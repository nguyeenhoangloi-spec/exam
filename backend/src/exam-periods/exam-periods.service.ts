import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamPeriodsService {
  constructor(private prisma: PrismaService) {}

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

  async create(data: {
    name: string;
    semester: string;
    schoolYear: string;
    startDate: string;
    endDate: string;
    status?: string;
  }) {
    return this.prisma.examPeriod.create({
      data: {
        name: data.name,
        semester: data.semester,
        schoolYear: data.schoolYear,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'UPCOMING',
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.examPeriod.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.examPeriod.delete({ where: { id } });
  }
}
