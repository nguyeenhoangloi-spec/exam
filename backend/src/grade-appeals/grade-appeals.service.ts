import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGradeAppealDto } from './dto/create-grade-appeal.dto';
import { ReviewGradeAppealDto } from './dto/review-grade-appeal.dto';
import { GradeAppealStatus } from '@prisma/client';

@Injectable()
export class GradeAppealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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
        onlineExamConfig: {
          include: {
            examSchedule: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.studentId !== student.id) {
      throw new NotFoundException('Không tìm thấy bài thi tương ứng của sinh viên.');
    }

    const allowedStatuses = ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'];
    if (!allowedStatuses.includes(attempt.status)) {
      throw new BadRequestException('Bài thi chưa được hoàn thành hoặc chưa công bố kết quả để phúc khảo.');
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
            onlineExamConfig: {
              include: {
                examSchedule: {
                  include: { subject: true },
                },
              },
            },
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
      where: { studentId: student.id },
      include: {
        attempt: {
          include: {
            onlineExamConfig: {
              include: {
                examSchedule: {
                  include: { subject: true },
                },
              },
            },
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

  async findAll(query: { status?: string; subjectId?: string; search?: string }) {
    const where: any = {};

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
        where.attempt = {
          onlineExamConfig: {
            examSchedule: {
              subjectId: subId,
            },
          },
        };
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
            onlineExamConfig: {
              include: {
                examSchedule: {
                  include: { subject: true },
                },
              },
            },
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
            onlineExamConfig: {
              include: {
                examSchedule: {
                  include: { subject: true },
                },
              },
            },
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

  async reviewAppeal(reviewerUserId: number, id: string, dto: ReviewGradeAppealDto) {
    const appeal = await this.prisma.gradeAppeal.findUnique({
      where: { id },
      include: { attempt: true },
    });

    if (!appeal) {
      throw new NotFoundException('Không tìm thấy đơn phúc khảo.');
    }

    const isApprove = dto.status === GradeAppealStatus.APPROVED_REGRADE;
    let newScore = appeal.originalScore;

    if (isApprove) {
      if (dto.revisedScore === undefined || dto.revisedScore === null) {
        throw new BadRequestException('Khi chấp nhận phúc khảo, bắt buộc phải nhập điểm mới.');
      }
      newScore = Number(dto.revisedScore);

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
        reviewerId: reviewerUserId,
        reviewedAt: new Date(),
      },
      include: {
        student: true,
        attempt: {
          include: {
            onlineExamConfig: {
              include: {
                examSchedule: {
                  include: { subject: true },
                },
              },
            },
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
      actorId: reviewerUserId,
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
