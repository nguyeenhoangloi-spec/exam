import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const depts = await this.prisma.department.findMany({
      include: {
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: { classes: true, teachers: true, subjects: true, majorSubjects: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return depts.map((d) => {
      const studentCount = d.classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
      return {
        ...d,
        _count: {
          ...d._count,
          students: studentCount,
        },
      };
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            students: {
              select: {
                id: true,
                studentCode: true,
                fullName: true,
                email: true,
                phone: true,
                gender: true,
              },
            },
            _count: { select: { students: true } },
          },
        },
        teachers: true,
        subjects: true,
      },
    });
    if (!department) throw new NotFoundException('Không tìm thấy khoa.');

    const allStudents = department.classes.flatMap((c) =>
      (c.students || []).map((s) => ({
        ...s,
        classCode: c.code,
        className: c.name,
      })),
    );

    return {
      ...department,
      students: allStudents,
      _count: {
        classes: department.classes.length,
        teachers: department.teachers.length,
        subjects: department.subjects.length,
        students: allStudents.length,
      },
    };
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

    // Auto-sync: Đảm bảo các môn học tạo trực thuộc Khoa tự động có mặt trong Khung CTDT
    const deptSubjects = await this.prisma.subject.findMany({
      where: { departmentId },
    });

    for (const sub of deptSubjects) {
      await this.prisma.majorSubject.upsert({
        where: { departmentId_subjectId: { departmentId, subjectId: sub.id } },
        create: {
          departmentId,
          subjectId: sub.id,
          type: 'MANDATORY',
          recommendedSemester: 1,
          note: 'Môn học thuộc Khoa',
        },
        update: {},
      });
    }

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
      orderBy: [{ recommendedSemester: 'asc' }, { type: 'asc' }],
    });
  }

  async addSubjectToCurriculum(
    departmentId: number,
    data: { subjectId: number; type?: 'MANDATORY' | 'ELECTIVE'; recommendedSemester?: number; note?: string },
  ) {
    await this.findOne(departmentId);

    const subjectId = Number(data.subjectId);
    const recommendedSemester = Number(data.recommendedSemester) || 1;

    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');

    return this.prisma.majorSubject.upsert({
      where: {
        departmentId_subjectId: { departmentId, subjectId },
      },
      create: {
        departmentId,
        subjectId,
        type: data.type || 'MANDATORY',
        recommendedSemester,
        note: data.note || null,
      },
      update: {
        type: data.type || 'MANDATORY',
        recommendedSemester,
        note: data.note || null,
      },
      include: { subject: true },
    });
  }

  async removeSubjectFromCurriculum(departmentId: number, targetId: number) {
    await this.findOne(departmentId);
    const existing = await this.prisma.majorSubject.findFirst({
      where: {
        departmentId,
        OR: [
          { subjectId: targetId },
          { id: targetId },
        ],
      },
    });
    if (!existing) throw new NotFoundException('Môn học không nằm trong khung chương trình của khoa.');
    return this.prisma.majorSubject.delete({
      where: { id: existing.id },
    });
  }
}
