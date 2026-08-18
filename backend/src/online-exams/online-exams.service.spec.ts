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

  it('does not expose server-side fill-blank grading metadata while taking the exam', async () => {
    const service = createService({
      id: 'attempt-1',
      student: { userId: studentUser.id },
      snapshot: { snapshotData: [] },
      attemptAnswers: [{
        questionId: 'question-1',
        fillBlankAnswers: [{ blankIndex: 1, value: 'test' }],
        fillBlankScore: 1,
        selectedOptionIds: null,
        textAnswer: null,
        isFlaggedForReview: false,
        version: 1,
        textAnswerRich: null,
        serverTimestamp: new Date(),
        submissionFiles: [],
      }],
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
    expect(result.savedAnswers[0]).not.toHaveProperty('fillBlankScore');
  });

  it('blocks re-downloading question content after submission', async () => {
    const service = createService({
      id: 'attempt-1',
      student: { userId: studentUser.id },
      snapshot: { snapshotData: [] },
      attemptAnswers: [],
      onlineExamConfig: {},
      status: 'SUBMITTED',
    });

    await expect(service.getAttemptQuestions(studentUser.id, 'attempt-1'))
      .rejects
      .toBeInstanceOf(ForbiddenException);
  });

  it('does not return an official score from a repeated submit while the exam is open', async () => {
    const service = createService({
      id: 'attempt-1',
      student: { userId: studentUser.id },
      status: 'SUBMITTED',
      mode: 'OFFICIAL',
      gradingStatus: 'NOT_SUBMITTED',
      totalScore: 8,
      maxScore: 10,
      onlineExamConfig: {
        mode: 'OFFICIAL',
        showResultImmediately: true,
        examSchedule: {
          examDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: '23:59',
        },
      },
    });

    await expect(service.submitAttempt(studentUser.id, 'attempt-1')).resolves.toMatchObject({
      totalScore: null,
      showResultImmediately: false,
    });
  });
});

describe('OnlineExamsService report permissions', () => {
  it('từ chối giảng viên xem báo cáo lịch không được phân công', async () => {
    const prisma: any = {
      examScheduleRoom: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new OnlineExamsService(prisma, {} as any, {} as any, {} as any);

    await expect(service.getGradeReport({ id: 501, role: 'TEACHER' }, 99))
      .rejects
      .toBeInstanceOf(ForbiddenException);
  });

  it('cho phép Admin xem báo cáo mà không cần assignment', async () => {
    const prisma: any = {
      examSchedule: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new OnlineExamsService(prisma, {} as any, {} as any, {} as any);

    await expect(service.getGradeReport({ id: 1, role: 'ADMIN' }, 99))
      .rejects
      .toThrow('Không tìm thấy lịch thi');
  });

  it('từ chối TEACHER xem bài làm của lịch không được phân công', async () => {
    const prisma: any = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          student: { userId: 11 },
          onlineExamConfig: { examScheduleId: 99 },
        }),
      },
      examScheduleRoom: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new OnlineExamsService(prisma, {} as any, {} as any, {} as any);

    await expect(service.getAttemptReviewDetails({ id: 501, role: 'TEACHER' }, 'attempt-1'))
      .rejects
      .toBeInstanceOf(ForbiddenException);
  });
});
