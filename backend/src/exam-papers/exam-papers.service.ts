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

@Injectable()
export class ExamPapersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly actionVerifier: ActionVerifierService,
  ) { }

  private assertOwner(actor: Actor, paper: { createdById: number }) {
    if (actor.role !== 'ADMIN' && paper.createdById !== actor.id && (paper as any).status !== ExamPaperStatus.PUBLISHED) {
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

  private selectQuestionsByScore(pool: any[], targetScore: number, defaultScore: number) {
    if (targetScore <= 0 || pool.length === 0) return [];

    const targetCents = Math.round(targetScore * 100);
    const questions = this.shuffle([...pool]).map((q) => {
      const score = q.score && Number(q.score) > 0 ? Number(q.score) : defaultScore;
      return {
        ...q,
        effectiveScore: score,
        cents: Math.round(score * 100),
      };
    });

    const dp = new Array<number[] | null>(targetCents + 1).fill(null);
    dp[0] = [];

    for (let i = 0; i < questions.length; i++) {
      const cents = questions[i].cents;
      if (cents <= 0) continue;

      for (let w = targetCents; w >= cents; w--) {
        if (dp[w - cents] !== null && dp[w] === null) {
          dp[w] = [...dp[w - cents]!, i];
          if (w === targetCents) break;
        }
      }
      if (dp[targetCents] !== null) break;
    }

    if (dp[targetCents] !== null) {
      return dp[targetCents]!.map((idx) => questions[idx]);
    }

    for (let w = targetCents - 1; w > 0; w--) {
      if (dp[w] !== null) {
        return dp[w]!.map((idx) => questions[idx]);
      }
    }

    const selected: any[] = [];
    let currentCents = 0;
    for (const q of questions) {
      if (currentCents + q.cents <= targetCents) {
        selected.push(q);
        currentCents += q.cents;
      }
      if (currentCents === targetCents) break;
    }
    return selected.length > 0 ? selected : [questions[0]];
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
      if (actor.role === 'TEACHER' && (schedule.examScheduleRooms || []).length === 0) {
        throw new ForbiddenException('Bạn chỉ được tạo đề cho lịch thi mà mình được phân công.');
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
        include: { options: { orderBy: { order: 'asc' } }, essayRubrics: { orderBy: { sortOrder: 'asc' } }, fillBlankAnswers: { orderBy: { blankIndex: 'asc' } } },
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

        const easySel = this.selectQuestionsByScore(byDifficulty.EASY, easyTarget, defaultEasyScore);
        const medSel = this.selectQuestionsByScore(byDifficulty.MEDIUM, medTarget, defaultMedScore);
        const hardSel = this.selectQuestionsByScore(byDifficulty.HARD, hardTarget, defaultHardScore);

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

        rawSelected = this.shuffle([
          ...this.shuffle(byDifficulty.EASY).slice(0, data.easyCount),
          ...this.shuffle(byDifficulty.MEDIUM).slice(0, data.mediumCount),
          ...this.shuffle(byDifficulty.HARD).slice(0, data.hardCount),
        ]);
      }

      let selectedQuestions: any[] = [];
      let totalScore = 10.0;

      const isEssay = targetType === 'TU_LUAN' || schedule.examType === 'TU_LUAN';

      if (isByScore || isEssay) {
        // CHẾ ĐỘ 1: Theo Thang điểm hoặc Tự luận -> Lấy NGUYÊN BẢN 100% điểm gốc từng câu từ Ngân hàng câu hỏi
        selectedQuestions = rawSelected.map((q) => {
          let assignedScore = 1.0;
          if (q.score && Number(q.score) > 0) {
            assignedScore = Number(q.score);
          } else if (isEssay) {
            const weightMap: Record<string, number> = { EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 };
            assignedScore = weightMap[q.difficulty] || 1.5;
          } else {
            assignedScore = 0.25;
          }
          return { ...q, assignedScore };
        });
        totalScore = Math.round(selectedQuestions.reduce((sum, item) => sum + item.assignedScore, 0) * 100) / 100;
      } else {
        // CHẾ ĐỘ 2: Trắc nghiệm Theo Số câu -> Chuẩn hóa phân bổ điểm sao cho Tổng điểm bộ đề LUÔN BẰNG ĐÚNG 10.0 ĐIỂM
        const targetTotalScore = 10.0;
        const numQuestions = rawSelected.length;

        const rawWeights = rawSelected.map((q) => {
          if (q.score && Number(q.score) > 0) return Number(q.score);
          const weightMap: Record<string, number> = { EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 };
          return weightMap[q.difficulty] || 1.5;
        });
        const totalRawWeight = rawWeights.reduce((sum, w) => sum + w, 0) || 1.0;

        let currentSum = 0;
        selectedQuestions = rawSelected.map((q, idx) => {
          let assignedScore = 0.25;
          if (idx === numQuestions - 1) {
            assignedScore = Math.round((targetTotalScore - currentSum) * 100) / 100;
          } else {
            const w = rawWeights[idx];
            const calculated = Math.round(((w / totalRawWeight) * targetTotalScore) * 100) / 100;
            assignedScore = Math.max(0.05, calculated);
            currentSum += assignedScore;
          }
          return { ...q, assignedScore };
        });
        totalScore = targetTotalScore;
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
      ...(actor.role === 'TEACHER' && { OR: [{ createdById: actor.id }, { status: ExamPaperStatus.PUBLISHED }] }),
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

    return papers.map((paper: any) => ({
      ...paper,
      hasExamPassword: Boolean(paper.examSchedule?.onlineExamConfig?.examPasswordHash),
    }));
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
    if (paper.status !== ExamPaperStatus.DRAFT) {
      throw new BadRequestException('Chỉ đề thi ở trạng thái bản nháp mới được phát hành.');
    }

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
    } else if (dto?.examPassword) {
      examPasswordHash = await bcrypt.hash(dto.examPassword.trim(), 10);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examPaper.update({
        where: { id },
        data: { status: ExamPaperStatus.PUBLISHED, publishedAt: new Date(), archivedAt: null },
        include: paperDetailInclude,
      });

      await tx.onlineExamConfig.upsert({
        where: { examScheduleId: paper.examScheduleId },
        update: { examPaperId: id, essayEnabled: hasEssayQuestions, ...(examPasswordHash ? { examPasswordHash } : {}) },
        create: {
          examScheduleId: paper.examScheduleId,
          examPaperId: id,
          requireFullscreen: true,
          preventTabSwitch: true,
          preventCopyPaste: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          essayEnabled: hasEssayQuestions,
          ...(examPasswordHash ? { examPasswordHash } : {}),
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
