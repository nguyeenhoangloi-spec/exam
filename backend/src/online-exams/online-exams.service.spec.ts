import { ForbiddenException } from '@nestjs/common';
import { OnlineExamsService } from './online-exams.service';

describe('OnlineExamsService review visibility', () => {
  const studentUser = { id: 11, role: 'STUDENT' };

  const createService = (attempt: Record<string, unknown>) => {
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue(attempt),
      },
      proctoringEvent: {
        count: jest.fn().mockResolvedValue(0),
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

  it('does not expose the answer key while a student is taking the exam', async () => {
    const service = createService({
      id: 'attempt-1',
      student: { userId: studentUser.id },
      snapshot: {
        paperTitle: 'Bài kiểm tra',
        duration: 45,
        snapshotData: [{
          order: 1,
          questionId: 'question-1',
          code: 'Q-001',
          content: 'Hai cộng hai bằng mấy?',
          contentRich: null,
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          score: 1,
          options: [
            { id: 'option-a', label: 'A', content: '4', isCorrect: true, media: [] },
            { id: 'option-b', label: 'B', content: '5', isCorrect: false, media: [] },
          ],
          fillBlankAnswers: [],
        }],
      },
      attemptAnswers: [],
      onlineExamConfig: {
        showImages: true,
        showVideos: true,
        showAudios: true,
        requireFullscreen: false,
        preventTabSwitch: false,
        preventCopyPaste: false,
        essayEnabled: false,
        allowEssayFileUpload: false,
        maxEssayFileSizeMb: 5,
      },
      status: 'IN_PROGRESS',
      expectedEndTime: new Date(Date.now() + 15 * 60 * 1000),
    });

    const result = await service.getAttemptQuestions(studentUser.id, 'attempt-1');

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].options).toEqual([
      { id: 'option-a', label: 'A', content: '4', contentRich: undefined, media: [] },
      { id: 'option-b', label: 'B', content: '5', contentRich: undefined, media: [] },
    ]);
    expect(JSON.stringify(result)).not.toContain('isCorrect');
  });
});
