import { OnlineExamGradingCore } from './online-exam-grading.core';

describe('OnlineExamGradingCore', () => {
  const core = new OnlineExamGradingCore();

  it('awards score only when the selected option set exactly matches the key', () => {
    const result = core.grade([
      { questionId: 'q1', type: 'SINGLE_CHOICE', score: 2, options: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] },
    ], [{ questionId: 'q1', selectedOptionIds: ['a'] }]);
    expect(result.calculatedScore).toBe(2);
    expect(result.hasEssay).toBe(false);
  });

  it('grades fill-blank answers using the question normalization settings', () => {
    const result = core.grade([
      { questionId: 'q1', type: 'FILL_BLANK', score: 2, fillBlankAnswers: [{ blankIndex: 1, answer: 'Hà Nội', acceptedAnswers: [], score: 2, caseSensitive: false, ignoreWhitespace: true, ignoreVietnameseTone: true }] },
    ], [{ questionId: 'q1', fillBlankAnswers: [{ blankIndex: 1, value: 'ha noi' }] }]);
    expect(result.calculatedScore).toBe(2);
    expect(result.fillBlankUpdates[0].result[0].correct).toBe(true);
  });

  it('applies penalty points and keeps essay score pending', () => {
    const result = core.grade([
      { questionId: 'q1', type: 'ESSAY', score: 5, options: [], fillBlankAnswers: [] },
      { questionId: 'q2', type: 'SINGLE_CHOICE', score: 3, options: [{ id: 'a', isCorrect: true }] },
    ], [{ questionId: 'q2', selectedOptionIds: ['a'] }], 1);
    expect(result.hasEssay).toBe(true);
    expect(result.calculatedScore).toBe(2);
  });
});
