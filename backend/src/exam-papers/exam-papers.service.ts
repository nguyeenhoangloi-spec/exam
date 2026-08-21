import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamPaperStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRandomExamPaperDto, UpdateExamPasswordDto } from './dto/exam-paper.dto';

type Actor = { id: number; role: string };
type DbClient = PrismaService | Prisma.TransactionClient;

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
          contentRich: true,
          type: true,
          difficulty: true,
          explanation: true,
          media: {
            orderBy: { sortOrder: 'asc' as const },
            select: { id: true, url: true, mimeType: true, fileName: true, altText: true, sortOrder: true },
          },
          options: {
            orderBy: { order: 'asc' as const },
            select: { id: true, label: true, content: true, isCorrect: true, order: true },
          },
          fillBlankAnswers: {
            orderBy: { blankIndex: 'asc' as const },
            select: { blankIndex: true, answer: true, acceptedAnswers: true, score: true, caseSensitive: true, ignoreWhitespace: true, ignoreVietnameseTone: true },
          },
        },
      },
    },
    orderBy: { questionOrder: 'asc' as const },
  },
};

import { ActionVerifierService } from '../common/security/action-verifier.service';
import { ConfirmCriticalActionDto } from '../common/dto/critical-action.dto';
import { ExamPaperGenerationCore } from './exam-paper-generation.core';

