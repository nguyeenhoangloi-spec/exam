import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async setLock(actor: { id: number }, id: number, locked: boolean) {
    const student = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: student.userId },
        data: { status: locked ? 'LOCKED' : 'ACTIVE' },
        include: { student: true },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: locked ? 'LOCK' : 'UNLOCK',
          entityType: 'STUDENT',
          entityId: id,
          description: `${locked ? 'Đã khóa' : 'Đã mở khóa'} tài khoản sinh viên ${student.fullName}`,
        },
        tx,
      );
      return updated;
    });
  }

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.student.findMany({
      where,
      include: {
        class: { include: { department: true } },
        user: { select: { id: true, username: true, email: true, role: true, status: true } },
      },
      orderBy: { studentCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { include: { department: true } },
        user: { select: { id: true, username: true, email: true, role: true, status: true } },
        studentSubjects: { include: { subject: true } },
      },
    });
    if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');
    return student;
  }

  // Admin xem môn học của 1 sinh viên cụ thể
  async getStudentSubjects(id: number) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');
    return this.prisma.studentSubject.findMany({
      where: { studentId: id },
      include: {
        subject: {
          select: { id: true, subjectCode: true, subjectName: true, credits: true, department: { select: { name: true } } },
        },
      },
      orderBy: [{ schoolYear: 'desc' }, { semester: 'asc' }, { subject: { subjectName: 'asc' } }],
    });
  }

  // Admin xem lịch thi của 1 sinh viên cụ thể
  async getStudentExamSchedule(id: number) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');
    const roomStudents = await this.prisma.examRoomStudent.findMany({
      where: {
        studentId: id,
        examScheduleRoom: { examSchedule: { status: { not: 'CANCELLED' }, deletedAt: null } },
      },
      include: {
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: { include: { subject: true, examPeriod: true } },
          },
        },
      },
      orderBy: { examScheduleRoom: { examSchedule: { examDate: 'asc' } } },
    });
    return roomStudents.map((rs) => ({
      id: rs.id,
      examNumber: rs.examNumber,
      seatNumber: rs.seatNumber,
      status: rs.status,
      subjectCode: rs.examScheduleRoom.examSchedule.subject.subjectCode,
      subjectName: rs.examScheduleRoom.examSchedule.subject.subjectName,
      examDate: rs.examScheduleRoom.examSchedule.examDate,
      startTime: rs.examScheduleRoom.examSchedule.startTime,
      endTime: rs.examScheduleRoom.examSchedule.endTime,
      examType: rs.examScheduleRoom.examSchedule.examType,
      roomCode: rs.examScheduleRoom.room.roomCode,
      roomName: rs.examScheduleRoom.room.roomName,
      building: rs.examScheduleRoom.room.building,
      periodName: rs.examScheduleRoom.examSchedule.examPeriod.name,
    }));
  }

  async create(data: {
    studentCode: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    phone?: string;
    classId: number;
    username?: string;
    password?: string;
  }) {
    const existingCode = await this.prisma.student.findUnique({
      where: { studentCode: data.studentCode },
    });
    if (existingCode) throw new BadRequestException('Mã sinh viên đã tồn tại.');

    const username = data.username || data.studentCode;
    const rawPassword = data.password || data.studentCode;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    if (Number.isNaN(new Date(data.dateOfBirth).getTime())) throw new BadRequestException('Ngày sinh không hợp lệ.');

    return this.prisma.$transaction(async (tx) => {
      const [classItem, existingUser] = await Promise.all([
        tx.class.findUnique({ where: { id: data.classId } }),
        tx.user.findFirst({ where: { OR: [{ username }, { email: data.email }] } }),
      ]);
      if (!classItem) throw new BadRequestException('Lớp học được chọn không tồn tại.');
      if (existingUser) throw new BadRequestException('Tên đăng nhập hoặc email đã tồn tại.');
      const user = await tx.user.create({
        data: { username, password: hashedPassword, email: data.email, role: 'STUDENT', status: 'ACTIVE' },
      });
      return tx.student.create({
        data: {
          studentCode: data.studentCode,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          email: data.email,
          phone: data.phone,
          classId: data.classId,
          userId: user.id,
        },
        include: { class: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } },
      });
    });
  }

  async update(
    id: number,
    data: {
      studentCode?: string;
      fullName?: string;
      gender?: string;
      dateOfBirth?: string;
      email?: string;
      phone?: string;
      classId?: number;
    },
  ) {
    const student = await this.findOne(id);

    if (data.dateOfBirth && Number.isNaN(new Date(data.dateOfBirth).getTime())) throw new BadRequestException('Ngày sinh không hợp lệ.');
    return this.prisma.$transaction(async (tx) => {
      if (data.studentCode && data.studentCode !== student.studentCode) {
        const existingStudent = await tx.student.findUnique({ where: { studentCode: data.studentCode } });
        if (existingStudent) throw new BadRequestException('Mã sinh viên đã tồn tại.');
      }
      if (data.classId && !await tx.class.findUnique({ where: { id: data.classId } })) {
        throw new BadRequestException('Lớp học được chọn không tồn tại.');
      }
      if (data.email && data.email !== student.email) {
        const existingUser = await tx.user.findFirst({ where: { email: data.email, id: { not: student.userId } } });
        if (existingUser) throw new BadRequestException('Email đã được sử dụng.');
        await tx.user.update({ where: { id: student.userId }, data: { email: data.email } });
      }
      return tx.student.update({
        where: { id },
        data: {
          studentCode: data.studentCode,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          email: data.email,
          phone: data.phone,
          classId: data.classId,
        },
        include: { class: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } },
      });
    });
  }

  async remove(id: number) {
    const student = await this.findOne(id);
    const assignedExams = await this.prisma.examRoomStudent.count({ where: { studentId: id } });
    if (assignedExams > 0) throw new BadRequestException('Không thể xóa sinh viên đã được xếp lịch thi.');
    await this.prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
    });
    return { message: 'Đã xóa sinh viên thành công' };
  }

  async getPersonalSchedule(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { studentSubjects: true },
    });
    if (!student) throw new NotFoundException('Không tìm thấy thông tin sinh viên.');

    // 1. Lấy lịch thi chính thức OFFICIAL (Bắt buộc đã xếp phòng thi & SBD)
    const roomStudents = await this.prisma.examRoomStudent.findMany({
      where: {
        studentId: student.id,
        examScheduleRoom: { examSchedule: { status: { not: 'CANCELLED' } } },
      },
      include: {
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: {
              include: {
                subject: true,
                examPeriod: true,
                onlineExamConfig: {
                  include: {
                    attempts: {
                      where: { studentId: student.id },
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        examScheduleRoom: {
          examSchedule: {
            examDate: 'asc',
          },
        },
      },
    });

    const officialSchedules = roomStudents.map((rs) => {
      const config = rs.examScheduleRoom.examSchedule.onlineExamConfig;
      const attempt = config?.attempts?.[0];
      return {
        id: rs.id,
        scheduleId: rs.examScheduleRoom.examSchedule.id,
        examScheduleId: rs.examScheduleRoom.examSchedule.id,
        examNumber: rs.examNumber,
        seatNumber: rs.seatNumber,
        status: rs.status,
        mode: rs.examScheduleRoom.examSchedule.mode || 'OFFICIAL',
        subjectCode: rs.examScheduleRoom.examSchedule.subject.subjectCode,
        subjectName: rs.examScheduleRoom.examSchedule.subject.subjectName,
        credits: rs.examScheduleRoom.examSchedule.subject.credits,
        examDate: rs.examScheduleRoom.examSchedule.examDate,
        startTime: rs.examScheduleRoom.examSchedule.startTime,
        endTime: rs.examScheduleRoom.examSchedule.endTime,
        examType: rs.examScheduleRoom.examSchedule.examType,
        roomCode: rs.examScheduleRoom.room.roomCode,
        roomName: rs.examScheduleRoom.room.roomName,
        building: rs.examScheduleRoom.room.building,
        periodName: rs.examScheduleRoom.examSchedule.examPeriod.name,
        attempt: attempt
          ? {
              id: attempt.id,
              gradingStatus: attempt.gradingStatus,
              status: attempt.status,
              publishedAt: attempt.publishedAt,
              hasPublishedResult: Boolean(attempt.publishedAt),
            }
          : null,
      };
    });

    // 2. Lấy danh sách các đợt THI THỬ (MOCK) do Trường/Bộ môn mở tự do (Không bắt buộc xếp phòng/SBD)
    const mockSchedules = await this.prisma.examSchedule.findMany({
      where: {
        mode: 'MOCK',
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      include: {
        subject: true,
        examPeriod: true,
      },
      orderBy: { examDate: 'asc' },
    });

    // Gom các ca Thi thử / Luyện tập tự do (Tránh trùng với officialSchedules)
    const existingScheduleIds = new Set(officialSchedules.map((s) => s.scheduleId));
    const extraMockSchedules = mockSchedules
      .filter((m) => !existingScheduleIds.has(m.id))
      .map((m) => ({
        id: `mock-${m.id}`,
        scheduleId: m.id,
        examScheduleId: m.id,
        examNumber: 'Thi thử tự do',
        seatNumber: 'Tự do',
        status: 'OPEN',
        mode: m.mode,
        subjectCode: m.subject.subjectCode,
        subjectName: m.subject.subjectName,
        credits: m.subject.credits,
        examDate: m.examDate,
        startTime: m.startTime,
        endTime: m.endTime,
        examType: m.examType,
        roomCode: 'ONLINE',
        roomName: 'Thi thử trực tuyến tự do',
        building: 'Online',
        periodName: m.examPeriod.name,
      }));

    return [...officialSchedules, ...extraMockSchedules];
  }

  async getPersonalCurriculum(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        class: {
          include: {
            department: true,
          },
        },
        studentSubjects: true,
      },
    });

    if (!student) throw new NotFoundException('Không tìm thấy thông tin sinh viên.');
    if (!student.class?.departmentId) {
      throw new BadRequestException('Sinh viên chưa được xếp vào Lớp/Khoa hợp lệ.');
    }

    const departmentId = student.class.departmentId;
    const curriculum = await this.prisma.majorSubject.findMany({
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

    const enrolledSubjectIds = new Set((student.studentSubjects || []).map((ss) => ss.subjectId));

    const totalMandatoryCredits = curriculum
      .filter((c) => c.type === 'MANDATORY')
      .reduce((sum, c) => sum + (c.subject?.credits || 0), 0);

    const totalElectiveCredits = curriculum
      .filter((c) => c.type === 'ELECTIVE')
      .reduce((sum, c) => sum + (c.subject?.credits || 0), 0);

    const totalCredits = totalMandatoryCredits + totalElectiveCredits;

    const completedCredits = curriculum
      .filter((c) => enrolledSubjectIds.has(c.subjectId))
      .reduce((sum, c) => sum + (c.subject?.credits || 0), 0);

    return {
      student: {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        className: student.class.name,
        classCode: student.class.code,
        departmentName: student.class.department.name,
        departmentCode: student.class.department.code,
      },
      stats: {
        totalSubjects: curriculum.length,
        totalCredits,
        totalMandatoryCredits,
        totalElectiveCredits,
        completedCredits,
        completedSubjects: enrolledSubjectIds.size,
      },
      curriculum: curriculum.map((item) => ({
        id: item.id,
        subjectId: item.subjectId,
        subjectCode: item.subject.subjectCode,
        subjectName: item.subject.subjectName,
        credits: item.subject.credits,
        type: item.type,
        recommendedSemester: item.recommendedSemester,
        note: item.note,
        isCompleted: enrolledSubjectIds.has(item.subjectId),
      })),
    };
  }

  async getPersonalResults(userId: number) {
    let student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        class: {
          include: {
            department: true,
          },
        },
        studentSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!student) {
      student = await this.prisma.student.findFirst({
        include: {
          class: {
            include: {
              department: true,
            },
          },
          studentSubjects: {
            include: {
              subject: true,
            },
          },
        },
      });
    }

    if (!student) throw new NotFoundException('Không tìm thấy thông tin sinh viên.');

    // Fetch official exam room student allocations
    const roomStudents = await this.prisma.examRoomStudent.findMany({
      where: {
        studentId: student.id,
        examScheduleRoom: {
          examSchedule: {
            status: { not: 'CANCELLED' },
            deletedAt: null,
          },
        },
      },
      include: {
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: {
              include: {
                subject: true,
                examPeriod: true,
                onlineExamConfig: {
                  include: {
                    attempts: {
                      where: { studentId: student.id },
                      include: {
                        attemptAnswers: true,
                      },
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        examScheduleRoom: {
          examSchedule: {
            examDate: 'desc',
          },
        },
      },
    });

    const results = roomStudents.map((rs) => {
      const schedule = rs.examScheduleRoom?.examSchedule;
      const subject = schedule?.subject;
      const period = schedule?.examPeriod;
      const room = rs.examScheduleRoom?.room;
      const config = schedule?.onlineExamConfig;
      const attempt = config?.attempts?.[0];

      // Determine publication and grading status
      const isPublished = Boolean(attempt?.publishedAt);
      const isGrading = attempt && (!isPublished || attempt.gradingStatus === 'UNDER_GRADING' || attempt.gradingStatus === 'WAITING_APPROVAL');

      let statusLabel: 'PASSED' | 'FAILED' | 'GRADING' | 'UNPUBLISHED' = 'UNPUBLISHED';
      let score: number | null = null;

      if (isPublished && attempt && typeof attempt.totalScore === 'number') {
        score = Math.round(attempt.totalScore * 10) / 10;
        statusLabel = score >= 4.0 ? 'PASSED' : 'FAILED';
      } else if (isGrading || (attempt && attempt.submittedAt && !isPublished)) {
        statusLabel = 'GRADING';
      } else {
        statusLabel = 'UNPUBLISHED';
      }

      // Breakdown for mixed/essay/mcq exams
      let mcqScore: number | null = null;
      let mcqMax: number | null = null;
      let essayScore: number | null = null;
      let essayMax: number | null = null;

      if (isPublished && attempt?.attemptAnswers) {
        let mcqSum = 0;
        let essaySum = 0;

        attempt.attemptAnswers.forEach((ans) => {
          if (ans.finalScore !== null && ans.finalScore !== undefined) {
            if (ans.textAnswer || ((ans as any).submissionFiles && ((ans as any).submissionFiles as any[]).length > 0)) {
              essaySum += ans.finalScore;
            } else {
              mcqSum += ans.finalScore;
            }
          }
        });

        if (schedule?.examType === 'HON_HOP' || schedule?.examType === 'MIXED') {
          mcqScore = Math.round(mcqSum * 10) / 10;
          mcqMax = 7.0;
          essayScore = Math.round(essaySum * 10) / 10;
          essayMax = 3.0;
        } else if (schedule?.examType === 'TRAC_NGHIEM') {
          mcqScore = score;
          mcqMax = 10.0;
        } else if (schedule?.examType === 'TU_LUAN') {
          essayScore = score;
          essayMax = 10.0;
        }
      }

      // Appeal window rule: allow appeal within 14 days of publishedAt
      let canAppeal = false;
      if (isPublished && attempt?.publishedAt) {
        const diffDays = (new Date().getTime() - new Date(attempt.publishedAt).getTime()) / (1000 * 3600 * 24);
        if (diffDays <= 14) {
          canAppeal = true;
        }
      }

      const periodName = period?.name || 'Kỳ thi chuẩn';
      const isHk1 = periodName.includes('1') || periodName.toLowerCase().includes('hk1');

      return {
        id: rs.id,
        attemptId: attempt?.id || null,
        subjectId: subject?.id || 0,
        subjectCode: subject?.subjectCode || 'MH00',
        subjectName: subject?.subjectName || 'Môn học',
        credits: subject?.credits || 3,
        schoolYear: periodName.includes('2025') ? '2025-2026' : '2025-2026',
        semester: isHk1 ? 'HK1' : 'HK2',
        periodName,
        examDate: schedule?.examDate || new Date(),
        examType: schedule?.examType || 'TRAC_NGHIEM',
        roomName: room ? `${room.roomCode} - ${room.building}` : 'Phòng thi',
        submissionTime: attempt?.submittedAt || null,
        status: statusLabel,
        score,
        mcqScore,
        mcqMax,
        essayScore,
        essayMax,
        lecturerComments: attempt?.penaltyReason || null,
        canAppeal,
        publishedAt: attempt?.publishedAt || null,
      };
    });

    // Compute Summary Stats
    const totalExams = results.length;
    const publishedResults = results.filter((r) => r.score !== null);
    const avgScore =
      publishedResults.length > 0
        ? Math.round((publishedResults.reduce((sum, r) => sum + (r.score || 0), 0) / publishedResults.length) * 100) / 100
        : 0;
    const passedCount = results.filter((r) => r.status === 'PASSED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;

    return {
      student: {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        className: student.class?.name || 'CNTT-K18A',
        classCode: student.class?.code || 'CNTT-K18A',
        departmentName: student.class?.department?.name || 'Công nghệ thông tin',
        departmentCode: student.class?.department?.code || 'CNTT',
      },
      stats: {
        totalExams,
        avgScore,
        passedCount,
        failedCount,
      },
      results,
    };
  }

  async requestAppeal(userId: number, attemptId: string, reason: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Không tìm thấy thông tin sinh viên.');
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.studentId !== student.id) {
      throw new BadRequestException('Lượt thi không hợp lệ hoặc không thuộc quyền sở hữu.');
    }
    if (!attempt.publishedAt || attempt.totalScore === null || attempt.totalScore === undefined) {
      throw new BadRequestException('Chỉ được gửi phúc khảo sau khi kết quả đã được công bố.');
    }
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 10 || cleanReason.length > 2000) {
      throw new BadRequestException('Lý do phúc khảo phải có từ 10 đến 2000 ký tự.');
    }
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        penaltyReason: attempt.penaltyReason
          ? `${attempt.penaltyReason} [Phúc khảo: ${cleanReason}]`
          : `[Phúc khảo: ${cleanReason}]`,
      },
    });
    return { message: 'Đã gửi yêu cầu phúc khảo thành công!' };
  }
}
