import {
  generateUnifiedExamPaperHtml,
  ExamPaperExportModel,
} from './exam-paper-template';

export interface ExamPaperExportData {
  paperCode: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  durationMinutes: number;
  totalScore: number;
  variantCount?: number;
  examType?: string;
  schoolName?: string;
  departmentName?: string;
  questions: Array<{
    order: number;
    code?: string;
    content: string;
    score: number;
    type?: string;
    fillBlankAnswers?: Array<{ blankIndex?: number; answer?: string; score?: number }>;
    correctAnswer?: string;
    sampleAnswer?: string;
    options: Array<{ label: string; content: string; isCorrect: boolean }>;
    explanation?: string;
  }>;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Tự động sinh N mã đề đảo ngẫu nhiên từ 1 đề gốc */
export function generateShuffledPaperVariants(
  basePaper: ExamPaperExportData,
  count = 4,
  startCode = 101,
): ExamPaperExportData[] {
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const variants: ExamPaperExportData[] = [];

  for (let v = 0; v < count; v++) {
    const variantCode = String(startCode + v);

    // Mã gốc v === 0 giữ nguyên thứ tự câu hỏi và phương án A, B, C, D
    if (v === 0) {
      variants.push({
        ...basePaper,
        paperCode: variantCode,
        title: `${basePaper.title} (Mã đề ${variantCode})`,
        questions: basePaper.questions.map((q, qIdx) => ({
          order: qIdx + 1,
          code: q.code,
          content: q.content,
          score: q.score,
          type: q.type,
          fillBlankAnswers: q.fillBlankAnswers ? [...q.fillBlankAnswers] : [],
          correctAnswer: q.correctAnswer,
          sampleAnswer: q.sampleAnswer,
          options: q.options ? q.options.map((opt) => ({ ...opt })) : [],
          explanation: q.explanation,
        })),
      });
      continue;
    }

    // Các mã đảo v > 0: Deep clone để không làm đột biến dữ liệu gốc
    const clonedQuestions = basePaper.questions.map((q) => ({
      ...q,
      fillBlankAnswers: q.fillBlankAnswers ? [...q.fillBlankAnswers] : [],
      options: q.options ? q.options.map((opt) => ({ ...opt })) : [],
    }));

    const shuffledQuestions = shuffleArray(clonedQuestions);

    const formattedQuestions = shuffledQuestions.map((q, qIdx) => {
      const isMultipleChoice = q.options && q.options.length > 0;
      const shuffledOptions = isMultipleChoice ? shuffleArray(q.options) : [];
      const relabeledOptions = shuffledOptions.map((opt, oIdx) => ({
        label: optionLetters[oIdx] || String(oIdx + 1),
        content: opt.content,
        isCorrect: opt.isCorrect,
      }));

      // Cập nhật correctAnswer khớp với chữ cái mới sau khi xáo trộn
      const correctOpt = relabeledOptions.find((o) => o.isCorrect);
      const updatedCorrectAnswer = correctOpt ? correctOpt.label : q.correctAnswer;

      return {
        order: qIdx + 1,
        code: q.code,
        content: q.content,
        score: q.score,
        type: q.type,
        fillBlankAnswers: q.fillBlankAnswers,
        correctAnswer: updatedCorrectAnswer,
        sampleAnswer: q.sampleAnswer,
        options: relabeledOptions,
        explanation: q.explanation,
      };
    });

    variants.push({
      ...basePaper,
      paperCode: variantCode,
      title: `${basePaper.title} (Mã đề ${variantCode})`,
      questions: formattedQuestions,
    });
  }

  return variants;
}

import { getSchoolLogoUrl } from './school-logo';

async function resolveImageAsBase64(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/** Xuất 1 mã đề thi ra file Word (.doc) */
export async function exportExamPaperToWord(data: ExamPaperExportData, includeAnswerKey = false) {
  await exportBulkExamPapersToWord([data], includeAnswerKey, data.subjectCode);
}

/** Xuất trọn bộ N mã đề thi và Bảng đáp án ma trận tổng hợp ra 1 file Word (.doc) duy nhất */
export async function exportBulkExamPapersToWord(
  papers: ExamPaperExportData[],
  includeAnswerKey = false,
  customFileName?: string,
  customOptions?: Partial<ExamPaperExportModel>
): Promise<void> {
  if (!papers || papers.length === 0) return;

  const rawLogoUrl = customOptions?.logoUrl || getSchoolLogoUrl();
  const embeddedLogoUrl = await resolveImageAsBase64(rawLogoUrl);

  const effectiveOptions: Partial<ExamPaperExportModel> = {
    ...customOptions,
    logoUrl: embeddedLogoUrl || rawLogoUrl,
  };

  const mappedPapers: ExamPaperExportModel[] = papers.map((p) => ({
    paperCode: p.paperCode || '101',
    paperTitle: p.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN',
    subjectName: p.subjectName,
    subjectCode: p.subjectCode,
    durationMinutes: p.durationMinutes,
    totalScore: p.totalScore || 10,
    examType: p.examType,
    departmentName: p.departmentName,
    schoolName: p.schoolName,
    ...effectiveOptions,
    questions: p.questions.map((q) => ({
      order: q.order,
      code: q.code,
      content: q.content,
      score: q.score,
      type: q.type,
      options: q.options?.map((opt) => ({
        label: opt.label,
        content: opt.content,
        isCorrect: opt.isCorrect,
      })),
      fillBlankAnswers: q.fillBlankAnswers,
      correctAnswer: q.correctAnswer,
      sampleAnswer: q.sampleAnswer,
      explanation: q.explanation,
    })),
  }));

  // Dùng chung 100% template HTML với bản In/PDF
  const html = generateUnifiedExamPaperHtml(mappedPapers, includeAnswerKey, effectiveOptions);

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const firstPaper = papers[0];
  const fileName = papers.length > 1
    ? `Bo_${papers.length}_De_Thi_${customFileName || firstPaper.subjectCode}_Ma_${papers.map((p) => p.paperCode).join('_')}.doc`
    : `De_Thi_${customFileName || firstPaper.subjectCode}_Ma_${firstPaper.paperCode}.doc`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
