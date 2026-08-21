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

  getRealScore(question: ExamPaperQuestion, isEssay: boolean = false): number {
    if (question.fillBlankAnswers && Array.isArray(question.fillBlankAnswers) && question.fillBlankAnswers.length > 0) {
      const bSum = question.fillBlankAnswers.reduce((sum: number, b: any) => sum + Number(b.score || 0), 0);
      if (bSum > 0) return bSum;
    }
    if (question.score && Number(question.score) > 0) {
      return Number(question.score);
    }
    if (question.essayRubrics && Array.isArray(question.essayRubrics) && question.essayRubrics.length > 0) {
      const rSum = question.essayRubrics.reduce((sum: number, r: any) => sum + Number(r.maxScore || 0), 0);
      if (rSum > 0) return rSum;
    }
    if (isEssay) {
      return ({ EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 } as Record<string, number>)[question.difficulty] || 1.5;
    }
    return 0.25;
  }

  selectByCount(
    pools: { easy: ExamPaperQuestion[]; medium: ExamPaperQuestion[]; hard: ExamPaperQuestion[] },
    counts: { easy: number; medium: number; hard: number },
    options?: { targetScore?: number; isEssay?: boolean },
  ): ExamPaperQuestion[] {
    const targetScore = options?.targetScore ?? 10.0;
    const isEssay = options?.isEssay ?? false;
    const targetCents = Math.round(targetScore * 100);

    const easyPool = this.shuffle(pools.easy || []);
    const medPool = this.shuffle(pools.medium || []);
    const hardPool = this.shuffle(pools.hard || []);

    const easyReq = counts.easy || 0;
    const medReq = counts.medium || 0;
    const hardReq = counts.hard || 0;

    // Fallback if requested count exceeds available pool
    if (easyReq > easyPool.length || medReq > medPool.length || hardReq > hardPool.length) {
      return this.shuffle([
        ...easyPool.slice(0, easyReq),
        ...medPool.slice(0, medReq),
        ...hardPool.slice(0, hardReq),
      ]);
    }

    const easyWithScore = easyPool.map((q) => ({ q, cents: Math.round(this.getRealScore(q, isEssay) * 100) }));
    const medWithScore = medPool.map((q) => ({ q, cents: Math.round(this.getRealScore(q, isEssay) * 100) }));
    const hardWithScore = hardPool.map((q) => ({ q, cents: Math.round(this.getRealScore(q, isEssay) * 100) }));

    let bestSelection: ExamPaperQuestion[] | null = null;
    let minDiff = Infinity;
    let iterations = 0;
    const maxIterations = 5000;

    const findCombinations = (
      pool: { q: ExamPaperQuestion; cents: number }[],
      needed: number,
      startIndex: number,
      current: { q: ExamPaperQuestion; cents: number }[],
      onFound: (chosen: { q: ExamPaperQuestion; cents: number }[]) => boolean,
    ): boolean => {
      if (current.length === needed) {
        return onFound(current);
      }
      for (let i = startIndex; i < pool.length; i++) {
        iterations++;
        if (iterations > maxIterations) return true;
        current.push(pool[i]);
        const stop = findCombinations(pool, needed, i + 1, current, onFound);
        current.pop();
        if (stop) return true;
      }
      return false;
    };

    findCombinations(easyWithScore, easyReq, 0, [], (easyChosen) => {
      const easySum = easyChosen.reduce((s, x) => s + x.cents, 0);

      return findCombinations(medWithScore, medReq, 0, [], (medChosen) => {
        const medSum = medChosen.reduce((s, x) => s + x.cents, 0);

        return findCombinations(hardWithScore, hardReq, 0, [], (hardChosen) => {
          const hardSum = hardChosen.reduce((s, x) => s + x.cents, 0);
          const totalCents = easySum + medSum + hardSum;
          const diff = Math.abs(totalCents - targetCents);

          if (diff < minDiff) {
            minDiff = diff;
            bestSelection = [...easyChosen.map((x) => x.q), ...medChosen.map((x) => x.q), ...hardChosen.map((x) => x.q)];
          }

          return diff === 0;
        });
      });
    });

    if (bestSelection) {
      return this.shuffle(bestSelection);
    }

    return this.shuffle([
      ...easyPool.slice(0, easyReq),
      ...medPool.slice(0, medReq),
      ...hardPool.slice(0, hardReq),
    ]);
  }

  selectByScore(pool: ExamPaperQuestion[], targetScore: number, defaultScore: number): ExamPaperQuestion[] {
    if (targetScore <= 0 || pool.length === 0) return [];

    const targetCents = Math.round(targetScore * 100);
    const questions = this.shuffle([...pool]).map((question) => {
      const score = this.getRealScore(question, false) || defaultScore;
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
    const isFillBlank = options.targetType === 'FILL_BLANK' || options.targetType === 'DIEN_LO';
    const isEssay = options.isEssay || options.targetType === 'TU_LUAN';

    // 1. Chế độ Theo thang điểm (BY_SCORE) HOẶC Đề Tự luận (TU_LUAN) HOẶC Đề Điền khuyết (FILL_BLANK) HOẶC câu hỏi có điểm thiết lập riêng:
    // LẤY TRỰC TIẾP 100% ĐIỂM THẬT TỪ NGÂN HÀNG CÂU HỎI (không bao giờ nhân tỷ lệ làm méo mó thành số điểm ảo 1.43đ, 2.86đ, 1.25đ)
    const hasCustomScores = questions.some(
      (q) => (q.score && Number(q.score) > 0) || (q.essayRubrics && q.essayRubrics.length > 0) || (q.fillBlankAnswers && q.fillBlankAnswers.length > 0),
    );

    if (options.isByScore || isEssay || isFillBlank || hasCustomScores) {
      const scored = questions.map((question) => {
        const actualScore = this.getRealScore(question, isEssay);
        return {
          ...question,
          assignedScore: actualScore,
        };
      });
      return {
        questions: scored,
        totalScore: Math.round(scored.reduce((sum, item) => sum + item.assignedScore, 0) * 100) / 100,
      };
    }

    // 2. Đối với Đề Trắc nghiệm chuẩn (không có điểm riêng từng câu):
    // Chia đều thang điểm 10.0 (ví dụ 40 câu = 0.25đ/câu, 20 câu = 0.5đ/câu)
    const targetTotalScore = 10.0;
    const count = questions.length || 1;
    let currentSum = 0;
    const scored = questions.map((question, index) => {
      let assignedScore: number;
      if (index === questions.length - 1) {
        assignedScore = Math.round((targetTotalScore - currentSum) * 100) / 100;
      } else {
        assignedScore = Math.round((targetTotalScore / count) * 100) / 100;
        currentSum += assignedScore;
      }
      return { ...question, assignedScore };
    });
    return { questions: scored, totalScore: targetTotalScore };
  }
}
