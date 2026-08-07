import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttemptStatus, EssayAttemptGradingStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
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
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

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
    if (actor.role === 'ADMIN') return;
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { subjectId: true } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    const assigned = await this.prisma.examScheduleRoom.findFirst({
      where: {
        examSchedule: { subjectId: question.subjectId },
        supervisors: { some: { teacher: { userId: actor.id } } },
      },
      select: { id: true },
    });
    if (!assigned) throw new ForbiddenException('Bạn không được phân công quản lý hoặc chấm câu hỏi môn này.');
  }

  async getRubric(actor: any, questionId: string) {
    await this.assertRubricAccess(actor, questionId);
    return this.prisma.essayRubricCriterion.findMany({ where: { questionId }, orderBy: { sortOrder: 'asc' } });
  }

  async saveRubric(actor: any, questionId: string, dto: RubricDto) {
    await this.assertRubricAccess(actor, questionId);
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { type: true, score: true, content: true } });
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
      await tx.essayRubricCriterion.deleteMany({ where: { questionId } });
      const rows = await Promise.all(
        dto.criteria.map((item) =>
          tx.essayRubricCriterion.create({
            data: { questionId, label: item.label, description: item.description || '', maxScore: item.maxScore, sortOrder: item.sortOrder },
          }),
        ),
      );
      await this.audit.write(
        {
          actorId: actor.id,
          action: 'RUBRIC_UPDATE',
          entityType: 'Question',
          entityId: questionId,
          description: 'Cập nhật Rubric câu hỏi tự luận',
          metadata: { totalRubricScore, criteriaCount: rows.length },
        },
        tx,
      );
      return rows;
    });

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async assignments(actor: any, status?: string) {
    const where: Prisma.ExamAttemptWhereInput = {
      onlineExamConfig: {
        examSchedule: actor.role === 'ADMIN' ? {} : { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } },
      },
      status: status
        ? (status as AttemptStatus)
        : { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.UNDER_REVIEW] },
    };
    return this.prisma.examAttempt.findMany({
      where,
      orderBy: { submittedAt: 'asc' },
      include: {
        student: true,
        onlineExamConfig: {
          include: {
            examSchedule: { include: { subject: true, examPeriod: true } },
          },
        },
        incidents: true,
      },
    });
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
    const attempt = await this.getAttempt(actor, attemptId);
    const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
    const questionIds = snapshot.filter((q) => q.type === 'ESSAY').map((q) => q.questionId);
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
    return {
      ...attempt,
      snapshot: undefined,
      questions: snapshot.map((q) => ({
        ...q,
        options: undefined,
        rubric: rubricByQuestion.get(q.questionId) || [],
      })),
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

    const rubrics = await this.prisma.essayRubricCriterion.findMany({
      where: { questionId: answer.questionId },
    });
    if (!rubrics.length) {
      throw new BadRequestException('Câu hỏi này chưa được tạo Rubric chấm điểm.');
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

      // Nếu đang ở trạng thái SUBMITTED hoặc AUTO_SUBMITTED, chuyển sang UNDER_GRADING
      if (['SUBMITTED', 'AUTO_SUBMITTED'].includes(attempt.status as any)) {
        await tx.examAttempt.update({
          where: { id: attempt.id },
          data: { status: AttemptStatus.UNDER_REVIEW },
        });
      }

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
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new BadRequestException('Chưa cấu hình GEMINI_API_KEY cho hỗ trợ chấm AI.');
    }
    const answer = await this.prisma.attemptAnswer.findUnique({
      where: { id: answerId },
      include: { attempt: { include: { snapshot: true, student: true } } },
    });
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời.');
    await this.getAttempt(actor, answer.attemptId);

    const snapshot = ((answer.attempt.snapshot?.snapshotData as any[]) || []).find((q) => q.questionId === answer.questionId);
    if (!snapshot || snapshot.type !== 'ESSAY') {
      throw new BadRequestException('Chỉ hỗ trợ AI đề xuất cho câu hỏi tự luận (ESSAY).');
    }

    let rubric = await this.prisma.essayRubricCriterion.findMany({
      where: { questionId: answer.questionId },
      orderBy: { sortOrder: 'asc' },
    });

    if (!rubric.length) {
      rubric = [
        {
          id: 'default_rubric',
          questionId: answer.questionId,
          label: 'Đánh giá nội dung tự luận',
          description: snapshot.explanation || 'Đánh giá câu trả lời tự luận của sinh viên',
          maxScore: snapshot.score || 1.0,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];
    }

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
    const timeoutMs = Math.min(Math.max(Number(process.env.GEMINI_TIMEOUT_MS || 90000), 30000), 120000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const model = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
      const candidateModels = Array.from(
        new Set([model, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-exp']),
      );
      let response: Response | null = null;
      let lastErrMessage = '';

      for (const candidateModel of candidateModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
              }),
            },
          );
          if (res.ok) {
            response = res;
            break;
          }
          lastErrMessage = `HTTP ${res.status}`;
        } catch (e: any) {
          lastErrMessage = e.message || 'Network error';
        }
      }

      if (!response || !response.ok) {
        throw new BadRequestException(`Gọi dịch vụ AI chấm thất bại (${lastErrMessage}). Vui lòng kiểm tra lại cấu hình API key.`);
      }

      const payload: any = await response.json();
      const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new BadRequestException('AI không trả về đúng định dạng JSON chuẩn chấm điểm.');
      }

      const parsed = JSON.parse(match[0]);
      const byId = new Map(rubric.map((r) => [r.id, r]));

      const criteria = Array.isArray(parsed.criteria)
        ? parsed.criteria
            .map((item: any) => {
              const r = byId.get(String(item.criterionId));
              if (!r) return null;
              const score = Math.min(Math.max(Number(item.score) || 0, 0), r.maxScore);
              return {
                criterionId: r.id,
                score: Number(score.toFixed(2)),
                comment: String(item.comment || '').trim(),
              };
            })
            .filter(Boolean)
        : [];

      if (criteria.length !== rubric.length) {
        throw new BadRequestException('AI chưa đánh giá đầy đủ tất cả tiêu chí Rubric.');
      }

      const overallComment = String(parsed.overallComment || '').trim();
      const confidence = Number(Math.min(Math.max(Number(parsed.confidence) || 0.8, 0), 1).toFixed(2));
      const aiSuggestedTotal = Number(criteria.reduce((sum: number, c: any) => sum + c.score, 0).toFixed(2));

      // Lưu kết quả AI đề xuất vào DB (lưu riêng, không tự động ghi đè điểm chính thức)
      await this.prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: {
          aiSuggestedScore: aiSuggestedTotal,
          aiSuggestedComment: overallComment,
          aiConfidence: confidence,
          aiGeneratedAt: new Date(),
        },
      });

      await this.audit.write({
        actorId: actor.id,
        action: 'ESSAY_AI_SUGGEST',
        entityType: 'AttemptAnswer',
        entityId: answer.id,
        description: 'Gọi AI gợi ý chấm bài tự luận',
        metadata: { aiSuggestedTotal, confidence },
      });

      return {
        criteria,
        overallComment,
        confidence,
        warning: parsed.warning || null,
        requiresTeacherConfirmation: true,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      if (error?.name === 'AbortError') {
        throw new BadRequestException('Thời gian chờ AI chấm quá lâu (Timeout). Vui lòng thử lại.');
      }
      throw new BadRequestException(error?.message || 'Không thể kết nối dịch vụ AI chấm bài.');
    } finally {
      clearTimeout(timer);
    }
  }

  async submitGrading(actor: any, attemptId: string) {
    const attempt = await this.getAttempt(actor, attemptId);
    const gradableStatuses: AttemptStatus[] = [
      AttemptStatus.SUBMITTED,
      AttemptStatus.AUTO_SUBMITTED,
      AttemptStatus.UNDER_REVIEW,
    ];
    if (!gradableStatuses.includes(attempt.status as AttemptStatus)) {
      throw new BadRequestException('Bài thi chưa nộp, chưa thể hoàn tất chấm.');
    }

    const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
    const essayQuestions = snapshot.filter((q) => q.type === 'ESSAY');
    const answers = await this.prisma.attemptAnswer.findMany({
      where: { attemptId },
      include: { essayGrades: true },
    });

    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    // Kiểm tra tất cả câu hỏi tự luận và tất cả các tiêu chí Rubric đều đã được chấm đầy đủ
    for (const q of essayQuestions) {
      const ans = answerByQuestion.get(q.questionId);
      if (!ans || ans.gradingStatus !== 'GRADED' || ans.finalScore === null || ans.finalScore === undefined) {
        throw new BadRequestException(`Câu hỏi tự luận "${q.content || q.code || q.questionId}" chưa được chấm điểm.`);
      }

      const rubrics = await this.prisma.essayRubricCriterion.findMany({ where: { questionId: q.questionId } });
      if (rubrics.length > 0) {
        const gradedCriterionIds = new Set(ans.essayGrades.map((g) => g.criterionId));
        const missing = rubrics.filter((r) => !gradedCriterionIds.has(r.id));
        if (missing.length > 0) {
          throw new BadRequestException(
            `Câu hỏi tự luận "${q.content || q.code}" vẫn còn ${missing.length} tiêu chí Rubric chưa chấm điểm.`,
          );
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
    if (attempt.gradingStatus !== EssayAttemptGradingStatus.WAITING_APPROVAL && !publish) {
      throw new BadRequestException('Bài thi chưa ở trạng thái chờ duyệt (WAITING_APPROVAL).');
    }

    const nextGradingStatus = publish
      ? EssayAttemptGradingStatus.PUBLISHED
      : EssayAttemptGradingStatus.WAITING_APPROVAL;

    const data: Prisma.ExamAttemptUpdateInput = {
      gradingStatus: nextGradingStatus,
      approvedBy: { connect: { id: actor.id } },
      approvedAt: new Date(),
    };
    if (publish) {
      data.publishedAt = new Date();
    }

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
    if (!file || !ALLOWED_MIME.has(file.mimetype) || file.size > MAX_BYTES) {
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
}
