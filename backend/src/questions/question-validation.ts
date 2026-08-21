import { BadRequestException } from '@nestjs/common';

export const FILL_BLANK_UNIT_SCORE = 0.25;

export function getFillBlankScore(blankCount: number): number {
  return Number((Math.max(1, blankCount) * FILL_BLANK_UNIT_SCORE).toFixed(2));
}

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

export function autoFormatFillBlankData(
  type: string,
  content: string,
  score: number,
  fillBlankAnswers?: any[]
): { content: string; fillBlankAnswers: any[] } {
  if (type !== 'FILL_BLANK') {
    return { content: String(content || '').trim(), fillBlankAnswers: fillBlankAnswers || [] };
  }

  let formattedContent = String(content || '').trim();

  if (!formattedContent.includes('{{blank_')) {
    let bCount = 0;
    formattedContent = formattedContent.replace(/(?:\.\.\.|_{2,}|\[\s*\]|\(\s*\)|chỗ\s*trống)/gi, () => {
      bCount++;
      return `{{blank_${bCount}}}`;
    });
    if (bCount === 0) {
      formattedContent = `${formattedContent} {{blank_1}}`;
    }
  }

  const matches = [...formattedContent.matchAll(/\{\{blank_(\d+)\}\}/g)].map((m) => Number(m[1]));
  const count = matches.length || 1;
  let answers = Array.isArray(fillBlankAnswers) ? [...fillBlankAnswers] : [];

  if (answers.length === 0) {
    const itemScore = FILL_BLANK_UNIT_SCORE;
    answers = matches.map((blankIndex) => ({
      blankIndex,
      answer: 'đáp_án_đúng',
      acceptedAnswers: [],
      score: itemScore,
      caseSensitive: false,
      ignoreWhitespace: true,
      ignoreVietnameseTone: false,
    }));
  } else if (answers.length !== count) {
    const itemScore = FILL_BLANK_UNIT_SCORE;
    answers = matches.map((blankIndex, idx) => {
      const existing = answers.find((a) => Number(a.blankIndex) === blankIndex) || answers[idx];
      return {
        blankIndex,
        answer: String(existing?.answer || '').trim() || 'đáp_án_đúng',
        acceptedAnswers: Array.isArray(existing?.acceptedAnswers) ? existing.acceptedAnswers : [],
        score: itemScore,
        caseSensitive: Boolean(existing?.caseSensitive),
        ignoreWhitespace: existing?.ignoreWhitespace !== false,
        ignoreVietnameseTone: Boolean(existing?.ignoreVietnameseTone),
      };
    });
  } else {
    const itemScore = FILL_BLANK_UNIT_SCORE;
    answers = answers.map((ans, idx) => ({
      ...ans,
      blankIndex: matches[idx] || idx + 1,
      answer: String(ans.answer || '').trim() || 'đáp_án_đúng',
      score: itemScore,
    }));
  }

  return { content: formattedContent, fillBlankAnswers: answers };
}

export function validateFillBlankAnswers(type: string, content: string, score: number, answers?: any[]): void {
  if (type !== 'FILL_BLANK') {
    if (answers?.length) throw new BadRequestException('Chỉ câu điền khuyết mới được khai báo đáp án ô trống.');
    return;
  }
  let placeholders = [...String(content || '').matchAll(/\{\{blank_(\d+)\}\}/g)].map(match => Number(match[1]));
  if (!placeholders.length) {
    placeholders = [1];
  }
  const expected = Array.from({ length: placeholders.length }, (_, index) => index + 1);
  if (new Set(placeholders).size !== placeholders.length || placeholders.some((value, index) => value !== expected[index])) {
    throw new BadRequestException('Chỗ trống phải được đánh số liên tiếp: {{blank_1}}, {{blank_2}}, ...');
  }
  if (!Array.isArray(answers) || answers.length !== expected.length) throw new BadRequestException('Cần khai báo đáp án và điểm cho từng chỗ trống.');
  const sorted = [...answers].sort((a, b) => Number(a.blankIndex) - Number(b.blankIndex));
  sorted.forEach((item, index) => {
    if (Number(item.blankIndex) !== expected[index] || !String(item.answer || '').trim()) throw new BadRequestException(`Đáp án cho blank_${expected[index]} không hợp lệ.`);
    if (Math.abs(Number(item.score) - FILL_BLANK_UNIT_SCORE) > 0.0001) throw new BadRequestException(`Mỗi ô trống phải có đúng ${FILL_BLANK_UNIT_SCORE} điểm.`);
  });
  const total = sorted.reduce((sum, item) => sum + Number(item.score), 0);
  const expectedScore = getFillBlankScore(sorted.length);
  if (Math.abs(Number(score) - expectedScore) > 0.0001 || Math.abs(total - expectedScore) > 0.0001) throw new BadRequestException(`Câu có ${sorted.length} ô trống phải có tổng ${expectedScore} điểm.`);
}
