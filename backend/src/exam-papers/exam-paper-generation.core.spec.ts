import { ExamPaperGenerationCore } from './exam-paper-generation.core';

describe('ExamPaperGenerationCore', () => {
  const core = new ExamPaperGenerationCore();
  const question = (id: number, difficulty: string, score?: number) => ({ id, difficulty, score });

  it('selects the requested count from each difficulty pool', () => {
    const selected = core.selectByCount(
      { easy: [question(1, 'EASY'), question(2, 'EASY')], medium: [question(3, 'MEDIUM')], hard: [question(4, 'HARD')] },
      { easy: 1, medium: 1, hard: 1 },
    );
    expect(selected).toHaveLength(3);
    expect(selected.map((item) => item.difficulty).sort()).toEqual(['EASY', 'HARD', 'MEDIUM']);
  });

  it('selects an exact score when the pool can satisfy it', () => {
    const selected = core.selectByScore([question(1, 'EASY', 1), question(2, 'EASY', 2), question(3, 'EASY', 3)], 3, 1);
    expect(selected.reduce((sum, item) => sum + Number(item.score || 1), 0)).toBe(3);
  });

  it('normalizes count-based scores to ten points', () => {
    const result = core.assignScores([question(1, 'EASY'), question(2, 'HARD')], {
      targetType: 'TRAC_NGHIEM',
      isEssay: false,
      isByScore: false,
    });
    expect(result.totalScore).toBe(10);
    expect(result.questions.reduce((sum, item) => sum + item.assignedScore, 0)).toBe(10);
  });
});
