import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async setLock(actor: { id: number }, id: number, locked: boolean) {
    const teacher = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: teacher.userId }, data: { status: locked ? 'LOCKED' : 'ACTIVE' }, include: { teacher: true } });
      await this.audit.write({ actorId: actor.id, action: locked ? 'LOCK' : 'UNLOCK', entityType: 'TEACHER', entityId: id, description: `${locked ? 'Đã khóa' : 'Đã mở khóa'} giảng viên ${teacher.fullName}` }, tx);
      return updated;
    });
  }

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
    return this.prisma.$transaction(async (tx) => {
      const [department, existingUser] = await Promise.all([
        tx.department.findUnique({ where: { id: data.departmentId } }),
        tx.user.findFirst({ where: { OR: [{ username }, { email: data.email }] } }),
      ]);
      if (!department) throw new BadRequestException('Khoa được chọn không tồn tại.');
      if (existingUser) throw new BadRequestException('Tên đăng nhập hoặc email đã tồn tại.');
      const user = await tx.user.create({
        data: { username, password: hashedPassword, email: data.email, role: 'TEACHER', status: 'ACTIVE' },
      });
      return tx.teacher.create({
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
    });
  }

  async update(
    id: number,
    data: {
      teacherCode?: string;
      fullName?: string;
      degree?: string;
      email?: string;
      phone?: string;
      departmentId?: number;
    },
  ) {
    const teacher = await this.findOne(id);
    if (teacher.user.status === 'LOCKED') {
      throw new BadRequestException('Giảng viên đã khóa, chỉ được mở khóa trước khi thay đổi.');
    }
    return this.prisma.$transaction(async (tx) => {
      if (data.teacherCode && data.teacherCode !== teacher.teacherCode) {
        const existingTeacher = await tx.teacher.findUnique({ where: { teacherCode: data.teacherCode } });
        if (existingTeacher) throw new BadRequestException('Mã giảng viên đã tồn tại.');
      }
      if (data.departmentId && !await tx.department.findUnique({ where: { id: data.departmentId } })) {
        throw new BadRequestException('Khoa được chọn không tồn tại.');
      }
      if (data.email && data.email !== teacher.email) {
        const existingUser = await tx.user.findFirst({ where: { email: data.email, id: { not: teacher.userId } } });
        if (existingUser) throw new BadRequestException('Email đã được sử dụng.');
        await tx.user.update({ where: { id: teacher.userId }, data: { email: data.email } });
      }
      return tx.teacher.update({ where: { id }, data, include: { department: true, user: true } });
    });
  }

  async remove(id: number) {
    const teacher = await this.findOne(id);
    if (teacher.supervisors.length > 0) throw new BadRequestException('Không thể xóa giảng viên đã có phân công coi thi.');
    await this.prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id } });
      await tx.user.delete({ where: { id: teacher.userId } });
    });
    return { message: 'Đã xóa giảng viên thành công' };
  }

  async getMyAssignments(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new NotFoundException('Không tìm thấy thông tin giảng viên.');

    const assignments = await this.prisma.examSupervisor.findMany({
      where: {
        teacherId: teacher.id,
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
