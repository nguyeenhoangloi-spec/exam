import { OnlineExamVisibilityCore } from './online-exam-visibility.core';

describe('OnlineExamVisibilityCore', () => {
  const core = new OnlineExamVisibilityCore();

  it('withholds an official objective score while the exam window is open', () => {
    const visibility = core.evaluate(
      { mode: 'OFFICIAL', status: 'SUBMITTED', gradingStatus: 'NOT_SUBMITTED' },
      { mode: 'OFFICIAL', showResultImmediately: true, allowReview: true },
      false,
    );

    expect(visibility.canShowScore).toBe(false);
    expect(visibility.canReviewAnswers).toBe(false);
  });

  it('allows an objective score after the exam closes but still withholds the answer key', () => {
    const visibility = core.evaluate(
      { mode: 'OFFICIAL', status: 'SUBMITTED', gradingStatus: 'NOT_SUBMITTED' },
      { mode: 'OFFICIAL', allowReview: true },
      true,
    );

    expect(visibility.canShowScore).toBe(true);
    expect(visibility.canReviewAnswers).toBe(false);
  });

  it('allows answer review only after closure and explicit publication', () => {
    const visibility = core.evaluate(
      {
        mode: 'OFFICIAL',
        status: 'GRADED',
        gradingStatus: 'PUBLISHED',
        publishedAt: new Date(),
      },
      { mode: 'OFFICIAL', allowReview: true },
      true,
    );

    expect(visibility.canShowScore).toBe(true);
    expect(visibility.canReviewAnswers).toBe(true);
  });

  it('never releases review when the feature is disabled', () => {
    const visibility = core.evaluate(
      { status: 'GRADED', gradingStatus: 'PUBLISHED', publishedAt: new Date() },
      { allowReview: false },
      true,
    );

    expect(visibility.canReviewAnswers).toBe(false);
  });

  it('calculates the shared schedule end using the configured local time', () => {
    const schedule = { examDate: new Date(2026, 7, 18), endTime: '10:30' };

    expect(core.isScheduleEnded(schedule, new Date(2026, 7, 18, 10, 29, 59))).toBe(false);
    expect(core.isScheduleEnded(schedule, new Date(2026, 7, 18, 10, 30, 0))).toBe(true);
  });
});
