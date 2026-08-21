import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AttemptStatus, EssayAttemptGradingStatus, Prisma } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { ActionReasonDto, GradeAnswerDto, RubricDto } from './dto/essay.dto';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

@Injectable()
export class EssayService {
  private readonly logger = new Logger(EssayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly aiService: AiService,
  ) {}

  private validFileSignature(file: Express.Multer.File) {
    const buffer = file?.buffer || Buffer.alloc(0);
    if (file.mimetype === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return buffer.subarray(0, 2).toString('ascii') === 'PK';
    }
    if (file.mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (file.mimetype === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    return false;
  }

  private async teacherCanAccessSchedule(userId: number, scheduleId: number) {
    return Boolean(
      await this.prisma.examScheduleRoom.findFirst({
        where: {
          examScheduleId: scheduleId,
          supervisors: { some: { teacher: { userId } } },
        },
        select: { id: true },
      }),
    );
  }

  async updateConfig(actor: any, scheduleId: number, data: any) {
    if (actor.role !== 'ADMIN' && !(await this.teacherCanAccessSchedule(actor.id, scheduleId))) {
      throw new ForbiddenException('Bạn không được cấu hình đề thi này.');
    }
    const config = await this.prisma.onlineExamConfig.findUnique({ where: { examScheduleId: scheduleId } });
    if (!config) throw new NotFoundException('Chưa có cấu hình bài thi cho lịch này.');
    const updated = await this.prisma.onlineExamConfig.update({
      where: { examScheduleId: scheduleId },
      data: {
        essayEnabled: Boolean(data.essayEnabled),
        allowEssayFileUpload: data.allowEssayFileUpload === undefined ? true : Boolean(data.allowEssayFileUpload),
        maxEssayFileSizeMb: Math.min(Math.max(Number(data.maxEssayFileSizeMb || 20), 1), 20),
        showEssayResultAfterApproval:
          data.showEssayResultAfterApproval === undefined ? true : Boolean(data.showEssayResultAfterApproval),
      },
      select: {
        id: true,
        examScheduleId: true,
        examPaperId: true,
        essayEnabled: true,
        allowEssayFileUpload: true,
        maxEssayFileSizeMb: true,
        showEssayResultAfterApproval: true,
        updatedAt: true,
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'UPDATE',
      entityType: 'ONLINE_EXAM_CONFIG',
      entityId: scheduleId,
      description: 'Cập nhật cấu hình thi tự luận',
      metadata: data,
    });
    return updated;
  }

  private async assertRubricAccess(actor: any, questionId: string) {
    if (['ADMIN', 'TEACHER'].includes(actor.role)) return;
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    throw new ForbiddenException('Bạn không có quyền quản lý hoặc cấu hình Rubric cho câu hỏi này.');
  }

  async getRubric(actor: any, questionId: string) {
    await this.assertRubricAccess(actor, questionId);
    const version = await this.prisma.essayRubricVersion.findFirst({
      where: { questionId },
      include: { criteria: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { version: 'desc' },
    });
    if (version) return version.criteria;
    return this.prisma.essayRubricCriterion.findMany({ where: { questionId }, orderBy: { sortOrder: 'asc' } });
  }

  async getRubricVersions(actor: any, questionId: string) {
    await this.assertRubricAccess(actor, questionId);
    return this.prisma.essayRubricVersion.findMany({
      where: { questionId },
      include: { criteria: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { version: 'desc' },
    });
  }

  async saveRubric(actor: any, questionId: string, dto: RubricDto) {
    await this.assertRubricAccess(actor, questionId);
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { type: true, score: true, content: true, explanation: true } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    if (question.type !== 'ESSAY') throw new BadRequestException('Chỉ câu hỏi tự luận (ESSAY) mới được tạo Rubric chấm điểm.');
    if (!dto.criteria || !dto.criteria.length) throw new BadRequestException('Rubric phải có ít nhất 1 tiêu chí.');

    // Kiểm tra thứ tự không bị trùng
    const sortOrders = dto.criteria.map((c) => c.sortOrder);
    if (new Set(sortOrders).size !== sortOrders.length) {
      throw new BadRequestException('Thứ tự (sortOrder) của các tiêu chí Rubric không được trùng nhau.');
    }

    // Kiểm tra điểm số
    for (const item of dto.criteria) {
      if (item.maxScore <= 0) {
        throw new BadRequestException(`Điểm tối đa của tiêu chí "${item.label}" phải lớn hơn 0.`);
      }
    }

    const totalRubricScore = Number(dto.criteria.reduce((sum, item) => sum + item.maxScore, 0).toFixed(2));
    const expectedScore = Number((question.score || 0).toFixed(2));
    if (Math.abs(totalRubricScore - expectedScore) > 0.001) {
      throw new BadRequestException(
        `Tổng điểm các tiêu chí Rubric (${totalRubricScore}đ) phải bằng đúng điểm số của câu hỏi (${expectedScore}đ).`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const latest = await tx.essayRubricVersion.findFirst({
        where: { questionId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      // Xóa các tiêu chí cũ để thay thế bằng bộ tiêu chí mới (tránh trùng lặp unique questionId + sortOrder)
      await tx.essayRubricCriterion.deleteMany({
        where: { questionId },
      });

      const version = await tx.essayRubricVersion.create({
        data: {
          questionId,
          version: (latest?.version || 0) + 1,
          referenceAnswer: dto.referenceAnswer?.trim() || question.explanation || null,
          gradingGuidance: dto.gradingGuidance?.trim() || null,
          totalScore: totalRubricScore,
          createdById: actor.id,
          criteria: {
            create: dto.criteria.map((item) => ({
              questionId,
              label: item.label.trim(),
              description: item.description?.trim() || null,
              fullCreditGuide: item.fullCreditGuide?.trim() || null,
              partialCreditGuide: item.partialCreditGuide?.trim() || null,
              zeroCreditGuide: item.zeroCreditGuide?.trim() || null,
              acceptedConcepts: item.acceptedConcepts?.trim() || null,
              commonMistakes: item.commonMistakes?.trim() || null,
              scoreStep: item.scoreStep || 0.25,
              maxScore: item.maxScore,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: { criteria: { orderBy: { sortOrder: 'asc' } } },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'RUBRIC_UPDATE',
          entityType: 'Question',
          entityId: questionId,
          description: 'Cập nhật Rubric câu hỏi tự luận',
          metadata: { totalRubricScore, criteriaCount: version.criteria.length, rubricVersion: version.version },
        },
        tx,
      );
      return version.criteria;
    });

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async suggestRubric(actor: any, questionId: string) {
    await this.assertRubricAccess(actor, questionId);
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { type: true, score: true, content: true, explanation: true },
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    if (question.type !== 'ESSAY') throw new BadRequestException('Chỉ câu hỏi tự luận (ESSAY) mới được AI tạo Rubric.');
    if (!question.content?.trim()) throw new BadRequestException('Câu hỏi chưa có nội dung để AI phân tích.');

    return this.aiService.generateRubric({
      questionText: question.content,
      sampleAnswer: question.explanation || '',
      totalScore: Number(question.score || 0),
    });
  }

  async autoMarkZeroForExpiredExams(): Promise<{ success: boolean; updatedCount: number }> {
    const now = new Date();
    const onlineConfigs = await this.prisma.onlineExamConfig.findMany({
      include: {
        examSchedule: {
          include: {
            examScheduleRooms: {
              include: {
                examRoomStudents: { include: { student: true } },
              },
            },
          },
        },
      },
    });

    let updatedCount = 0;

    for (const config of onlineConfigs) {
      const sched = config.examSchedule;
      if (!sched || !sched.examDate) continue;

      const examDate = new Date(sched.examDate);
      let endHour = 23, endMinute = 59;

      if (sched.endTime && sched.endTime.includes(':')) {
        const parts = sched.endTime.split(':').map((p) => parseInt(p, 10));
        if (!isNaN(parts[0])) endHour = parts[0];
        if (!isNaN(parts[1])) endMinute = parts[1];
      }

      const examEnd = new Date(
        examDate.getFullYear(),
        examDate.getMonth(),
        examDate.getDate(),
        endHour,
        endMinute,
        59,
      );

      // Nếu chưa hết giờ ca thi -> Chưa tự động chấm 0đ vắng thi
      if (now <= examEnd) continue;

      const rooms = sched.examScheduleRooms || [];
      for (const room of rooms) {
        for (const ers of room.examRoomStudents || []) {
          if (!ers.studentId) continue;

          const attempt = await this.prisma.examAttempt.findFirst({
            where: {
              studentId: ers.studentId,
              onlineExamConfigId: config.id,
            },
          });

          if (!attempt) {
            // Trường hợp 1: Thí sinh vắng thi không vào thi -> Tạo điểm 0đ PUBLISHED
            await this.prisma.examAttempt.create({
              data: {
                student: { connect: { id: ers.studentId } },
                onlineExamConfig: { connect: { id: config.id } },
                mode: sched.mode,
                attemptToken: randomUUID(),
                status: AttemptStatus.AUTO_SUBMITTED,
                gradingStatus: EssayAttemptGradingStatus.PUBLISHED,
                totalScore: 0,
                penaltyPoints: 0,
                penaltyReason: 'Vắng thi / Hết giờ không tham gia thi',
                submittedAt: examEnd,
                publishedAt: now,
              },
            });
            updatedCount++;
          } else if (
            attempt.gradingStatus !== EssayAttemptGradingStatus.PUBLISHED &&
            attempt.gradingStatus !== EssayAttemptGradingStatus.WAITING_APPROVAL
          ) {
            // Trường hợp 2: Thí sinh đã tham gia thi nhưng hết giờ ca thi.
            // Không tự động ghi điểm AI ở đây; Giảng viên phải chủ động bấm
            // "Chấm mẫu AI" để xem đề xuất theo Rubric và xác nhận điểm.
            const isAlreadySubmitted = attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.AUTO_SUBMITTED;
            await this.prisma.examAttempt.update({
              where: { id: attempt.id },
              data: {
                status: isAlreadySubmitted ? attempt.status : AttemptStatus.AUTO_SUBMITTED,
                gradingStatus: EssayAttemptGradingStatus.UNDER_GRADING,
                submittedAt: attempt.submittedAt || examEnd,
              },
            });
            updatedCount++;
          }
        }
      }
    }

    return { success: true, updatedCount };
  }

  async assignments(actor: any, status?: string) {
    try {
      await this.autoMarkZeroForExpiredExams();
    } catch (e) {
      this.logger.warn(`autoMarkZeroForExpiredExams failed: ${e?.message}`);
    }

    const where: Prisma.ExamAttemptWhereInput = {
      onlineExamConfig: {
        examSchedule: actor.role === 'ADMIN' ? {} : { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } },
      },
      status: status
        ? (status as AttemptStatus)
        : { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.UNDER_REVIEW, AttemptStatus.IN_PROGRESS, AttemptStatus.NOT_STARTED] },
    };
    const attempts = await this.prisma.examAttempt.findMany({
      where,
      orderBy: { submittedAt: 'asc' },
      include: {
        student: true,
        snapshot: true,
        onlineExamConfig: {
          include: {
            examSchedule: { include: { subject: true, examPeriod: true } },
            examPaper: {
              include: {
                questions: {
                  include: { question: true },
                },
              },
            },
          },
        },
        incidents: true,
      },
    });

    const attemptsWithEssay = attempts.filter((a) => {
      const snap = a.snapshot?.snapshotData;
      if (Array.isArray(snap) && snap.length > 0) {
        return (snap as any[]).some((q) => q.type === 'ESSAY');
      }
      const paperQuestions = a.onlineExamConfig?.examPaper?.questions || [];
      if (paperQuestions.length > 0) {
        return paperQuestions.some((eq: any) => eq.question?.type === 'ESSAY');
      }
      return Boolean(a.onlineExamConfig?.essayEnabled);
    });

    try {
      const scheduleWhere = actor.role === 'ADMIN'
        ? {}
        : { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } };

      const onlineConfigs = await this.prisma.onlineExamConfig.findMany({
        where: {
          examSchedule: scheduleWhere,
          essayEnabled: true,
        },
        include: {
          examPaper: {
            include: {
              questions: {
                include: { question: true },
              },
            },
          },
          examSchedule: {
            include: {
              subject: true,
              examPeriod: true,
              examScheduleRooms: {
                include: {
                  examRoomStudents: {
                    include: { student: true },
                  },
                },
              },
            },
          },
        },
      });

      const onlineConfigsWithEssay = onlineConfigs.filter((cfg) => {
        const paperQuestions = cfg.examPaper?.questions || [];
        if (paperQuestions.length > 0) {
          return paperQuestions.some((eq: any) => eq.question?.type === 'ESSAY');
        }
        return true;
      });

      const existingStudentAttemptKeys = new Set(
        attemptsWithEssay.map((a) => `${a.studentId}-${a.onlineExamConfigId}`),
      );

      const virtualAttempts: any[] = [];
      for (const config of onlineConfigsWithEssay) {
        const rooms = config.examSchedule?.examScheduleRooms || [];
        for (const room of rooms) {
          const roomStudents = room.examRoomStudents || [];
          for (const ers of roomStudents) {
            const key = `${ers.studentId}-${config.id}`;
            if (!existingStudentAttemptKeys.has(key) && ers.student) {
              existingStudentAttemptKeys.add(key);
              virtualAttempts.push({
                id: `virtual-${ers.studentId}-${config.id}`,
                studentId: ers.studentId,
                onlineExamConfigId: config.id,
                student: ers.student,
                onlineExamConfig: {
                  id: config.id,
                  examScheduleId: config.examScheduleId,
                  examPaperId: config.examPaperId,
                  mode: config.mode,
                  examSchedule: config.examSchedule,
                },
                status: 'NOT_STARTED',
                gradingStatus: 'NOT_STARTED',
                submittedAt: null,
                createdAt: new Date(),
                totalScore: 0,
                attemptAnswers: [],
                isVirtual: true,
              });
            }
          }
        }
      }

      return [...attemptsWithEssay, ...virtualAttempts];
    } catch (e) {
      return attemptsWithEssay;
    }
  }

  private async getAttempt(actor: any, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        snapshot: true,
        attemptAnswers: {
          include: {
            essayGrades: { include: { criterion: true, gradedBy: true } },
            submissionFiles: true,
            gradeHistories: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
          },
        },
        incidents: true,
        onlineExamConfig: {
          include: {
            examSchedule: {
              include: {
                examScheduleRooms: { include: { supervisors: { include: { teacher: true } } } },
                subject: true,
                examPeriod: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Không tìm thấy phiên làm bài thi.');
    if (
      actor.role !== 'ADMIN' &&
      !(await this.teacherCanAccessSchedule(actor.id, attempt.onlineExamConfig.examScheduleId))
    ) {
      throw new ForbiddenException('Bạn không được truy cập bài thi này.');
    }
    return attempt;
  }

  async detail(actor: any, attemptId: string) {
    let attempt = await this.getAttempt(actor, attemptId);
    const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
    const essayQuestions = snapshot.filter((q) => q.type === 'ESSAY');

    const questionIds = essayQuestions.map((q) => q.questionId);
    const dbQuestions = questionIds.length
      ? await this.prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, explanation: true, media: true },
        })
      : [];
    const dbQuestionMap = new Map(dbQuestions.map((q) => [q.id, q]));

    const rubrics = questionIds.length
      ? await this.prisma.essayRubricCriterion.findMany({
          where: { questionId: { in: questionIds } },
          orderBy: { sortOrder: 'asc' },
        })
      : [];
    const rubricByQuestion = new Map<string, typeof rubrics>();
    for (const rubric of rubrics) {
      rubricByQuestion.set(rubric.questionId, [...(rubricByQuestion.get(rubric.questionId) || []), rubric]);
    }

    const processedQuestions = await Promise.all(
      essayQuestions.map(async (q) => {
        const dbQ = dbQuestionMap.get(q.questionId);
        const resolvedExplanation = q.explanation || q.sampleAnswer || dbQ?.explanation || '';
        const resolvedMedia = (Array.isArray(q.media) && q.media.length > 0) ? q.media : (dbQ?.media || []);
        let questionRubric = rubricByQuestion.get(q.questionId) || [];
        if (!questionRubric.length && q.type === 'ESSAY') {
          const maxSc = Number(q.score || 1);
          try {
            const defaultCriterion = await this.prisma.essayRubricCriterion.create({
              data: {
                questionId: q.questionId,
                label: 'Nội dung & Đánh giá tổng thể',
                description: 'Đánh giá mức độ hoàn thành bài tự luận theo yêu cầu đề bài',
                maxScore: maxSc,
                sortOrder: 1,
              },
            });
            questionRubric = [defaultCriterion];
          } catch (e) {
            // Ignore if race condition
          }
        }
        return {
          ...q,
          media: resolvedMedia,
          sampleAnswer: resolvedExplanation,
          explanation: resolvedExplanation,
          options: undefined,
          rubric: questionRubric,
        };
      }),
    );

    // Đảm bảo tất cả câu hỏi tự luận trong attempt đều có bản ghi AttemptAnswer để có thể chấm điểm và lưu điểm thủ công
    for (const q of essayQuestions) {
      let existingAns = (attempt.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
      if (!existingAns) {
        try {
          existingAns = (await this.prisma.attemptAnswer.create({
            data: {
              attempt: { connect: { id: attempt.id } },
              questionId: q.questionId,
              textAnswer: '(Sinh viên không nhập nội dung văn bản)',
              gradingStatus: 'GRADED',
              finalScore: 0,
              clientTimestamp: new Date(),
            },
            include: {
              essayGrades: { include: { criterion: true, gradedBy: true } },
              submissionFiles: true,
              gradeHistories: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
            },
          })) as any;
          attempt.attemptAnswers.push(existingAns);
        } catch (e) {
          const found = await this.prisma.attemptAnswer.findFirst({
            where: { attemptId: attempt.id, questionId: q.questionId },
            include: {
              essayGrades: { include: { criterion: true, gradedBy: true } },
              submissionFiles: true,
              gradeHistories: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
            },
          });
          if (found) attempt.attemptAnswers.push(found as any);
        }
      }
    }

    return {
      ...attempt,
      snapshot: undefined,
      questions: processedQuestions,
    };
  }

  async gradeAnswer(actor: any, answerId: string, dto: GradeAnswerDto) {
    const answer = await this.prisma.attemptAnswer.findUnique({
      where: { id: answerId },
      include: { attempt: true, essayGrades: true },
    });
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời.');

    const attempt = await this.getAttempt(actor, answer.attemptId);

    // Sau khi PUBLISHED: không cho Giảng viên sửa trực tiếp
    if (attempt.gradingStatus === EssayAttemptGradingStatus.PUBLISHED && actor.role !== 'ADMIN') {
      throw new BadRequestException('Bài thi đã công bố điểm. Chỉ ADMIN mới có quyền điều chỉnh điểm sau công bố.');
    }

    let rubrics = await this.prisma.essayRubricCriterion.findMany({
      where: { questionId: answer.questionId },
    });
    if (!rubrics.length) {
      const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
      const qSnapshot = snapshot.find((q) => q.questionId === answer.questionId);
      const maxScore = Number(qSnapshot?.score || 1);
      const defaultRubric = await this.prisma.essayRubricCriterion.create({
        data: {
          questionId: answer.questionId,
          label: 'Nội dung & Đánh giá tổng thể',
          description: 'Đánh giá mức độ hoàn thành bài tự luận theo yêu cầu đề bài',
          maxScore: maxScore,
          sortOrder: 1,
        },
      });
      rubrics = [defaultRubric];
    }

    // Bắt buộc phải chấm đủ tất cả các tiêu chí trong Rubric
    if (dto.criteria.length !== rubrics.length) {
      throw new BadRequestException(
        `Bạn phải nhập điểm đủ tất cả ${rubrics.length} tiêu chí Rubric của câu hỏi.`,
      );
    }

    const map = new Map(rubrics.map((r) => [r.id, r]));
    const existingGradesMap = new Map(answer.essayGrades.map((g) => [g.criterionId, g]));

    for (const item of dto.criteria) {
      const criterion = map.get(item.criterionId);
      if (!criterion) throw new BadRequestException('Tiêu chí chấm không hợp lệ.');
      if (item.score < 0) {
        throw new BadRequestException(`Điểm tiêu chí "${criterion.label}" không được nhỏ hơn 0.`);
      }
      if (item.score > criterion.maxScore) {
        throw new BadRequestException(
          `Điểm tiêu chí "${criterion.label}" (${item.score}) không được vượt điểm tối đa (${criterion.maxScore}).`,
        );
      }
      const scoreStep = Number(criterion.scoreStep || 0.25);
      const stepRatio = item.score / scoreStep;
      if (Math.abs(stepRatio - Math.round(stepRatio)) > 0.000001) {
        throw new BadRequestException(
          `Điểm tiêu chí "${criterion.label}" phải theo bước ${scoreStep} điểm.`,
        );
      }
    }

    const totalScore = Number(
      dto.criteria.reduce((sum, item) => sum + Number(item.score || 0), 0).toFixed(2),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.criteria) {
        const existing = existingGradesMap.get(item.criterionId);
        const oldScore = existing ? existing.score : null;
        const oldComment = existing ? existing.comment : null;
        const newScore = Number(item.score.toFixed(2));
        const newComment = item.comment || '';

        // Upsert grade
        await tx.essayGrade.upsert({
          where: {
            attemptAnswerId_criterionId: {
              attemptAnswerId: answer.id,
              criterionId: item.criterionId,
            },
          },
          create: {
            attemptAnswerId: answer.id,
            criterionId: item.criterionId,
            score: newScore,
            comment: newComment,
            gradedById: actor.id,
          },
          update: {
            score: newScore,
            comment: newComment,
            gradedById: actor.id,
          },
        });

        // Ghi nhận Lịch sử chỉnh điểm nếu có thay đổi
        if (!existing || oldScore !== newScore || oldComment !== newComment) {
          await tx.essayGradeHistory.create({
            data: {
              attemptAnswerId: answer.id,
              criterionId: item.criterionId,
              oldScore,
              newScore,
              oldComment,
              newComment,
              actorId: actor.id,
              reason: dto.reason || (attempt.gradingStatus === EssayAttemptGradingStatus.PUBLISHED ? 'Chỉnh sửa điểm sau công bố' : 'Chấm điểm tiêu chí'),
            },
          });
        }
      }

      // Cập nhật câu trả lời
      await tx.attemptAnswer.update({
        where: { id: answer.id },
        data: {
          finalScore: totalScore,
          teacherComment: dto.teacherComment || '',
          gradingStatus: 'GRADED',
          ...(dto.reason?.includes('AI') ? { aiConfirmedById: actor.id, aiConfirmedAt: new Date() } : {}),
        },
      });

      // Tự động tính lại tổng điểm toàn bộ bài thi khi lưu điểm
      const allAnswers = await tx.attemptAnswer.findMany({
        where: { attemptId: attempt.id },
      });
      const penalty = Number(attempt.penaltyPoints || 0);
      const computedTotal = allAnswers.reduce((sum, a) => sum + (Number(a.finalScore) || 0), 0);
      const newAttemptTotalScore = Number(Math.max(0, computedTotal - penalty).toFixed(2));

      await tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          totalScore: newAttemptTotalScore,
          ...(['SUBMITTED', 'AUTO_SUBMITTED'].includes(attempt.status as any) ? { status: AttemptStatus.UNDER_REVIEW } : {}),
        },
      });

      await this.audit.write(
        {
          actorId: actor.id,
          action: 'ESSAY_GRADE',
          entityType: 'AttemptAnswer',
          entityId: answer.id,
          description: 'Chấm điểm câu tự luận theo Rubric',
          metadata: { totalScore, teacherComment: dto.teacherComment },
        },
        tx,
      );
    });

    return { success: true, finalScore: totalScore };
  }

  async aiSuggest(actor: any, answerId: string) {
    const answer = await this.prisma.attemptAnswer.findUnique({
      where: { id: answerId },
      include: { attempt: { include: { snapshot: true, student: true } } },
    });
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời.');
    await this.getAttempt(actor, answer.attemptId);

    const snapshot = ((answer.attempt.snapshot?.snapshotData as any[]) || []).find(
      (q) => q.questionId === answer.questionId || q.id === answer.questionId,
    );
    if (!snapshot || snapshot.type !== 'ESSAY') {
      throw new BadRequestException('Chỉ hỗ trợ AI đề xuất cho câu hỏi tự luận (ESSAY).');
    }

    let rubric = await this.prisma.essayRubricCriterion.findMany({
      where: { questionId: answer.questionId },
      orderBy: { sortOrder: 'asc' },
    });

    if (!rubric.length) {
      try {
        const defaultCriterion = await this.prisma.essayRubricCriterion.create({
          data: {
            questionId: answer.questionId,
            label: 'Nội dung câu trả lời tự luận hoàn chỉnh',
            description: snapshot.explanation || 'Đánh giá độ chính xác, đầy đủ và lập luận logic của câu trả lời',
            maxScore: Number(snapshot.score || 1.0),
            sortOrder: 1,
          },
        });
        rubric = [defaultCriterion];
      } catch (e) {
        rubric = await this.prisma.essayRubricCriterion.findMany({
          where: { questionId: answer.questionId },
          orderBy: { sortOrder: 'asc' },
        });
      }
    }
    const rawText = ((answer.textAnswer as string) || '').trim();
    if (!rawText || rawText === '(Sinh viên không nhập nội dung văn bản)') {
      const emptyCriteria = rubric.map((r) => ({
        criterionId: r.id,
        score: 0,
        comment: 'Sinh viên bỏ trống / chưa làm câu hỏi này (0đ).',
        evidenceQuote: '',
        achievementLevel: 'NOT_MET',
      }));
      return {
        criteria: emptyCriteria,
        overallComment: 'Sinh viên bỏ trống / chưa làm câu hỏi này (0đ).',
        confidence: 1.0,
        warning: 'Thí sinh không nhập nội dung trả lời.',
        isBlank: true,
        source: 'RULE',
        requiresTeacherConfirmation: true,
      };
    }

    const aiRun = await this.prisma.essayAiGradingRun.create({
      data: {
        attemptAnswerId: answer.id,
        rubricVersionId: answer.rubricVersionId || null,
        requestedById: Number(actor?.id) || 1,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const prompt = `Bạn là trợ lý AI chấm thi. Nhiệm vụ của bạn là phân tích bài làm của sinh viên và đề xuất điểm số theo đúng Rubric. Bạn CHỈ ĐỀ XUẤT, không tự quyết định điểm số chính thức.

CÂU HỎI:
${snapshot.content}

ĐÁP ÁN GỢI Ý / HƯỚNG DẪN:
${snapshot.explanation || 'Không có hướng dẫn chi tiết.'}

BÀI LÀM CỦA SINH VIÊN:
${answer.textAnswer || '(Sinh viên không nhập nội dung văn bản)'}

RUBRIC DỮ LIỆU (ID|Tên tiêu chí|Mô tả|Điểm tối đa):
${rubric.map((r) => `${r.id}|${r.label}|${r.description || ''}|${r.maxScore}`).join('\n')}

Hãy đánh giá và trả về JSON duy nhất theo đúng cấu trúc schema sau:
{
  "criteria": [
    {
      "criterionId": "<id tiêu chí>",
      "score": <số điểm đề xuất không vượt maxScore và không âm>,
      "comment": "<nhận xét ngắn gọn về tiêu chí này>"
    }
  ],
  "overallComment": "<nhận xét tổng quát>",
  "confidence": <độ tin cậy từ 0.0 đến 1.0>,
  "warning": "<cảnh báo nếu thiếu ý hoặc trả lời lạc đề, hoặc null>"
}`;

    const controller = new AbortController();
    try {
      let criteria: any[] = [];
      let overallComment = '';
      let confidence = 0.85;
      let warningMsg: string | undefined;

      try {
        const aiRes = await this.aiService.gradeEssay({
          questionText: snapshot.content,
          sampleAnswer: snapshot.explanation || '',
          answerText: answer.textAnswer || '(Sinh viên không nhập văn bản)',
          criteria: rubric.map((r) => ({
            criterionId: r.id,
            label: r.label,
            maxScore: r.maxScore,
            description: r.description,
            fullCreditGuide: r.fullCreditGuide || undefined,
            partialCreditGuide: r.partialCreditGuide || undefined,
            zeroCreditGuide: r.zeroCreditGuide || undefined,
            acceptedConcepts: r.acceptedConcepts || undefined,
            commonMistakes: r.commonMistakes || undefined,
          })),
        });

        if (aiRes && Array.isArray(aiRes.criteriaGrades)) {
          const byId = new Map(rubric.map((r) => [r.id, r]));
          const parsedCriteria = aiRes.criteriaGrades
            .map((item: any, idx: number) => {
              const r =
                byId.get(String(item.criterionId)) ||
                rubric.find((rub) => rub.id === String(item.criterionId) || rub.label === String(item.criterionId)) ||
                rubric[idx];
              if (!r) return null;
              const score = Math.min(Math.max(Number(item.score) || 0, 0), r.maxScore);
              return {
                criterionId: r.id,
                score: Number(score.toFixed(2)),
                comment: String(item.comment || '').trim() || 'AI: Đã phân tích bài làm theo tiêu chí Rubric.',
                evidenceQuote: String(item.evidenceQuote || '').trim().slice(0, 500) || (answer.textAnswer || '').slice(0, 150),
                achievementLevel: ['FULL', 'PARTIAL', 'NOT_MET', 'NEEDS_REVIEW'].includes(String(item.achievementLevel))
                  ? String(item.achievementLevel)
                  : 'NEEDS_REVIEW',
              };
            })
            .filter(Boolean);

          const uniqueCriterionIds = new Set(parsedCriteria.map((item: any) => item.criterionId));
          if (parsedCriteria.length === rubric.length && uniqueCriterionIds.size === rubric.length) {
            criteria = parsedCriteria;
            overallComment = String(aiRes.generalFeedback || '').trim() || 'AI: Đã hoàn tất phân tích bài làm của thí sinh.';
            confidence = 0.9;
            this.logger.log(`AI Service (${aiRes.providerUsed}) graded essay successfully.`);
          }
        }
      } catch (aiErr: any) {
        this.logger.warn(`AiService gradeEssay failed: ${aiErr?.message || aiErr}.`);
      }

      // Không tự chấm bằng heuristic khi AI lỗi hoặc trả thiếu Rubric.
      // Nếu không có đủ kết quả cho toàn bộ tiêu chí, yêu cầu giáo viên chấm thủ công.
      if (!criteria.length) {
        throw new BadRequestException('AI không trả đủ kết quả theo Rubric. Vui lòng thử lại hoặc chấm thủ công.');
      }

      const aiSuggestedTotal = Number(criteria.reduce((sum: number, c: any) => sum + c.score, 0).toFixed(2));

      // Lưu kết quả AI đề xuất vào DB
      await this.prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: {
          aiSuggestedScore: aiSuggestedTotal,
          aiSuggestedComment: overallComment,
          aiConfidence: confidence,
          aiGeneratedAt: new Date(),
        },
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.essayAiGradingRun.update({
          where: { id: aiRun.id },
          data: {
            status: 'SUCCEEDED',
            suggestedScore: aiSuggestedTotal,
            overallComment,
            confidence,
            warning: warningMsg || null,
            completedAt: new Date(),
          },
        });
        await tx.essayAiCriterionResult.createMany({
          data: criteria.map((item: any) => ({
            aiGradingRunId: aiRun.id,
            criterionId: item.criterionId,
            suggestedScore: item.score,
            achievementLevel: item.achievementLevel || 'NEEDS_REVIEW',
            comment: item.comment || null,
            evidenceQuote: item.evidenceQuote || null,
          })),
        });
      });

      await this.audit.write({
        actorId: actor.id,
        action: 'ESSAY_AI_SUGGEST',
        entityType: 'AttemptAnswer',
        entityId: answer.id,
        description: 'Gọi AI gợi ý chấm bài tự luận',
        metadata: { aiSuggestedTotal, confidence, warning: warningMsg },
      });

      return {
        runId: aiRun.id,
        criteria,
        overallComment,
        confidence,
        warning: warningMsg,
        isBlank: false,
        source: 'AI',
        requiresTeacherConfirmation: true,
      };
    } catch (error: any) {
      await this.prisma.essayAiGradingRun.update({
        where: { id: aiRun.id },
        data: { status: 'FAILED', errorMessage: error?.message || 'Không thể tạo đề xuất AI.', completedAt: new Date() },
      }).catch(() => undefined);
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Lỗi AI chấm bài: ${error?.message}`);
      throw new BadRequestException('Không thể kết nối dịch vụ AI chấm bài. Vui lòng thử lại sau.');
    }
  }

  async submitGrading(actor: any, attemptId: string) {
    const attempt = await this.getAttempt(actor, attemptId);
    const gradableStatuses: AttemptStatus[] = [
      AttemptStatus.SUBMITTED,
      AttemptStatus.AUTO_SUBMITTED,
      AttemptStatus.UNDER_REVIEW,
      AttemptStatus.NOT_STARTED,
      AttemptStatus.IN_PROGRESS,
    ];
    if (!gradableStatuses.includes(attempt.status as AttemptStatus) && actor.role !== 'ADMIN') {
      throw new BadRequestException('Bài thi chưa nộp, chưa thể hoàn tất chấm.');
    }

    const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
    const essayQuestions = snapshot.filter((q) => q.type === 'ESSAY');

    const answers = await this.prisma.attemptAnswer.findMany({
      where: { attemptId },
      include: { essayGrades: true },
    });

    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    // Kiểm tra tất cả câu hỏi tự luận và tự động gán 0đ cho tiêu chí Rubric chưa chấm
    for (const q of essayQuestions) {
      let ans = answerByQuestion.get(q.questionId);
      if (!ans) {
        try {
          ans = await this.prisma.attemptAnswer.create({
            data: {
              attempt: { connect: { id: attemptId } },
              questionId: q.questionId,
              textAnswer: '(Sinh viên không nhập nội dung văn bản)',
              gradingStatus: 'GRADED',
              finalScore: 0,
              clientTimestamp: new Date(),
            },
            include: { essayGrades: true },
          });
          answerByQuestion.set(q.questionId, ans);
        } catch (e) {
          ans = await this.prisma.attemptAnswer.findFirst({
            where: { attemptId, questionId: q.questionId },
            include: { essayGrades: true },
          }) as any;
        }
      }

      if (!ans) continue;

      let rubrics = await this.prisma.essayRubricCriterion.findMany({ where: { questionId: q.questionId } });
      if (!rubrics.length) {
        try {
          const defaultCriterion = await this.prisma.essayRubricCriterion.create({
            data: {
              questionId: q.questionId,
              label: 'Nội dung & Đánh giá tổng thể',
              description: 'Đánh giá mức độ hoàn thành bài tự luận theo yêu cầu đề bài',
              maxScore: Number(q.score || 1),
              sortOrder: 1,
            },
          });
          rubrics = [defaultCriterion];
        } catch (e) {
          rubrics = await this.prisma.essayRubricCriterion.findMany({ where: { questionId: q.questionId } });
        }
      }

      if (rubrics.length > 0) {
        const gradedCriterionIds = new Set((ans.essayGrades || []).map((g) => g.criterionId));
        const missing = rubrics.filter((r) => !gradedCriterionIds.has(r.id));
        if (missing.length > 0) {
          for (const mRubric of missing) {
            await this.prisma.essayGrade.upsert({
              where: {
                attemptAnswerId_criterionId: { attemptAnswerId: ans.id, criterionId: mRubric.id },
              },
              create: {
                attemptAnswerId: ans.id,
                criterionId: mRubric.id,
                score: 0,
                comment: 'Tự động 0đ tiêu chí chưa chấm',
                gradedById: actor.id,
              },
              update: {
                score: 0,
                comment: 'Tự động 0đ tiêu chí chưa chấm',
                gradedById: actor.id,
              },
            });
          }
          const updatedAns = await this.prisma.attemptAnswer.findUnique({
            where: { id: ans.id },
            include: { essayGrades: true },
          });
          if (updatedAns) {
            const sumScore = Number(updatedAns.essayGrades.reduce((s, g) => s + (g.score || 0), 0).toFixed(2));
            await this.prisma.attemptAnswer.update({
              where: { id: ans.id },
              data: { finalScore: sumScore, gradingStatus: 'GRADED' },
            });
            answerByQuestion.set(q.questionId, { ...updatedAns, finalScore: sumScore, gradingStatus: 'GRADED' });
          }
        }
      }
    }

    // Tính tổng điểm thi
    const totalAnswerScores = Number(
      answers.reduce((sum, a) => sum + (a.finalScore || 0), 0).toFixed(2),
    );
    const penaltyPoints = attempt.penaltyPoints || 0;
    const finalAttemptScore = Math.max(0, Number((totalAnswerScores - penaltyPoints).toFixed(2)));

    await this.prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          totalScore: finalAttemptScore,
          status: AttemptStatus.SUBMITTED,
          gradingStatus: EssayAttemptGradingStatus.WAITING_APPROVAL,
          gradedById: actor.id,
          gradedAt: new Date(),
        },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'ESSAY_GRADING_SUBMIT',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: 'Hoàn tất chấm bài tự luận và gửi ADMIN duyệt',
          metadata: { totalScore: finalAttemptScore, penaltyPoints },
        },
        tx,
      );
    });

    return {
      success: true,
      gradingStatus: EssayAttemptGradingStatus.WAITING_APPROVAL,
      totalScore: finalAttemptScore,
    };
  }

  async approve(actor: any, attemptId: string, publish = false) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền duyệt hoặc công bố điểm bài thi.');
    }
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Không tìm thấy bài thi.');

    if (!publish && attempt.gradingStatus !== EssayAttemptGradingStatus.WAITING_APPROVAL) {
      throw new BadRequestException('Chỉ bài đang chờ duyệt mới có thể được duyệt nội bộ.');
    }
    const publishableStatuses: EssayAttemptGradingStatus[] = [
      EssayAttemptGradingStatus.WAITING_APPROVAL,
      EssayAttemptGradingStatus.APPROVED,
    ];
    if (publish && !publishableStatuses.includes(attempt.gradingStatus)) {
      throw new BadRequestException('Chỉ bài chờ duyệt hoặc đã duyệt nội bộ mới có thể công bố.');
    }

    const nextGradingStatus = publish
      ? EssayAttemptGradingStatus.PUBLISHED
      : EssayAttemptGradingStatus.APPROVED;

    const data: Prisma.ExamAttemptUpdateInput = {
      gradingStatus: nextGradingStatus,
      approvedBy: { connect: { id: actor.id } },
      approvedAt: new Date(),
      ...(publish ? { publishedAt: new Date() } : { publishedAt: null }),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({ where: { id: attemptId }, data });
      await this.audit.write(
        {
          actorId: actor.id,
          action: publish ? 'ESSAY_PUBLISH' : 'ESSAY_APPROVE',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: publish ? 'Công bố điểm chính thức cho Sinh viên' : 'Duyệt điểm bài thi',
          metadata: { gradingStatus: nextGradingStatus },
        },
        tx,
      );
    });

    return { success: true, gradingStatus: nextGradingStatus };
  }

  async returnGrading(actor: any, attemptId: string, dto: ActionReasonDto) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền trả lại bài thi để Giảng viên chấm lại.');
    }
    if (!dto?.reason?.trim()) {
      throw new BadRequestException('Bắt buộc phải nhập lý do trả lại chấm bài.');
    }
    const attempt = await this.getAttempt(actor, attemptId);

    await this.prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          gradingStatus: EssayAttemptGradingStatus.UNDER_GRADING,
        },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'ESSAY_RETURN',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: 'Yêu cầu trả lại bài thi cho Giảng viên chấm lại',
          metadata: { reason: dto.reason },
        },
        tx,
      );
    });

    return { success: true, gradingStatus: EssayAttemptGradingStatus.UNDER_GRADING };
  }

  async reopen(actor: any, attemptId: string, dto: ActionReasonDto) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền mở lại phiên thi cho Sinh viên làm bài.');
    }
    if (!dto?.reason?.trim()) {
      throw new BadRequestException('Bắt buộc phải nhập lý do mở lại bài thi.');
    }
    const attempt = await this.getAttempt(actor, attemptId);

    await this.prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: AttemptStatus.IN_PROGRESS,
          gradingStatus: EssayAttemptGradingStatus.NOT_SUBMITTED,
          endTime: null,
          submittedAt: null,
        },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'ESSAY_REOPEN',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: 'Mở lại phiên bài thi cho Sinh viên tiếp tục',
          metadata: { reason: dto.reason },
        },
        tx,
      );
    });

    return { success: true, status: AttemptStatus.IN_PROGRESS };
  }

  async extend(actor: any, attemptId: string, dto: ActionReasonDto) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền gia hạn thời gian bài thi.');
    }
    const extra = dto.extraMinutes || 0;
    if (extra <= 0) throw new BadRequestException('Số phút gia hạn phải lớn hơn 0.');
    if (!dto?.reason?.trim()) throw new BadRequestException('Bắt buộc phải nhập lý do gia hạn.');

    const attempt = await this.getAttempt(actor, attemptId);
    const expectedEndTime = new Date((attempt.expectedEndTime || new Date()).getTime() + extra * 60000);

    await this.prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          expectedEndTime,
          extraMinutes: { increment: extra },
          extraTimeReason: dto.reason,
        },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'ESSAY_EXTEND',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: 'Gia hạn thêm thời gian làm bài',
          metadata: { reason: dto.reason, extraMinutes: extra },
        },
        tx,
      );
    });

    return { success: true, expectedEndTime };
  }

  async penalty(actor: any, attemptId: string, dto: ActionReasonDto) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền áp dụng điểm phạt cho bài thi.');
    }
    const penalty = dto.penaltyPoints || 0;
    if (penalty < 0) throw new BadRequestException('Điểm phạt không được là số âm.');
    if (!dto?.reason?.trim()) throw new BadRequestException('Bắt buộc phải nhập lý do áp dụng điểm phạt.');

    const attempt = await this.getAttempt(actor, attemptId);
    const answers = await this.prisma.attemptAnswer.findMany({ where: { attemptId } });
    const rawAnswersTotal = answers.reduce((sum, a) => sum + (a.finalScore || 0), 0);

    if (penalty > rawAnswersTotal) {
      throw new BadRequestException(
        `Điểm phạt (${penalty}đ) không được vượt quá tổng điểm bài làm hiện tại (${rawAnswersTotal}đ).`,
      );
    }

    const newTotalScore = Math.max(0, Number((rawAnswersTotal - penalty).toFixed(2)));

    await this.prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          penaltyPoints: penalty,
          penaltyReason: dto.reason,
          totalScore: newTotalScore,
        },
      });
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'ESSAY_PENALTY',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: 'Áp dụng điểm phạt cho bài thi vi phạm',
          metadata: { reason: dto.reason, penaltyPoints: penalty, newTotalScore },
        },
        tx,
      );
    });

    return { success: true, penaltyPoints: penalty, totalScore: newTotalScore };
  }

  async adjustScorePostPublish(actor: any, attemptId: string, answerId: string, dto: GradeAnswerDto) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền điều chỉnh điểm bài thi sau khi công bố.');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Bắt buộc phải nhập lý do điều chỉnh điểm sau công bố.');
    }

    const answer = await this.prisma.attemptAnswer.findUnique({
      where: { id: answerId },
      include: { essayGrades: true },
    });
    if (!answer || answer.attemptId !== attemptId) {
      throw new NotFoundException('Không tìm thấy câu trả lời cần điều chỉnh.');
    }

    return this.gradeAnswer(actor, answerId, dto);
  }

  async uploadFile(actorId: number, token: string, questionId: string, file: Express.Multer.File) {
    if (!file || !ALLOWED_MIME.has(file.mimetype) || file.size > MAX_BYTES || !this.validFileSignature(file)) {
      throw new BadRequestException('File đính kèm không hợp lệ hoặc vượt quá dung lượng tối đa 20 MB (Chấp nhận PDF, DOCX, JPG, PNG).');
    }
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { attemptToken: token },
      include: { student: true, onlineExamConfig: true, attemptAnswers: true },
    });
    if (!attempt || attempt.student.userId !== actorId) {
      throw new ForbiddenException('Phiên thi không hợp lệ.');
    }
    if (![AttemptStatus.IN_PROGRESS, AttemptStatus.DISCONNECTED].includes(attempt.status as any)) {
      throw new BadRequestException('Bài thi đã nộp, không thể tải thêm file đính kèm.');
    }
    const answer = attempt.attemptAnswers.find((a) => a.questionId === questionId);
    if (!answer) {
      throw new BadRequestException('Cần lưu câu trả lời trước khi tải file.');
    }

    const dir = join(process.cwd(), 'uploads', 'essay');
    await mkdir(dir, { recursive: true });
    const id = randomUUID();
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
      : '';
    const name = `${id}${ext}`;
    await writeFile(join(dir, name), file.buffer);

    const created = await this.prisma.essaySubmissionFile.create({
      data: {
        id,
        attemptId: attempt.id,
        answerId: answer.id,
        url: `/uploads/essay/${name}`,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    await this.audit.write({
      actorId,
      action: 'UPLOAD_FILE',
      entityType: 'EssaySubmissionFile',
      entityId: id,
      description: 'Sinh viên tải file bài làm tự luận',
      metadata: { fileName: file.originalname, size: file.size, mimeType: file.mimetype },
    });

    return created;
  }

  /**
   * Auto-grade all ESSAY answers for an attempt using AI immediately after student submits.
   * Runs as a background fire-and-forget job. Does NOT throw on failure.
   */
  async autoGradeAttempt(attemptId: string): Promise<void> {
    try {
      const attempt = await this.prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { snapshot: true },
      });
      if (!attempt) return;

      const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
      const essayQuestions = snapshot.filter((q) => q.type === 'ESSAY');
      if (!essayQuestions.length) return;

      const answers = await this.prisma.attemptAnswer.findMany({
        where: { attemptId, questionId: { in: essayQuestions.map((q) => q.questionId) } },
        include: { essayGrades: true },
      });

      // System actor for AI grading
      const systemActor = { id: 0, role: 'SYSTEM' };

      for (const qs of essayQuestions) {
        let answer: any = answers.find((a) => a.questionId === qs.questionId);
        if (!answer) {
          try {
            answer = await this.prisma.attemptAnswer.create({
              data: {
                attempt: { connect: { id: attemptId } },
                questionId: qs.questionId,
                textAnswer: '(Sinh viên không nhập nội dung văn bản)',
                gradingStatus: 'GRADED',
                finalScore: 0,
                clientTimestamp: new Date(),
              },
              include: { essayGrades: true },
            });
          } catch (e) {
            answer = await this.prisma.attemptAnswer.findFirst({
              where: { attemptId, questionId: qs.questionId },
              include: { essayGrades: true },
            });
          }
        }
        if (!answer) continue;

        // Skip if already graded with essayGrades
        if (answer.gradingStatus === 'GRADED' && answer.essayGrades && answer.essayGrades.length > 0) continue;

        const rubric = await this.prisma.essayRubricCriterion.findMany({
          where: { questionId: qs.questionId },
          orderBy: { sortOrder: 'asc' },
        });

        // Khởi tạo default rubric trong DB nếu câu hỏi chưa được cài đặt Rubric
        let effectiveRubric = rubric;
        if (!effectiveRubric.length) {
          try {
            const defaultCriterion = await this.prisma.essayRubricCriterion.create({
              data: {
                questionId: qs.questionId,
                label: 'Nội dung & Đánh giá tổng thể',
                description: 'Đánh giá mức độ hoàn thành bài tự luận theo yêu cầu đề bài',
                maxScore: Number(qs.score || 1),
                sortOrder: 1,
              },
            });
            effectiveRubric = [defaultCriterion];
          } catch (e) {
            effectiveRubric = await this.prisma.essayRubricCriterion.findMany({
              where: { questionId: qs.questionId },
              orderBy: { sortOrder: 'asc' },
            });
          }
        }

        let criteria: { criterionId: string; score: number; comment: string }[] = [];
        let overallComment = '';

        const rawAns = ((answer?.textAnswer as string) || '').trim();

        // NGUYÊN TẮC QUẢN LÝ KHẢO THÍ: Nếu sinh viên không trả lời câu hỏi này (nội dung rỗng/chưa làm) -> Mặc định 0đ
        if (!rawAns || rawAns === '(Sinh viên không nhập nội dung)' || rawAns === '(Sinh viên không nhập nội dung văn bản)') {
          criteria = effectiveRubric.map((r) => ({
            criterionId: r.id,
            score: 0,
            comment: 'Sinh viên bỏ trống / chưa làm câu hỏi này (0đ).',
          }));
          overallComment = 'Sinh viên bỏ trống / chưa làm câu hỏi này (0đ).';
        } else {
          try {
            const aiRes = await this.aiService.gradeEssay({
              questionText: qs.content,
              sampleAnswer: qs.explanation || '',
              answerText: rawAns,
              criteria: effectiveRubric.map((r) => ({ criterionId: r.id, label: r.label, maxScore: r.maxScore, description: r.description })),
            });

            if (aiRes && Array.isArray(aiRes.criteriaGrades) && aiRes.criteriaGrades.length) {
              const byId = new Map(effectiveRubric.map((r) => [r.id, r]));
              const parsed = aiRes.criteriaGrades
                .map((item: any) => {
                  const r = byId.get(String(item.criterionId));
                  if (!r) return null;
                  return { criterionId: r.id, score: Math.min(Math.max(Number(item.score) || 0, 0), r.maxScore), comment: String(item.comment || '').trim() };
                })
                .filter(Boolean) as { criterionId: string; score: number; comment: string }[];
              if (parsed.length) {
                criteria = parsed;
                overallComment = String(aiRes.generalFeedback || '').trim();
              }
            }
          } catch (aiErr: any) {
            this.logger.warn(`[AutoGrade] AI failed for answer ${answer.id}: ${aiErr?.message}. Using heuristic.`);
          }

          // Heuristic fallback
          if (!criteria.length) {
            const refText = (qs.content + ' ' + (qs.explanation || '')).toLowerCase();
            const words = rawAns.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
            const matched = words.filter((w) => refText.includes(w));
            const ratio = words.length > 0 ? matched.length / words.length : 0;
            const factor = rawAns.length < 10 ? 0 : ratio > 0.25 || rawAns.length > 80 ? 0.75 : ratio > 0.1 ? 0.5 : 0.25;

            criteria = effectiveRubric.map((r) => ({
              criterionId: r.id,
              score: Number((r.maxScore * factor).toFixed(2)),
              comment: factor === 0 ? 'AI: Bài làm chưa có nội dung hợp lệ.' : 'AI: Chấm tự động dựa trên phân tích nội dung.',
            }));
            overallComment = 'Chấm tự động bằng AI heuristic (chờ GV xem xét).';
          }
        }

        const totalScore = Number(criteria.reduce((s, c) => s + c.score, 0).toFixed(2));

        await this.prisma.$transaction(async (tx) => {
          // Upsert từng tiêu chí vào EssayGrade
          for (const item of criteria) {
            await tx.essayGrade.upsert({
              where: { attemptAnswerId_criterionId: { attemptAnswerId: answer.id, criterionId: item.criterionId } },
              create: { attemptAnswerId: answer.id, criterionId: item.criterionId, score: item.score, comment: item.comment, gradedById: null },
              update: { score: item.score, comment: item.comment },
            });
          }
          // Cập nhật answer: lưu điểm AI, đánh dấu AI đã chấm
          await tx.attemptAnswer.update({
            where: { id: answer.id },
            data: {
              finalScore: totalScore,
              teacherComment: overallComment,
              gradingStatus: 'GRADED',
              aiSuggestedScore: totalScore,
              aiSuggestedComment: overallComment,
            },
          });
        });

        this.logger.log(`[AutoGrade] AI graded answer ${answer.id} → ${totalScore}đ`);
      }

      // Sau khi chấm xong tất cả câu, cập nhật attempt → UNDER_REVIEW (chờ GV xem xét)
      const totalEssayScore = (
        await this.prisma.attemptAnswer.findMany({ where: { attemptId, questionId: { in: essayQuestions.map((q) => q.questionId) } } })
      ).reduce((s, a) => s + (a.finalScore ?? 0), 0);

      await this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          gradingStatus: EssayAttemptGradingStatus.UNDER_GRADING,
          totalScore: Number(totalEssayScore.toFixed(2)),
        },
      });

      this.logger.log(`[AutoGrade] Attempt ${attemptId} auto-graded. Total essay score: ${totalEssayScore}`);
    } catch (err: any) {
      // Fire-and-forget: không throw, chỉ log lỗi
      this.logger.error(`[AutoGrade] Failed for attempt ${attemptId}: ${err?.message}`);
    }
  }
}
