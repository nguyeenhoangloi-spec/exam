import { normalizeFillBlankAnswer } from '../questions/question-validation';

export class OnlineExamGradingCore {
  grade(snapshotQuestions: any[], attemptAnswers: any[], penaltyPoints = 0) {
    const hasEssay = snapshotQuestions.some((question) =>
      question.type === 'ESSAY' || question.questionType === 'ESSAY' || String(question.type || '').toUpperCase() === 'ESSAY',
    );
    let calculatedScore = 0;
    const fillBlankUpdates: Array<{ questionId: string; score: number; result: any[] }> = [];

    for (const question of snapshotQuestions) {
      const studentAnswer = attemptAnswers.find((answer) => answer.questionId === question.questionId);
      if (!studentAnswer) continue;

      if (question.type === 'FILL_BLANK') {
        const submitted = new Map<number, string>(
          ((studentAnswer.fillBlankAnswers as any[]) || [])
            .map((item) => [Number(item.blankIndex), String(item.value || '')]),
        );
        const result = (question.fillBlankAnswers || []).map((expected: any) => {
          const settings = {
            caseSensitive: expected.caseSensitive,
            ignoreWhitespace: expected.ignoreWhitespace,
            ignoreVietnameseTone: expected.ignoreVietnameseTone,
          };
          const actual = submitted.get(Number(expected.blankIndex)) || '';
          const accepted = [expected.answer, ...((expected.acceptedAnswers as string[]) || [])];
          const correct = accepted.some((value) =>
            normalizeFillBlankAnswer(value, settings) === normalizeFillBlankAnswer(actual, settings),
          );
          return {
            blankIndex: expected.blankIndex,
            value: actual,
            correct,
            score: correct ? Number(expected.score || 0) : 0,
          };
        });
        const score = result.reduce((sum: number, item: any) => sum + item.score, 0);
        calculatedScore += score;
        fillBlankUpdates.push({ questionId: question.questionId, score, result });
        continue;
      }

      if (!studentAnswer.selectedOptionIds) continue;
      const selectedIds: string[] = (studentAnswer.selectedOptionIds as string[]) || [];
      const correctOptionIds: string[] = (question.options || [])
        .filter((option: any) => option.isCorrect)
        .map((option: any) => option.id);
      const isCorrect = selectedIds.length === correctOptionIds.length
        && selectedIds.every((id) => correctOptionIds.includes(id));
      if (isCorrect) calculatedScore += question.score || 0;
    }

    return {
      hasEssay,
      calculatedScore: Math.max(0, calculatedScore - penaltyPoints),
      fillBlankUpdates,
    };
  }
}
