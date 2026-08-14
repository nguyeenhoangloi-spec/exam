export class OnlineExamAnswerCore {
  validate(snapshotQuestion: any | undefined, answer: any) {
    if (!snapshotQuestion) throw new Error('QUESTION_NOT_IN_SNAPSHOT');
    if (snapshotQuestion.type !== 'FILL_BLANK' && answer.fillBlankAnswers?.length) {
      throw new Error('FILL_BLANK_DATA_NOT_ALLOWED');
    }
    if (snapshotQuestion.type !== 'FILL_BLANK') return;

    const expected = (snapshotQuestion.fillBlankAnswers || [])
      .map((item: any) => Number(item.blankIndex))
      .sort((a: number, b: number) => a - b);
    const received = answer.fillBlankAnswers || [];
    const hasUnknownIndex = received.some((item: any) => !expected.includes(Number(item.blankIndex)));
    const hasDuplicateIndex = new Set(received.map((item: any) => item.blankIndex)).size !== received.length;
    if (hasUnknownIndex || hasDuplicateIndex) throw new Error('INVALID_FILL_BLANK_DATA');
  }
}
