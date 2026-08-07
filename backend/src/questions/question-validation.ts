import { BadRequestException } from '@nestjs/common';

export function normalizeQuestionContent(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateQuestionOptions(type: string, options: any[]): void {
  if (!Array.isArray(options)) throw new BadRequestException('Danh sách đáp án không hợp lệ.');
  const normalized = options.map((option, index) => ({
    label: String(option.label || String.fromCharCode(65 + index)).trim().toUpperCase(),
    content: String(option.content || '').trim(),
    isCorrect: Boolean(option.isCorrect),
  }));
  if (['FILL_BLANK', 'ESSAY'].includes(type)) {
    if (normalized.length) throw new BadRequestException('Câu điền khuyết hoặc tự luận không dùng danh sách lựa chọn.');
    return;
  }
  if (type === 'TRUE_FALSE' && normalized.length !== 2) {
    throw new BadRequestException('Câu đúng/sai phải có đúng 2 lựa chọn.');
  }
  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type) && normalized.length < 2) {
    throw new BadRequestException('Câu lựa chọn phải có ít nhất 2 đáp án.');
  }
  const correctCount = normalized.filter((option) => option.isCorrect).length;
  if (['SINGLE_CHOICE', 'TRUE_FALSE'].includes(type) && correctCount !== 1) {
    throw new BadRequestException('Loại câu hỏi này phải có chính xác 1 đáp án đúng.');
  }
  if (type === 'MULTIPLE_CHOICE' && correctCount < 1) {
    throw new BadRequestException('Câu nhiều đáp án phải có ít nhất 1 đáp án đúng.');
  }
  const labels = new Set<string>();
  for (const option of normalized) {
    if (!option.content) throw new BadRequestException('Nội dung đáp án không được để trống.');
    if (labels.has(option.label)) throw new BadRequestException(`Nhãn đáp án ${option.label} bị trùng.`);
    labels.add(option.label);
  }
}

export function normalizeFillBlankAnswer(value: string, settings?: { caseSensitive?: boolean; ignoreWhitespace?: boolean; ignoreVietnameseTone?: boolean }): string {
  let normalized = String(value || '').trim();
  if (settings?.ignoreWhitespace !== false) normalized = normalized.replace(/\s+/g, '');
  if (settings?.ignoreVietnameseTone) normalized = normalized.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return settings?.caseSensitive ? normalized : normalized.toLocaleLowerCase('vi-VN');
}

export function validateFillBlankAnswers(type: string, content: string, score: number, answers?: any[]): void {
  if (type !== 'FILL_BLANK') {
    if (answers?.length) throw new BadRequestException('Chỉ câu điền khuyết mới được khai báo đáp án ô trống.');
    return;
  }
  const placeholders = [...String(content || '').matchAll(/\{\{blank_(\d+)\}\}/g)].map(match => Number(match[1]));
  if (!placeholders.length) throw new BadRequestException('Câu điền khuyết phải có ít nhất một chỗ trống theo mẫu {{blank_1}}.');
  const expected = Array.from({ length: placeholders.length }, (_, index) => index + 1);
  if (new Set(placeholders).size !== placeholders.length || placeholders.some((value, index) => value !== expected[index])) {
    throw new BadRequestException('Chỗ trống phải được đánh số liên tiếp: {{blank_1}}, {{blank_2}}, ...');
  }
  if (!Array.isArray(answers) || answers.length !== expected.length) throw new BadRequestException('Cần khai báo đáp án và điểm cho từng chỗ trống.');
  const sorted = [...answers].sort((a, b) => Number(a.blankIndex) - Number(b.blankIndex));
  sorted.forEach((item, index) => {
    if (Number(item.blankIndex) !== expected[index] || !String(item.answer || '').trim()) throw new BadRequestException(`Đáp án cho blank_${expected[index]} không hợp lệ.`);
    if (!Number.isFinite(Number(item.score)) || Number(item.score) < 0) throw new BadRequestException(`Điểm cho blank_${expected[index]} không hợp lệ.`);
  });
  const total = sorted.reduce((sum, item) => sum + Number(item.score), 0);
  if (Math.abs(total - Number(score)) > 0.0001) throw new BadRequestException(`Tổng điểm các chỗ trống (${total}) phải bằng điểm câu hỏi (${score}).`);
}
