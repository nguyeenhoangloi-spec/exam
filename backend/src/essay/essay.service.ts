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

  async submitGrading(actor: any, attemptId: string) {
    const attempt = await this.getAttempt(actor, attemptId);
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
    const attempt = await this.getAttempt(actor, attemptId);
    await this.prisma.$transaction(async (tx) => { await tx.examAttempt.update({ where: { id: attemptId }, data: { status: AttemptStatus.IN_PROGRESS, gradingStatus: EssayAttemptGradingStatus.NOT_SUBMITTED, endTime: null, submittedAt: null } }); await this.audit.write({ actorId: actor.id, action: 'ESSAY_REOPEN', entityType: 'ExamAttempt', entityId: attemptId, description: 'Mở lại bài tự luận', metadata: { reason: dto.reason } }, tx); });
    return { success: true, status: AttemptStatus.IN_PROGRESS };
  }

  async extend(actor: any, attemptId: string, dto: ActionReasonDto) {
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
