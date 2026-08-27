import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamArrangementService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /**
   * Lấy danh sách các lớp có sinh viên đăng ký môn học của ca thi này
   */
  async getScheduleClasses(examScheduleId: number) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: { examPeriod: true, subject: true },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi.');

    const studentSubjects = await this.prisma.studentSubject.findMany({
      where: {
        subjectId: schedule.subjectId,
        semester: schedule.examPeriod.semester,
        schoolYear: schedule.examPeriod.schoolYear,
        status: 'ELIGIBLE',
      },
      include: {
        student: {
          include: {
            class: {
              include: { department: true },
            },
          },
        },
      },
    });

    const classMap = new Map<number, {
      id: number;
      name: string;
      code: string;
      departmentId: number;
      departmentName: string;
      studentCount: number;
    }>();

    for (const ss of studentSubjects) {
      const cls = ss.student?.class;
      if (!cls) continue;
      if (!classMap.has(cls.id)) {
        classMap.set(cls.id, {
          id: cls.id,
          name: cls.name,
          code: (cls as any).code || cls.name,
          departmentId: cls.departmentId,
          departmentName: cls.department?.name || 'Chưa phân khoa',
          studentCount: 0,
        });
      }
      classMap.get(cls.id)!.studentCount += 1;
    }

    return {
      scheduleId: schedule.id,
      subjectName: schedule.subject.subjectName,
      subjectCode: schedule.subject.subjectCode,
      totalEligibleStudents: studentSubjects.length,
      classes: Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async autoArrange(
    actor: { id: number },
    examScheduleId: number,
    roomIds: number[],
    persist = true,
    classIds?: number[],
  ) {
    if (!roomIds || roomIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một phòng thi.');
    }

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

        // 2. Lấy danh sách sinh viên đăng ký môn học và đủ điều kiện (có lọc theo classIds nếu có)
        const whereCondition: any = {
          subjectId: schedule.subjectId,
          semester: schedule.examPeriod.semester,
          schoolYear: schedule.examPeriod.schoolYear,
          status: 'ELIGIBLE',
        };

        if (classIds && classIds.length > 0) {
          whereCondition.student = { classId: { in: classIds } };
        }

        const studentSubjects = await tx.studentSubject.findMany({
          where: whereCondition,
          include: {
            student: {
              include: { class: { include: { department: true } } },
            },
          },
          orderBy: [
            { student: { class: { name: 'asc' } } },
            { student: { studentCode: 'asc' } },
          ],
        });

        if (studentSubjects.length === 0) {
          throw new BadRequestException(
            classIds && classIds.length > 0
              ? `Không có sinh viên nào đủ điều kiện thi thuộc các lớp đã chọn.`
              : `Không có sinh viên nào đăng ký và đủ điều kiện thi môn ${schedule.subject.subjectName}.`,
          );
        }

        const students = studentSubjects.map((ss) => ss.student);
        const duplicateStudentIds = students.filter((student, index) => students.findIndex((item) => item.id === student.id) !== index);
        if (duplicateStudentIds.length > 0) {
          throw new BadRequestException('Dữ liệu đăng ký môn học có sinh viên bị lặp. Hãy xử lý dữ liệu trước khi xếp phòng.');
        }

        // Major subject curriculum mapping
        const majorSubjects = await tx.majorSubject.findMany({
          where: { subjectId: schedule.subjectId },
          include: { department: true },
        });
        const majorSubjectMap = new Map(majorSubjects.map((ms) => [ms.departmentId, ms]));

        // 3. Kiểm tra phòng thi
        let rooms = await tx.examRoom.findMany({
          where: { id: { in: roomIds }, status: 'AVAILABLE' },
        });

        if (rooms.length !== roomIds.length || new Set(roomIds).size !== roomIds.length) {
          throw new BadRequestException('Một hoặc nhiều phòng thi không tồn tại, không khả dụng hoặc bị chọn lặp.');
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

        // Tự đề xuất thêm phòng trống nếu sức chứa được chọn chưa đủ
        const originalRoomIds = [...roomIds];
        const autoAddedRooms: Array<{ id: number; roomCode: string; roomName: string; capacity: number }> = [];
        let totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
        if (totalCapacity < students.length) {
          const conflictingRoomIds = new Set(overlappingScheduleRooms.map((item) => item.roomId));
          const preferredBuilding = rooms[0]?.building;
          const candidates = await tx.examRoom.findMany({
            where: { status: 'AVAILABLE', id: { notIn: roomIds } },
            orderBy: { roomCode: 'asc' },
          });
          candidates
            .filter((room) => !conflictingRoomIds.has(room.id))
            .sort((a, b) => Number(b.building === preferredBuilding) - Number(a.building === preferredBuilding) || b.capacity - a.capacity || a.roomCode.localeCompare(b.roomCode));
          for (const room of candidates) {
            if (totalCapacity >= students.length) break;
            rooms.push(room);
            totalCapacity += room.capacity;
            autoAddedRooms.push({ id: room.id, roomCode: room.roomCode, roomName: room.roomName, capacity: room.capacity });
          }
        }
        if (totalCapacity < students.length) {
          const shortage = students.length - totalCapacity;
          if (persist) throw new BadRequestException(`Không đủ chỗ ngồi: còn thiếu ${shortage} chỗ sau khi đã tìm tất cả phòng trống không trùng ca.`);
        }

        // 4. Xóa kết quả xếp phòng cũ của lịch thi này nếu có khi lưu chính thức
        const existingScheduleRooms = await tx.examScheduleRoom.findMany({
          where: { examScheduleId },
          select: { id: true },
        });
        const existingScheduleRoomIds = existingScheduleRooms.map((r) => r.id);
        const hasExistingArrangement = existingScheduleRoomIds.length > 0;

        if (persist && hasExistingArrangement) {
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

        // 5. THUẬT TOÁN DỒN CHỖ & GHÉP LỚP (Class Packing & Seat Assignment)
        const arrangementResults: any[] = [];
        const roomBreakdowns: Array<{
          roomId: number;
          roomCode: string;
          roomName: string;
          building: string;
          capacity: number;
          studentCount: number;
          classes: Array<{ className: string; count: number }>;
        }> = [];

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
          const roomClassCountMap = new Map<string, number>();

          for (let seat = 1; seat <= studentsInThisRoomCount; seat++) {
            const student = students[studentIndex++];
            const sbd = `SBD${String(currentSbdNumber++).padStart(4, '0')}`;
            const className = student.class?.name || 'Khác';

            roomClassCountMap.set(className, (roomClassCountMap.get(className) || 0) + 1);

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

          roomBreakdowns.push({
            roomId: room.id,
            roomCode: room.roomCode,
            roomName: room.roomName,
            building: room.building,
            capacity: room.capacity,
            studentCount: studentsInThisRoomCount,
            classes: Array.from(roomClassCountMap.entries()).map(([className, count]) => ({ className, count })),
          });
        }

        const alternativeRooms = persist ? [] : await tx.examRoom.findMany({
          where: { status: 'AVAILABLE', id: { notIn: [...roomIds, ...autoAddedRooms.map((room) => room.id)] } },
          orderBy: { capacity: 'desc' },
          take: roomIds.length,
          select: { id: true, capacity: true, roomCode: true },
        });
        const hasAlternativeCapacity = totalCapacity >= students.length;
        const warnings: string[] = [];
        if (assignedRoomCount < rooms.length) warnings.push(`${rooms.length - assignedRoomCount} phòng được chọn nhưng không cần sử dụng hết sức chứa.`);
        if (autoAddedRooms.length) warnings.push(`Đã tự đề xuất thêm ${autoAddedRooms.length} phòng để đủ chỗ ngồi; hãy kiểm tra trước khi lưu.`);

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
          alternatives: hasAlternativeCapacity
            ? [{ roomIds: alternativeRooms.map((room) => room.id), rationale: `Có thể thay bằng các phòng ${alternativeRooms.map((room) => room.roomCode).join(', ')} với tổng sức chứa tương đương.` }]
            : [{ roomIds, rationale: 'Giữ nguyên các phòng đã chọn và xác nhận sau khi kiểm tra lại dữ liệu.' }],
          autoAddedRooms,
          selectedRoomIds: originalRoomIds,
          effectiveRoomIds: rooms.map((room) => room.id),
          rationale: `Phân bổ sinh viên dồn chỗ theo lớp và mã sinh viên vào các phòng đã chọn theo sức chứa (${rooms.map((room) => room.roomCode).join(', ')}).`,
          summary: {
            totalStudents: students.length,
            totalRoomsAssigned: assignedRoomCount,
            subjectCode: schedule.subject.subjectCode,
            subjectName: schedule.subject.subjectName,
            examDate: schedule.examDate,
            timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
          },
          roomBreakdowns,
          details: arrangementResults,
        };

        if (persist) {
          await this.audit.write({
            actorId: actor.id,
            action: 'ARRANGE',
            entityType: 'EXAM_SCHEDULE',
            entityId: examScheduleId,
            description: `Đã xếp phòng thi cho môn ${schedule.subject.subjectName} (${assignedRoomCount} phòng, ${students.length} thí sinh)`,
            metadata: { roomIds, totalStudents: students.length, classIds },
          }, tx);
        }

        return result;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2034') {
        throw new ConflictException('Dữ liệu xếp phòng vừa thay đổi bởi thao tác khác. Vui lòng tải lại và thử lại.');
      }
      throw error;
    }
  }

  async preview(actor: { id: number }, examScheduleId: number, roomIds: number[], classIds?: number[]) {
    return this.autoArrange(actor, examScheduleId, roomIds, false, classIds);
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

    return scheduleRooms.map((sr) => {
      // Phân tích danh sách lớp trong phòng
      const classMap = new Map<string, number>();
      sr.examRoomStudents.forEach((ers) => {
        const clsName = ers.student?.class?.name || 'Khác';
        classMap.set(clsName, (classMap.get(clsName) || 0) + 1);
      });

      return {
        ...sr,
        classBreakdown: Array.from(classMap.entries()).map(([className, count]) => ({ className, count })),
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
      };
    });
  }

  async getRoomAvailability(examScheduleId: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: { id: examScheduleId, deletedAt: null },
      include: { subject: true, examScheduleRooms: { include: { examRoomStudents: true } } },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy ca thi.');

    const allRooms = await this.prisma.examRoom.findMany({
      orderBy: { roomCode: 'asc' },
    });

    const startOfDay = new Date(schedule.examDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(schedule.examDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingScheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: {
        examScheduleId: { not: examScheduleId },
        examSchedule: {
          status: { not: 'CANCELLED' },
          deletedAt: null,
          examDate: { gte: startOfDay, lte: endOfDay },
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
      const subjCode = osr.examSchedule.subject?.subjectCode || '---';
      busyMap.set(osr.roomId, subjCode);
    });

    const currentScheduleRoomIds = new Set(schedule.examScheduleRooms.map((sr) => sr.roomId));

    return allRooms.map((room) => {
      const isConflicting = busyMap.has(room.id);
      const isMaintenance = room.status !== 'AVAILABLE';
      const isBusy = isConflicting || isMaintenance;
      const conflictingSubject = busyMap.get(room.id);
      const isAssignedToCurrent = currentScheduleRoomIds.has(room.id);

      let busyReason = null;
      if (isMaintenance) busyReason = 'Bảo trì';
      else if (isConflicting) busyReason = `Trùng ca môn ${conflictingSubject}`;

      return {
        ...room,
        isAvailable: !isBusy,
        isAssignedToCurrent,
        conflictingSubject: conflictingSubject || null,
        busyReason,
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
