export type ExamPaperQuestion = {
  difficulty: string;
  score?: number | string | null;
  [key: string]: any;
};

export type ScoredExamPaperQuestion = ExamPaperQuestion & {
  assignedScore: number;
};

/**
 * Pure exam-paper generation rules. This class deliberately has no database,
 * framework, or HTTP dependency so the selection and scoring rules can be
 * tested independently from persistence and permissions.
 */
export class ExamPaperGenerationCore {
  shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  selectByCount(
    pools: { easy: ExamPaperQuestion[]; medium: ExamPaperQuestion[]; hard: ExamPaperQuestion[] },
    counts: { easy: number; medium: number; hard: number },
  ): ExamPaperQuestion[] {
    return this.shuffle([
      ...this.shuffle(pools.easy).slice(0, counts.easy),
      ...this.shuffle(pools.medium).slice(0, counts.medium),
      ...this.shuffle(pools.hard).slice(0, counts.hard),
    ]);
  }

  selectByScore(pool: ExamPaperQuestion[], targetScore: number, defaultScore: number): ExamPaperQuestion[] {
    if (targetScore <= 0 || pool.length === 0) return [];

    const targetCents = Math.round(targetScore * 100);
    const questions = this.shuffle([...pool]).map((question) => {
      const score = question.score && Number(question.score) > 0 ? Number(question.score) : defaultScore;
      return { ...question, effectiveScore: score, cents: Math.round(score * 100) };
    });

    const dp = new Array<number[] | null>(targetCents + 1).fill(null);
    dp[0] = [];

    for (let index = 0; index < questions.length; index += 1) {
      const cents = questions[index].cents;
      if (cents <= 0) continue;
      for (let weight = targetCents; weight >= cents; weight -= 1) {
        if (dp[weight - cents] !== null && dp[weight] === null) {
          dp[weight] = [...dp[weight - cents]!, index];
          if (weight === targetCents) break;
        }
      }
      if (dp[targetCents] !== null) break;
    }

    if (dp[targetCents] !== null) return dp[targetCents]!.map((index) => questions[index]);

    for (let weight = targetCents - 1; weight > 0; weight -= 1) {
      if (dp[weight] !== null) return dp[weight]!.map((index) => questions[index]);
    }

    const selected: ExamPaperQuestion[] = [];
    let currentCents = 0;
    for (const question of questions) {
      if (currentCents + question.cents <= targetCents) {
        selected.push(question);
        currentCents += question.cents;
      }
      if (currentCents === targetCents) break;
    }
    return selected.length > 0 ? selected : [questions[0]];
  }

  assignScores(
    questions: ExamPaperQuestion[],
    options: { targetType: string; isEssay: boolean; isByScore: boolean },
  ): { questions: ScoredExamPaperQuestion[]; totalScore: number } {
    if (options.isByScore) {
      const scored = questions.map((question) => ({
        ...question,
        assignedScore: question.score && Number(question.score) > 0
          ? Number(question.score)
          : options.isEssay
            ? ({ EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 } as Record<string, number>)[question.difficulty] || 1.5
            : 0.25,
      }));
      return {
        questions: scored,
        totalScore: Math.round(scored.reduce((sum, item) => sum + item.assignedScore, 0) * 100) / 100,
      };
    }

    const targetTotalScore = 10.0;
    const rawWeights = questions.map((question) => question.score && Number(question.score) > 0
      ? Number(question.score)
      : ({ EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 } as Record<string, number>)[question.difficulty] || 1.5);
    const totalRawWeight = rawWeights.reduce((sum, weight) => sum + weight, 0) || 1.0;
    let currentSum = 0;
    const scored = questions.map((question, index) => {
      let assignedScore: number;
      if (index === questions.length - 1) {
        assignedScore = Math.round((targetTotalScore - currentSum) * 100) / 100;
      } else {
        if (options.isEssay) {
          // Với Tự luận, làm tròn theo bước điểm 0.25đ đẹp
          assignedScore = Math.max(0.25, Math.round(((rawWeights[index] / totalRawWeight) * targetTotalScore) * 4) / 4);
        } else {
          assignedScore = Math.max(0.05, Math.round(((rawWeights[index] / totalRawWeight) * targetTotalScore) * 100) / 100);
        }
        currentSum += assignedScore;
      }
      return { ...question, assignedScore };
    });
    return { questions: scored, totalScore: targetTotalScore };
  }
}
