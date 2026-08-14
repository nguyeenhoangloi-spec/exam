import { OnlineExamProctoringCore } from './online-exam-proctoring.core';

describe('OnlineExamProctoringCore', () => {
  const core = new OnlineExamProctoringCore();

  it('uses default risk weights by event type', () => {
    expect(core.calculateRisk([
      { eventType: 'TAB_HIDDEN' },
      { eventType: 'COPY_ATTEMPT' },
      { eventType: 'UNKNOWN' },
    ])).toBe(35);
  });

  it('honors configured weights and review threshold', () => {
    const result = core.shouldFlag(10, core.calculateRisk(
      [{ eventType: 'WINDOW_BLUR' }, { eventType: 'FULLSCREEN_EXIT' }],
      { weightWindowBlur: 7, weightExitFull: 13 },
    ), { reviewThreshold: 30 });
    expect(result).toEqual({ newRiskScore: 30, shouldFlag: true });
  });
});
