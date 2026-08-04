import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamArrangementService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async autoArrange(actor: { id: number }, examScheduleId: number, roomIds: number[]) {
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
      include: { subject: true, examPeriod: true },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch thi.');
    }
    if (['CANCELLED', 'COMPLETED'].includes(schedule.status)) {
      throw new BadRequestException('Không thể xếp phòng cho lịch thi đã hủy hoặc đã hoàn thành.');
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
          include: { class: true },
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

    // 3. Kiểm tra phòng thi
    const rooms = await tx.examRoom.findMany({
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
    const existingScheduleRooms = await tx.examScheduleRoom.findMany({
      where: { examScheduleId },
      select: { id: true },
    });
    const existingScheduleRoomIds = existingScheduleRooms.map((r) => r.id);

    if (existingScheduleRoomIds.length > 0) {
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

      const scheduleRoom = await tx.examScheduleRoom.create({
        data: {
          examScheduleId,
          roomId: room.id,
        },
      });
      assignedRoomCount += 1;

      const studentsInThisRoomCount = Math.min(room.capacity, students.length - studentIndex);

      for (let seat = 1; seat <= studentsInThisRoomCount; seat++) {
        const student = students[studentIndex++];
        const sbd = `SBD${String(currentSbdNumber++).padStart(4, '0')}`;

        const roomStudent = await tx.examRoomStudent.create({
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
        });

        arrangementResults.push({
          id: roomStudent.id,
          examNumber: roomStudent.examNumber,
          seatNumber: roomStudent.seatNumber,
          studentCode: student.studentCode,
          fullName: student.fullName,
          className: student.class.name,
          roomCode: room.roomCode,
          roomName: room.roomName,
          building: room.building,
        });
      }
    }

    const result = {
      message: 'Xếp sinh viên vào phòng thi tự động thành công!',
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
    await this.audit.write({
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

  async getArrangementResults(examScheduleId: number) {
    const scheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: { examScheduleId },
      include: {
        room: true,
        examRoomStudents: {
          include: {
            student: { include: { class: true } },
          },
          orderBy: { seatNumber: 'asc' },
        },
        supervisors: {
          include: { teacher: true },
        },
      },
    });

    return scheduleRooms;
  }
}
