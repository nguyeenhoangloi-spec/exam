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

export function cleanSingleAnswer(str: string): string {
  return String(str || '')
    .replace(/\{\{blank_\d+\}\}/gi, '')
    .replace(/^(?:(?:ô|chỗ\s*trống|vị\s*trí)\s*#?\d+\s*[:.-]*|\d+[\s.:-]+|\[\d+\]\s*[:.-]*|\(\d+\)\s*[:.-]*)\s*/iu, '')
    .replace(/^["'«“\(\[]+|["'»”\)\]]+$/g, '')
    .replace(/\{\{blank_\d+\}\}/gi, '')
    .trim();
}

export function parseMultiBlankAnswers(rawText: string, blankCount: number, fallbackExp = ''): string[] {
  const count = Math.max(1, blankCount);
  const text = String(rawText || '').trim();
  const exp = String(fallbackExp || '').replace(/\{\{blank_\d+\}\}/gi, '').trim();
  const answers: string[] = Array(count).fill('');

  if (!text && !exp) return answers;

  // 1. Kiểm tra mẫu có đánh số thứ tự như "Ô 1: SELECT ; Ô 2: INSERT", "1. SELECT ; 2. INSERT", "[1] SELECT, [2] INSERT"
  const numberedPattern = /(?:(?:ô|chỗ\s*trống|vị\s*trí)\s*#?|\[|\()?\s*(\d+)\s*[\]\)]?\s*[:.-]\s*([^;,\n|]+)/gi;
  let match;
  let foundNumbered = false;
  while ((match = numberedPattern.exec(text)) !== null) {
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < count) {
      answers[idx] = cleanSingleAnswer(match[2]);
      foundNumbered = true;
    }
  }

  if (foundNumbered) {
    for (let i = 0; i < count; i++) {
      if (!answers[i] && exp) {
        const expParts = parseMultiBlankAnswers(exp, count);
        answers[i] = expParts[i] || '';
      }
    }
    return answers;
  }

  // 2. Tách theo ký tự phân cách (; | \n / hoặc dấu phẩy)
  let delimiterParts = text.split(/[;|\n\/]/).map(cleanSingleAnswer).filter(Boolean);
  if (delimiterParts.length < count && text.includes(',')) {
    const commaParts = text.split(',').map(cleanSingleAnswer).filter(Boolean);
    if (commaParts.length >= count || commaParts.length > delimiterParts.length) {
      delimiterParts = commaParts;
    }
  }

  if (delimiterParts.length >= count) {
    for (let i = 0; i < count; i++) {
      answers[i] = cleanSingleAnswer(delimiterParts[i]);
    }
    return answers;
  }

  if (delimiterParts.length > 0 && count === 1) {
    answers[0] = cleanSingleAnswer(delimiterParts[0]);
    return answers;
  }

  if (exp && exp !== text) {
    const fromExp = parseMultiBlankAnswers(exp, count);
    for (let i = 0; i < count; i++) {
      answers[i] = cleanSingleAnswer(delimiterParts[i] || fromExp[i] || (i === 0 ? text : ''));
    }
    return answers;
  }

  for (let i = 0; i < count; i++) {
    answers[i] = cleanSingleAnswer(delimiterParts[i] || (i === 0 ? text : ''));
  }
  return answers;
}

export function cleanFillBlankContent(content: string): string {
  let formatted = String(content || '').trim();

  // Đảm bảo các thẻ {{blank_1... luôn có đầy đủ 2 ngoặc nhọn đóng }}
  formatted = formatted.replace(/(\{\{blank_\d+)(?!\}\})/gi, '$1}}');

  // Tách dòng và kiểm tra các dòng đuôi chú thích chỗ trống
  const lines = formatted.split('\n');
  const isTrailingPlaceholderLine = (l: string) =>
    /^(?:(?:ô|chỗ\s*trống|vị\s*trí)\s*#?\d+\s*[:.-]*|\d+[\s.:-]+|\[\d+\]\s*[:.-]*)\s*\{\{blank_\d+\}\}\s*$/iu.test(l.trim());

  const mainLines: string[] = [];
  const trailingLines: string[] = [];
  let foundTrailing = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTrailingPlaceholderLine(line)) {
      foundTrailing = true;
      trailingLines.push(line);
    } else if (foundTrailing && !line.trim()) {
      // empty line after trailing
    } else {
      mainLines.push(line);
    }
  }

  let mainText = mainLines.join('\n').trim();

  // Kiểm tra xem mainText có ký hiệu [1], [2], (1), (2), _1_, ..., ___, [] không
  if (/(?:\[\d+\]|\(\d+\)|_\d+_)/.test(mainText)) {
    let bCount = 0;
    mainText = mainText.replace(/(?:\[\d+\]|\(\d+\)|_\d+_)/g, () => {
      bCount++;
      return `{{blank_${bCount}}}`;
    });
    formatted = mainText;
  } else if (/(?:\.\.\.+|_{2,}|\[\s*\]|\(\s*\)|chỗ\s*trống)/i.test(mainText)) {
    let bCount = 0;
    mainText = mainText.replace(/(?:\.\.\.+|_{2,}|\[\s*\]|\(\s*\)|chỗ\s*trống)/gi, () => {
      bCount++;
      return `{{blank_${bCount}}}`;
    });
    formatted = mainText;
  } else if (mainText.includes('{{blank_')) {
    formatted = mainText;
  } else if (trailingLines.length > 0) {
    formatted = formatted;
  } else {
    formatted = `${mainText} {{blank_1}}`;
  }

  // Đảm bảo đánh số liên tiếp từ 1 đến N: {{blank_1}}, {{blank_2}}, ...
  let counter = 0;
  formatted = formatted.replace(/\{\{blank_\d+\}\}/gi, () => {
    counter++;
    return `{{blank_${counter}}}`;
  });

  return formatted.trim();
}

export function autoFormatFillBlankData(
  type: string,
  content: string,
  score: number,
  fillBlankAnswers?: any[]
): { content: string; fillBlankAnswers: any[] } {
  if (type !== 'FILL_BLANK') {
    return {
      content: String(content || '').replace(/\{\{blank_\d+\}\}/gi, '').trim(),
      fillBlankAnswers: []
    };
  }

  const formattedContent = cleanFillBlankContent(content);
  const matches = [...formattedContent.matchAll(/\{\{blank_(\d+)\}\}/g)].map((m) => Number(m[1]));
  const count = matches.length || 1;
  const itemScore = FILL_BLANK_UNIT_SCORE;
  let answers = Array.isArray(fillBlankAnswers) ? [...fillBlankAnswers] : [];

  const firstAns = String(answers[0]?.answer || '').trim();
  const isConcatenated = firstAns && (
    answers.length < count ||
    (answers.length === count && count > 1 && answers.every(a => String(a.answer || '').trim() === firstAns && (firstAns.includes('Ô') || firstAns.includes(';') || firstAns.includes(','))))
  );

  if (isConcatenated) {
    const parsed = parseMultiBlankAnswers(firstAns, count);
    answers = matches.map((blankIndex, idx) => ({
      blankIndex,
      answer: parsed[idx] || 'đáp_án_đúng',
      acceptedAnswers: Array.isArray(answers[idx]?.acceptedAnswers) ? answers[idx].acceptedAnswers : [],
      score: itemScore,
      caseSensitive: Boolean(answers[idx]?.caseSensitive),
      ignoreWhitespace: answers[idx]?.ignoreWhitespace !== false,
      ignoreVietnameseTone: Boolean(answers[idx]?.ignoreVietnameseTone),
    }));
  } else if (answers.length === 0) {
    answers = matches.map((blankIndex) => ({
      blankIndex,
      answer: 'đáp_án_đúng',
      acceptedAnswers: [],
      score: itemScore,
      caseSensitive: false,
      ignoreWhitespace: true,
      ignoreVietnameseTone: false,
    }));
  } else {
    answers = matches.map((blankIndex, idx) => {
      const existing = answers.find((a) => Number(a.blankIndex) === blankIndex) || answers[idx];
      return {
        blankIndex,
        answer: cleanSingleAnswer(existing?.answer || '') || 'đáp_án_đúng',
        acceptedAnswers: Array.isArray(existing?.acceptedAnswers) ? existing.acceptedAnswers : [],
        score: itemScore,
        caseSensitive: Boolean(existing?.caseSensitive),
        ignoreWhitespace: existing?.ignoreWhitespace !== false,
        ignoreVietnameseTone: Boolean(existing?.ignoreVietnameseTone),
      };
    });
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
