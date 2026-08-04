import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamPaperStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRandomExamPaperDto } from './dto/exam-paper.dto';

type Actor = { id: number; role: string };

const paperDetailInclude = {
  examSchedule: { include: { subject: true, examPeriod: true } },
  createdBy: { select: { id: true, username: true, role: true } },
  questions: {
    include: {
      question: {
        select: {
          id: true,
          code: true,
          content: true,
          type: true,
          difficulty: true,
          explanation: true,
          options: {
            orderBy: { order: 'asc' as const },
            select: { id: true, label: true, content: true, isCorrect: true, order: true },
          },
        },
      },
    },
    orderBy: { questionOrder: 'asc' as const },
  },
};

@Injectable()
export class ExamPapersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertOwner(actor: Actor, paper: { createdById: number }) {
    if (actor.role !== 'ADMIN' && paper.createdById !== actor.id) {
      throw new ForbiddenException('Bạn chỉ được quản lý đề thi do mình tạo.');
    }
  }

  private async current(id: number) {
    const paper = await this.prisma.examPaper.findFirst({
      where: { id, deletedAt: null },
      include: paperDetailInclude,
    });
    if (!paper) throw new NotFoundException('Không tìm thấy đề thi.');
    return paper;
  }

  private shuffle<T>(items: T[]) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  async createRandom(actor: Actor, data: CreateRandomExamPaperDto, persist = true) {
    const requestedCount = data.easyCount + data.mediumCount + data.hardCount;
    if (requestedCount < 1) {
      throw new BadRequestException('Đề thi phải có ít nhất một câu hỏi.');
    }

    if (data.durationMinutes === 60 && requestedCount !== 40) {
      throw new BadRequestException(`Đề thi 60 phút phải có đúng 40 câu hỏi (hiện tại có ${requestedCount} câu).`);
    }

    if (data.durationMinutes === 90 && requestedCount !== 60) {
      throw new BadRequestException(`Đề thi 90 phút phải có đúng 60 câu hỏi (hiện tại có ${requestedCount} câu).`);
    }

    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.examSchedule.findUnique({
        where: { id: data.examScheduleId },
        include: {
          subject: true,
          examPeriod: true,
          examPapers: { where: { deletedAt: null }, select: { status: true } },
          examScheduleRooms: {
            where: { supervisors: { some: { teacher: { userId: actor.id } } } },
            select: { id: true },
          },
        },
      });
      if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi.');
      if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(schedule.status)) {
        throw new BadRequestException('Không thể tạo đề cho lịch thi đã hủy hoặc hoàn thành.');
      }
      if (schedule.examPapers.some((paper) => paper.status === ExamPaperStatus.PUBLISHED)) {
        throw new BadRequestException('Lịch thi đã có đề công bố, không được tạo lại đề tự động.');
      }
      if (actor.role === 'TEACHER' && schedule.examScheduleRooms.length === 0) {
        throw new ForbiddenException('Bạn chỉ được tạo đề cho lịch thi mà mình được phân công.');
      }
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      const scheduleDuration = ((endHour * 60) + endMinute) - ((startHour * 60) + startMinute);
      if (!Number.isFinite(scheduleDuration) || scheduleDuration < 1 || data.durationMinutes > scheduleDuration) {
        throw new BadRequestException('Thời lượng đề thi không được vượt quá thời gian của lịch thi.');
      }

      const duplicateCode = await tx.examPaper.findFirst({
        where: {
          examScheduleId: data.examScheduleId,
          paperCode: data.paperCode.trim(),
          deletedAt: null,
        },
        select: { id: true },
      });
      if (duplicateCode) {
        throw new ConflictException(`Mã đề ${data.paperCode} đã tồn tại trong lịch thi này.`);
      }

      const approvedQuestions = await tx.question.findMany({
        where: {
          subjectId: schedule.subjectId,
          status: 'APPROVED',
          isActive: true,
          deletedAt: null,
        },
        include: { options: { orderBy: { order: 'asc' } } },
      });

      const byDifficulty = {
        EASY: approvedQuestions.filter((question) => question.difficulty === 'EASY'),
        MEDIUM: approvedQuestions.filter((question) => question.difficulty === 'MEDIUM'),
        HARD: approvedQuestions.filter((question) => question.difficulty === 'HARD'),
      };
      const requirements = [
        { label: 'dễ', requested: data.easyCount, available: byDifficulty.EASY.length },
        { label: 'trung bình', requested: data.mediumCount, available: byDifficulty.MEDIUM.length },
        { label: 'khó', requested: data.hardCount, available: byDifficulty.HARD.length },
      ];
      const shortage = requirements.find((item) => item.available < item.requested);
      if (shortage) {
        if (!persist) {
          return {
            preview: true,
            isValid: false,
            message: `Không đủ câu ${shortage.label} theo ma trận.`,
            errors: [`Yêu cầu ${shortage.requested}, hiện có ${shortage.available}.`],
            warnings: [],
            alternatives: [{ rationale: `Giảm số câu ${shortage.label} xuống ${shortage.available} hoặc bổ sung câu đã duyệt.` }],
            paper: { paperCode: data.paperCode.trim(), questionCount: requestedCount, totalScore: requestedCount * 0.25 },
          };
        }
        throw new BadRequestException(
          `Không đủ câu ${shortage.label} đã duyệt. Yêu cầu ${shortage.requested}, hiện có ${shortage.available}.`,
        );
      }

      const selectedQuestions = this.shuffle([
        ...this.shuffle(byDifficulty.EASY).slice(0, data.easyCount),
        ...this.shuffle(byDifficulty.MEDIUM).slice(0, data.mediumCount),
        ...this.shuffle(byDifficulty.HARD).slice(0, data.hardCount),
      ]);
      const totalScore = selectedQuestions.reduce((sum, question) => sum + question.score, 0);
      const paperCode = data.paperCode.trim();
      const title = data.title?.trim() || `Đề thi môn ${schedule.subject.subjectName} - Mã đề ${paperCode}`;

      if (!persist) {
        return {
          preview: true,
          message: 'Đã tạo phương án đề thi. Chưa ghi dữ liệu.',
          schedule: { id: schedule.id, subjectName: schedule.subject.subjectName, examDate: schedule.examDate, startTime: schedule.startTime, endTime: schedule.endTime },
          paper: { paperCode, title, durationMinutes: data.durationMinutes, totalScore, questionCount: selectedQuestions.length },
          questions: selectedQuestions.map((question, index) => ({ id: question.id, code: question.code, content: question.content, difficulty: question.difficulty, score: question.score, order: index + 1 })),
          rationale: 'Chọn ngẫu nhiên câu đã duyệt theo đúng ma trận độ khó đã nhập.',
          warnings: [],
          alternatives: [{ rationale: 'Có thể chạy lại xem trước để tạo một bộ câu ngẫu nhiên khác cùng ma trận.' }],
        };
      }

      const examPaper = await tx.examPaper.create({
        data: {
          examScheduleId: data.examScheduleId,
          paperCode,
          title,
          durationMinutes: data.durationMinutes,
          totalScore,
          status: ExamPaperStatus.DRAFT,
          createdById: actor.id,
          questions: {
            create: selectedQuestions.map((question, index) => ({
              questionId: question.id,
              questionOrder: index + 1,
              score: question.score,
            })),
          },
        },
        include: paperDetailInclude,
      });

      for (const question of selectedQuestions) {
        await tx.questionStatistic.upsert({
          where: { questionId: question.id },
          create: { questionId: question.id, usedCount: 1, lastUsedAt: new Date() },
          update: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
        });
      }

      await this.audit.write({
        actorId: actor.id,
        action: 'CREATE',
        entityType: 'EXAM_PAPER',
        entityId: examPaper.id,
        description: `Đã tạo đề thi ${examPaper.paperCode}`,
        metadata: {
          paperCode: examPaper.paperCode,
          examScheduleId: data.examScheduleId,
          questionCount: selectedQuestions.length,
        },
      }, tx);
      return examPaper;
    });
  }

  async previewRandom(actor: Actor, data: CreateRandomExamPaperDto) {
    return this.createRandom(actor, data, false);
  }

  async findAll(actor: Actor, examScheduleId?: number) {
    const where: Prisma.ExamPaperWhereInput = {
      deletedAt: null,
      ...(examScheduleId && { examScheduleId }),
      ...(actor.role === 'TEACHER' && { createdById: actor.id }),
    };
    return this.prisma.examPaper.findMany({
      where,
      include: {
        examSchedule: { include: { subject: true, examPeriod: true } },
        createdBy: { select: { id: true, username: true, role: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(actor: Actor, id: number) {
    const paper = await this.current(id);
    this.assertOwner(actor, paper);
    return paper;
  }

  async publish(actor: Actor, id: number) {
    const paper = await this.current(id);
    if (paper.status !== ExamPaperStatus.DRAFT) {
      throw new BadRequestException('Chỉ đề thi ở trạng thái bản nháp mới được phát hành.');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examPaper.update({
        where: { id },
        data: { status: ExamPaperStatus.PUBLISHED, publishedAt: new Date(), archivedAt: null },
        include: paperDetailInclude,
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'PUBLISH',
        entityType: 'EXAM_PAPER',
        entityId: id,
        description: `Đã phát hành đề thi ${paper.paperCode}`,
        metadata: { paperCode: paper.paperCode },
      }, tx);
      return updated;
    });
  }

  async archive(actor: Actor, id: number) {
    const paper = await this.current(id);
    if (paper.status === ExamPaperStatus.ARCHIVED) {
      throw new BadRequestException('Đề thi đã được lưu trữ.');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examPaper.update({
        where: { id },
        data: { status: ExamPaperStatus.ARCHIVED, archivedAt: new Date() },
        include: paperDetailInclude,
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'ARCHIVE',
        entityType: 'EXAM_PAPER',
        entityId: id,
        description: `Đã lưu trữ đề thi ${paper.paperCode}`,
        metadata: { paperCode: paper.paperCode },
      }, tx);
      return updated;
    });
  }

  async restore(actor: Actor, id: number) {
    const paper = await this.current(id);
    if (paper.status !== ExamPaperStatus.ARCHIVED) {
      throw new BadRequestException('Chỉ đề thi đang lưu trữ mới được khôi phục.');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examPaper.update({
        where: { id },
        data: { status: ExamPaperStatus.DRAFT, archivedAt: null, publishedAt: null },
        include: paperDetailInclude,
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'RESTORE',
        entityType: 'EXAM_PAPER',
        entityId: id,
        description: `Đã khôi phục đề thi ${paper.paperCode}`,
        metadata: { paperCode: paper.paperCode },
      }, tx);
      return updated;
    });
  }

  async remove(actor: Actor, id: number) {
    const paper = await this.current(id);
    this.assertOwner(actor, paper);
    if (paper.status !== ExamPaperStatus.DRAFT) {
      throw new BadRequestException('Chỉ đề thi bản nháp mới được xóa. Hãy lưu trữ đề đã phát hành.');
    }
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.examPaper.update({
        where: { id },
        data: { deletedAt: new Date(), status: ExamPaperStatus.ARCHIVED, archivedAt: new Date() },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'DELETE',
        entityType: 'EXAM_PAPER',
        entityId: id,
        description: `Đã xóa đề thi ${paper.paperCode}`,
        metadata: { paperCode: paper.paperCode },
      }, tx);
      return removed;
    });
  }
}
