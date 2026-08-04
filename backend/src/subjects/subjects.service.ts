import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.subject.findMany({
      include: {
        department: true,
        chapters: { orderBy: { order: 'asc' } },
        _count: { select: { studentSubjects: true, questions: true, examSchedules: true } },
      },
      orderBy: { subjectCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: { department: true, chapters: { orderBy: { order: 'asc' } } },
    });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');
    return subject;
  }

  async findChapters(subjectId: number) {
    await this.findOne(subjectId);
    return this.prisma.chapter.findMany({ where: { subjectId }, orderBy: { order: 'asc' } });
  }

  async create(data: { subjectCode: string; subjectName: string; credits: number; departmentId: number }) {
    if (await this.prisma.subject.findUnique({ where: { subjectCode: data.subjectCode } })) {
      throw new BadRequestException('Mã môn học đã tồn tại.');
    }
    if (!await this.prisma.department.findUnique({ where: { id: data.departmentId } })) {
      throw new BadRequestException('Khoa được chọn không tồn tại.');
    }
    return this.prisma.subject.create({ data, include: { department: true } });
  }

  async update(id: number, data: { subjectCode?: string; subjectName?: string; credits?: number; departmentId?: number }) {
    await this.findOne(id);
    if (data.departmentId !== undefined && !await this.prisma.department.findUnique({ where: { id: data.departmentId } })) {
      throw new BadRequestException('Khoa được chọn không tồn tại.');
    }
    return this.prisma.subject.update({ where: { id }, data, include: { department: true } });
  }

  async remove(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { studentSubjects: true, questions: true, examSchedules: true } } },
    });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');
    if (subject._count.studentSubjects || subject._count.questions || subject._count.examSchedules) {
      throw new BadRequestException('Không thể xóa môn học đã có sinh viên đăng ký, câu hỏi hoặc lịch thi.');
    }
    return this.prisma.subject.delete({ where: { id } });
  }
}
