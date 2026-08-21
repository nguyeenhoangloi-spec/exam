import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGradeAppealDto } from './dto/create-grade-appeal.dto';
import { ReviewGradeAppealDto } from './dto/review-grade-appeal.dto';
import { GradeAppealStatus } from '@prisma/client';

const safeOnlineExamConfig = {
  select: {
    id: true,
    examScheduleId: true,
    examPaperId: true,
    examSchedule: { include: { subject: true } },
  },
} as const;

@Injectable()
export class GradeAppealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private teacherScope(actor: { id: number; role: string }) {
    if (actor.role !== 'TEACHER') return {};
    return {
      attempt: {
        onlineExamConfig: {
          examSchedule: {
            examScheduleRooms: {
              some: { supervisors: { some: { teacher: { userId: actor.id } } } },
            },
          },
        },
      },
    };
  }

  /** Phúc khảo chỉ áp dụng cho điểm thi chính thức, không áp dụng thi thử. */
  private officialAttemptScope() {
    return {
      attempt: {
        onlineExamConfig: {
          examSchedule: { mode: 'OFFICIAL' as const },
        },
      },
    };
  }

  private isScheduleEnded(schedule?: { examDate?: Date | string | null; endTime?: string | null }): boolean {
    if (!schedule?.examDate || !schedule.endTime) return false;
    const [hours, minutes] = schedule.endTime.split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return false;
    const endAt = new Date(schedule.examDate);
    if (Number.isNaN(endAt.getTime())) return false;
    endAt.setHours(hours, minutes, 0, 0);
    return new Date() >= endAt;
  }

  async createAppeal(userId: number, dto: CreateGradeAppealDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Không tìm thấy thông tin Sinh viên liên kết với tài khoản này.');
    }

    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: dto.attemptId },
      include: {
        onlineExamConfig: safeOnlineExamConfig,
      },
    });

    if (!attempt || attempt.studentId !== student.id) {
      throw new NotFoundException('Không tìm thấy bài thi tương ứng của sinh viên.');
    }

    if (attempt.onlineExamConfig?.examSchedule?.mode !== 'OFFICIAL') {
      throw new BadRequestException('Kết quả thi thử chỉ phục vụ luyện tập và không hỗ trợ phúc khảo.');
    }
    if (!this.isScheduleEnded(attempt.onlineExamConfig?.examSchedule)) {
      throw new BadRequestException('Kết quả chưa đến thời điểm mở cho sinh viên nên chưa thể gửi phúc khảo.');
    }

    if (!attempt.publishedAt || attempt.totalScore === null || attempt.totalScore === undefined) {
      throw new BadRequestException('Kết quả chưa được công bố nên chưa thể gửi phúc khảo.');
    }

    const existingAppeal = await this.prisma.gradeAppeal.findFirst({
      where: {
        attemptId: attempt.id,
        status: { in: [GradeAppealStatus.PENDING, GradeAppealStatus.UNDER_REVIEW, GradeAppealStatus.APPROVED_REGRADE] },
      },
    });

    if (existingAppeal) {
      throw new BadRequestException('Bạn đã gửi đơn phúc khảo cho lượt thi này và đơn đang được xem xét/xử lý.');
    }

    const appeal = await this.prisma.gradeAppeal.create({
      data: {
        attemptId: attempt.id,
        studentId: student.id,
        reason: dto.reason,
        evidenceUrls: dto.evidenceUrls ? JSON.stringify(dto.evidenceUrls) : null,
        status: GradeAppealStatus.PENDING,
        originalScore: attempt.totalScore ?? 0,
      },
      include: {
        student: true,
        attempt: {
          include: {
            onlineExamConfig: safeOnlineExamConfig,
          },
        },
      },
    });

    await this.auditService.write({
      actorId: userId,
      action: 'CREATE_GRADE_APPEAL',
      entityType: 'grade_appeals',
      entityId: appeal.id,
      description: `Sinh viên gửi đơn phúc khảo cho lượt thi ${attempt.id}`,
      metadata: { attemptId: attempt.id, reason: dto.reason, originalScore: attempt.totalScore },
    });

    return appeal;
  }

  async getMyAppeals(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      return [];
    }

    return this.prisma.gradeAppeal.findMany({
      where: { studentId: student.id, ...this.officialAttemptScope() },
      include: {
        attempt: {
          include: {
            onlineExamConfig: safeOnlineExamConfig,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(actor: { id: number; role: string }, query: { status?: string; subjectId?: string; search?: string }) {
    const where: any = {
      AND: [
        this.officialAttemptScope(),
        ...(actor.role === 'TEACHER' ? [this.teacherScope(actor)] : []),
      ],
    };

    if (query.status && Object.values(GradeAppealStatus).includes(query.status as any)) {
      where.status = query.status as GradeAppealStatus;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { reason: { contains: s, mode: 'insensitive' } },
        { student: { fullName: { contains: s, mode: 'insensitive' } } },
        { student: { studentCode: { contains: s, mode: 'insensitive' } } },
      ];
    }

    if (query.subjectId) {
      const subId = Number(query.subjectId);
      if (!isNaN(subId)) {
        where.AND = [
          ...(where.AND || []),
          {
            attempt: {
              onlineExamConfig: {
                examSchedule: {
                  subjectId: subId,
                },
              },
            },
          },
        ];
      }
    }

    return this.prisma.gradeAppeal.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        attempt: {
          include: {
            onlineExamConfig: safeOnlineExamConfig,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(actor: { id: number; role: string }, id: string) {
    const appeal = await this.prisma.gradeAppeal.findFirst({
      where: {
        id,
        ...(actor.role === 'STUDENT' ? { student: { userId: actor.id } } : {}),
        AND: [
          this.officialAttemptScope(),
          ...(actor.role === 'TEACHER' ? [this.teacherScope(actor)] : []),
        ],
      },
      include: {
        student: {
          include: {
            class: {
              include: { department: true },
            },
          },
        },
        attempt: {
          include: {
            onlineExamConfig: safeOnlineExamConfig,
            attemptAnswers: {
              include: {
                essayGrades: {
                  include: { criterion: true },
                },
              },
            },
            submissionFiles: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!appeal) {
      throw new NotFoundException('Không tìm thấy đơn phúc khảo.');
    }

    return appeal;
  }

  async reviewAppeal(actor: { id: number; role: string }, id: string, dto: ReviewGradeAppealDto) {
    const terminalStatuses = new Set<GradeAppealStatus>([
      GradeAppealStatus.APPROVED_REGRADE,
      GradeAppealStatus.REJECTED,
    ]);
    if (!terminalStatuses.has(dto.status)) {
      throw new BadRequestException('Chỉ được chấp nhận chấm lại hoặc từ chối đơn phúc khảo.');
    }

    const appeal = await this.prisma.gradeAppeal.findFirst({
      where: {
        id,
        AND: [
          this.officialAttemptScope(),
          ...(actor.role === 'TEACHER' ? [this.teacherScope(actor)] : []),
        ],
      },
      include: { attempt: true },
    });

    if (!appeal) {
      if (actor.role === 'TEACHER') {
        throw new ForbiddenException('Bạn không được phân công xử lý đơn phúc khảo này.');
      }
      throw new NotFoundException('Không tìm thấy đơn phúc khảo.');
    }
    if (terminalStatuses.has(appeal.status)) {
      throw new BadRequestException('Đơn phúc khảo này đã được xử lý.');
    }

    const isApprove = dto.status === GradeAppealStatus.APPROVED_REGRADE;
    let newScore = appeal.originalScore;

    if (isApprove) {
      if (dto.revisedScore === undefined || dto.revisedScore === null) {
        throw new BadRequestException('Khi chấp nhận phúc khảo, bắt buộc phải nhập điểm mới.');
      }
      newScore = Number(dto.revisedScore);
      const maxScore = (appeal as any).attempt?.maxScore ?? 10;
      if (newScore > Number(maxScore)) {
        throw new BadRequestException('Điểm mới không được vượt quá thang điểm của bài thi.');
      }

      // Update attempt score & status
      await this.prisma.examAttempt.update({
        where: { id: appeal.attemptId },
        data: {
          totalScore: newScore,
          gradingStatus: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
    }

    const updated = await this.prisma.gradeAppeal.update({
      where: { id },
      data: {
        status: dto.status,
        revisedScore: isApprove ? newScore : appeal.revisedScore,
        reviewerNote: dto.reviewerNote,
        reviewerId: actor.id,
        reviewedAt: new Date(),
      },
      include: {
        student: true,
        attempt: {
          include: {
            onlineExamConfig: safeOnlineExamConfig,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    await this.auditService.write({
      actorId: actor.id,
      action: 'REVIEW_GRADE_APPEAL',
      entityType: 'grade_appeals',
      entityId: appeal.id,
      description: `Xử lý đơn phúc khảo ${appeal.id} với trạng thái ${dto.status}`,
      metadata: {
        status: dto.status,
        oldScore: appeal.originalScore,
        newScore: isApprove ? newScore : appeal.revisedScore,
        reviewerNote: dto.reviewerNote,
      },
    });

    return updated;
  }
}
