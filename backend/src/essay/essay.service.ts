import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttemptStatus, EssayAttemptGradingStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActionReasonDto, GradeAnswerDto, RubricDto } from './dto/essay.dto';

const ALLOWED_MIME = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']);
const MAX_BYTES = 20 * 1024 * 1024;

@Injectable()
export class EssayService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async teacherCanAccessSchedule(userId: number, scheduleId: number) {
    return Boolean(await this.prisma.examScheduleRoom.findFirst({ where: { examScheduleId: scheduleId, supervisors: { some: { teacher: { userId } } } }, select: { id: true } }));
  }

  async updateConfig(actor: any, scheduleId: number, data: any) {
    if (actor.role !== 'ADMIN' && !(await this.teacherCanAccessSchedule(actor.id, scheduleId))) throw new ForbiddenException('Bạn không được cấu hình đề thi này.');
    const config = await this.prisma.onlineExamConfig.findUnique({ where: { examScheduleId: scheduleId } });
    if (!config) throw new NotFoundException('Chưa có cấu hình bài thi cho lịch này.');
    const updated = await this.prisma.onlineExamConfig.update({ where: { examScheduleId: scheduleId }, data: { essayEnabled: Boolean(data.essayEnabled), allowEssayFileUpload: data.allowEssayFileUpload === undefined ? true : Boolean(data.allowEssayFileUpload), maxEssayFileSizeMb: Math.min(Math.max(Number(data.maxEssayFileSizeMb || 20), 1), 20), showEssayResultAfterApproval: data.showEssayResultAfterApproval === undefined ? true : Boolean(data.showEssayResultAfterApproval) } });
    await this.audit.write({ actorId: actor.id, action: 'UPDATE', entityType: 'ONLINE_EXAM_CONFIG', entityId: scheduleId, description: 'Cập nhật cấu hình thi tự luận', metadata: data });
    return updated;
  }

  private async assertRubricAccess(actor: any, questionId: string) {
    if (actor.role === 'ADMIN') return;
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { subjectId: true } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    const assigned = await this.prisma.examScheduleRoom.findFirst({ where: { examSchedule: { subjectId: question.subjectId }, supervisors: { some: { teacher: { userId: actor.id } } } }, select: { id: true } });
    if (!assigned) throw new ForbiddenException('Bạn không được phân công môn này.');
  }

  async getRubric(actor: any, questionId: string) {
    await this.assertRubricAccess(actor, questionId);
    return this.prisma.essayRubricCriterion.findMany({ where: { questionId }, orderBy: { sortOrder: 'asc' } });
  }

  async saveRubric(actor: any, questionId: string, dto: RubricDto) {
    await this.assertRubricAccess(actor, questionId);
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { type: true, score: true } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    if (question.type !== 'ESSAY') throw new BadRequestException('Chỉ câu hỏi tự luận mới có rubric.');
    if (!dto.criteria.length) throw new BadRequestException('Rubric phải có ít nhất một tiêu chí.');
    const total = dto.criteria.reduce((sum, item) => sum + item.maxScore, 0);
    if (total > question.score + 0.0001) throw new BadRequestException(`Tổng điểm rubric (${total}) vượt điểm câu hỏi (${question.score}).`);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.essayRubricCriterion.deleteMany({ where: { questionId } });
      const rows = await Promise.all(dto.criteria.map((item) => tx.essayRubricCriterion.create({ data: { questionId, ...item } })));
      await this.audit.write({ actorId: actor.id, action: 'RUBRIC_UPDATE', entityType: 'Question', entityId: questionId, description: 'Cập nhật rubric câu hỏi tự luận', metadata: { total } }, tx);
      return rows;
    });
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async assignments(actor: any, status?: string) {
    const where: Prisma.ExamAttemptWhereInput = { onlineExamConfig: { examSchedule: actor.role === 'ADMIN' ? {} : { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } } }, status: status ? status as AttemptStatus : { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.UNDER_REVIEW] } };
    return this.prisma.examAttempt.findMany({ where, orderBy: { submittedAt: 'asc' }, include: { student: true, onlineExamConfig: { include: { examSchedule: { include: { subject: true, examPeriod: true } } } } } });
  }

  private async getAttempt(actor: any, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { student: true, snapshot: true, attemptAnswers: { include: { essayGrades: true, submissionFiles: true } }, onlineExamConfig: { include: { examSchedule: { include: { examScheduleRooms: { include: { supervisors: { include: { teacher: true } } } }, subject: true } } } } } });
    if (!attempt) throw new NotFoundException('Không tìm thấy bài thi.');
    if (actor.role !== 'ADMIN' && !(await this.teacherCanAccessSchedule(actor.id, attempt.onlineExamConfig.examScheduleId))) throw new ForbiddenException('Bạn không được truy cập bài thi này.');
    return attempt;
  }

  async detail(actor: any, attemptId: string) {
    const attempt = await this.getAttempt(actor, attemptId);
    const snapshot = (attempt.snapshot?.snapshotData as any[]) || [];
    const questionIds = snapshot.filter((q) => q.type === 'ESSAY').map((q) => q.questionId);
    const rubrics = questionIds.length
      ? await this.prisma.essayRubricCriterion.findMany({ where: { questionId: { in: questionIds } }, orderBy: { sortOrder: 'asc' } })
      : [];
    const rubricByQuestion = new Map<string, typeof rubrics>();
    for (const rubric of rubrics) rubricByQuestion.set(rubric.questionId, [...(rubricByQuestion.get(rubric.questionId) || []), rubric]);
    return { ...attempt, snapshot: undefined, questions: snapshot.map((q) => ({ ...q, options: undefined, rubric: rubricByQuestion.get(q.questionId) || [] })) };
  }

  async gradeAnswer(actor: any, answerId: string, dto: GradeAnswerDto) {
    const answer = await this.prisma.attemptAnswer.findUnique({ where: { id: answerId }, include: { attempt: true } });
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời.');
    await this.getAttempt(actor, answer.attemptId);
    if (answer.attempt.gradingStatus === EssayAttemptGradingStatus.PUBLISHED) {
      throw new BadRequestException('BÃ i tá»± luáº­n Ä‘Ã£ cÃ´ng bá»‘, khÃ´ng Ä‘Æ°á»£c sá»­a Ä‘iá»ƒm trá»±c tiáº¿p.');
    }
    const rubrics = await this.prisma.essayRubricCriterion.findMany({ where: { questionId: answer.questionId } });
    const map = new Map(rubrics.map((r) => [r.id, r]));
    for (const item of dto.criteria) {
      const criterion = map.get(item.criterionId);
      if (!criterion) throw new BadRequestException('Tiêu chí chấm không hợp lệ.');
      if (item.score < 0 || item.score > criterion.maxScore) throw new BadRequestException(`Điểm tiêu chí ${criterion.label} không hợp lệ.`);
    }
    const total = dto.criteria.reduce((s, item) => s + item.score, 0);
    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.criteria) await tx.essayGrade.upsert({ where: { attemptAnswerId_criterionId: { attemptAnswerId: answer.id, criterionId: item.criterionId } }, create: { attemptAnswerId: answer.id, criterionId: item.criterionId, score: item.score, comment: item.comment, gradedById: actor.id }, update: { score: item.score, comment: item.comment, gradedById: actor.id } });
      await tx.attemptAnswer.update({ where: { id: answer.id }, data: { finalScore: total, teacherComment: dto.teacherComment, gradingStatus: 'GRADED' } });
      await this.audit.write({ actorId: actor.id, action: 'ESSAY_GRADE', entityType: 'AttemptAnswer', entityId: answer.id, description: 'Chấm câu tự luận', metadata: { total } }, tx);
    });
    return { success: true, finalScore: total };
  }

  async aiSuggest(actor: any, answerId: string) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new NotFoundException('Chưa cấu hình GEMINI_API_KEY cho hỗ trợ chấm AI.');
    const answer = await this.prisma.attemptAnswer.findUnique({ where: { id: answerId }, include: { attempt: { include: { snapshot: true, student: true } } } });
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời.');
    await this.getAttempt(actor, answer.attemptId);
    const snapshot = ((answer.attempt.snapshot?.snapshotData as any[]) || []).find((q) => q.questionId === answer.questionId);
    if (!snapshot || snapshot.type !== 'ESSAY') throw new BadRequestException('Chỉ hỗ trợ chấm AI cho câu tự luận.');
    let rubric = await this.prisma.essayRubricCriterion.findMany({ where: { questionId: answer.questionId }, orderBy: { sortOrder: 'asc' } });
    if (!rubric.length) {
      rubric = [{
        id: 'default_rubric',
        questionId: answer.questionId,
        label: 'Hướng dẫn đáp án & Thang điểm',
        description: snapshot.explanation || 'Đánh giá câu trả lời tự luận của sinh viên',
        maxScore: snapshot.score || 10.0,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }] as any[];
    }
    const prompt = `Bạn là trợ lý chấm thi. Chỉ đề xuất, không quyết định điểm.\nCÂU HỎI:\n${snapshot.content}\nBÀI LÀM:\n${answer.textAnswer || ''}\nRUBRIC:\n${rubric.map((r) => `${r.id}|${r.label}|${r.description || ''}|tối đa ${r.maxScore}`).join('\n')}\nTrả JSON duy nhất dạng {"criteria":[{"criterionId":"...","score":0,"comment":"..."}],"overallComment":"...","confidence":0}. Điểm không vượt maxScore.`;
    const controller = new AbortController();
    const timeoutMs = Math.min(Math.max(Number(process.env.GEMINI_TIMEOUT_MS || 120000), 30000), 180000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
      const candidateModels = Array.from(new Set([model, 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash']));
      let response: Response | null = null;
      for (const candidateModel of candidateModels) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } }) });
        if (res.ok) {
          response = res;
          break;
        }
        if (res.status !== 404) {
          throw new BadRequestException(`Gemini trả lỗi HTTP ${res.status}.`);
        }
      }
      if (!response || !response.ok) throw new BadRequestException('Gemini trả lỗi HTTP 404.');
      const payload: any = await response.json();
      const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new BadRequestException('AI không trả đúng JSON chấm điểm.');
      const parsed = JSON.parse(match[0]);
      const byId = new Map(rubric.map((r) => [r.id, r]));
      const criteria = Array.isArray(parsed.criteria) ? parsed.criteria.map((item: any) => { const r = byId.get(String(item.criterionId)); if (!r) return null; return { criterionId: r.id, score: Math.min(Math.max(Number(item.score) || 0, 0), r.maxScore), comment: String(item.comment || '') }; }).filter(Boolean) : [];
      if (criteria.length !== rubric.length) throw new BadRequestException('AI chưa đánh giá đủ các tiêu chí rubric.');
      return { criteria, overallComment: String(parsed.overallComment || ''), confidence: Math.min(Math.max(Number(parsed.confidence) || 0, 0), 1), requiresTeacherConfirmation: true };
    } catch (error: any) { if (error instanceof BadRequestException) throw error; if (error?.name === 'AbortError') throw new BadRequestException('AI chấm quá thời gian chờ.'); throw new BadRequestException(error?.message || 'Không thể gọi AI chấm bài.'); }
    finally { clearTimeout(timer); }
  }

  async submitGrading(actor: any, attemptId: string) {
    const attempt = await this.getAttempt(actor, attemptId);
    const gradableStatuses: AttemptStatus[] = [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.UNDER_REVIEW];
    if (!gradableStatuses.includes(attempt.status as AttemptStatus)) {
      throw new BadRequestException('BÃ i thi chÆ°a ná»™p, chÆ°a thá»ƒ hoÃ n táº¥t cháº¥m.');
    }
    const answers = await this.prisma.attemptAnswer.findMany({ where: { attemptId } });
    if (answers.some((a) => a.gradingStatus !== 'GRADED')) throw new BadRequestException('Còn câu tự luận chưa chấm.');
    const total = answers.reduce((sum, a) => sum + (a.finalScore || 0), 0);
    await this.prisma.$transaction(async (tx) => { await tx.examAttempt.update({ where: { id: attempt.id }, data: { totalScore: Math.max(0, total - attempt.penaltyPoints), gradingStatus: EssayAttemptGradingStatus.WAITING_APPROVAL, gradedById: actor.id, gradedAt: new Date() } }); await this.audit.write({ actorId: actor.id, action: 'ESSAY_GRADING_SUBMIT', entityType: 'ExamAttempt', entityId: attemptId, description: 'Hoàn tất chấm bài tự luận' }, tx); });
    return { success: true, gradingStatus: EssayAttemptGradingStatus.WAITING_APPROVAL, totalScore: Math.max(0, total - attempt.penaltyPoints) };
  }

  async approve(actor: any, attemptId: string, publish = false) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Chỉ ADMIN được duyệt hoặc công bố điểm.');
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.gradingStatus !== EssayAttemptGradingStatus.WAITING_APPROVAL) throw new BadRequestException('Bài chưa ở trạng thái chờ duyệt.');
    const data: Prisma.ExamAttemptUpdateInput = { gradingStatus: publish ? EssayAttemptGradingStatus.PUBLISHED : EssayAttemptGradingStatus.WAITING_APPROVAL, approvedBy: { connect: { id: actor.id } }, approvedAt: new Date() };
    if (publish) data.publishedAt = new Date();
    await this.prisma.$transaction(async (tx) => { await tx.examAttempt.update({ where: { id: attemptId }, data }); await this.audit.write({ actorId: actor.id, action: publish ? 'ESSAY_PUBLISH' : 'ESSAY_APPROVE', entityType: 'ExamAttempt', entityId: attemptId, description: publish ? 'Công bố điểm tự luận' : 'Duyệt điểm tự luận' }, tx); });
    return { success: true, gradingStatus: data.gradingStatus };
  }

  async reopen(actor: any, attemptId: string, dto: ActionReasonDto) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Chá»‰ ADMIN Ä‘Æ°á»£c má»Ÿ láº¡i bÃ i tá»± luáº­n.');
    const attempt = await this.getAttempt(actor, attemptId);
    await this.prisma.$transaction(async (tx) => { await tx.examAttempt.update({ where: { id: attemptId }, data: { status: AttemptStatus.IN_PROGRESS, gradingStatus: EssayAttemptGradingStatus.NOT_SUBMITTED, endTime: null, submittedAt: null } }); await this.audit.write({ actorId: actor.id, action: 'ESSAY_REOPEN', entityType: 'ExamAttempt', entityId: attemptId, description: 'Mở lại bài tự luận', metadata: { reason: dto.reason } }, tx); });
    return { success: true, status: AttemptStatus.IN_PROGRESS };
  }

  async extend(actor: any, attemptId: string, dto: ActionReasonDto) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Chá»‰ ADMIN Ä‘Æ°á»£c gia háº¡n bÃ i tá»± luáº­n.');
    const attempt = await this.getAttempt(actor, attemptId);
    const extra = dto.extraMinutes || 0;
    if (!extra) throw new BadRequestException('Số phút gia hạn phải lớn hơn 0.');
    const expectedEndTime = new Date((attempt.expectedEndTime || new Date()).getTime() + extra * 60000);
    await this.prisma.$transaction(async (tx) => { await tx.examAttempt.update({ where: { id: attemptId }, data: { expectedEndTime, extraMinutes: { increment: extra }, extraTimeReason: dto.reason } }); await this.audit.write({ actorId: actor.id, action: 'ESSAY_EXTEND', entityType: 'ExamAttempt', entityId: attemptId, description: 'Gia hạn bài tự luận', metadata: { reason: dto.reason, extraMinutes: extra } }, tx); });
    return { success: true, expectedEndTime };
  }

  async penalty(actor: any, attemptId: string, dto: ActionReasonDto) {
    const attempt = await this.getAttempt(actor, attemptId);
    const penalty = dto.penaltyPoints || 0;
    if (penalty < 0 || penalty > (attempt.maxScore || 10)) throw new BadRequestException('Điểm trừ không hợp lệ.');
    await this.prisma.$transaction(async (tx) => { await tx.examAttempt.update({ where: { id: attemptId }, data: { penaltyPoints: penalty, totalScore: Math.max(0, (attempt.totalScore || 0) - penalty) } }); await this.audit.write({ actorId: actor.id, action: 'ESSAY_PENALTY', entityType: 'ExamAttempt', entityId: attemptId, description: 'Trừ điểm bài tự luận', metadata: { reason: dto.reason, penalty } }, tx); });
    return { success: true, penaltyPoints: penalty };
  }

  async uploadFile(actorId: number, token: string, questionId: string, file: Express.Multer.File) {
    if (!file || !ALLOWED_MIME.has(file.mimetype) || file.size > MAX_BYTES) throw new BadRequestException('File không hợp lệ hoặc vượt quá 20 MB.');
    const attempt = await this.prisma.examAttempt.findUnique({ where: { attemptToken: token }, include: { student: true, onlineExamConfig: true, attemptAnswers: true } });
    if (!attempt || attempt.student.userId !== actorId) throw new ForbiddenException('Phiên thi không hợp lệ.');
    if (![AttemptStatus.IN_PROGRESS, AttemptStatus.DISCONNECTED].includes(attempt.status as any)) throw new BadRequestException('Bài đã nộp, không thể tải file.');
    const answer = attempt.attemptAnswers.find((a) => a.questionId === questionId);
    if (!answer) throw new BadRequestException('Cần lưu câu trả lời trước khi tải file.');
    const dir = join(process.cwd(), 'uploads', 'essay'); await mkdir(dir, { recursive: true });
    const id = randomUUID(); const ext = file.originalname.includes('.') ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase() : '';
    const name = `${id}${ext}`; await writeFile(join(dir, name), file.buffer);
    return this.prisma.essaySubmissionFile.create({ data: { id, attemptId: attempt.id, answerId: answer.id, url: `/uploads/essay/${name}`, fileName: file.originalname, mimeType: file.mimetype, size: file.size } });
  }
}
