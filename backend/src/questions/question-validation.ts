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
