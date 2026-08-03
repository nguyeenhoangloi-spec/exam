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

  async createRandom(actor: Actor, data: CreateRandomExamPaperDto) {
    const requestedCount = data.easyCount + data.mediumCount + data.hardCount;
    if (requestedCount < 1) {
      throw new BadRequestException('Đề thi phải có ít nhất một câu hỏi.');
    }

    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.examSchedule.findUnique({
        where: { id: data.examScheduleId },
        include: { subject: true, examPeriod: true },
      });
      if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi.');
      if (['CANCELLED', 'COMPLETED'].includes(schedule.status)) {
        throw new BadRequestException('Không thể tạo đề cho lịch thi đã hủy hoặc hoàn thành.');
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