@Injectable()
export class ExamPapersService {
  private readonly generationCore = new ExamPaperGenerationCore();
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly actionVerifier: ActionVerifierService,
  ) { }

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

  /**
   * A published paper makes the related exam schedule operational. Therefore,
   * room allocation and invigilator assignment must be complete before this
   * transition is allowed. This is intentionally checked server-side.
   */
  private async assertScheduleReadyForPublication(client: DbClient, examScheduleId: number) {
    const schedule = await client.examSchedule.findFirst({
      where: { id: examScheduleId, deletedAt: null },
      select: {
        id: true,
        mode: true,
        examScheduleRooms: {
          select: {
            room: { select: { roomCode: true } },
            supervisors: { select: { id: true } },
          },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi của đề thi.');
    // Thi thử là ca luyện tập online mở tự do: không yêu cầu xếp phòng, SBD
    // hoặc giám thị. Các ràng buộc bên dưới chỉ dành cho lịch thi chính thức.
    if (schedule.mode === 'MOCK') return;
    if (schedule.examScheduleRooms.length === 0) {
      throw new BadRequestException(
        'Không thể phát hành đề thi vì lịch thi chưa được xếp phòng. Hãy xếp phòng và phân công giám thị trước khi công bố.',
      );
    }

    const roomsMissingSupervisors = schedule.examScheduleRooms
      .filter((scheduleRoom) => scheduleRoom.supervisors.length < 2)
      .map((scheduleRoom) => scheduleRoom.room.roomCode);
    if (roomsMissingSupervisors.length > 0) {
      throw new BadRequestException(
        `Không thể phát hành đề thi vì phòng ${roomsMissingSupervisors.join(', ')} chưa đủ 2 giám thị. Hãy hoàn tất phân công trước khi công bố.`,
      );
    }
  }

  async createRandom(actor: Actor, data: CreateRandomExamPaperDto, persist = true) {
    const isByScore = data.selectionMode === 'BY_SCORE';
    const requestedCount = isByScore ? 1 : ((data.easyCount || 0) + (data.mediumCount || 0) + (data.hardCount || 0));
    if (!isByScore && requestedCount < 1) {
      throw new BadRequestException('Đề thi phải có ít nhất một câu hỏi.');
    }
    if (isByScore && ((data.easyScore || 0) + (data.mediumScore || 0) + (data.hardScore || 0)) <= 0) {
      throw new BadRequestException('Tổng thang điểm ma trận phải lớn hơn 0.');
    }

    return this.prisma.$transaction(async (tx) => {
      const findSchedule = tx.examSchedule.findFirst || tx.examSchedule.findUnique;
      const schedule = await findSchedule.call(tx.examSchedule, {
        where: { id: data.examScheduleId, deletedAt: null },
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

      const targetType = data.examType || schedule.examType || 'TRAC_NGHIEM';
      if (schedule.examType !== targetType) {
        await tx.examSchedule.update({
          where: { id: schedule.id },
          data: { examType: targetType },
        });
        schedule.examType = targetType;
      }

      if (!isByScore && targetType !== 'TU_LUAN' && data.durationMinutes === 60 && requestedCount !== 40) throw new BadRequestException(`Đề thi trắc nghiệm 60 phút phải có đúng 40 câu hỏi (hiện tại có ${requestedCount} câu).`);
      if (!isByScore && targetType !== 'TU_LUAN' && data.durationMinutes === 90 && requestedCount !== 60) throw new BadRequestException(`Đề thi trắc nghiệm 90 phút phải có đúng 60 câu hỏi (hiện tại có ${requestedCount} câu).`);
      if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(schedule.status)) {
        throw new BadRequestException('Không thể tạo đề cho lịch thi đã hủy hoặc hoàn thành.');
      }
      if ((schedule.examPapers || []).some((paper) => paper.status === ExamPaperStatus.PUBLISHED)) {
        throw new BadRequestException('Lịch thi đã có đề công bố, không được tạo lại đề tự động.');
      }
      if (actor.role === 'TEACHER' && schedule.mode !== 'MOCK') {
        throw new ForbiddenException('Giảng viên chỉ được tạo đề cho lịch thi thử. Đề thi chính thức do quản trị viên quản lý.');
      }
      const startTimeStr = schedule.startTime || '07:00';
      const endTimeStr = schedule.endTime || '22:00';
      const startParts = startTimeStr.split(':').map(Number);
      const endParts = endTimeStr.split(':').map(Number);
      const startMins = (startParts[0] || 0) * 60 + (startParts[1] || 0);
      const endMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
      const scheduleDuration = endMins - startMins;
      if (!Number.isFinite(scheduleDuration) || scheduleDuration < 1 || data.durationMinutes > scheduleDuration) {
        throw new BadRequestException('Thời lượng đề thi không được vượt quá thời gian của lịch thi.');
      }

      if (persist) {
        // Gỡ giải phóng tất cả các đề đã bị xóa (deletedAt != null) đang vô tình chiếm giữ paperCode trong DB
        const deadPapers = await tx.examPaper.findMany({
          where: {
            examScheduleId: data.examScheduleId,
            deletedAt: { not: null },
          },
        });
        for (const deadPaper of deadPapers) {
          if (!deadPaper.paperCode.includes('_del_')) {
            await tx.examPaper.update({
              where: { id: deadPaper.id },
              data: { paperCode: `${deadPaper.paperCode}_del_${deadPaper.id}` },
            });
          }
        }

        let baseCode = data.paperCode.trim();
        let candidateCode = baseCode;
        let suffix = 1;

        while (await tx.examPaper.findFirst({
          where: {
            examScheduleId: data.examScheduleId,
            paperCode: candidateCode,
            deletedAt: null,
            status: { not: ExamPaperStatus.ARCHIVED },
          },
          select: { id: true },
        })) {
          candidateCode = isNaN(Number(baseCode)) ? `${baseCode}-${suffix}` : String(Number(baseCode) + suffix);
          suffix++;
        }
        data.paperCode = candidateCode;
      }

      const approvedQuestions = await tx.question.findMany({
        where: {
          subjectId: schedule.subjectId,
          status: 'APPROVED',
          isActive: true,
          deletedAt: null,
        },
        include: {
          media: { orderBy: { sortOrder: 'asc' } },
          options: { orderBy: { order: 'asc' } },
          essayRubrics: { orderBy: { sortOrder: 'asc' } },
          fillBlankAnswers: { orderBy: { blankIndex: 'asc' } },
        },
      });

      const isCompatibleType = (question: { type: string }) => {
        if (targetType === 'TU_LUAN') return question.type === 'ESSAY' || question.type === 'TU_LUAN';
        if (targetType === 'DIEN_LO' || targetType === 'FILL_BLANK') return question.type === 'FILL_BLANK';
        if (targetType === 'TRAC_NGHIEM') return question.type !== 'ESSAY' && question.type !== 'FILL_BLANK';
        return true;
      };
      const byDifficulty = {
        EASY: approvedQuestions.filter((question) => question.difficulty === 'EASY' && isCompatibleType(question)),
        MEDIUM: approvedQuestions.filter((question) => question.difficulty === 'MEDIUM' && isCompatibleType(question)),
        HARD: approvedQuestions.filter((question) => question.difficulty === 'HARD' && isCompatibleType(question)),
      };
      const requirements = [
        { label: 'dễ', requested: data.easyCount, available: byDifficulty.EASY.length },
        { label: 'trung bình', requested: data.mediumCount, available: byDifficulty.MEDIUM.length },
        { label: 'khó', requested: data.hardCount, available: byDifficulty.HARD.length },
      ];

      let rawSelected: any[] = [];

      if (isByScore) {
        const easyTarget = Number(data.easyScore) || 0;
        const medTarget = Number(data.mediumScore) || 0;
        const hardTarget = Number(data.hardScore) || 0;

        const defaultEasyScore = targetType === 'TU_LUAN' ? 1.0 : 0.25;
        const defaultMedScore = targetType === 'TU_LUAN' ? 1.5 : 0.25;
        const defaultHardScore = targetType === 'TU_LUAN' ? 2.0 : 0.25;

        const easySel = this.generationCore.selectByScore(byDifficulty.EASY, easyTarget, defaultEasyScore);
        const medSel = this.generationCore.selectByScore(byDifficulty.MEDIUM, medTarget, defaultMedScore);
        const hardSel = this.generationCore.selectByScore(byDifficulty.HARD, hardTarget, defaultHardScore);

        const typeName = targetType === 'TU_LUAN' ? 'Tự luận' : targetType === 'FILL_BLANK' ? 'Điền khuyết' : 'Trắc nghiệm';
        const achievedEasy = Math.round(easySel.reduce((sum, q) => sum + (q.effectiveScore || defaultEasyScore), 0) * 100) / 100;
        const achievedMed = Math.round(medSel.reduce((sum, q) => sum + (q.effectiveScore || defaultMedScore), 0) * 100) / 100;
        const achievedHard = Math.round(hardSel.reduce((sum, q) => sum + (q.effectiveScore || defaultHardScore), 0) * 100) / 100;

        if (easyTarget > 0 && Math.abs(achievedEasy - easyTarget) > 0.01) {
          throw new BadRequestException(`Ngân hàng đề chưa đủ câu hỏi Dễ loại ${typeName} đã duyệt để đạt mục tiêu ${easyTarget}đ (hiện chỉ có ${easySel.length} câu = ${achievedEasy}đ).`);
        }
        if (medTarget > 0 && Math.abs(achievedMed - medTarget) > 0.01) {
          throw new BadRequestException(`Ngân hàng đề chưa đủ câu hỏi Trung bình loại ${typeName} đã duyệt để đạt mục tiêu ${medTarget}đ (hiện chỉ có ${medSel.length} câu = ${achievedMed}đ).`);
        }
        if (hardTarget > 0 && Math.abs(achievedHard - hardTarget) > 0.01) {
          throw new BadRequestException(`Ngân hàng đề chưa đủ câu hỏi Khó loại ${typeName} đã duyệt để đạt mục tiêu ${hardTarget}đ (hiện chỉ có ${hardSel.length} câu = ${achievedHard}đ).`);
        }

        rawSelected = [...easySel, ...medSel, ...hardSel];
        if (rawSelected.length === 0) {
          throw new BadRequestException('Chưa chọn được câu hỏi nào phù hợp với mục tiêu điểm.');
        }
      } else {
        const shortage = requirements.find((item) => item.available < item.requested);
        if (shortage) {
          const typeName = targetType === 'TU_LUAN' ? 'Tự luận' : targetType === 'FILL_BLANK' ? 'Điền khuyết' : 'Trắc nghiệm';
          if (!persist) {
            return {
              preview: true,
              isValid: false,
              message: `Không đủ câu ${shortage.label} loại ${typeName} theo ma trận đã chọn.`,
              errors: [`Yêu cầu ${shortage.requested} câu ${shortage.label}, hiện Ngân hàng đề môn này có: ${byDifficulty.EASY.length} câu Dễ, ${byDifficulty.MEDIUM.length} câu Trung bình, ${byDifficulty.HARD.length} câu Khó loại ${typeName} khả dụng.`],
              warnings: [],
              alternatives: [{ rationale: `Giảm số câu ${shortage.label} xuống ${shortage.available} câu hoặc duyệt thêm câu hỏi ${typeName} trong Ngân hàng đề.` }],
              paper: { paperCode: data.paperCode.trim(), questionCount: requestedCount, totalScore: 10.0 },
            };
          }
          throw new BadRequestException(
            `Không đủ ${shortage.requested} câu hỏi ${shortage.label} loại ${typeName} đã duyệt (hiện chỉ có ${shortage.available} câu khả dụng).`,
          );
        }

        const isEssay = targetType === 'TU_LUAN' || schedule.examType === 'TU_LUAN';

        rawSelected = this.generationCore.selectByCount(
          { easy: byDifficulty.EASY, medium: byDifficulty.MEDIUM, hard: byDifficulty.HARD },
          { easy: data.easyCount, medium: data.mediumCount, hard: data.hardCount },
          { targetScore: 10.0, isEssay },
        );
      }

      let selectedQuestions: any[] = [];
      let totalScore = 10.0;

      const isEssay = targetType === 'TU_LUAN' || schedule.examType === 'TU_LUAN';

      if (isByScore) {
        // CHẾ ĐỘ 1: Theo Thang điểm (BY_SCORE) -> Lấy theo điểm mục tiêu/điểm gốc từng câu
        const scored = this.generationCore.assignScores(rawSelected, { targetType, isEssay, isByScore: true });
        selectedQuestions = scored.questions;
        totalScore = scored.totalScore;
      } else {
        // CHẾ ĐỘ 2: Theo Số câu (BY_COUNT) -> Lấy điểm thực tế từ Ngân hàng đề
        const scored = this.generationCore.assignScores(rawSelected, { targetType, isEssay, isByScore: false });
        selectedQuestions = scored.questions;
        totalScore = scored.totalScore;

        // BẮT BUỘC: Nếu tổng điểm thực tế các câu hỏi được chọn không đạt đúng 10.0 điểm thì PHẢI BÁO LỖI, không tạo đề sai chuẩn
        if (Math.abs(totalScore - 10.0) > 0.01) {
          const typeName = targetType === 'TU_LUAN' ? 'Tự luận' : targetType === 'FILL_BLANK' ? 'Điền khuyết' : 'Trắc nghiệm';
          if (!persist) {
            return {
              preview: true,
              isValid: false,
              message: `Tổng điểm các câu hỏi theo ma trận chỉ đạt ${totalScore}đ, không đủ chuẩn 10.0 điểm.`,
              errors: [
                `Tổ hợp câu hỏi loại ${typeName} theo ma trận (${data.easyCount} Dễ, ${data.mediumCount} Trung bình, ${data.hardCount} Khó) có tổng điểm thực tế là ${totalScore}đ (thiếu ${Math.round((10 - totalScore) * 100) / 100}đ để đủ chuẩn 10.0đ).`,
                `Vui lòng vào Ngân hàng câu hỏi cập nhật/bổ sung điểm các câu hỏi hoặc chọn lại ma trận số câu để đạt đúng 10.0 điểm.`,
              ],
              warnings: [],
              alternatives: [{ rationale: 'Vào Ngân hàng câu hỏi cập nhật điểm các câu hỏi để đạt tổng 10.0 điểm.' }],
              paper: { paperCode: data.paperCode.trim(), questionCount: selectedQuestions.length, totalScore },
            };
          }
          throw new BadRequestException(
            `Không thể tạo đề thi: Tổng điểm thực tế của các câu hỏi theo ma trận (${data.easyCount} Dễ, ${data.mediumCount} Trung bình, ${data.hardCount} Khó) là ${totalScore}đ, không đạt đúng chuẩn 10.0 điểm khảo thí. Vui lòng vào Ngân hàng câu hỏi cập nhật điểm câu hỏi để đạt đúng 10.0 điểm.`,
          );
        }
      }
      const paperCode = data.paperCode.trim();
      const title = data.title?.trim() || `Đề thi môn ${schedule.subject.subjectName} - Mã đề ${paperCode}`;

      if (!persist) {
        return {
          preview: true,
          message: 'Đã tạo phương án đề thi. Chưa ghi dữ liệu.',
          schedule: { id: schedule.id, subjectName: schedule.subject.subjectName, examDate: schedule.examDate, startTime: schedule.startTime, endTime: schedule.endTime },
          paper: { paperCode, title, durationMinutes: data.durationMinutes, totalScore, questionCount: selectedQuestions.length },
          questions: selectedQuestions.map((question, index) => ({ id: question.id, code: question.code, content: question.content, difficulty: question.difficulty, score: question.assignedScore, order: index + 1 })),
          rationale: 'Chọn ngẫu nhiên câu đã duyệt theo đúng ma trận độ khó đã nhập.',
          warnings: [],
          alternatives: [{ rationale: 'Có thể chạy lại xem trước để tạo một bộ câu ngẫu nhiên khác cùng ma trận.' }],
        };
      }

      const count = Math.min(Math.max(data.variantCount || 1, 1), 10);
      const createdPapers: any[] = [];

      for (let v = 1; v <= count; v++) {
        const baseVCode = count > 1 ? `${paperCode}-${100 + v}` : paperCode;
        let finalVCode = baseVCode;
        let vSuffix = 1;
        while (await tx.examPaper.findFirst({
          where: { examScheduleId: data.examScheduleId, paperCode: finalVCode },
          select: { id: true },
        })) {
          finalVCode = `${baseVCode}_${vSuffix}`;
          vSuffix++;
        }

        const vTitle = count > 1 ? `${title} (Mã đề ${100 + v})` : title;
        const shuffledQuestions = count > 1 ? [...selectedQuestions].sort(() => Math.random() - 0.5) : selectedQuestions;

        const examPaper = await tx.examPaper.create({
          data: {
            examScheduleId: data.examScheduleId,
            paperCode: finalVCode,
            title: vTitle,
            durationMinutes: data.durationMinutes,
            totalScore,
            status: ExamPaperStatus.DRAFT,
            createdById: actor.id,
            questions: {
              create: shuffledQuestions.map((question, index) => ({
                questionId: question.id,
                questionOrder: index + 1,
                score: question.assignedScore,
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

        createdPapers.push(examPaper);
      }

      return count === 1 ? createdPapers[0] : createdPapers;
    });
  }

  async previewRandom(actor: Actor, data: CreateRandomExamPaperDto) {
    return this.createRandom(actor, data, false);
  }

  async findAll(actor: Actor, examScheduleId?: number) {
    const where: Prisma.ExamPaperWhereInput = {
      deletedAt: null,
      examSchedule: { deletedAt: null },
      ...(examScheduleId && { examScheduleId }),
      ...(actor.role === 'TEACHER' && { createdById: actor.id }),
    };
    const papers = await this.prisma.examPaper.findMany({
      where,
      include: {
        examSchedule: {
          include: {
            subject: true,
            examPeriod: true,
            onlineExamConfig: {
              select: {
                id: true,
                examPasswordHash: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, username: true, role: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return papers.map((paper: any) => {
      const config = paper.examSchedule?.onlineExamConfig;
      const { examPasswordHash: _secretHash, ...safeConfig } = config || {};
      return {
        ...paper,
        examSchedule: {
          ...paper.examSchedule,
          onlineExamConfig: config ? safeConfig : null,
        },
        hasExamPassword: Boolean(config?.examPasswordHash),
      };
    });
  }

  async findOne(actor: Actor, id: number) {
    const paper = await this.current(id);
    this.assertOwner(actor, paper);
    return paper;
  }

  async publish(actor: Actor, id: number, dto?: ConfirmCriticalActionDto) {
    if (dto) {
      await this.actionVerifier.verify(actor.id, dto, 'PHAT HANH DE THI');
    }
    const paper = await this.current(id);
    this.assertOwner(actor, paper);
    if (actor.role === 'TEACHER' && paper.examSchedule?.mode !== 'MOCK') {
      throw new ForbiddenException('Giảng viên chỉ được phát hành đề thuộc lịch thi thử. Đề thi chính thức do quản trị viên phát hành.');
    }
    if (paper.status !== ExamPaperStatus.DRAFT) {
      throw new BadRequestException('Chỉ đề thi ở trạng thái bản nháp mới được phát hành.');
    }
    await this.assertScheduleReadyForPublication(this.prisma, paper.examScheduleId);

    // Mật khẩu thi: bắt buộc với kỳ thi chính thức (OFFICIAL), hash bcrypt trước khi lưu
    const isOfficial = paper.examSchedule?.mode === 'OFFICIAL';
    const hasEssayQuestions = paper.questions.some((item: any) => item.question?.type === 'ESSAY');

    // Kiểm tra & Tự động đồng bộ / khởi tạo Rubric cho câu hỏi tự luận khi phát hành đề
    for (const item of paper.questions) {
      const q = item.question;
      if (!q || q.type !== 'ESSAY') continue;

      const expectedScore = Number(item.score) > 0 ? Number(item.score) : Number((q as any).score) || 10;
      let rubrics = await this.prisma.essayRubricCriterion.findMany({
        where: { questionId: q.id },
      });

      // Nếu chưa có Rubric trong Ngân hàng câu hỏi -> Tự động sinh 1 Rubric chuẩn 100% khớp điểm câu hỏi trong đề
      if (!rubrics || rubrics.length === 0) {
        const defaultRubric = await this.prisma.essayRubricCriterion.create({
          data: {
            questionId: q.id,
            label: 'Nội dung câu trả lời tự luận hoàn chỉnh',
            description: 'Đánh giá độ chính xác, đầy đủ và lập luận logic của câu trả lời',
            maxScore: expectedScore,
            sortOrder: 1,
          },
        });
        rubrics = [defaultRubric];
      } else if (rubrics.length === 1) {
        // Nếu chỉ có 1 tiêu chí Rubric nhưng maxScore chưa trùng điểm phân bổ trong đề -> Tự động cập nhật maxScore
        if (Math.abs(rubrics[0].maxScore - expectedScore) > 0.001) {
          await this.prisma.essayRubricCriterion.update({
            where: { id: rubrics[0].id },
            data: { maxScore: expectedScore },
          });
        }
      } else {
        // Nếu có nhiều tiêu chí Rubric, tự động cân bằng tiêu chí cuối để tổng điểm khớp 100% với đề thi
        const totalRubricScore = rubrics.reduce((sum, r) => sum + Number(r.maxScore), 0);
        if (Math.abs(totalRubricScore - expectedScore) > 0.001) {
          const diff = expectedScore - totalRubricScore;
          const lastCriterion = rubrics[rubrics.length - 1];
          const newMaxScore = Math.max(0.1, Number((lastCriterion.maxScore + diff).toFixed(2)));
          await this.prisma.essayRubricCriterion.update({
            where: { id: lastCriterion.id },
            data: { maxScore: newMaxScore },
          });
        }
      }
    }
    for (const q of paper.questions.map((item: any) => item.question).filter((question: any) => question?.type === 'FILL_BLANK')) {
      const blanks = q.fillBlankAnswers || [];
      const total = blanks.reduce((sum: number, blank: any) => sum + Number(blank.score || 0), 0);
      if (!blanks.length || Math.abs(total - Number((paper.questions.find((item: any) => item.questionId === q.id)?.score) || 0)) > 0.001) {
        throw new BadRequestException(`Câu điền khuyết "${q.code}" thiếu đáp án hoặc tổng điểm chỗ trống không khớp điểm trong đề.`);
      }
    }
    let examPasswordHash: string | null = null;
    if (isOfficial) {
      if (!dto?.examPassword || dto.examPassword.trim().length < 4) {
        throw new BadRequestException(
          'Kỳ thi chính thức bắt buộc phải thiết lập mật khẩu thi (tối thiểu 4 ký tự).',
        );
      }
      examPasswordHash = await bcrypt.hash(dto.examPassword.trim(), 10);
    }

    return this.prisma.$transaction(async (tx) => {
      // Re-check inside the write transaction so an arrangement cannot be
      // removed between the pre-check above and the publication update.
      await this.assertScheduleReadyForPublication(tx, paper.examScheduleId);

      const updated = await tx.examPaper.update({
        where: { id },
        data: { status: ExamPaperStatus.PUBLISHED, publishedAt: new Date(), archivedAt: null },
        include: paperDetailInclude,
      });

      await tx.onlineExamConfig.upsert({
        where: { examScheduleId: paper.examScheduleId },
        update: {
          examPaperId: id,
          essayEnabled: hasEssayQuestions,
          // Thi thử không giữ mật khẩu từ cấu hình cũ; đổi sang OFFICIAL
          // sau này sẽ buộc thiết lập mật khẩu mới tại lúc phát hành.
          examPasswordHash,
        },
        create: {
          examScheduleId: paper.examScheduleId,
          examPaperId: id,
          requireFullscreen: true,
          preventTabSwitch: true,
          preventCopyPaste: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          essayEnabled: hasEssayQuestions,
          examPasswordHash,
        },
      });

      await this.audit.write({
        actorId: actor.id,
        action: 'PUBLISH',
        entityType: 'EXAM_PAPER',
        entityId: id,
        description: `Đã phát hành đề thi ${paper.paperCode} và kích hoạt ca thi trực tuyến. Lý do: ${dto?.reason || 'Phát hành chính thức'}${dto?.note ? ` (${dto.note})` : ''}`,
        metadata: { paperCode: paper.paperCode, examScheduleId: paper.examScheduleId, reason: dto?.reason, note: dto?.note },
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
      await tx.onlineExamConfig.deleteMany({
        where: { examPaperId: id },
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

  async updatePassword(actor: Actor, id: number, dto: UpdateExamPasswordDto) {
    const paper = await this.current(id);
    this.assertOwner(actor, paper);

    if (!paper.examScheduleId) {
      throw new BadRequestException('Đề thi chưa được gán vào lịch thi.');
    }

    if (!dto.newPassword || dto.newPassword.trim().length < 4) {
      throw new BadRequestException('Mật khẩu ca thi mới phải có tối thiểu 4 ký tự.');
    }

    const examPasswordHash = await bcrypt.hash(dto.newPassword.trim(), 10);
    const hasEssayQuestions = paper.questions.some((item: any) => item.question?.type === 'ESSAY');

    return this.prisma.$transaction(async (tx) => {
      await tx.onlineExamConfig.upsert({
        where: { examScheduleId: paper.examScheduleId },
        update: {
          examPaperId: id,
          examPasswordHash,
        },
        create: {
          examScheduleId: paper.examScheduleId,
          examPaperId: id,
          requireFullscreen: true,
          preventTabSwitch: true,
          preventCopyPaste: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          essayEnabled: hasEssayQuestions,
          examPasswordHash,
        },
      });

      await this.audit.write({
        actorId: actor.id,
        action: 'UPDATE_EXAM_PASSWORD',
        entityType: 'EXAM_PAPER',
        entityId: id,
        description: `Đã đổi mật khẩu ca thi cho đề thi ${paper.paperCode}.${dto.reason ? ` Lý do: ${dto.reason}` : ''}`,
        metadata: { paperCode: paper.paperCode, examScheduleId: paper.examScheduleId, reason: dto.reason },
      }, tx);

      return {
        message: 'Đổi mật khẩu ca thi thành công.',
        paperId: id,
        hasExamPassword: true,
      };
    });
  }
}
