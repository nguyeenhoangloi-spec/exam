import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: { classes: true, teachers: true, subjects: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { classes: true, teachers: true, subjects: true },
    });
    if (!department) throw new NotFoundException('Không tìm thấy khoa.');
    return department;
  }

  async create(data: { code: string; name: string }) {
    return this.prisma.department.create({ data });
  }

  async update(id: number, data: { code?: string; name?: string }) {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: number) {
    const department = await this.findOne(id);
    if (department.classes.length || department.teachers.length || department.subjects.length) {
      throw new BadRequestException('Không thể xóa khoa còn lớp học, giảng viên hoặc môn học.');
    }
    return this.prisma.department.delete({ where: { id } });
  }

  async getCurriculum(departmentId: number) {
    await this.findOne(departmentId);
    return this.prisma.majorSubject.findMany({
      where: { departmentId },
      include: {
        subject: {
          select: {
            id: true,
            subjectCode: true,
            subjectName: true,
            credits: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [{ type: 'asc' }, { recommendedSemester: 'asc' }],
    });
  }

  async addSubjectToCurriculum(
    departmentId: number,
    data: { subjectId: number; type?: 'MANDATORY' | 'ELECTIVE'; recommendedSemester?: number; note?: string },
  ) {
    await this.findOne(departmentId);
    const subject = await this.prisma.subject.findUnique({ where: { id: Number(data.subjectId) } });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');

    return this.prisma.majorSubject.upsert({
      where: {
        departmentId_subjectId: {
          departmentId,
          subjectId: Number(data.subjectId),
        },
      },
      create: {
        departmentId,
        subjectId: Number(data.subjectId),
        type: data.type || 'MANDATORY',
        recommendedSemester: Number(data.recommendedSemester) || 1,
        note: data.note || null,
      },
      update: {
        type: data.type || 'MANDATORY',
        recommendedSemester: Number(data.recommendedSemester) || 1,
        note: data.note || null,
      },
      include: {
        subject: true,
      },
    });
  }

  async removeSubjectFromCurriculum(departmentId: number, subjectId: number) {
    await this.findOne(departmentId);
    const existing = await this.prisma.majorSubject.findUnique({
      where: {
        departmentId_subjectId: {
          departmentId,
          subjectId,
        },
      },
    });
    if (!existing) throw new NotFoundException('Môn học không nằm trong khung chương trình của khoa.');
    return this.prisma.majorSubject.delete({
      where: { id: existing.id },
    });
  }
}
