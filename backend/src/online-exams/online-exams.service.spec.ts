import { ForbiddenException } from '@nestjs/common';
import { OnlineExamsService } from './online-exams.service';

describe('OnlineExamsService review visibility', () => {
  const studentUser = { id: 11, role: 'STUDENT' };

  const createService = (attempt: Record<string, unknown>) => {
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue(attempt),
      },
    };

    return new OnlineExamsService(prisma as any, {} as any, {} as any, {} as any);
  };

  it('blocks a student from review data when answer review is disabled', async () => {
    const service = createService({
      id: 'attempt-1',
      student: { userId: studentUser.id },
      snapshot: { snapshotData: [] },
      attemptAnswers: [],
      incidents: [],
      proctoringEvents: [],
      submittedAt: new Date(),
      status: 'GRADED',
      gradingStatus: 'NOT_SUBMITTED',
      publishedAt: null,
      onlineExamConfig: {
        allowReview: false,
        showResultImmediately: true,
        examSchedule: { subject: { subjectName: 'Toán' } },
        examPaper: { paperCode: 'A1', durationMinutes: 60 },
      },
    });

    await expect(service.getAttemptReviewDetails(studentUser, 'attempt-1'))
      .rejects
      .toBeInstanceOf(ForbiddenException);
  });

  it('keeps review access for an administrator even when student review is disabled', async () => {
    const service = createService({
      id: 'attempt-1',
      student: { userId: studentUser.id, studentCode: 'SV001', fullName: 'Nguyễn Văn A', className: 'CTK42' },
      snapshot: { snapshotData: [] },
      attemptAnswers: [],
      incidents: [],
      proctoringEvents: [],
      submittedAt: new Date(),
      status: 'GRADED',
      gradingStatus: 'NOT_SUBMITTED',
      totalScore: 8,
      maxScore: 10,
      riskScore: 0,
      isFlagged: false,
      onlineExamConfig: {
        allowReview: false,
        showResultImmediately: false,
        examSchedule: { subject: { subjectName: 'Toán' } },
        examPaper: { paperCode: 'A1', durationMinutes: 60 },
      },
    });

    await expect(service.getAttemptReviewDetails({ id: 1, role: 'ADMIN' }, 'attempt-1'))
      .resolves
      .toMatchObject({ attemptId: 'attempt-1', questions: [] });
  });
});
