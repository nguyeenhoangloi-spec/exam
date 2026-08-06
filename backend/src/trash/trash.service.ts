import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrashService {
  // Keep this service as a normal class so TypeScript Server can refresh the file cleanly.
  constructor(private readonly prisma: PrismaService) {}

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
        subTitle: `Kỳ thi: ${item.examPeriod?.name || 'Chưa rõ'} · Ngày thi: ${item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : '---'} (${item.startTime}-${item.endTime})`,
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
        subTitle: `Tổng số câu: ${item.questions.length} câu · Thời lượng: ${item.durationMinutes} phút · Điểm tối đa: ${item.totalScore}`,
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
        subTitle: `Nội dung: ${item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content} · Môn: ${item.subject?.subjectName || 'Tự do'}`,
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

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'RESTORE_EXAM_SCHEDULE',
          entityType: 'ExamSchedule',
          entityId: String(id),
          description: `Khôi phục lịch thi môn ${schedule.subject?.subjectName || ''} từ thùng rác`,
        },
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

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'RESTORE_EXAM_PAPER',
          entityType: 'ExamPaper',
          entityId: String(id),
          description: `Khôi phục đề thi mã ${paper.paperCode} từ thùng rác`,
        },
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

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'RESTORE_QUESTION',
          entityType: 'Question',
          entityId: String(id),
          description: `Khôi phục câu hỏi [${question.code}] từ thùng rác`,
        },
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

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'HARD_DELETE_EXAM_SCHEDULE',
          entityType: 'ExamSchedule',
          entityId: String(id),
          description: `Xóa vĩnh viễn lịch thi ${schedule.subject?.subjectName || ''} khỏi hệ thống`,
        },
      });

      return { success: true, message: 'Đã xóa vĩnh viễn lịch thi khỏi Database' };
    }

    if (type === 'papers') {
      const paper = await this.prisma.examPaper.findUnique({
        where: { id: Number(id) },
      });
      if (!paper) throw new NotFoundException('Không tìm thấy đề thi');

      await this.prisma.examPaper.delete({ where: { id: Number(id) } });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'HARD_DELETE_EXAM_PAPER',
          entityType: 'ExamPaper',
          entityId: String(id),
          description: `Xóa vĩnh viễn đề thi ${paper.paperCode} khỏi hệ thống`,
        },
      });

      return { success: true, message: 'Đã xóa vĩnh viễn đề thi khỏi Database' };
    }

    if (type === 'questions') {
      const question = await this.prisma.question.findUnique({
        where: { id: String(id) },
      });
      if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

      await this.prisma.question.delete({ where: { id: String(id) } });

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'HARD_DELETE_QUESTION',
          entityType: 'Question',
          entityId: String(id),
          description: `Xóa vĩnh viễn câu hỏi [${question.code}] khỏi hệ thống`,
        },
      });

      return { success: true, message: 'Đã xóa vĩnh viễn câu hỏi khỏi Database' };
    }

    throw new BadRequestException('Loại danh mục không hợp lệ');
  }
}
