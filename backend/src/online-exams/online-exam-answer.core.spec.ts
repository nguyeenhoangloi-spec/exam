import { OnlineExamAnswerCore } from './online-exam-answer.core';

describe('OnlineExamAnswerCore', () => {
  const core = new OnlineExamAnswerCore();

  it('rejects an answer for a question outside the snapshot', () => {
    expect(() => core.validate(undefined, { questionId: 'missing' })).toThrow('QUESTION_NOT_IN_SNAPSHOT');
  });

  it('rejects fill-blank data on a choice question', () => {
    expect(() => core.validate({ type: 'SINGLE_CHOICE' }, { fillBlankAnswers: [{ blankIndex: 1 }] }))
      .toThrow('FILL_BLANK_DATA_NOT_ALLOWED');
  });

  it('rejects unknown and duplicate blank indexes', () => {
    const question = { type: 'FILL_BLANK', fillBlankAnswers: [{ blankIndex: 1 }, { blankIndex: 2 }] };
    expect(() => core.validate(question, { fillBlankAnswers: [{ blankIndex: 3 }] }))
      .toThrow('INVALID_FILL_BLANK_DATA');
    expect(() => core.validate(question, { fillBlankAnswers: [{ blankIndex: 1 }, { blankIndex: 1 }] }))
      .toThrow('INVALID_FILL_BLANK_DATA');
  });
});
