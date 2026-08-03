import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamArrangementService {
  constructor(private prisma: PrismaService) {}

  async autoArrange(examScheduleId: number, roomIds: number[]) {
    if (!roomIds || roomIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một phòng thi.');
    }

    // 1. Lấy lịch thi
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: { subject: true, examPeriod: true },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch thi.');
    }

    // 2. Lấy danh sách sinh viên đăng ký môn học và đủ điều kiện
    const studentSubjects = await this.prisma.studentSubject.findMany({
      where: {
        subjectId: schedule.subjectId,
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

    // 3. Kiểm tra phòng thi
    const rooms = await this.prisma.examRoom.findMany({
      where: { id: { in: roomIds } },
    });

    if (rooms.length !== roomIds.length) {
      throw new BadRequestException('Một hoặc nhiều phòng thi được chọn không tồn tại.');
    }

    // Check phòng có bị trùng thời gian ở lịch thi khác không
    const overlappingScheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: {
        roomId: { in: roomIds },
        examScheduleId: { not: examScheduleId },
        examSchedule: {
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

    // Kiểm tra tổng sức chứa các phòng
    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    if (totalCapacity < students.length) {
      throw new BadRequestException(
        `Tổng sức chứa của các phòng được chọn (${totalCapacity} chỗ) không đủ cho tổng số sinh viên (${students.length} sinh viên).`,
      );
    }

    // 4. Xóa kết quả xếp phòng cũ của lịch thi này (nếu có)
    const existingScheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: { examScheduleId },
      select: { id: true },
    });
    const existingScheduleRoomIds = existingScheduleRooms.map((r) => r.id);

    if (existingScheduleRoomIds.length > 0) {
      await this.prisma.examSupervisor.deleteMany({
        where: { examScheduleRoomId: { in: existingScheduleRoomIds } },
      });
      await this.prisma.examRoomStudent.deleteMany({
        where: { examScheduleRoomId: { in: existingScheduleRoomIds } },
      });
      await this.prisma.examScheduleRoom.deleteMany({
        where: { examScheduleId },
      });
    }

    // 5. Tiến hành chia sinh viên vào các phòng và tạo exam_schedule_rooms
    const arrangementResults: any[] = [];
    let studentIndex = 0;
    let currentSbdNumber = 1;

    for (const room of rooms) {
      if (studentIndex >= students.length) break;

      const scheduleRoom = await this.prisma.examScheduleRoom.create({
        data: {
          examScheduleId,
          roomId: room.id,
        },
      });

      const studentsInThisRoomCount = Math.min(room.capacity, students.length - studentIndex);

      for (let seat = 1; seat <= studentsInThisRoomCount; seat++) {
        const student = students[studentIndex++];
        const sbd = `SBD${String(currentSbdNumber++).padStart(4, '0')}`;

        const roomStudent = await this.prisma.examRoomStudent.create({
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

    return {
      message: 'Xếp sinh viên vào phòng thi tự động thành công!',
      summary: {
        totalStudents: students.length,
        totalRoomsAssigned: rooms.length,
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName,
        examDate: schedule.examDate,
        timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
      },
      details: arrangementResults,
    };
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
