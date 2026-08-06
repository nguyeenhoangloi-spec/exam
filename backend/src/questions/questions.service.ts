import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BloomLevel, Prisma, QuestionDifficulty, QuestionHistoryAction, QuestionStatus, QuestionType } from '@prisma/client';
import { createHash } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BulkActionDto, CreateQuestionDto, ImportConfirmDto, ImportPreviewDto, QuestionQueryDto, SaveAiQuestionsDto, UpdateQuestionDto } from './dto/question.dto';
import { normalizeQuestionContent, validateQuestionOptions } from './question-validation';

type Actor = { id: number; role: string };
const include = {
  subject: true, chapter: true, media: { orderBy: { sortOrder: 'asc' as const } }, options: { orderBy: { order: 'asc' as const }, include: { media: { orderBy: { sortOrder: 'asc' as const } } } },
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
  private rich(v: unknown) {
    if (!v || typeof v !== 'object') return undefined;
    const html = typeof (v as any).html === 'string' ? (v as any).html : '';
    return this.json({ html: html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '').replace(/javascript:/gi, '') });
  }
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
  private async chapter(subjectId: number, chapterId?: string | null) {
    if (chapterId && !await this.prisma.chapter.findFirst({ where: { id: chapterId, subjectId } })) throw new BadRequestException('Chương không thuộc môn học.');
  }

  private mediaRoot() { return join(process.cwd(), 'uploads', 'questions'); }
  private sniffImage(file: Express.Multer.File) {
    const b = file.buffer;
    if (file.mimetype === 'image/png' && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return true;
    if (file.mimetype === 'image/jpeg' && b.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return true;
    if (file.mimetype === 'image/webp' && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return true;
    if (file.mimetype === 'image/svg+xml') return /<svg[\s>]/i.test(file.buffer.toString('utf8', 0, 4096));
    return false;
  }
  private validateMediaFile(file: Express.Multer.File) {
    if (!file || file.size > Number(process.env.QUESTION_MEDIA_MAX_BYTES || 5 * 1024 * 1024)) throw new BadRequestException('Ảnh vượt quá dung lượng cho phép.');
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.mimetype) || !this.sniffImage(file)) throw new BadRequestException('File không phải ảnh PNG/JPG/WEBP/SVG hợp lệ.');
  }
  async previewMedia(a: Actor, files: Express.Multer.File[]) {
    this.access(a); if (!files?.length) throw new BadRequestException('Vui lòng chọn ít nhất một ảnh.');
    files.forEach(file => this.validateMediaFile(file));
    return files.map(file => ({ fileName: basename(file.originalname), mimeType: file.mimetype, size: file.size, previewable: true }));
  }
  async uploadMedia(a: Actor, questionId: string, optionId: string | undefined, files: Express.Multer.File[]) {
    this.access(a); const q = await this.current(questionId); this.edit(a, q); if (!files?.length) throw new BadRequestException('Vui lòng chọn ít nhất một ảnh.');
    if (optionId && !q.options.some(o => o.id === optionId)) throw new BadRequestException('Đáp án không thuộc câu hỏi.');
    files.forEach(file => this.validateMediaFile(file));
    const root = this.mediaRoot(); await mkdir(root, { recursive: true });
    const created: any[] = [];
    for (const [i, file] of files.entries()) {
      const id = randomUUID(); const extension = extname(file.originalname).toLowerCase() || (file.mimetype === 'image/svg+xml' ? '.svg' : '.bin');
      const stored = `${id}${extension}`; const bytes = file.mimetype === 'image/svg+xml'
        ? Buffer.from(file.buffer.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '').replace(/javascript:/gi, ''))
        : file.buffer;
      await writeFile(join(root, stored), bytes);
      const media = await this.prisma.questionMedia.create({ data: { id, questionId, optionId: optionId || null, url: `/uploads/questions/${stored}`, mimeType: file.mimetype, fileName: basename(file.originalname), sortOrder: i } });
      created.push(media);
    }
    return created;
  }
  async removeMedia(a: Actor, id: string) {
    this.access(a); const media = await this.prisma.questionMedia.findUnique({ where: { id }, include: { question: { select: { createdById: true, status: true } } } });
    if (!media) throw new NotFoundException('Không tìm thấy ảnh.');
    this.edit(a, media.question);
    await this.prisma.questionMedia.delete({ where: { id } });
    const fileName = basename(media.url); await unlink(join(this.mediaRoot(), fileName)).catch(() => undefined);
    return { success: true };
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
      code: await this.code(tx), subject: { connect: { id: d.subjectId } }, ...(d.chapterId ? { chapter: { connect: { id: d.chapterId } } } : {}), content: d.content.trim(),
      normalizedContent: normalizeQuestionContent(d.content), ...(d.contentRich ? { contentRich: this.rich(d.contentRich) } : {}), type: d.type, difficulty: d.difficulty, bloomLevel: d.bloomLevel,
      score: d.score, explanation: d.explanation || null, keywords: d.keywords || null, status: QuestionStatus.DRAFT, createdBy: { connect: { id: a.id } },
      ...(d.media?.length ? { media: { create: d.media.map((m, i) => ({ url: m.url, mimeType: m.mimeType, fileName: m.fileName, width: m.width, height: m.height, sortOrder: m.sortOrder ?? i, altText: m.altText })) } } : {}),
      options: { create: d.options.map((o, i) => ({ label: o.label, content: o.content, ...(o.contentRich ? { contentRich: this.json(o.contentRich) } : {}), isCorrect: o.isCorrect, order: o.order ?? i })) }, statistic: { create: {} },
    }, include });
    for (const option of d.options) {
      const createdOption = q.options.find((item) => item.order === (option.order ?? d.options.indexOf(option)));
      if (createdOption && option.media?.length) await tx.questionMedia.createMany({ data: option.media.map((m, i) => ({ questionId: q.id, optionId: createdOption.id, url: m.url, mimeType: m.mimeType, fileName: m.fileName, width: m.width, height: m.height, sortOrder: m.sortOrder ?? i, altText: m.altText })) });
    }
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
      this.prisma.question.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [q.sortBy || 'createdAt']: q.sortOrder || 'desc' }, include: { subject: true, chapter: true, media: { orderBy: { sortOrder: 'asc' } }, options: { orderBy: { order: 'asc' }, include: { media: { orderBy: { sortOrder: 'asc' } } } }, createdBy: { select: { id: true, username: true } }, statistic: true, _count: { select: { options: true, examPaperQuestions: true } } } }),
      this.prisma.question.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
  async statistics(a: Actor) {
    this.access(a);
    const where = { deletedAt: null };
    const [statusRows, difficultyRows, typeRows] = await Promise.all([
      this.prisma.question.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.question.groupBy({ by: ['difficulty'], where, _count: { _all: true } }),
      this.prisma.question.groupBy({ by: ['type'], where, _count: { _all: true } }),
    ]);
    const out: any = { total: 0, DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, ARCHIVED: 0, difficulty: {}, types: {} };
    statusRows.forEach(r => { out[r.status] = r._count._all; out.total += r._count._all; });
    difficultyRows.forEach(r => { out.difficulty[r.difficulty] = r._count._all; });
    typeRows.forEach(r => { out.types[r.type] = r._count._all; });
    return out;
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
    const subjectId = d.subjectId ?? old.subjectId, chapterId = d.chapterId === null ? null : (d.chapterId ?? old.chapterId); await this.chapter(subjectId, chapterId);
    validateQuestionOptions(d.type ?? old.type, d.options ?? old.options); if (d.content) await this.noDuplicate(a, d.content, d.overrideDuplicate, id);
    return this.prisma.$transaction(async tx => {
      if (d.options) await tx.questionOption.deleteMany({ where: { questionId: id } });
      if (d.media) await tx.questionMedia.deleteMany({ where: { questionId: id, optionId: null } });
      const q = await tx.question.update({ where: { id }, data: {
        ...(d.subjectId && { subject: { connect: { id: d.subjectId } } }), ...(d.chapterId !== undefined && { chapter: d.chapterId ? { connect: { id: d.chapterId } } : { disconnect: true } }),
        ...(d.content && { content: d.content.trim(), normalizedContent: normalizeQuestionContent(d.content) }), ...(d.contentRich !== undefined && { contentRich: d.contentRich ? this.rich(d.contentRich) : Prisma.JsonNull }),
        ...(d.type && { type: d.type }), ...(d.difficulty && { difficulty: d.difficulty }), ...(d.bloomLevel && { bloomLevel: d.bloomLevel }),
        ...(d.score !== undefined && { score: d.score }), ...(d.explanation !== undefined && { explanation: d.explanation || null }),
        ...(d.keywords !== undefined && { keywords: d.keywords || null }),
        ...(d.media?.length && { media: { create: d.media.map((m, i) => ({ url: m.url, mimeType: m.mimeType, fileName: m.fileName, width: m.width, height: m.height, sortOrder: m.sortOrder ?? i, altText: m.altText })) } }),
        ...(d.options && { options: { create: d.options.map((o, i) => ({ label: o.label, content: o.content, ...(o.contentRich ? { contentRich: this.json(o.contentRich) } : {}), isCorrect: o.isCorrect, order: o.order ?? i })) } }),
      }, include });
      if (d.options) {
        for (const option of d.options) {
          const createdOption = q.options.find((item) => item.order === (option.order ?? d.options!.indexOf(option)));
          if (createdOption && option.media?.length) await tx.questionMedia.createMany({ data: option.media.map((m, i) => ({ questionId: id, optionId: createdOption.id, url: m.url, mimeType: m.mimeType, fileName: m.fileName, width: m.width, height: m.height, sortOrder: m.sortOrder ?? i, altText: m.altText })) });
        }
      }
      await tx.questionHistory.create({ data: { questionId: id, action: QuestionHistoryAction.UPDATE, oldData: this.json(old), newData: this.json(q), changedById: a.id } });
      await this.audit.write({ actorId: a.id, action: 'UPDATE', entityType: 'QUESTION', entityId: id, description: `Đã cập nhật câu hỏi ${q.code}`, metadata: { questionCode: q.code } }, tx);
      return q;
    });
  }
  async duplicate(a: Actor, id: string) {
    const old = await this.current(id); return this.prisma.$transaction(async tx => {
      const q = await tx.question.create({ data: { code: await this.code(tx), subject: { connect: { id: old.subjectId } }, ...(old.chapterId ? { chapter: { connect: { id: old.chapterId } } } : {}), content: `${old.content} (Bản sao)`, normalizedContent: `${old.normalizedContent} ban sao ${Date.now()}`, type: old.type, difficulty: old.difficulty, bloomLevel: old.bloomLevel, score: old.score, explanation: old.explanation, keywords: old.keywords, createdBy: { connect: { id: a.id } }, options: { create: old.options.map(o => ({ label: o.label, content: o.content, isCorrect: o.isCorrect, order: o.order })) }, statistic: { create: {} } }, include });
      await tx.questionHistory.create({ data: { questionId: q.id, action: QuestionHistoryAction.DUPLICATE, note: `Từ ${old.code}`, changedById: a.id } });
      await this.audit.write({ actorId: a.id, action: 'DUPLICATE', entityType: 'QUESTION', entityId: q.id, description: `Đã nhân bản câu hỏi ${old.code} thành ${q.code}`, metadata: { sourceQuestionCode: old.code, questionCode: q.code } }, tx);
      return q;
    });
  }
  private async transition(a: Actor, id: string, action: QuestionHistoryAction, from: QuestionStatus[], to: QuestionStatus, note?: string) {
    const old = await this.current(id);
    if (!from.includes(old.status)) {
      const labels: Record<string, string> = { DRAFT: 'bản nháp', PENDING: 'chờ duyệt', APPROVED: 'đã duyệt', REJECTED: 'bị từ chối', ARCHIVED: 'lưu trữ' };
      throw new BadRequestException(`Không thể chuyển từ ${labels[old.status] || old.status} sang ${labels[to] || to}.`);
    }
    if (action === QuestionHistoryAction.SUBMIT) {
      if (old.status !== QuestionStatus.DRAFT && old.status !== QuestionStatus.REJECTED) throw new BadRequestException('Chỉ gửi duyệt được câu nháp hoặc bị từ chối.');
    }
    if ((action === QuestionHistoryAction.APPROVE || action === QuestionHistoryAction.REJECT) && a.role === 'TEACHER' && old.createdById === a.id) throw new ForbiddenException('Không được tự duyệt câu hỏi.');
    if ((action === QuestionHistoryAction.ARCHIVE || action === QuestionHistoryAction.RESTORE) && a.role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được thực hiện.');
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
    if (a.role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được xóa.'); const old = await this.current(id);
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
      if (d.action === 'SUBMIT') await this.submit(a, id);
      else if (d.action === 'APPROVE') await this.approve(a, id); else if (d.action === 'REJECT') await this.reject(a, id, d.reason!);
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
    const typeLabels: Record<string, string> = { SINGLE_CHOICE: 'Trắc nghiệm một đáp án', MULTIPLE_CHOICE: 'Trắc nghiệm nhiều đáp án', TRUE_FALSE: 'Đúng hoặc Sai', FILL_BLANK: 'Điền vào chỗ trống', ESSAY: 'Tự luận' };
    const difficultyLabels: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
    const bloomLabels: Record<string, string> = { REMEMBER: 'Nhận biết', UNDERSTAND: 'Thông hiểu', APPLY: 'Vận dụng', ANALYZE: 'Phân tích' };
    const statusLabels: Record<string, string> = { DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', ARCHIVED: 'Lưu trữ' };
    return '\uFEFFMã câu hỏi,Mã môn,Mã chương,Loại câu hỏi,Độ khó,Mức độ Bloom,Nội dung câu hỏi,Điểm,Trạng thái\r\n' + r.data.map(x => [x.code, x.subject.subjectCode, x.chapter.code, typeLabels[x.type] || x.type, difficultyLabels[x.difficulty] || x.difficulty, bloomLabels[x.bloomLevel] || x.bloomLevel, x.content, x.score, statusLabels[x.status] || x.status].map(esc).join(',')).join('\r\n');
  }
  importTemplate() {
    return '\uFEFFNội dung câu hỏi,Đáp án A,Đáp án B,Đáp án C,Đáp án D,Đáp án đúng,Giải thích\r\n"ISO/IEC 27001 là tiêu chuẩn gì?","Tiêu chuẩn quản lý an toàn thông tin ISMS","Chuẩn cáp mạng USB","Chuẩn lập trình web HTML","Chuẩn kết nối không dây Wi-Fi","A","ISO/IEC 27001 là tiêu chuẩn quản lý ATTT quốc tế."\r\n"Thuật toán RSA thuộc loại mã hóa nào?","Mã hóa bất đối xứng (Dùng cặp khóa Public/Private)","Mã hóa đối xứng","Hàm băm một chiều","Không mã hóa","A","RSA là thuật toán mã hóa bất đối xứng phổ biến."\r\n';
  }
  private csvLegacy(file: Express.Multer.File) {
    const lines = file.buffer.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean); const headers = lines.shift()!.split(',');
    return lines.map((line, i) => ({ row: i + 2, data: Object.fromEntries(headers.map((h, x) => [h.trim(), line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]*))(?:,|$)/g)?.[x]?.replace(/^\"|\",?$|,$/g, '').replace(/\"\"/g, '"') || ''])) }));
  }
  private rowsFromFile(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    const aliases: Record<string, string> = {
      'Mã môn': 'subjectCode',
      'Mã chương': 'chapterCode',
      'Loại câu hỏi': 'type',
      'Độ khó': 'difficulty',
      'Mức độ Bloom': 'bloomLevel',
      'Nội dung câu hỏi': 'content',
      'Nội dung': 'content',
      'Câu hỏi': 'content',
      'Điểm': 'score',
      'Đáp án A': 'optionA',
      'Đúng A': 'correctA',
      'Đáp án B': 'optionB',
      'Đúng B': 'correctB',
      'Đáp án C': 'optionC',
      'Đúng C': 'correctC',
      'Đáp án D': 'optionD',
      'Đúng D': 'correctD',
      'Đáp án đúng': 'correctAnswer',
      'Đáp án': 'correctAnswer',
      'Giải thích': 'explanation',
    };
    const headers = (matrix.shift() || []).map((h: any) => aliases[String(h).trim()] || String(h).trim());
    return matrix.filter(row => row.some((v: any) => String(v ?? '').trim() !== '')).map((row, i) => ({ row: i + 2, data: Object.fromEntries(headers.map((h, x) => [h, String(row[x] ?? '').trim()])) }));
  }
  private resolveImport(data: any, meta: ImportPreviewDto) {
    const use = (key: string, fallback: any) => meta.applyDefaultsToMissingOnly !== false && (!data[key] || String(data[key]).trim() === '') ? fallback : data[key];
    const resolvedSubjectId = data.subjectId || (data.subjectCode ? null : meta.subjectId);
    const resolvedChapterId = data.chapterId || (data.chapterCode ? null : meta.chapterId);
    return {
      ...data,
      ...(resolvedSubjectId && { subjectId: resolvedSubjectId }),
      ...(resolvedChapterId && { chapterId: resolvedChapterId }),
      type: use('type', meta.defaultType || 'SINGLE_CHOICE'),
      difficulty: use('difficulty', meta.defaultDifficulty || 'MEDIUM'),
      bloomLevel: use('bloomLevel', meta.defaultBloomLevel || 'UNDERSTAND'),
      score: use('score', meta.defaultScore || '0.25'),
    };
  }
  async importPreview(a: Actor, file: Express.Multer.File, meta: ImportPreviewDto = new ImportPreviewDto()) {
    this.access(a); let rows = this.rowsFromFile(file); if (!rows.length || rows.length > 1000) throw new BadRequestException('File phải có 1-1000 dòng.');
    rows = rows.map(row => ({ ...row, data: this.resolveImport(row.data, meta) }));
    const out = [];
    for (const row of rows) {
      const v: any = row.data;
      let subject = v.subjectId ? await this.prisma.subject.findUnique({ where: { id: Number(v.subjectId) } }) : (v.subjectCode ? await this.prisma.subject.findUnique({ where: { subjectCode: v.subjectCode } }) : null);
      if (!subject && meta.subjectId) {
        subject = await this.prisma.subject.findUnique({ where: { id: Number(meta.subjectId) } });
      }
      let chapter = v.chapterId ? await this.prisma.chapter.findUnique({ where: { id: String(v.chapterId) } }) : (subject && v.chapterCode ? await this.prisma.chapter.findFirst({ where: { subjectId: subject.id, code: v.chapterCode } }) : null);
      if (!chapter && meta.chapterId && subject && String(subject.id) === String(meta.subjectId)) {
        chapter = await this.prisma.chapter.findUnique({ where: { id: String(meta.chapterId) } });
      }
      const errors = [];
      if (!subject) errors.push('Môn học không tồn tại. Vui lòng chọn môn học ở ô cấu hình.');
      if (!v.content) errors.push('Thiếu nội dung câu hỏi.');
      out.push({ ...row, subjectId: subject?.id, chapterId: chapter?.id || null, errors, duplicates: v.content ? await this.duplicates(v.content) : [] });
    }
    return { hash: createHash('sha256').update(file.buffer).digest('hex'), rows: out };
  }
  async importConfirm(a: Actor, file: Express.Multer.File, d: ImportConfirmDto) {
    if (createHash('sha256').update(file.buffer).digest('hex') !== d.hash) throw new BadRequestException('File đã thay đổi.'); const p = await this.importPreview(a, file, d);
    if (d.overrides) { try { const overrides = JSON.parse(d.overrides); p.rows.forEach((row: any) => { if (overrides[row.row]) row.data = { ...row.data, ...overrides[row.row] }; }); } catch { throw new BadRequestException('Dữ liệu chỉnh sửa import không hợp lệ.'); } }
    const selected = p.rows.filter(x => d.rows.includes(x.row));
    if (!selected.length || selected.some(x => x.errors.length)) throw new BadRequestException('Dòng chọn có lỗi.'); if (selected.some(x => x.duplicates.length) && !(d.overrideDuplicate && a.role === 'ADMIN')) throw new ConflictException('Có câu trùng.');
    const payloads: CreateQuestionDto[] = selected.map((x) => {
      const v: any = x.data;
      const correctAnsStr = String(v.correctAnswer || '').trim().toUpperCase();
      const checkCorrect = (label: string) => {
        if (v[`correct${label}`] === 'true' || v[`correct${label}`] === true) return true;
        if (!correctAnsStr) return false;
        if (correctAnsStr.includes(label)) return true;
        if (label === 'A' && (correctAnsStr === '1' || correctAnsStr.startsWith('A'))) return true;
        if (label === 'B' && (correctAnsStr === '2' || correctAnsStr.startsWith('B'))) return true;
        if (label === 'C' && (correctAnsStr === '3' || correctAnsStr.startsWith('C'))) return true;
        if (label === 'D' && (correctAnsStr === '4' || correctAnsStr.startsWith('D'))) return true;
        if (v[`option${label}`] && String(v[`option${label}`]).trim().toUpperCase() === correctAnsStr) return true;
        return false;
      };
      const options = ['A', 'B', 'C', 'D'].filter((key) => v[`option${key}`]).map((key, index) => ({
        label: key,
        content: v[`option${key}`],
        isCorrect: checkCorrect(key),
        order: index,
      }));
      const payload: CreateQuestionDto = { subjectId: x.subjectId!, chapterId: x.chapterId || undefined, content: v.content, type: v.type || 'SINGLE_CHOICE', difficulty: v.difficulty || 'MEDIUM', bloomLevel: v.bloomLevel || 'UNDERSTAND', score: Number(v.score || .25), explanation: v.explanation, options, overrideDuplicate: d.overrideDuplicate };
      if (!['SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','ESSAY'].includes(payload.type)) throw new BadRequestException(`Loại câu ở dòng ${x.row} không hợp lệ.`);
      if (!['EASY','MEDIUM','HARD'].includes(payload.difficulty)) throw new BadRequestException(`Độ khó ở dòng ${x.row} không hợp lệ.`);
      if (!['REMEMBER','UNDERSTAND','APPLY','ANALYZE'].includes(payload.bloomLevel)) throw new BadRequestException(`Bloom ở dòng ${x.row} không hợp lệ.`);
      validateQuestionOptions(payload.type, payload.options);
      if (!Number.isFinite(payload.score) || payload.score < 0.01 || payload.score > 100) throw new BadRequestException(`Điểm ở dòng ${x.row} không hợp lệ.`);
      return payload;
    });
    const created = await this.prisma.$transaction(async (tx) => {
      const rows: any[] = [];
      for (const payload of payloads) {
        if (payload.chapterId) {
          const chapter = await tx.chapter.findFirst({ where: { id: payload.chapterId, subjectId: payload.subjectId } });
          if (!chapter) throw new BadRequestException('Chương không còn thuộc môn học đã chọn.');
        }
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
