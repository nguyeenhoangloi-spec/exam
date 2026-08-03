import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(examPeriodId?: number) {
    const where: any = {};
    if (examPeriodId) where.examPeriodId = examPeriodId;

    return this.prisma.examSchedule.findMany({
      where,
      include: {
        examPeriod: true,
        subject: true,
        examScheduleRooms: {
          include: {
            room: true,
            _count: { select: { examRoomStudents: true, supervisors: true } },
          },
        },
      },
      orderBy: { examDate: 'asc' },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id },
      include: {
        examPeriod: true,
        subject: true,
        examScheduleRooms: {
          include: {
            room: true,
            supervisors: { include: { teacher: true } },
            examRoomStudents: { include: { student: { include: { class: true } } } },
          },
        },
        examPapers: true,
      },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi.');
    return schedule;
  }

  async create(data: {
    examPeriodId: number;
    subjectId: number;
    examDate: string;
    startTime: string;
    endTime: string;
    examType?: string;
    status?: string;
    note?: string;
  }) {
    // 1. Check end time > start time
    if (data.startTime >= data.endTime) {
      throw new BadRequestException('Thời gian kết thúc (endTime) phải lớn hơn thời gian bắt đầu (startTime).');
    }

    // 2. Check subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: data.subjectId },
    });
    if (!subject) {
      throw new BadRequestException('Môn học được chọn không tồn tại.');
    }

    // 3. Check exam period exists & date within range
    const period = await this.prisma.examPeriod.findUnique({
      where: { id: data.examPeriodId },
    });
    if (!period) {
      throw new BadRequestException('Kỳ thi được chọn không tồn tại.');
    }

    const examDate = new Date(data.examDate);
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    // Normalize dates to eliminate time part comparison issues
    examDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (examDate < startDate || examDate > endDate) {
      throw new BadRequestException(
        `Ngày thi (${data.examDate}) phải nằm trong khoảng thời gian kỳ thi (${period.startDate.toISOString().split('T')[0]} đến ${period.endDate.toISOString().split('T')[0]}).`,
      );
    }

    return this.prisma.examSchedule.create({
      data: {
        examPeriodId: data.examPeriodId,
        subjectId: data.subjectId,
        examDate: new Date(data.examDate),
        startTime: data.startTime,
        endTime: data.endTime,
        examType: data.examType || 'TRAC_NGHIEM',
        status: data.status || 'SCHEDULED',
        note: data.note,
      },
      include: {
        examPeriod: true,
        subject: true,
      },
    });
  }

  async update(id: number, data: any) {
    const existing = await this.findOne(id);

    const startTime = data.startTime || existing.startTime;
    const endTime = data.endTime || existing.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
    }

    if (data.examPeriodId || data.examDate) {
      const periodId = data.examPeriodId || existing.examPeriodId;
      const period = await this.prisma.examPeriod.findUnique({ where: { id: periodId } });
      if (period) {
        const examDate = new Date(data.examDate || existing.examDate);
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        examDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (examDate < startDate || examDate > endDate) {
          throw new BadRequestException('Ngày thi nằm ngoài khoảng thời gian của kỳ thi.');
        }
      }
    }

    return this.prisma.examSchedule.update({
      where: { id },
      data: {
        ...data,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
      },
      include: { examPeriod: true, subject: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.examSchedule.delete({ where: { id } });
  }
}
