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

  async enrollStudents(subjectId: number, data: { studentIds: number[]; semester: string; schoolYear: string }) {
    await this.findOne(subjectId);
    const ids = Array.from(new Set((data.studentIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0)));
    if (!ids.length) throw new BadRequestException('Vui lòng chọn ít nhất một sinh viên.');
    if (!data.semester?.trim() || !data.schoolYear?.trim()) throw new BadRequestException('Vui lòng nhập học kỳ và năm học.');
    const students = await this.prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (students.length !== ids.length) throw new BadRequestException('Có sinh viên không tồn tại.');
    await this.prisma.$transaction(ids.map((studentId) => this.prisma.studentSubject.upsert({
      where: { studentId_subjectId_semester_schoolYear: { studentId, subjectId, semester: data.semester.trim(), schoolYear: data.schoolYear.trim() } },
      create: { studentId, subjectId, semester: data.semester.trim(), schoolYear: data.schoolYear.trim(), status: 'ELIGIBLE' },
      update: { status: 'ELIGIBLE' },
    })));
    return { successCount: ids.length, subjectId, semester: data.semester.trim(), schoolYear: data.schoolYear.trim() };
  }

  async getEnrollments(subjectId: number, semester?: string, schoolYear?: string) {
    await this.findOne(subjectId);
    return this.prisma.studentSubject.findMany({
      where: { subjectId, ...(semester && { semester }), ...(schoolYear && { schoolYear }) },
      include: { student: { select: { id: true, studentCode: true, fullName: true, email: true } } },
      orderBy: { student: { studentCode: 'asc' } },
    });
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
