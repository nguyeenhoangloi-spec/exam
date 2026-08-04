import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BloomLevel, Prisma, QuestionDifficulty, QuestionHistoryAction, QuestionStatus, QuestionType } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BulkActionDto, CreateQuestionDto, ImportConfirmDto, QuestionQueryDto, SaveAiQuestionsDto, UpdateQuestionDto } from './dto/question.dto';
import { normalizeQuestionContent, validateQuestionOptions } from './question-validation';

type Actor = { id: number; role: string };
const include = {
  subject: true, chapter: true, options: { orderBy: { order: 'asc' as const } },
  createdBy: { select: { id: true, username: true } },
  approvedBy: { select: { id: true, username: true } }, statistic: true,
  histories: { orderBy: { createdAt: 'desc' as const }, include: { changedBy: { select: { id: true, username: true } } } },
};

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  private access(a: Actor) { if (!['ADMIN', 'TEACHER'].includes(a.role)) throw new ForbiddenException('Không có quyền truy cập.'); }
  private json(v: unknown) { return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue; }
  private async current(id: string) {
    const q = await this.prisma.question.findFirst({ where: { id, deletedAt: null }, include: { options: true, statistic: true } });
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi.');
    return q;
  }
  private edit(a: Actor, q: { createdById: number; status: QuestionStatus }) {
    if (a.role === 'ADMIN') return;
    if (q.createdById !== a.id) throw new ForbiddenException('Chỉ được sửa câu hỏi của mình.');
    if (q.status !== QuestionStatus.DRAFT && q.status !== QuestionStatus.REJECTED) throw new BadRequestException('Chỉ sửa được câu nháp hoặc bị từ chối.');
  }
  private async chapter(subjectId: number, chapterId: string) {
    if (!await this.prisma.chapter.findFirst({ where: { id: chapterId, subjectId } })) throw new BadRequestException('Chương không thuộc môn học.');
  }
  private async code(tx: Prisma.TransactionClient) {
    const r = await tx.$queryRaw<Array<{ value: bigint }>>`SELECT nextval('question_code_seq') value`;
    return `Q${Number(r[0].value).toString().padStart(6, '0')}`;
  }
  private async duplicates(content: string, exclude = '') {
    const normalized = normalizeQuestionContent(content);
    try {
      return await this.prisma.$queryRaw<Array<{ id: string; code: string; content: string; similarity: number }>>`
        SELECT id,code,content,similarity("normalizedContent",${normalized})::float similarity FROM questions
        WHERE "deletedAt" IS NULL AND (${exclude}='' OR id::text<>${exclude})
        AND ("normalizedContent"=${normalized} OR similarity("normalizedContent",${normalized})>0.90)
        ORDER BY similarity DESC LIMIT 10`;
    } catch {
      const exact = await this.prisma.question.findMany({
        where: { normalizedContent: normalized, deletedAt: null, ...(exclude && { id: { not: exclude } }) },
        select: { id: true, code: true, content: true },
        take: 10,
      });
      return exact.map(q => ({ ...q, similarity: 1.0 }));
    }
  }

  async saveAi(a: Actor, d: SaveAiQuestionsDto) {
    this.access(a);
    for (const question of d.questions) {
      await this.chapter(question.subjectId, question.chapterId);
      validateQuestionOptions(question.type, question.options);
      if (!Number.isFinite(question.score) || question.score < 0.01 || question.score > 100) {
        throw new BadRequestException('Điểm câu hỏi AI không hợp lệ.');
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const created: any[] = [];
      for (const question of d.questions) {
        created.push(await this.createInTransaction(tx, a, question));
      }
      return created;
    });
  }
  private async noDuplicate(a: Actor, content: string, override = false, exclude = '') {
    const found = await this.duplicates(content, exclude);
    if (found.length && !(override && a.role === 'ADMIN')) throw new ConflictException({ message: 'Câu hỏi trùng hoặc tương đồng trên 90%.', duplicates: found });
  }
  private async createInTransaction(tx: Prisma.TransactionClient, a: Actor, d: CreateQuestionDto) {
    const q = await tx.question.create({ data: {
      code: await this.code(tx), subjectId: d.subjectId, chapterId: d.chapterId, content: d.content.trim(),
      normalizedContent: normalizeQuestionContent(d.content), type: d.type, difficulty: d.difficulty, bloomLevel: d.bloomLevel,
      score: d.score, explanation: d.explanation || null, keywords: d.keywords || null, status: QuestionStatus.DRAFT, createdById: a.id,
      options: { create: d.options.map((o, i) => ({ label: o.label, content: o.content, isCorrect: o.isCorrect, order: o.order ?? i })) }, statistic: { create: {} },
    }, include });
    await tx.questionHistory.create({ data: { questionId: q.id, action: QuestionHistoryAction.CREATE, newData: this.json(q), changedById: a.id } });
    await this.audit.write({ actorId: a.id, action: 'CREATE', entityType: 'QUESTION', entityId: q.id, description: `Đã tạo câu hỏi ${q.code}`, metadata: { questionCode: q.code } }, tx);
    return q;
  }

  async findAll(a: Actor, q: QuestionQueryDto) {
    this.access(a); const page = q.page || 1, limit = q.limit || 20;
    const where: Prisma.QuestionWhereInput = {
      deletedAt: null, ...(q.subjectId && { subjectId: q.subjectId }), ...(q.chapterId && { chapterId: q.chapterId }),
      ...(q.type && { type: q.type }), ...(q.difficulty && { difficulty: q.difficulty }), ...(q.bloomLevel && { bloomLevel: q.bloomLevel }),
      ...(q.status && { status: q.status }),
      ...(q.search && { OR: [{ content: { contains: q.search, mode: 'insensitive' as const } }, { code: { contains: q.search, mode: 'insensitive' as const } }] }),
      ...((q.fromDate || q.toDate) && { createdAt: { ...(q.fromDate && { gte: new Date(q.fromDate) }), ...(q.toDate && { lte: new Date(`${q.toDate}T23:59:59.999Z`) }) } }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [q.sortBy || 'createdAt']: q.sortOrder || 'desc' }, include: { subject: true, chapter: true, createdBy: { select: { id: true, username: true } }, statistic: true, _count: { select: { options: true, examPaperQuestions: true } } } }),
      this.prisma.question.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
  async statistics(a: Actor) {
    this.access(a); const rows = await this.prisma.question.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } });
    const out: any = { total: 0, DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, ARCHIVED: 0 };
    rows.forEach(r => { out[r.status] = r._count._all; out.total += r._count._all; }); return out;
  }
  async filterOptions(a: Actor) {
    this.access(a); return { subjects: await this.prisma.subject.findMany({ include: { chapters: { orderBy: { order: 'asc' } } }, orderBy: { subjectName: 'asc' } }), types: Object.values(QuestionType), difficulties: Object.values(QuestionDifficulty), bloomLevels: Object.values(BloomLevel), statuses: Object.values(QuestionStatus) };
  }
  async findOne(a: Actor, id: string) {
    this.access(a); const q = await this.prisma.question.findFirst({ where: { id, deletedAt: null }, include });
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi.');
    return { ...q, statistic: q.statistic ? { ...q.statistic, correctRate: q.statistic.totalAnswers ? q.statistic.correctAnswers / q.statistic.totalAnswers : null } : null };
  }
  async create(a: Actor, d: CreateQuestionDto) {
    this.access(a); await this.chapter(d.subjectId, d.chapterId); validateQuestionOptions(d.type, d.options); await this.noDuplicate(a, d.content, d.overrideDuplicate);
    return this.prisma.$transaction(async tx => this.createInTransaction(tx, a, d));
  }
  async update(a: Actor, id: string, d: UpdateQuestionDto) {
    const old = await this.current(id); this.edit(a, old);
    if (await this.prisma.examPaperQuestion.count({ where: { questionId: id } })) {
      throw new BadRequestException('Không thể sửa câu hỏi đã được đưa vào đề thi. Hãy nhân bản câu hỏi để chỉnh sửa.');
    }
    const subjectId = d.subjectId ?? old.subjectId, chapterId = d.chapterId ?? old.chapterId; await this.chapter(subjectId, chapterId);
    validateQuestionOptions(d.type ?? old.type, d.options ?? old.options); if (d.content) await this.noDuplicate(a, d.content, d.overrideDuplicate, id);
    return this.prisma.$transaction(async tx => {
      if (d.options) await tx.questionOption.deleteMany({ where: { questionId: id } });
      const q = await tx.question.update({ where: { id }, data: {
        ...(d.subjectId && { subjectId: d.subjectId }), ...(d.chapterId && { chapterId: d.chapterId }),
        ...(d.content && { content: d.content.trim(), normalizedContent: normalizeQuestionContent(d.content) }),
        ...(d.type && { type: d.type }), ...(d.difficulty && { difficulty: d.difficulty }), ...(d.bloomLevel && { bloomLevel: d.bloomLevel }),
        ...(d.score !== undefined && { score: d.score }), ...(d.explanation !== undefined && { explanation: d.explanation || null }),
        ...(d.keywords !== undefined && { keywords: d.keywords || null }),
        ...(d.options && { options: { create: d.options.map((o, i) => ({ label: o.label, content: o.content, isCorrect: o.isCorrect, order: o.order ?? i })) } }),
      }, include });
      await tx.questionHistory.create({ data: { questionId: id, action: QuestionHistoryAction.UPDATE, oldData: this.json(old), newData: this.json(q), changedById: a.id } });
      await this.audit.write({ actorId: a.id, action: 'UPDATE', entityType: 'QUESTION', entityId: id, description: `Đã cập nhật câu hỏi ${q.code}`, metadata: { questionCode: q.code } }, tx);
      return q;
    });
  }
  async duplicate(a: Actor, id: string) {
    const old = await this.current(id); return this.prisma.$transaction(async tx => {
      const q = await tx.question.create({ data: { code: await this.code(tx), subjectId: old.subjectId, chapterId: old.chapterId, content: `${old.content} (Bản sao)`, normalizedContent: `${old.normalizedContent} ban sao ${Date.now()}`, type: old.type, difficulty: old.difficulty, bloomLevel: old.bloomLevel, score: old.score, explanation: old.explanation, keywords: old.keywords, createdById: a.id, options: { create: old.options.map(o => ({ label: o.label, content: o.content, isCorrect: o.isCorrect, order: o.order })) }, statistic: { create: {} } }, include });
      await tx.questionHistory.create({ data: { questionId: q.id, action: QuestionHistoryAction.DUPLICATE, note: `Từ ${old.code}`, changedById: a.id } });
      await this.audit.write({ actorId: a.id, action: 'DUPLICATE', entityType: 'QUESTION', entityId: q.id, description: `Đã nhân bản câu hỏi ${old.code} thành ${q.code}`, metadata: { sourceQuestionCode: old.code, questionCode: q.code } }, tx);
      return q;
    });
  }
  private async transition(a: Actor, id: string, action: QuestionHistoryAction, from: QuestionStatus[], to: QuestionStatus, note?: string) {
    const old = await this.current(id); if (!from.includes(old.status)) throw new BadRequestException(`Không thể chuyển ${old.status} sang ${to}.`);
    if (action === QuestionHistoryAction.SUBMIT) this.edit(a, old);
    if ((action === QuestionHistoryAction.APPROVE || action === QuestionHistoryAction.REJECT) && a.role === 'TEACHER' && old.createdById === a.id) throw new ForbiddenException('Không được tự duyệt câu hỏi.');
    if ((action === QuestionHistoryAction.ARCHIVE || action === QuestionHistoryAction.RESTORE) && a.role !== 'ADMIN') throw new ForbiddenException('Chỉ ADMIN được thực hiện.');
    return this.prisma.$transaction(async tx => {
      const q = await tx.question.update({ where: { id }, data: { status: to, rejectionReason: action === QuestionHistoryAction.REJECT ? note : null, approvedById: action === QuestionHistoryAction.APPROVE ? a.id : old.approvedById, approvedAt: action === QuestionHistoryAction.APPROVE ? new Date() : old.approvedAt, archivedAt: action === QuestionHistoryAction.ARCHIVE ? new Date() : action === QuestionHistoryAction.RESTORE ? null : old.archivedAt, isActive: to !== QuestionStatus.ARCHIVED }, include });
      await tx.questionHistory.create({ data: { questionId: id, action, oldData: this.json(old), newData: this.json(q), note, changedById: a.id } });
      const labels: Partial<Record<QuestionHistoryAction, string>> = {
        SUBMIT: 'Đã gửi duyệt',
        APPROVE: 'Đã duyệt',
        REJECT: 'Đã từ chối',
        ARCHIVE: 'Đã lưu trữ',
        RESTORE: 'Đã khôi phục',
      };
      await this.audit.write({
        actorId: a.id,
        action,
        entityType: 'QUESTION',
        entityId: id,
        description: `${labels[action] || 'Đã thao tác với'} câu hỏi ${q.code}`,
        metadata: { questionCode: q.code, note: note || null },
      }, tx);
      return q;
    });
  }
  submit(a: Actor, id: string) { return this.transition(a, id, QuestionHistoryAction.SUBMIT, [QuestionStatus.DRAFT, QuestionStatus.REJECTED], QuestionStatus.PENDING); }
  approve(a: Actor, id: string) { return this.transition(a, id, QuestionHistoryAction.APPROVE, [QuestionStatus.PENDING, QuestionStatus.DRAFT], QuestionStatus.APPROVED); }
  reject(a: Actor, id: string, reason: string) { return this.transition(a, id, QuestionHistoryAction.REJECT, [QuestionStatus.PENDING, QuestionStatus.DRAFT], QuestionStatus.REJECTED, reason); }
  archive(a: Actor, id: string) { return this.transition(a, id, QuestionHistoryAction.ARCHIVE, [QuestionStatus.DRAFT, QuestionStatus.PENDING, QuestionStatus.APPROVED, QuestionStatus.REJECTED], QuestionStatus.ARCHIVED); }
  restore(a: Actor, id: string) { return this.transition(a, id, QuestionHistoryAction.RESTORE, [QuestionStatus.ARCHIVED], QuestionStatus.DRAFT); }
  async remove(a: Actor, id: string) {
    if (a.role !== 'ADMIN') throw new ForbiddenException('Chỉ ADMIN được xóa.'); const old = await this.current(id);
    if (old.statistic?.usedCount || await this.prisma.examPaperQuestion.count({ where: { questionId: id } })) throw new BadRequestException('Câu đã dùng; hãy lưu trữ.');
    return this.prisma.$transaction(async tx => {
      await tx.questionHistory.create({ data: { questionId: id, action: QuestionHistoryAction.DELETE, oldData: this.json(old), changedById: a.id } });
      const removed = await tx.question.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      await this.audit.write({ actorId: a.id, action: 'DELETE', entityType: 'QUESTION', entityId: id, description: `Đã xóa câu hỏi ${old.code}`, metadata: { questionCode: old.code } }, tx);
      return removed;
    });
  }
  async bulkAction(a: Actor, d: BulkActionDto) {
    const errors: any[] = []; let successCount = 0;
    for (const id of d.ids) try {
      if (d.action === 'APPROVE') await this.approve(a, id); else if (d.action === 'REJECT') await this.reject(a, id, d.reason!);
      else if (d.action === 'ARCHIVE') await this.archive(a, id); else if (d.action === 'RESTORE') await this.restore(a, id);
      else if (d.action === 'DELETE') await this.remove(a, id);
      else {
        const q = await this.current(id); this.edit(a, q); if (d.chapterId) await this.chapter(q.subjectId, d.chapterId);
        await this.prisma.$transaction(async tx => {
          const updated = await tx.question.update({ where: { id }, data: d.difficulty ? { difficulty: d.difficulty } : { chapterId: d.chapterId } });
          await tx.questionHistory.create({ data: { questionId: id, action: QuestionHistoryAction.BULK_UPDATE, oldData: this.json(q), newData: this.json(updated), changedById: a.id } });
          await this.audit.write({ actorId: a.id, action: 'BULK_UPDATE', entityType: 'QUESTION', entityId: id, description: `Đã cập nhật hàng loạt câu hỏi ${q.code}`, metadata: { questionCode: q.code, action: d.action } }, tx);
        });
      }
      successCount++;
    } catch (e: any) { errors.push({ id, message: e?.response?.message || e.message }); }
    return { successCount, failedCount: errors.length, errors };
  }
  async exportCsv(a: Actor, q: QuestionQueryDto) {
    const r = await this.findAll(a, { ...q, page: 1, limit: 100 }); const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return '\uFEFFcode,subject,chapter,type,difficulty,bloomLevel,content,score,status\r\n' + r.data.map(x => [x.code, x.subject.subjectCode, x.chapter.code, x.type, x.difficulty, x.bloomLevel, x.content, x.score, x.status].map(esc).join(',')).join('\r\n');
  }
  importTemplate() { return '\uFEFFsubjectCode,chapterCode,type,difficulty,bloomLevel,content,score,optionA,correctA,optionB,correctB,optionC,correctC,optionD,correctD,explanation\r\nCNTT01,CH1,SINGLE_CHOICE,EASY,REMEMBER,"Câu hỏi mẫu hợp lệ?",0.25,"Đáp án A",true,"Đáp án B",false,"Đáp án C",false,"Đáp án D",false,"Giải thích mẫu"\r\nCNTT01,CH1,TRUE_FALSE,EASY,UNDERSTAND,"Mệnh đề mẫu là đúng.",0.25,"Đúng",true,"Sai",false,,,,,"Giải thích"'; }
  private csv(file: Express.Multer.File) {
    const lines = file.buffer.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean); const headers = lines.shift()!.split(',');
    return lines.map((line, i) => ({ row: i + 2, data: Object.fromEntries(headers.map((h, x) => [h.trim(), line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]*))(?:,|$)/g)?.[x]?.replace(/^\"|\",?$|,$/g, '').replace(/\"\"/g, '"') || ''])) }));
  }
  async importPreview(a: Actor, file: Express.Multer.File) {
    this.access(a); const rows = this.csv(file); if (!rows.length || rows.length > 1000) throw new BadRequestException('CSV phải có 1-1000 dòng.');
    const out = []; for (const row of rows) { const v: any = row.data; const subject = await this.prisma.subject.findUnique({ where: { subjectCode: v.subjectCode } }); const chapter = subject ? await this.prisma.chapter.findFirst({ where: { subjectId: subject.id, code: v.chapterCode } }) : null; const errors = []; if (!subject) errors.push('Môn không tồn tại'); if (!chapter) errors.push('Chương không hợp lệ'); if (!v.content) errors.push('Thiếu nội dung'); out.push({ ...row, subjectId: subject?.id, chapterId: chapter?.id, errors, duplicates: v.content ? await this.duplicates(v.content) : [] }); }
    return { hash: createHash('sha256').update(file.buffer).digest('hex'), rows: out };
  }
  async importConfirm(a: Actor, file: Express.Multer.File, d: ImportConfirmDto) {
    if (createHash('sha256').update(file.buffer).digest('hex') !== d.hash) throw new BadRequestException('File đã thay đổi.'); const p = await this.importPreview(a, file); const selected = p.rows.filter(x => d.rows.includes(x.row));
    if (!selected.length || selected.some(x => x.errors.length)) throw new BadRequestException('Dòng chọn có lỗi.'); if (selected.some(x => x.duplicates.length) && !(d.overrideDuplicate && a.role === 'ADMIN')) throw new ConflictException('Có câu trùng.');
    const payloads: CreateQuestionDto[] = selected.map((x) => {
      const v: any = x.data;
      const options = ['A', 'B', 'C', 'D'].filter((key) => v[`option${key}`]).map((key, index) => ({ label: key, content: v[`option${key}`], isCorrect: v[`correct${key}`] === 'true', order: index }));
      const payload: CreateQuestionDto = { subjectId: x.subjectId!, chapterId: x.chapterId!, content: v.content, type: v.type, difficulty: v.difficulty || 'MEDIUM', bloomLevel: v.bloomLevel || 'UNDERSTAND', score: Number(v.score || .25), explanation: v.explanation, options, overrideDuplicate: d.overrideDuplicate };
      validateQuestionOptions(payload.type, payload.options);
      if (!Number.isFinite(payload.score) || payload.score < 0.01 || payload.score > 100) throw new BadRequestException(`Điểm ở dòng ${x.row} không hợp lệ.`);
      return payload;
    });
    const created = await this.prisma.$transaction(async (tx) => {
      const rows: any[] = [];
      for (const payload of payloads) {
        const chapter = await tx.chapter.findFirst({ where: { id: payload.chapterId, subjectId: payload.subjectId } });
        if (!chapter) throw new BadRequestException('Chương không còn thuộc môn học đã chọn.');
        const normalizedContent = normalizeQuestionContent(payload.content);
        const duplicates = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM questions WHERE "deletedAt" IS NULL
          AND ("normalizedContent" = ${normalizedContent} OR similarity("normalizedContent", ${normalizedContent}) > 0.90)
          LIMIT 1`;
        if (duplicates.length && !(d.overrideDuplicate && a.role === 'ADMIN')) throw new ConflictException('Có câu trùng hoặc tương đồng trong dữ liệu đang nhập.');
        rows.push(await this.createInTransaction(tx, a, payload));
      }
      return rows;
    });
  }
}
