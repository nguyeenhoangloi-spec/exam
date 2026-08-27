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
    // Xáo trộn thứ tự câu hỏi
    const shuffledQuestions = shuffleArray(basePaper.questions);

    const formattedQuestions = shuffledQuestions.map((q, qIdx) => {
      // Xáo trộn thứ tự các phương án A, B, C, D
      const shuffledOptions = q.options && q.options.length > 0 ? shuffleArray(q.options) : [];
      const relabeledOptions = shuffledOptions.map((opt, oIdx) => ({
        label: optionLetters[oIdx] || String(oIdx + 1),
        content: opt.content,
        isCorrect: opt.isCorrect,
      }));

      return {
        order: qIdx + 1,
        code: q.code,
        content: q.content,
        score: q.score,
        type: q.type,
        fillBlankAnswers: q.fillBlankAnswers,
        correctAnswer: q.correctAnswer,
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

/** Xuất 1 mã đề thi ra file Word (.doc) */
export function exportExamPaperToWord(data: ExamPaperExportData, includeAnswerKey = true) {
  exportBulkExamPapersToWord([data], includeAnswerKey, data.subjectCode);
}

/** Xuất trọn bộ N mã đề thi và Bảng đáp án ma trận tổng hợp ra 1 file Word (.doc) duy nhất */
export function exportBulkExamPapersToWord(
  papers: ExamPaperExportData[],
  includeAnswerKey = true,
  customFileName?: string,
) {
  if (!papers || papers.length === 0) return;

  const mappedPapers: ExamPaperExportModel[] = papers.map((p) => ({
    paperCode: p.paperCode,
    title: p.title,
    subjectName: p.subjectName,
    subjectCode: p.subjectCode,
    durationMinutes: p.durationMinutes,
    totalScore: p.totalScore || 10,
    examType: p.examType,
    departmentName: p.departmentName,
    schoolName: p.schoolName,
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
  const html = generateUnifiedExamPaperHtml(mappedPapers, includeAnswerKey);

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
