import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TrashService implements OnModuleInit {
  private readonly logger = new Logger(TrashService.name);

  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  /**
   * Tự động chạy khi NestJS Module khởi tạo & lập lịch quét dọn dẹp định kỳ 24h
   */
  async onModuleInit() {
    // 1. Quét dọn dẹp thùng rác hết hạn ngay khi backend khởi động
    await this.autoCleanExpiredTrash(30).catch((err) => {
      this.logger.error(`Lỗi khi tự động dọn dẹp thùng rác lúc khởi động: ${err.message}`);
    });

    // 2. Lập lịch tự động dọn dẹp định kỳ 24 giờ một lần (Native NodeJS Interval)
    setInterval(() => {
      this.autoCleanExpiredTrash(30).catch((err) => {
        this.logger.error(`Lỗi khi dọn dẹp thùng rác định kỳ 24h: ${err.message}`);
      });
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Tự động xóa vĩnh viễn các bản ghi bị soft-delete quá N ngày (Mặc định: 30 ngày)
   */
  async autoCleanExpiredTrash(retentionDays = 30, actorId?: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const [deletedSchedules, deletedPapers, deletedQuestions] = await Promise.all([
      this.prisma.examSchedule.deleteMany({
        where: {
          deletedAt: {
            not: null,
            lte: cutoffDate,
          },
        },
      }),
      this.prisma.examPaper.deleteMany({
        where: {
          deletedAt: {
            not: null,
            lte: cutoffDate,
          },
        },
      }),
      this.prisma.question.deleteMany({
        where: {
          deletedAt: {
            not: null,
            lte: cutoffDate,
          },
        },
      }),
    ]);

    const totalCleaned = deletedSchedules.count + deletedPapers.count + deletedQuestions.count;

    if (totalCleaned > 0) {
      this.logger.log(
        `🧹 [TRASH AUTO-CLEANUP] Đã tự động xóa vĩnh viễn ${totalCleaned} bản ghi quá ${retentionDays} ngày (Schedules: ${deletedSchedules.count}, Papers: ${deletedPapers.count}, Questions: ${deletedQuestions.count})`,
      );

      await this.audit.write({
          actorId: actorId || null,
          action: 'AUTO_PURGE_TRASH',
          entityType: 'Trash',
          entityId: 'SYSTEM',
          description: `Hệ thống tự động dọn dẹp xóa vĩnh viễn ${totalCleaned} bản ghi trong thùng rác quá ${retentionDays} ngày (Lịch thi: ${deletedSchedules.count}, Đề thi: ${deletedPapers.count}, Câu hỏi: ${deletedQuestions.count})`,
      });
    }

    return {
      success: true,
      totalCleaned,
      details: {
        schedules: deletedSchedules.count,
        papers: deletedPapers.count,
        questions: deletedQuestions.count,
      },
      cutoffDate,
    };
  }

  /**
   * Lấy thống kê số lượng items nằm trong thùng rác
   */
  async getTrashStats() {
    const [
      schedulesCount, papersCount, questionsCount
    ] = await Promise.all([
      this.prisma.examSchedule.count({ where: { deletedAt: { not: null } } }),
      this.prisma.examPaper.count({ where: { deletedAt: { not: null } } }),
      this.prisma.question.count({ where: { deletedAt: { not: null } } }),
    ]);

    const total = schedulesCount + papersCount + questionsCount;

    return {
      total,
      schedules: schedulesCount,
      papers: papersCount,
      questions: questionsCount,
      users: 0,
      subjects: 0,
      classes: 0,
    };
  }

  /**
   * Lấy danh sách items đã bị xóa (Soft Delete) theo loại
   */
  async getTrashItems(type: string, search = '') {
    const searchFilter = search.trim().toLowerCase();

    if (type === 'schedules') {
      const items = await this.prisma.examSchedule.findMany({
        where: {
          deletedAt: { not: null },
          ...(searchFilter
            ? {
                OR: [
                  { subject: { subjectName: { contains: searchFilter, mode: 'insensitive' } } },
                  { subject: { subjectCode: { contains: searchFilter, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        include: {
          subject: true,
          examPeriod: true,
          deletedBy: { select: { id: true, username: true, role: true } },
        },
        orderBy: { deletedAt: 'desc' },
      });

      return items.map((item: any) => ({
        id: item.id,
        type: 'schedules',
        title: `Lịch thi [${item.subject?.subjectCode || 'MH'}] ${item.subject?.subjectName || ''}`,
        subTitle: `Kỳ thi: ${item.examPeriod?.name || 'Chưa rõ'}, ngày thi: ${item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : '—'} (${item.startTime} – ${item.endTime})`,
        deletedAt: item.deletedAt,
        deletedBy: item.deletedBy?.username || 'Hệ thống',
        raw: item,
      }));
    }

    if (type === 'papers') {
      const items = await this.prisma.examPaper.findMany({
        where: {
          deletedAt: { not: null },
          ...(searchFilter
            ? {
                OR: [
                  { paperCode: { contains: searchFilter, mode: 'insensitive' } },
                  { examSchedule: { subject: { subjectName: { contains: searchFilter, mode: 'insensitive' } } } },
                ],
              }
            : {}),
        },
        include: {
          examSchedule: { include: { subject: true, examPeriod: true } },
          questions: true,
        },
        orderBy: { deletedAt: 'desc' },
      });

      return items.map((item: any) => ({
        id: item.id,
        type: 'papers',
        title: `Mã đề: ${item.paperCode} (Môn: ${item.examSchedule?.subject?.subjectName || 'Môn thi'})`,
        subTitle: `${item.questions.length} câu, ${item.durationMinutes} phút, điểm tối đa: ${item.totalScore}`,
        deletedAt: item.deletedAt,
        deletedBy: 'Hệ thống',
        raw: item,
      }));
    }

    if (type === 'questions') {
      const items = await this.prisma.question.findMany({
        where: {
          deletedAt: { not: null },
          ...(searchFilter
            ? {
                OR: [
                  { code: { contains: searchFilter, mode: 'insensitive' } },
                  { content: { contains: searchFilter, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        include: {
          subject: true,
          createdBy: { select: { id: true, username: true } },
        },
        orderBy: { deletedAt: 'desc' },
      });

      return items.map((item: any) => ({
        id: item.id,
        type: 'questions',
        title: `Câu hỏi [${item.code || 'CH'}] - Dạng: ${item.type}`,
        subTitle: `Nội dung: ${item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content}, Môn: ${item.subject?.subjectName || 'Tự do'}`,
        deletedAt: item.deletedAt,
        deletedBy: item.createdBy?.username || 'Hệ thống',
        raw: item,
      }));
    }

    return [];
  }

  /**
   * Khôi phục 1 item từ Thùng Rác về trạng thái hoạt động
   */
  async restoreItem(actorId: number, type: string, id: number | string) {
    if (type === 'schedules') {
      const schedule = await this.prisma.examSchedule.findUnique({
        where: { id: Number(id) },
        include: { subject: true },
      });
      if (!schedule || !schedule.deletedAt) {
        throw new NotFoundException('Không tìm thấy lịch thi trong thùng rác');
      }

      const restored = await this.prisma.examSchedule.update({
        where: { id: Number(id) },
        data: {
          deletedAt: null,
          deletedById: null,
          status: 'SCHEDULED',
        },
      });

      await this.audit.write({
          actorId,
          action: 'RESTORE_EXAM_SCHEDULE',
          entityType: 'ExamSchedule',
          entityId: String(id),
          description: `Khôi phục lịch thi môn ${schedule.subject?.subjectName || ''} từ thùng rác`,
      });

      return { success: true, message: 'Khôi phục lịch thi thành công', item: restored };
    }

    if (type === 'papers') {
      const paper = await this.prisma.examPaper.findUnique({
        where: { id: Number(id) },
      });
      if (!paper || !paper.deletedAt) {
        throw new NotFoundException('Không tìm thấy đề thi trong thùng rác');
      }

      const restored = await this.prisma.examPaper.update({
        where: { id: Number(id) },
        data: {
          deletedAt: null,
          archivedAt: null,
          status: 'DRAFT',
        },
      });

      await this.audit.write({
          actorId,
          action: 'RESTORE_EXAM_PAPER',
          entityType: 'ExamPaper',
          entityId: String(id),
          description: `Khôi phục đề thi mã ${paper.paperCode} từ thùng rác`,
      });

      return { success: true, message: 'Khôi phục đề thi thành công', item: restored };
    }

    if (type === 'questions') {
      const question = await this.prisma.question.findUnique({
        where: { id: String(id) },
      });
      if (!question || !question.deletedAt) {
        throw new NotFoundException('Không tìm thấy câu hỏi trong thùng rác');
      }

      const restored = await this.prisma.question.update({
        where: { id: String(id) },
        data: {
          deletedAt: null,
          isActive: true,
        },
      });

      await this.audit.write({
          actorId,
          action: 'RESTORE_QUESTION',
          entityType: 'Question',
          entityId: String(id),
          description: `Khôi phục câu hỏi [${question.code}] từ thùng rác`,
      });

      return { success: true, message: 'Khôi phục câu hỏi thành công', item: restored };
    }

    throw new BadRequestException('Loại danh mục không hợp lệ');
  }

  /**
   * Xóa vĩnh viễn (Hard Delete) khỏi Database PostgreSQL
   */
  async hardDeleteItem(actorId: number, type: string, id: number | string) {
    if (type === 'schedules') {
      const schedule = await this.prisma.examSchedule.findUnique({
        where: { id: Number(id) },
        include: { subject: true },
      });
      if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi');

      await this.prisma.examSchedule.delete({ where: { id: Number(id) } });

      await this.audit.write({
          actorId,
          action: 'HARD_DELETE_EXAM_SCHEDULE',
          entityType: 'ExamSchedule',
          entityId: String(id),
          description: `Xóa vĩnh viễn lịch thi ${schedule.subject?.subjectName || ''} khỏi hệ thống`,
      });

      return { success: true, message: 'Đã xóa vĩnh viễn lịch thi khỏi Database' };
    }

    if (type === 'papers') {
      const paper = await this.prisma.examPaper.findUnique({
        where: { id: Number(id) },
      });
      if (!paper) throw new NotFoundException('Không tìm thấy đề thi');

      await this.prisma.examPaper.delete({ where: { id: Number(id) } });

      await this.audit.write({
          actorId,
          action: 'HARD_DELETE_EXAM_PAPER',
          entityType: 'ExamPaper',
          entityId: String(id),
          description: `Xóa vĩnh viễn đề thi ${paper.paperCode} khỏi hệ thống`,
      });

      return { success: true, message: 'Đã xóa vĩnh viễn đề thi khỏi Database' };
    }

    if (type === 'questions') {
      const question = await this.prisma.question.findUnique({
        where: { id: String(id) },
      });
      if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

      await this.prisma.question.delete({ where: { id: String(id) } });

      await this.audit.write({
          actorId,
          action: 'HARD_DELETE_QUESTION',
          entityType: 'Question',
          entityId: String(id),
          description: `Xóa vĩnh viễn câu hỏi [${question.code}] khỏi hệ thống`,
      });

      return { success: true, message: 'Đã xóa vĩnh viễn câu hỏi khỏi Database' };
    }

    throw new BadRequestException('Loại danh mục không hợp lệ');
  }
}
