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

  // Gán từng sinh viên riêng lẻ (legacy)
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

  // Gán cả lớp vào môn học
  async enrollByClass(subjectId: number, data: { classId: number; semester: string; schoolYear: string }) {
    await this.findOne(subjectId);
    if (!data.classId) throw new BadRequestException('Vui lòng chọn lớp.');
    if (!data.semester?.trim() || !data.schoolYear?.trim()) throw new BadRequestException('Vui lòng nhập học kỳ và năm học.');

    const cls = await this.prisma.class.findUnique({
      where: { id: data.classId },
      include: { students: { select: { id: true } } },
    });
    if (!cls) throw new BadRequestException('Lớp không tồn tại.');
    if (!cls.students.length) throw new BadRequestException(`Lớp ${cls.name} chưa có sinh viên nào.`);

    const semester = data.semester.trim();
    const schoolYear = data.schoolYear.trim();

    await this.prisma.$transaction(
      cls.students.map((s) =>
        this.prisma.studentSubject.upsert({
          where: { studentId_subjectId_semester_schoolYear: { studentId: s.id, subjectId, semester, schoolYear } },
          create: { studentId: s.id, subjectId, semester, schoolYear, status: 'ELIGIBLE' },
          update: { status: 'ELIGIBLE' },
        }),
      ),
    );

    return {
      successCount: cls.students.length,
      classId: cls.id,
      className: cls.name,
      classCode: cls.code,
      subjectId,
      semester,
      schoolYear,
    };
  }

  // Preview số SV sẽ được gán nếu chọn lớp này
  async previewEnrollByClass(subjectId: number, classId: number, semester: string, schoolYear: string) {
    await this.findOne(subjectId);
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: { select: { id: true, studentCode: true, fullName: true } },
        department: { select: { name: true } },
      },
    });
    if (!cls) throw new BadRequestException('Lớp không tồn tại.');

    const existingIds = new Set(
      (await this.prisma.studentSubject.findMany({
        where: {
          subjectId,
          studentId: { in: cls.students.map((s) => s.id) },
          ...(semester?.trim() && { semester: semester.trim() }),
          ...(schoolYear?.trim() && { schoolYear: schoolYear.trim() }),
        },
        select: { studentId: true },
      })).map((r) => r.studentId),
    );

    return {
      classId: cls.id,
      className: cls.name,
      classCode: cls.code,
      departmentName: (cls as any).department?.name,
      totalStudents: cls.students.length,
      newStudents: cls.students.filter((s) => !existingIds.has(s.id)).length,
      alreadyEnrolled: existingIds.size,
    };
  }

  // Danh sách SV đã đăng ký, kèm thông tin lớp
  async getEnrollments(subjectId: number, semester?: string, schoolYear?: string, classId?: number) {
    await this.findOne(subjectId);
    return this.prisma.studentSubject.findMany({
      where: {
        subjectId,
        ...(semester && { semester }),
        ...(schoolYear && { schoolYear }),
        ...(classId && { student: { classId } }),
      },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            class: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: [{ student: { class: { code: 'asc' } } }, { student: { studentCode: 'asc' } }],
    });
  }

  // Thống kê đăng ký môn theo lớp
  async getEnrollmentsSummary(subjectId: number, semester?: string, schoolYear?: string) {
    await this.findOne(subjectId);
    const enrollments = await this.prisma.studentSubject.findMany({
      where: {
        subjectId,
        ...(semester && { semester }),
        ...(schoolYear && { schoolYear }),
      },
      include: {
        student: {
          select: {
            classId: true,
            class: { select: { id: true, code: true, name: true, department: { select: { name: true } } } },
          },
        },
      },
    });

    const map = new Map<number, { classId: number; classCode: string; className: string; departmentName: string; count: number; semesters: Set<string> }>();
    for (const e of enrollments) {
      const cls = e.student.class;
      if (!cls) continue;
      if (!map.has(cls.id)) {
        map.set(cls.id, { classId: cls.id, classCode: cls.code, className: cls.name, departmentName: (cls as any).department?.name || '', count: 0, semesters: new Set() });
      }
      const entry = map.get(cls.id)!;
      entry.count++;
      entry.semesters.add(`${e.semester} / ${(e as any).schoolYear || ''}`);
    }

    return Array.from(map.values())
      .map((e) => ({ ...e, semesters: Array.from(e.semesters) }))
      .sort((a, b) => a.classCode.localeCompare(b.classCode));
  }

  async create(data: { subjectCode: string; subjectName: string; credits: number; departmentId: number }) {
    if (await this.prisma.subject.findUnique({ where: { subjectCode: data.subjectCode } })) {
      throw new BadRequestException('Mã môn học đã tồn tại.');
    }
    if (!await this.prisma.department.findUnique({ where: { id: data.departmentId } })) {
      throw new BadRequestException('Khoa được chọn không tồn tại.');
    }
    const subject = await this.prisma.subject.create({ data, include: { department: true } });
    if (data.departmentId) {
      await this.prisma.majorSubject.upsert({
        where: { departmentId_subjectId: { departmentId: data.departmentId, subjectId: subject.id } },
        create: { departmentId: data.departmentId, subjectId: subject.id, type: 'MANDATORY', recommendedSemester: 1, note: 'Môn học thuộc Khoa' },
        update: {},
      });
    }
    return subject;
  }

  async update(id: number, data: { subjectCode?: string; subjectName?: string; credits?: number; departmentId?: number }) {
    await this.findOne(id);
    if (data.departmentId !== undefined && !await this.prisma.department.findUnique({ where: { id: data.departmentId } })) {
      throw new BadRequestException('Khoa được chọn không tồn tại.');
    }
    const subject = await this.prisma.subject.update({ where: { id }, data, include: { department: true } });
    if (subject.departmentId) {
      await this.prisma.majorSubject.upsert({
        where: { departmentId_subjectId: { departmentId: subject.departmentId, subjectId: subject.id } },
        create: { departmentId: subject.departmentId, subjectId: subject.id, type: 'MANDATORY', recommendedSemester: 1, note: 'Môn học thuộc Khoa' },
        update: {},
      });
    }
    return subject;
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
