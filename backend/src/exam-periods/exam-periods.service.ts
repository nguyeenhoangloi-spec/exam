import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamPeriodsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll() {
    const periods = await this.prisma.examPeriod.findMany({
      include: {
        _count: { select: { examSchedules: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    const now = new Date();
    return periods.map((period) => ({ ...period, status: this.getDisplayStatus(period, now) }));
  }

  private getDisplayStatus(period: { status: string; startDate: Date; endDate: Date }, now: Date) {
    if (['CANCELLED', 'DRAFT', 'LOCKED'].includes(period.status)) return period.status;
    if (now < period.startDate) return 'UPCOMING';
    if (now > period.endDate) return 'COMPLETED';
    return 'ONGOING';
  }

  async findOne(id: number) {
    const period = await this.prisma.examPeriod.findUnique({
      where: { id },
      include: { examSchedules: { include: { subject: true } } },
    });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ thi.');
    return { ...period, status: this.getDisplayStatus(period, new Date()) };
  }

  async create(actor: { id: number }, data: {
    name: string;
    semester: string;
    schoolYear: string;
    startDate: string;
    endDate: string;
    status?: string;
  }) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc của kỳ thi.');
    }
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.examPeriod.create({ data: {
        name: data.name,
        semester: data.semester,
        schoolYear: data.schoolYear,
        startDate,
        endDate,
        status: data.status || 'UPCOMING',
      } });
      await this.audit.write({ actorId: actor.id, action: 'CREATE', entityType: 'EXAM_PERIOD', entityId: period.id, description: `Đã tạo kỳ thi ${period.name}` }, tx);
      return period;
    });
  }

  async update(actor: { id: number }, id: number, data: any) {
    const existing = await this.findOne(id);
    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc của kỳ thi.');
    }
    const outsideSchedule = existing.examSchedules.find((schedule) => schedule.examDate < startDate || schedule.examDate > endDate);
    if (outsideSchedule) {
      throw new BadRequestException('Không thể thu hẹp kỳ thi làm một lịch thi hiện có nằm ngoài khoảng thời gian.');
    }
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.examPeriod.update({ where: { id }, data: {
        ...data,
        startDate: data.startDate ? startDate : undefined,
        endDate: data.endDate ? endDate : undefined,
      } });
      await this.audit.write({ actorId: actor.id, action: 'UPDATE', entityType: 'EXAM_PERIOD', entityId: period.id, description: `Đã cập nhật kỳ thi ${period.name}` }, tx);
      return period;
    });
  }

  async remove(actor: { id: number }, id: number) {
    const existing = await this.findOne(id);
    if (existing.examSchedules.length > 0) {
      throw new BadRequestException('Không thể xóa kỳ thi đã có lịch thi. Hãy hủy hoặc xóa các lịch thi trước.');
    }
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.examPeriod.delete({ where: { id } });
      await this.audit.write({ actorId: actor.id, action: 'DELETE', entityType: 'EXAM_PERIOD', entityId: id, description: `Đã xóa kỳ thi ${existing.name}` }, tx);
      return removed;
    });
  }
}
