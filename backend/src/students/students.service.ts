import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.student.findMany({
      where,
      include: {
        class: { include: { department: true } },
        user: true,
      },
      orderBy: { studentCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { include: { department: true } },
        user: true,
        studentSubjects: { include: { subject: true } },
      },
    });
    if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');
    return student;
  }

  async create(data: {
    studentCode: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    phone?: string;
    classId: number;
    username?: string;
    password?: string;
  }) {
    const existingCode = await this.prisma.student.findUnique({
      where: { studentCode: data.studentCode },
    });
    if (existingCode) throw new BadRequestException('Mã sinh viên đã tồn tại.');

    const username = data.username || data.studentCode;
    const rawPassword = data.password || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    if (Number.isNaN(new Date(data.dateOfBirth).getTime())) throw new BadRequestException('Ngày sinh không hợp lệ.');

    return this.prisma.$transaction(async (tx) => {
      const [classItem, existingUser] = await Promise.all([
        tx.class.findUnique({ where: { id: data.classId } }),
        tx.user.findFirst({ where: { OR: [{ username }, { email: data.email }] } }),
      ]);
      if (!classItem) throw new BadRequestException('Lớp học được chọn không tồn tại.');
      if (existingUser) throw new BadRequestException('Tên đăng nhập hoặc email đã tồn tại.');
      const user = await tx.user.create({
        data: { username, password: hashedPassword, email: data.email, role: 'STUDENT', status: 'ACTIVE' },
      });
      return tx.student.create({
        data: {
          studentCode: data.studentCode,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          email: data.email,
          phone: data.phone,
          classId: data.classId,
          userId: user.id,
        },
        include: { class: true, user: true },
      });
    });
  }

  async update(
    id: number,
    data: {
      studentCode?: string;
      fullName?: string;
      gender?: string;
      dateOfBirth?: string;
      email?: string;
      phone?: string;
      classId?: number;
    },
  ) {
    const student = await this.findOne(id);

    if (data.dateOfBirth && Number.isNaN(new Date(data.dateOfBirth).getTime())) throw new BadRequestException('Ngày sinh không hợp lệ.');
    return this.prisma.$transaction(async (tx) => {
      if (data.studentCode && data.studentCode !== student.studentCode) {
        const existingStudent = await tx.student.findUnique({ where: { studentCode: data.studentCode } });
        if (existingStudent) throw new BadRequestException('Mã sinh viên đã tồn tại.');
      }
      if (data.classId && !await tx.class.findUnique({ where: { id: data.classId } })) {
        throw new BadRequestException('Lớp học được chọn không tồn tại.');
      }
      if (data.email && data.email !== student.email) {
        const existingUser = await tx.user.findFirst({ where: { email: data.email, id: { not: student.userId } } });
        if (existingUser) throw new BadRequestException('Email đã được sử dụng.');
        await tx.user.update({ where: { id: student.userId }, data: { email: data.email } });
      }
      return tx.student.update({
        where: { id },
        data: {
          studentCode: data.studentCode,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          email: data.email,
          phone: data.phone,
          classId: data.classId,
        },
        include: { class: true, user: true },
      });
    });
  }

  async remove(id: number) {
    const student = await this.findOne(id);
    const assignedExams = await this.prisma.examRoomStudent.count({ where: { studentId: id } });
    if (assignedExams > 0) throw new BadRequestException('Không thể xóa sinh viên đã được xếp lịch thi.');
    await this.prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
    });
    return { message: 'Đã xóa sinh viên thành công' };
  }

  async getPersonalSchedule(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Không tìm thấy thông tin sinh viên.');

    const roomStudents = await this.prisma.examRoomStudent.findMany({
      where: {
        studentId: student.id,
        examScheduleRoom: { examSchedule: { status: { not: 'CANCELLED' } } },
      },
      include: {
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: {
              include: {
                subject: true,
                examPeriod: true,
              },
            },
          },
        },
      },
      orderBy: {
        examScheduleRoom: {
          examSchedule: {
            examDate: 'asc',
          },
        },
      },
    });

    return roomStudents.map((rs) => ({
      id: rs.id,
      scheduleId: rs.examScheduleRoom.examSchedule.id,
      examScheduleId: rs.examScheduleRoom.examSchedule.id,
      examNumber: rs.examNumber,
      seatNumber: rs.seatNumber,
      status: rs.status,
      subjectCode: rs.examScheduleRoom.examSchedule.subject.subjectCode,
      subjectName: rs.examScheduleRoom.examSchedule.subject.subjectName,
      credits: rs.examScheduleRoom.examSchedule.subject.credits,
      examDate: rs.examScheduleRoom.examSchedule.examDate,
      startTime: rs.examScheduleRoom.examSchedule.startTime,
      endTime: rs.examScheduleRoom.examSchedule.endTime,
      examType: rs.examScheduleRoom.examSchedule.examType,
      roomCode: rs.examScheduleRoom.room.roomCode,
      roomName: rs.examScheduleRoom.room.roomName,
      building: rs.examScheduleRoom.room.building,
      periodName: rs.examScheduleRoom.examSchedule.examPeriod.name,
    }));
  }
}
