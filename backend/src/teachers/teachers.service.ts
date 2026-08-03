import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacher.findMany({
      include: {
        department: true,
        user: true,
      },
      orderBy: { teacherCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        department: true,
        user: true,
        supervisors: {
          include: {
            examScheduleRoom: {
              include: {
                room: true,
                examSchedule: {
                  include: { subject: true, examPeriod: true },
                },
              },
            },
          },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Không tìm thấy giảng viên.');
    return teacher;
  }

  async create(data: {
    teacherCode: string;
    fullName: string;
    degree: string;
    email: string;
    phone?: string;
    departmentId: number;
    username?: string;
    password?: string;
  }) {
    const existingCode = await this.prisma.teacher.findUnique({
      where: { teacherCode: data.teacherCode },
    });
    if (existingCode) throw new BadRequestException('Mã giảng viên đã tồn tại.');

    const username = data.username || data.teacherCode;
    const rawPassword = data.password || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: data.email,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    return this.prisma.teacher.create({
      data: {
        teacherCode: data.teacherCode,
        fullName: data.fullName,
        degree: data.degree,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        userId: user.id,
      },
      include: { department: true, user: true },
    });
  }

  async update(
    id: number,
    data: {
      fullName?: string;
      degree?: string;
      email?: string;
      phone?: string;
      departmentId?: number;
    },
  ) {
    await this.findOne(id);

    return this.prisma.teacher.update({
      where: { id },
      data,
      include: { department: true, user: true },
    });
  }

  async remove(id: number) {
    const teacher = await this.findOne(id);
    await this.prisma.teacher.delete({ where: { id } });
    if (teacher.userId) {
      await this.prisma.user.delete({ where: { id: teacher.userId } }).catch(() => {});
    }
    return { message: 'Đã xóa giảng viên thành công' };
  }

  async getMyAssignments(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new NotFoundException('Không tìm thấy thông tin giảng viên.');

    const assignments = await this.prisma.examSupervisor.findMany({
      where: { teacherId: teacher.id },
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

    return assignments.map((a) => ({
      id: a.id,
      role: a.role,
      note: a.note,
      subjectCode: a.examScheduleRoom.examSchedule.subject.subjectCode,
      subjectName: a.examScheduleRoom.examSchedule.subject.subjectName,
      examDate: a.examScheduleRoom.examSchedule.examDate,
      startTime: a.examScheduleRoom.examSchedule.startTime,
      endTime: a.examScheduleRoom.examSchedule.endTime,
      roomCode: a.examScheduleRoom.room.roomCode,
      roomName: a.examScheduleRoom.room.roomName,
      building: a.examScheduleRoom.room.building,
      periodName: a.examScheduleRoom.examSchedule.examPeriod.name,
    }));
  }
}
