import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        department: true,
        _count: { select: { studentSubjects: true, questions: true, examSchedules: true } },
      },
      orderBy: { subjectCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: { department: true, questions: true },
    });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');
    return subject;
  }

  async create(data: { subjectCode: string; subjectName: string; credits: number; departmentId: number }) {
    const existing = await this.prisma.subject.findUnique({
      where: { subjectCode: data.subjectCode },
    });
    if (existing) throw new BadRequestException('Mã môn học đã tồn tại.');

    return this.prisma.subject.create({
      data,
      include: { department: true },
    });
  }

  async update(id: number, data: { subjectCode?: string; subjectName?: string; credits?: number; departmentId?: number }) {
    await this.findOne(id);
    return this.prisma.subject.update({
      where: { id },
      data,
      include: { department: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.subject.delete({ where: { id } });
  }
}
