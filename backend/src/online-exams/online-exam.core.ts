export type OnlineExamQuestion = {
  question: any;
  score: number;
};

/** Pure online-exam transformations shared by start and read flows. */
export class OnlineExamCore {
  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  buildSnapshot(paperQuestions: OnlineExamQuestion[], options: { shuffleQuestions: boolean; shuffleOptions: boolean }) {
    const orderedQuestions = options.shuffleQuestions ? this.shuffle(paperQuestions) : [...paperQuestions];
    return orderedQuestions.map((paperQuestion, index) => {
      const question = paperQuestion.question;
      const rawOptions = question.options.map((option: any) => ({
        id: option.id,
        label: option.label,
        content: option.content,
        contentRich: option.contentRich,
        media: option.media,
        isCorrect: option.isCorrect,
      }));
      const answerOptions = options.shuffleOptions ? this.shuffle(rawOptions) : rawOptions;

      return {
        order: index + 1,
        questionId: question.id,
        code: question.code,
        content: question.content,
        contentRich: question.contentRich,
        media: question.media,
        type: question.type,
        difficulty: question.difficulty,
        score: paperQuestion.score,
        options: answerOptions,
        fillBlankAnswers: question.fillBlankAnswers.map((answer: any) => ({
          blankIndex: answer.blankIndex,
          answer: answer.answer,
          acceptedAnswers: answer.acceptedAnswers,
          score: answer.score,
          caseSensitive: answer.caseSensitive,
          ignoreWhitespace: answer.ignoreWhitespace,
          ignoreVietnameseTone: answer.ignoreVietnameseTone,
        })),
      };
    });
  }

  sanitizeQuestions(rawQuestions: any[], mediaFlags: { showImages: boolean; showVideos: boolean; showAudios: boolean }) {
    const filterMedia = (mediaList: any[] | null | undefined): any[] => (mediaList || [])
      .filter((media: any) => {
        const type = (media.mimeType || '').toLowerCase();
        if (type.startsWith('image/')) return mediaFlags.showImages;
        if (type.startsWith('video/')) return mediaFlags.showVideos;
        if (type.startsWith('audio/')) return mediaFlags.showAudios;
        return true;
      })
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return rawQuestions.map((question: any) => ({
      order: question.order,
      questionId: question.questionId,
      code: question.code,
      content: question.content,
      contentRich: question.contentRich,
      media: filterMedia(question.media),
      type: question.type,
      difficulty: question.difficulty,
      score: question.score,
      options: (question.options || []).map((option: any) => ({
        id: option.id,
        label: option.label,
        content: option.content,
        contentRich: option.contentRich,
        media: filterMedia(option.media),
      })),
      blankIndexes: (question.fillBlankAnswers || []).map((answer: any) => answer.blankIndex),
    }));
  }
}
