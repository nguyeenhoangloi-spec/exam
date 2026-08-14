import { OnlineExamCore } from './online-exam.core';

describe('OnlineExamCore', () => {
  const core = new OnlineExamCore();

  it('builds a server snapshot while retaining the answer key internally', () => {
    const snapshot = core.buildSnapshot([{ score: 1, question: {
      id: 'q1', code: 'Q1', content: '2+2?', contentRich: null, media: [], type: 'SINGLE_CHOICE', difficulty: 'EASY',
      options: [{ id: 'a', label: 'A', content: '4', isCorrect: true, media: [] }], fillBlankAnswers: [],
    } }], { shuffleQuestions: false, shuffleOptions: false });
    expect(snapshot[0].options[0].isCorrect).toBe(true);
    expect(snapshot[0].questionId).toBe('q1');
  });

  it('sanitizes answer keys and filters disabled media for the client', () => {
    const result = core.sanitizeQuestions([{
      order: 1, questionId: 'q1', code: 'Q1', content: 'Question', contentRich: null,
      type: 'SINGLE_CHOICE', difficulty: 'EASY', score: 1,
      media: [{ id: 'img', mimeType: 'image/png' }],
      options: [{ id: 'a', label: 'A', content: 'Answer', isCorrect: true, media: [] }],
      fillBlankAnswers: [],
    }], { showImages: false, showVideos: true, showAudios: true });
    expect(JSON.stringify(result)).not.toContain('isCorrect');
    expect(result[0].media).toEqual([]);
  });
});
