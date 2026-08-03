import { BadRequestException } from '@nestjs/common';
import { normalizeQuestionContent, validateQuestionOptions } from './question-validation';

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
});
