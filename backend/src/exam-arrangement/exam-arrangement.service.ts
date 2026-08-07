import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamArrangementService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async autoArrange(actor: { id: number }, examScheduleId: number, roomIds: number[], persist = true) {
    if (!roomIds || roomIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một phòng thi.');
    }

    // All reads and writes are in one serializable transaction.  This keeps
    // two concurrent administrators from assigning the same room/student
    // after both requests have observed the old, apparently-free state.
    try {
    return await this.prisma.$transaction(async (tx) => {
    // 1. Lấy lịch thi
    const schedule = await tx.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: { subject: true, examPeriod: true, examPapers: { select: { status: true, deletedAt: true } } },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch thi.');
    }
    if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(schedule.status)) {
      throw new BadRequestException('Không thể xếp phòng cho lịch thi đã hủy, hoàn thành hoặc đã khóa.');
    }
    if (schedule.examPapers.some((paper) => paper.status === 'PUBLISHED' && !paper.deletedAt)) {
      throw new BadRequestException('Lịch thi đã có đề công bố, không được thay đổi phương án xếp phòng.');
    }
    // 2. Lấy danh sách sinh viên đăng ký môn học và đủ điều kiện
    const studentSubjects = await tx.studentSubject.findMany({
      where: {
        subjectId: schedule.subjectId,
        semester: schedule.examPeriod.semester,
        schoolYear: schedule.examPeriod.schoolYear,
        status: 'ELIGIBLE',
      },
      include: {
        student: {
          include: { class: { include: { department: true } } },
        },
      },
      orderBy: {
        student: { studentCode: 'asc' },
      },
    });

    if (studentSubjects.length === 0) {
      throw new BadRequestException(`Không có sinh viên nào đăng ký và đủ điều kiện thi môn ${schedule.subject.subjectName}.`);
    }

    const students = studentSubjects.map((ss) => ss.student);
    const duplicateStudentIds = students.filter((student, index) => students.findIndex((item) => item.id === student.id) !== index);
    if (duplicateStudentIds.length > 0) {
      throw new BadRequestException('Dữ liệu đăng ký môn học có sinh viên bị lặp. Hãy xử lý dữ liệu trước khi xếp phòng.');
    }

    // Fetch major subject curriculum mapping for the subject being arranged
    const majorSubjects = await tx.majorSubject.findMany({
      where: { subjectId: schedule.subjectId },
      include: { department: true },
    });
    const majorSubjectMap = new Map(majorSubjects.map((ms) => [ms.departmentId, ms]));

    // 3. Kiểm tra phòng thi
    const rooms = await tx.examRoom.findMany({
      where: { id: { in: roomIds }, status: 'AVAILABLE' },
    });

    if (rooms.length !== roomIds.length || new Set(roomIds).size !== roomIds.length) {
      throw new BadRequestException('Một hoặc nhiều phòng thi không tồn tại, không khả dụng hoặc bị chọn lặp.');
    }
    const incompatibleRooms = schedule.examType === 'TU_LUAN'
      ? rooms.filter((room) => ['THI_MAY_TINH', 'COMPUTER_LAB'].includes(room.roomType))
      : [];
    if (incompatibleRooms.length > 0) {
      throw new BadRequestException(`Phòng ${incompatibleRooms.map((room) => room.roomCode).join(', ')} không phù hợp với hình thức tự luận.`);
    }

    // Check phòng có bị trùng thời gian ở lịch thi khác không
    const overlappingScheduleRooms = await tx.examScheduleRoom.findMany({
      where: {
        roomId: { in: roomIds },
        examScheduleId: { not: examScheduleId },
        examSchedule: {
          status: { not: 'CANCELLED' },
          deletedAt: null,
          examDate: schedule.examDate,
          AND: [
            { startTime: { lt: schedule.endTime } },
            { endTime: { gt: schedule.startTime } },
          ],
        },
      },
      include: { room: true, examSchedule: { include: { subject: true } } },
    });

    if (overlappingScheduleRooms.length > 0) {
      const busyRoomCodes = Array.from(new Set(overlappingScheduleRooms.map((osr) => osr.room.roomCode))).join(', ');
      throw new BadRequestException(`Phòng thi [${busyRoomCodes}] đã có lịch thi khác trùng khung giờ (${schedule.startTime} - ${schedule.endTime}).`);
    }

    const studentConflict = await tx.examRoomStudent.findFirst({
      where: {
        studentId: { in: students.map((student) => student.id) },
        examScheduleRoom: {
          examScheduleId: { not: examScheduleId },
          examSchedule: {
            status: { not: 'CANCELLED' },
            deletedAt: null,
            examDate: schedule.examDate,
            AND: [
              { startTime: { lt: schedule.endTime } },
              { endTime: { gt: schedule.startTime } },
            ],
          },
        },
      },
      include: { student: true },
    });
    if (studentConflict) {
      throw new BadRequestException(
        `Sinh viên ${studentConflict.student.studentCode} đã được xếp vào một lịch thi trùng khung giờ.`,
      );
    }

    // Kiểm tra tổng sức chứa các phòng
    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    if (totalCapacity < students.length) {
      throw new BadRequestException(
        `Tổng sức chứa của các phòng được chọn (${totalCapacity} chỗ) không đủ cho tổng số sinh viên (${students.length} sinh viên).`,
      );
    }

    const existingSupervisors = await tx.examSupervisor.count({
      where: { examScheduleRoom: { examScheduleId } },
    });
    if (existingSupervisors > 0) {
      throw new BadRequestException('Lịch thi đã có phân công giám thị. Hãy hủy phân công trước khi xếp lại phòng.');
    }

    // 4. Xóa kết quả xếp phòng cũ của lịch thi này (nếu có)
    const existingAssignedStudents = await tx.examRoomStudent.count({
      where: { examScheduleRoom: { examScheduleId } },
    });
    if (existingAssignedStudents > 0) {
      throw new BadRequestException('Lịch thi đã có sinh viên được xếp phòng; không được ghi đè phương án hiện tại.');
    }

    const existingScheduleRooms = await tx.examScheduleRoom.findMany({
      where: { examScheduleId },
      select: { id: true },
    });
    const existingScheduleRoomIds = existingScheduleRooms.map((r) => r.id);

    if (persist && existingScheduleRoomIds.length > 0) {
      await tx.examSupervisor.deleteMany({
        where: { examScheduleRoomId: { in: existingScheduleRoomIds } },
      });
      await tx.examRoomStudent.deleteMany({
        where: { examScheduleRoomId: { in: existingScheduleRoomIds } },
      });
      await tx.examScheduleRoom.deleteMany({
        where: { examScheduleId },
      });
    }

    // 5. Tiến hành chia sinh viên vào các phòng và tạo exam_schedule_rooms
    const arrangementResults: any[] = [];
    let assignedRoomCount = 0;
    let studentIndex = 0;
    let currentSbdNumber = 1;

    for (const room of rooms) {
      if (studentIndex >= students.length) break;

      const scheduleRoom = persist
        ? await tx.examScheduleRoom.create({
            data: {
              examScheduleId,
              roomId: room.id,
            },
          })
        : { id: 0, examScheduleId, roomId: room.id };
      assignedRoomCount += 1;

      const studentsInThisRoomCount = Math.min(room.capacity, students.length - studentIndex);

      for (let seat = 1; seat <= studentsInThisRoomCount; seat++) {
        const student = students[studentIndex++];
        const sbd = `SBD${String(currentSbdNumber++).padStart(4, '0')}`;

        const roomStudent = persist
          ? await tx.examRoomStudent.create({
              data: {
                examScheduleRoomId: scheduleRoom.id,
                studentId: student.id,
                examNumber: sbd,
                seatNumber: seat,
                status: 'ASSIGNED',
              },
              include: {
                student: { include: { class: true } },
              },
            })
          : null;

        const deptId = student.class.departmentId;
        const majorSub = majorSubjectMap.get(deptId);
        const requirementType = majorSub ? majorSub.type : 'ELECTIVE';
        const requirementLabel = majorSub
          ? `${student.class.department.name} • ${majorSub.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn'}`
          : `${student.class.department.name} • Tự chọn ngoài khung`;

        arrangementResults.push({
          id: roomStudent?.id ?? 0,
          examNumber: sbd,
          seatNumber: seat,
          studentCode: student.studentCode,
          fullName: student.fullName,
          className: student.class.name,
          departmentName: student.class.department.name,
          requirementType,
          requirementLabel,
          roomCode: room.roomCode,
          roomName: room.roomName,
          building: room.building,
        });
      }
    }

    const alternativeRooms = persist ? [] : await tx.examRoom.findMany({
      where: { status: 'AVAILABLE', id: { notIn: roomIds } },
      orderBy: { capacity: 'desc' },
      take: roomIds.length,
      select: { id: true, capacity: true, roomCode: true },
    });
    const hasAlternativeCapacity = alternativeRooms.reduce((sum, room) => sum + room.capacity, 0) >= students.length;
    const warnings: string[] = [];
    if (assignedRoomCount < rooms.length) warnings.push(`${rooms.length - assignedRoomCount} phòng được chọn nhưng không cần sử dụng hết sức chứa.`);

    const result = {
      message: persist ? 'Xếp sinh viên vào phòng thi tự động thành công!' : 'Đã tạo phương án xếp phòng. Chưa ghi dữ liệu.',
      preview: !persist,
      warnings,
      errors: [] as string[],
      unassigned: students.slice(studentIndex).map((student) => ({
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        reason: 'Không còn phòng đủ sức chứa',
      })),
      alternatives: hasAlternativeCapacity ? [{ roomIds: alternativeRooms.map((room) => room.id), rationale: `Có thể thay bằng các phòng ${alternativeRooms.map((room) => room.roomCode).join(', ')} với tổng sức chứa tương đương.` }] : [{ roomIds, rationale: 'Giữ nguyên các phòng đã chọn và xác nhận sau khi kiểm tra lại dữ liệu.' }],
      rationale: `Phân bổ sinh viên theo mã sinh viên tăng dần vào các phòng đã chọn theo sức chứa (${rooms.map((room) => room.roomCode).join(', ')}).`,
      summary: {
        totalStudents: students.length,
        totalRoomsAssigned: assignedRoomCount,
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName,
        examDate: schedule.examDate,
        timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
      },
      details: arrangementResults,
    };
    if (persist) await this.audit.write({
      actorId: actor.id,
      action: 'ARRANGE',
      entityType: 'EXAM_SCHEDULE',
      entityId: examScheduleId,
      description: `Đã xếp phòng thi cho môn ${schedule.subject.subjectName}`,
      metadata: { roomIds, totalStudents: students.length },
    }, tx);
    return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2034') {
        throw new ConflictException('Dữ liệu xếp phòng vừa thay đổi bởi thao tác khác. Vui lòng tải lại và thử lại.');
      }
      throw error;
    }
  }

  async preview(actor: { id: number }, examScheduleId: number, roomIds: number[]) {
    return this.autoArrange(actor, examScheduleId, roomIds, false);
  }

  async getArrangementResults(examScheduleId: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: { id: examScheduleId, deletedAt: null },
      select: { id: true, subjectId: true },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy ca thi.');

    const majorSubjects = await this.prisma.majorSubject.findMany({
      where: { subjectId: schedule.subjectId },
      include: { department: true },
    });
    const majorSubjectMap = new Map(majorSubjects.map((ms) => [ms.departmentId, ms]));

    const scheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: { examScheduleId },
      include: {
        room: true,
        examRoomStudents: {
          include: {
            student: {
              include: {
                class: {
                  include: { department: true },
                },
              },
            },
          },
          orderBy: { seatNumber: 'asc' },
        },
        supervisors: {
          include: { teacher: true },
        },
      },
    });

    return scheduleRooms.map((sr) => ({
      ...sr,
      examRoomStudents: sr.examRoomStudents.map((ers) => {
        const deptId = ers.student?.class?.departmentId;
        const deptName = ers.student?.class?.department?.name || 'Khoa Công nghệ thông tin';
        const majorSub = deptId ? majorSubjectMap.get(deptId) : null;
        const requirementType = majorSub ? majorSub.type : 'ELECTIVE';
        const requirementLabel = majorSub
          ? `${deptName} • ${majorSub.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn'}`
          : `${deptName} • Tự chọn ngoài khung`;

        return {
          ...ers,
          requirementType,
          requirementLabel,
          departmentName: deptName,
        };
      }),
    }));
  }

  async getRoomAvailability(examScheduleId: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: { id: examScheduleId, deletedAt: null },
      include: { subject: true },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy ca thi.');

    const allRooms = await this.prisma.examRoom.findMany({
      orderBy: { roomCode: 'asc' },
    });

    const overlappingScheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: {
        examScheduleId: { not: examScheduleId },
        examSchedule: {
          status: { not: 'CANCELLED' },
          deletedAt: null,
          examDate: schedule.examDate,
          AND: [
            { startTime: { lt: schedule.endTime } },
            { endTime: { gt: schedule.startTime } },
          ],
        },
      },
      include: { room: true, examSchedule: { include: { subject: true } } },
    });

    const busyMap = new Map<number, string>();
    overlappingScheduleRooms.forEach((osr) => {
      busyMap.set(osr.roomId, osr.examSchedule.subject.subjectCode);
    });

    return allRooms.map((room) => {
      const isBusy = busyMap.has(room.id) || room.status !== 'AVAILABLE';
      const conflictingSubject = busyMap.get(room.id);
      return {
        ...room,
        isAvailable: !isBusy,
        conflictingSubject: conflictingSubject || null,
        busyReason: room.status !== 'AVAILABLE' ? 'Bảo trì' : conflictingSubject ? `Trùng ca môn ${conflictingSubject}` : null,
      };
    });
  }

  async resetArrangement(actor: { id: number }, examScheduleId: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: { id: examScheduleId, deletedAt: null },
      include: { examPapers: { select: { status: true, deletedAt: true } } },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy ca thi.');
    if (schedule.examPapers.some((paper) => paper.status === 'PUBLISHED' && !paper.deletedAt)) {
      throw new BadRequestException('Lịch thi đã có đề thi công bố, không thể hủy xếp phòng.');
    }

    const scheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: { examScheduleId },
      select: { id: true },
    });
    const roomIds = scheduleRooms.map((r) => r.id);

    await this.prisma.$transaction(async (tx) => {
      if (roomIds.length > 0) {
        await tx.examRoomStudent.deleteMany({ where: { examScheduleRoomId: { in: roomIds } } });
        await tx.examSupervisor.deleteMany({ where: { examScheduleRoomId: { in: roomIds } } });
        await tx.examScheduleRoom.deleteMany({ where: { examScheduleId } });
      }
      await this.audit.write({
        actorId: actor.id,
        action: 'RESET_ARRANGEMENT',
        entityType: 'EXAM_SCHEDULE',
        entityId: examScheduleId,
        description: `Đã hủy phương án xếp phòng cho lịch thi ID ${examScheduleId}`,
      }, tx);
    });

    return { message: 'Đã hủy xếp phòng cho ca thi thành công.' };
  }

  async getHistory() {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { entityType: 'EXAM_SCHEDULE' },
      include: { actor: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return auditLogs;
  }
}
