import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        department: true,
        _count: { select: { students: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        department: true,
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
      },
    });
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
    return cls;
  }

  async getClassSubjects(id: number) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');

    const enrollments = await this.prisma.studentSubject.findMany({
      where: { student: { classId: id } },
      include: {
        subject: {
          select: {
            id: true,
            subjectCode: true,
            subjectName: true,
            credits: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    const map = new Map<string, any>();
    for (const e of enrollments) {
      const key = `${e.subjectId}_${e.semester}_${e.schoolYear}`;
      if (!map.has(key)) {
        map.set(key, {
          subjectId: e.subject.id,
          subjectCode: e.subject.subjectCode,
          subjectName: e.subject.subjectName,
          credits: e.subject.credits,
          departmentName: e.subject.department?.name || '',
          semester: e.semester,
          schoolYear: e.schoolYear,
          studentCount: 0,
        });
      }
      map.get(key).studentCount++;
    }
    return Array.from(map.values()).sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
  }

  async create(data: { code: string; name: string; departmentId: number }) {
    if (!await this.prisma.department.findUnique({ where: { id: data.departmentId } })) {
      throw new BadRequestException('Khoa được chọn không tồn tại.');
    }
    return this.prisma.class.create({ data });
  }

  async update(id: number, data: { code?: string; name?: string; departmentId?: number }) {
    await this.findOne(id);
    if (data.departmentId !== undefined && !await this.prisma.department.findUnique({ where: { id: data.departmentId } })) {
      throw new BadRequestException('Khoa được chọn không tồn tại.');
    }
    return this.prisma.class.update({ where: { id }, data });
  }

  async remove(id: number) {
    const cls = await this.findOne(id);
    if (cls.students.length > 0) {
      throw new BadRequestException('Không thể xóa lớp học còn sinh viên.');
    }
    return this.prisma.class.delete({ where: { id } });
  }
}
