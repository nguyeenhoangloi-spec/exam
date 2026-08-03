import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamPapersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async createRandom(
    actor: { id: number },
    data: {
      examScheduleId: number;
      paperCode: string;
      title?: string;
      durationMinutes: number;
      easyCount: number;
      mediumCount: number;
      hardCount: number;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lấy thông tin lịch thi & môn học
      const schedule = await tx.examSchedule.findUnique({
        where: { id: data.examScheduleId },
        include: { subject: true },
      });

      if (!schedule) {
        throw new NotFoundException('Không tìm thấy lịch thi.');
      }

      const subjectId = schedule.subjectId;

      // 2. Lấy danh sách câu hỏi ĐÃ ĐƯỢC DUYỆT (APPROVED) theo subjectId
      const approvedQuestions = await tx.question.findMany({
        where: {
          subjectId,
          status: 'APPROVED',
        },
        include: { options: true },
      });

      const easyQuestions = approvedQuestions.filter((q) => q.difficulty === 'EASY');
      const mediumQuestions = approvedQuestions.filter((q) => q.difficulty === 'MEDIUM');
      const hardQuestions = approvedQuestions.filter((q) => q.difficulty === 'HARD');

      // 3. Kiểm tra số lượng câu hỏi có đủ đáp ứng yêu cầu không
      if (easyQuestions.length < data.easyCount) {
        throw new BadRequestException(
          `Ngân hàng câu hỏi không đủ câu dễ (EASY). Yêu cầu: ${data.easyCount}, hiện có: ${easyQuestions.length} câu đã duyệt.`,
        );
      }
      if (mediumQuestions.length < data.mediumCount) {
        throw new BadRequestException(
          `Ngân hàng câu hỏi không đủ câu trung bình (MEDIUM). Yêu cầu: ${data.mediumCount}, hiện có: ${mediumQuestions.length} câu đã duyệt.`,
        );
      }
      if (hardQuestions.length < data.hardCount) {
        throw new BadRequestException(
          `Ngân hàng câu hỏi không đủ câu khó (HARD). Yêu cầu: ${data.hardCount}, hiện có: ${hardQuestions.length} câu đã duyệt.`,
        );
      }

      // 4. Trộn ngẫu nhiên (Fisher-Yates Shuffle) và lấy đủ số lượng
      const shuffleArray = (array: any[]) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      const selectedEasy = shuffleArray(easyQuestions).slice(0, data.easyCount);
      const selectedMedium = shuffleArray(mediumQuestions).slice(0, data.mediumCount);
      const selectedHard = shuffleArray(hardQuestions).slice(0, data.hardCount);

      const selectedQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];
      const shuffledFinalQuestions = shuffleArray(selectedQuestions);

      const totalScore = shuffledFinalQuestions.reduce((acc, q) => acc + (q.score || 0.25), 0);
      const title = data.title || `Đề thi môn ${schedule.subject.subjectName} - Mã đề ${data.paperCode}`;

      // 5. Lưu vào Database
      const examPaper = await tx.examPaper.create({
        data: {
          examScheduleId: data.examScheduleId,
          paperCode: data.paperCode,
          title,
          durationMinutes: data.durationMinutes || 60,
          totalScore,
          createdById: actor.id,
          questions: {
            create: shuffledFinalQuestions.map((q, index) => ({
              questionId: q.id,
              questionOrder: index + 1,
              score: q.score || 0.25,
            })),
          },
        },
        include: {
          examSchedule: { include: { subject: true } },
          questions: {
            include: {
              question: { include: { options: true } },
            },
            orderBy: { questionOrder: 'asc' },
          },
        },
      });

      await this.audit.write({
        actorId: actor.id,
        action: 'CREATE',
        entityType: 'EXAM_PAPER',
        entityId: examPaper.id,
        description: `Đã tạo đề thi ${examPaper.paperCode}`,
        metadata: { paperCode: examPaper.paperCode, examScheduleId: data.examScheduleId },
      }, tx);
      return examPaper;
    });
  }

  async findAll(examScheduleId?: number) {
    const where: any = {};
    if (examScheduleId) where.examScheduleId = examScheduleId;

    return this.prisma.examPaper.findMany({
      where,
      include: {
        examSchedule: { include: { subject: true } },
        createdBy: { select: { id: true, username: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const paper = await this.prisma.examPaper.findUnique({
      where: { id },
      include: {
        examSchedule: { include: { subject: true, examPeriod: true } },
        createdBy: { select: { id: true, username: true } },
        questions: {
          include: {
            question: { include: { options: true } },
          },
          orderBy: { questionOrder: 'asc' },
        },
      },
    });
    if (!paper) throw new NotFoundException('Không tìm thấy đề thi.');
    return paper;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.examPaper.delete({ where: { id } });
  }
}
