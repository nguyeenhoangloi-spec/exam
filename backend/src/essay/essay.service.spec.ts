import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EssayService } from './essay.service';
import { AttemptStatus, EssayAttemptGradingStatus } from '@prisma/client';

describe('EssayService', () => {
  let service: EssayService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      question: { findUnique: jest.fn() },
      essayRubricCriterion: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
      examAttempt: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      attemptAnswer: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      essayGrade: { upsert: jest.fn() },
      essayGradeHistory: { create: jest.fn() },
      essaySubmissionFile: { create: jest.fn() },
      examScheduleRoom: { findFirst: jest.fn() },
      onlineExamConfig: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };
    audit = { write: jest.fn().mockResolvedValue({}) };
    const aiService = { gradeEssay: jest.fn().mockRejectedValue(new Error('AI failed')) } as any;
    service = new EssayService(prisma, audit, aiService);
  });

  describe('saveRubric', () => {
    it('từ chối nếu câu hỏi không phải ESSAY', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', type: 'MULTIPLE_CHOICE', score: 1.0 });
      await expect(
        service.saveRubric({ id: 1, role: 'ADMIN' }, 'q1', {
          criteria: [{ label: 'Ý chính', maxScore: 1.0, sortOrder: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('từ chối nếu tổng điểm Rubric không bằng điểm câu hỏi', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', type: 'ESSAY', score: 2.0 });
      await expect(
        service.saveRubric({ id: 1, role: 'ADMIN' }, 'q1', {
          criteria: [{ label: 'Ý chính', maxScore: 1.0, sortOrder: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('từ chối nếu thứ tự sortOrder bị trùng', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', type: 'ESSAY', score: 2.0 });
      await expect(
        service.saveRubric({ id: 1, role: 'ADMIN' }, 'q1', {
          criteria: [
            { label: 'Ý 1', maxScore: 1.0, sortOrder: 1 },
            { label: 'Ý 2', maxScore: 1.0, sortOrder: 1 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('tạo Rubric thành công khi tổng điểm bằng điểm câu hỏi', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', type: 'ESSAY', score: 2.0 });
      prisma.essayRubricCriterion.create.mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data }));
      const result = await service.saveRubric({ id: 1, role: 'ADMIN' }, 'q1', {
        criteria: [
          { label: 'Ý 1', maxScore: 1.0, sortOrder: 1 },
          { label: 'Ý 2', maxScore: 1.0, sortOrder: 2 },
        ],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('gradeAnswer & submitGrading', () => {
    it('từ chối nếu bỏ sót tiêu chí Rubric', async () => {
      prisma.attemptAnswer.findUnique.mockResolvedValue({
        id: 'ans1',
        attemptId: 'att1',
        questionId: 'q1',
        essayGrades: [],
      });
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att1',
        onlineExamConfig: { examScheduleId: 10 },
        gradingStatus: EssayAttemptGradingStatus.UNDER_GRADING,
      });
      prisma.essayRubricCriterion.findMany.mockResolvedValue([
        { id: 'r1', label: 'T1', maxScore: 1.0 },
        { id: 'r2', label: 'T2', maxScore: 1.0 },
      ]);

      await expect(
        service.gradeAnswer({ id: 1, role: 'ADMIN' }, 'ans1', {
          criteria: [{ criterionId: 'r1', score: 1.0 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('từ chối nếu điểm tiêu chí nhập vượt maxScore hoặc âm', async () => {
      prisma.attemptAnswer.findUnique.mockResolvedValue({
        id: 'ans1',
        attemptId: 'att1',
        questionId: 'q1',
        essayGrades: [],
      });
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att1',
        onlineExamConfig: { examScheduleId: 10 },
        gradingStatus: EssayAttemptGradingStatus.UNDER_GRADING,
      });
      prisma.essayRubricCriterion.findMany.mockResolvedValue([
        { id: 'r1', label: 'T1', maxScore: 1.0 },
      ]);

      await expect(
        service.gradeAnswer({ id: 1, role: 'ADMIN' }, 'ans1', {
          criteria: [{ criterionId: 'r1', score: 1.5 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('từ chối nếu TEACHER chưa được phân công ca thi', async () => {
      prisma.attemptAnswer.findUnique.mockResolvedValue({
        id: 'ans1',
        attemptId: 'att1',
        questionId: 'q1',
        essayGrades: [],
      });
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att1',
        onlineExamConfig: { examScheduleId: 10 },
        gradingStatus: EssayAttemptGradingStatus.PUBLISHED,
      });
      prisma.examScheduleRoom.findFirst.mockResolvedValue(null);

      await expect(
        service.gradeAnswer({ id: 2, role: 'TEACHER' }, 'ans1', {
          criteria: [{ criterionId: 'r1', score: 1.0 }],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('Role-based Actions: approve, return, penalty', () => {
    it('từ chối nếu TEACHER cố gắng duyệt hoặc công bố điểm', async () => {
      await expect(
        service.approve({ id: 2, role: 'TEACHER' }, 'att1', false),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('từ chối nếu TEACHER cố gắng áp dụng điểm phạt', async () => {
      await expect(
        service.penalty({ id: 2, role: 'TEACHER' }, 'att1', { reason: 'Vi phạm', penaltyPoints: 1.0 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ADMIN duyệt điểm và chuyển trạng thái công bố thành công', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att1',
        gradingStatus: EssayAttemptGradingStatus.WAITING_APPROVAL,
      });
      prisma.examAttempt.update.mockResolvedValue({});

      const res = await service.approve({ id: 1, role: 'ADMIN' }, 'att1', true);
      expect(res.gradingStatus).toBe(EssayAttemptGradingStatus.PUBLISHED);
    });

    it('ADMIN trả lại bài thi để chấm lại thành công', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att1',
        onlineExamConfig: { examScheduleId: 10 },
        gradingStatus: EssayAttemptGradingStatus.WAITING_APPROVAL,
      });
      prisma.examAttempt.update.mockResolvedValue({});

      const res = await service.returnGrading({ id: 1, role: 'ADMIN' }, 'att1', { reason: 'Chấm chưa đúng tiêu chí' });
      expect(res.gradingStatus).toBe(EssayAttemptGradingStatus.UNDER_GRADING);
    });
  });
});
