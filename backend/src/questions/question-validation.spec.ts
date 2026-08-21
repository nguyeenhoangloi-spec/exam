import { BadRequestException } from '@nestjs/common';
import { autoFormatFillBlankData, normalizeQuestionContent, validateFillBlankAnswers, validateQuestionOptions } from './question-validation';

const options = [
  { label: 'A', content: 'Đúng', isCorrect: true, order: 0 },
  { label: 'B', content: 'Sai', isCorrect: false, order: 1 },
];

describe('Question validation', () => {
  it('chuẩn hóa tiếng Việt để kiểm tra trùng', () => {
    expect(normalizeQuestionContent('  Tính Đóng-gói! ')).toBe('tinh dong goi');
  });
  it('chấp nhận SINGLE_CHOICE có đúng một đáp án', () => {
    expect(() => validateQuestionOptions('SINGLE_CHOICE', options)).not.toThrow();
  });
  it('từ chối SINGLE_CHOICE có nhiều đáp án đúng', () => {
    expect(() => validateQuestionOptions('SINGLE_CHOICE', options.map(x => ({ ...x, isCorrect: true })))).toThrow(BadRequestException);
  });
  it('từ chối MULTIPLE_CHOICE không có đáp án đúng', () => {
    expect(() => validateQuestionOptions('MULTIPLE_CHOICE', options.map(x => ({ ...x, isCorrect: false })))).toThrow(BadRequestException);
  });
  it('yêu cầu TRUE_FALSE có đúng hai lựa chọn', () => {
    expect(() => validateQuestionOptions('TRUE_FALSE', options.slice(0, 1))).toThrow(BadRequestException);
  });
  it('không cho ESSAY chứa lựa chọn', () => {
    expect(() => validateQuestionOptions('ESSAY', options)).toThrow(BadRequestException);
    expect(() => validateQuestionOptions('ESSAY', [])).not.toThrow();
  });
  it('chuẩn hóa mọi ô điền về 0,25 điểm và tự tính tổng điểm câu', () => {
    const formatted = autoFormatFillBlankData('FILL_BLANK', 'A {{blank_1}} B {{blank_2}}', 99, [
      { blankIndex: 1, answer: 'một', score: 2 },
      { blankIndex: 2, answer: 'hai', score: 3 },
    ]);
    expect(formatted.fillBlankAnswers.map((item) => item.score)).toEqual([0.25, 0.25]);
    expect(() => validateFillBlankAnswers('FILL_BLANK', formatted.content, 0.5, formatted.fillBlankAnswers)).not.toThrow();
  });
  it('từ chối câu điền có điểm mỗi ô khác 0,25', () => {
    expect(() => validateFillBlankAnswers('FILL_BLANK', 'A {{blank_1}} B {{blank_2}}', 1, [
      { blankIndex: 1, answer: 'một', score: 0.5 },
      { blankIndex: 2, answer: 'hai', score: 0.5 },
    ])).toThrow('0.25');
  });
});
