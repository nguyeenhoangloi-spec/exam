import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamPeriodsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll() {
    return this.prisma.examPeriod.findMany({
      include: {
        _count: { select: { examSchedules: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const period = await this.prisma.examPeriod.findUnique({
      where: { id },
      include: { examSchedules: { include: { subject: true } } },
    });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ thi.');
    return period;
  }

  async create(actor: { id: number }, data: {
    name: string;
    semester: string;
    schoolYear: string;
    startDate: string;
    endDate: string;
    status?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.examPeriod.create({ data: {
        name: data.name,
        semester: data.semester,
        schoolYear: data.schoolYear,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'UPCOMING',
      } });
      await this.audit.write({ actorId: actor.id, action: 'CREATE', entityType: 'EXAM_PERIOD', entityId: period.id, description: `Đã tạo kỳ thi ${period.name}` }, tx);
      return period;
    });
  }

  async update(actor: { id: number }, id: number, data: any) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.examPeriod.update({ where: { id }, data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      } });
      await this.audit.write({ actorId: actor.id, action: 'UPDATE', entityType: 'EXAM_PERIOD', entityId: period.id, description: `Đã cập nhật kỳ thi ${period.name}` }, tx);
      return period;
    });
  }

  async remove(actor: { id: number }, id: number) {
    const existing = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.examPeriod.delete({ where: { id } });
      await this.audit.write({ actorId: actor.id, action: 'DELETE', entityType: 'EXAM_PERIOD', entityId: id, description: `Đã xóa kỳ thi ${existing.name}` }, tx);
      return removed;
    });
  }
}
