import api from './api';
import {
  generateUnifiedExamPaperHtml,
  ExamPaperExportModel,
  setGlobalPublishedTemplates,
} from './exam-paper-template';

export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  institutionName?: string;
  facultyName?: string;
  metaInfo?: Array<{ label: string; value: string }>;
  columns: Array<{ header: string; width?: string; align?: 'left' | 'center' | 'right' }>;
  rows: Array<Array<string | number>>;
  footerNotes?: string;
  signers?: Array<{ title: string; subtitle?: string }>;
  pageSize?: 'A4' | 'A5';
  orientation?: 'portrait' | 'landscape';
  templateCode?: string;
}

export interface ExamQuestionPrintItem {
  index: number;
  content: string;
  score?: number;
  type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE' | 'FILL_BLANK' | string;
  options?: Array<{ key?: string; text: string; isCorrect?: boolean }>;
  fillBlankAnswers?: Array<{ blankIndex?: number; answer?: string; score?: number }>;
  correctAnswer?: string;
  answerExplanation?: string;
}

export interface PrintExamPaperOptions {
  institutionName?: string;
  facultyName?: string;
  motto?: string;
  paperTitle?: string;
  subtitle?: string;
  subjectName: string;
  subjectCode: string;
  paperCode?: string;
  durationMinutes: number;
  totalScore?: number;
  examType?: string;
  essayHeaderMode?: 'STANDARD' | 'ANONYMIZED_CUT';
  duplexPrinting?: boolean;
  showScoreBox?: boolean;
  showInstructions?: boolean;
  instructionText?: string;
  questions: ExamQuestionPrintItem[];
  showAnswers?: boolean;
  signers?: Array<{ title: string; subtitle?: string }>;
  footerNotes?: string;
  pageSize?: 'A4' | 'A5';
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

let templateCache: Record<string, any> | null = null;
let lastCacheTime = 0;

/** Fetch published template configs with client-side memory caching */
export async function getPublishedTemplatesMap(): Promise<Record<string, any>> {
  const now = Date.now();
  if (templateCache && now - lastCacheTime < 60000) {
    return templateCache;
  }
  try {
    const res = await api.get('/document-templates/published');
    const map: Record<string, any> = {};
    if (Array.isArray(res.data)) {
      for (const item of res.data) {
        if (item.code) map[item.code] = item.config;
      }
    }
    templateCache = map;
    setGlobalPublishedTemplates(map);
    lastCacheTime = now;
    return map;
  } catch {
    return templateCache || {};
  }
}

/** In các báo cáo dạng bảng (lịch thi, danh sách thi, bảng điểm...) */
export function printReport(options: PrintReportOptions): boolean {
  const printable = window.open('', '_blank', 'width=980,height=780');
  if (!printable) return false;

  const published = options.templateCode && templateCache ? templateCache[options.templateCode] : null;
  const institutionName = options.institutionName || published?.header?.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
  const facultyName = options.facultyName !== undefined ? options.facultyName : (published?.header?.facultyName || 'KHOA CÔNG NGHỆ THÔNG TIN');
  const motto = published?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const pageSize = options.pageSize || published?.page?.size || 'A4';
  const orientation = options.orientation || published?.page?.orientation || 'portrait';
  const marginMm = published?.page?.marginMm || 15;

  const metaHtml = options.metaInfo?.length
    ? `<div class="meta">${options.metaInfo.map(m => `<div><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}</div>`).join('')}</div>`
    : '';

  // Chuẩn hóa trọng số cột thành phần trăm chính xác summing to 100% (chống tràn lề phải)
  const numericWeights = options.columns.map((c) => {
    if (!c.width) return 10;
    const num = parseFloat(String(c.width).replace(/[^\d.]/g, ''));
    return isNaN(num) || num <= 0 ? 10 : num;
  });
  const totalWeight = numericWeights.reduce((sum, w) => sum + w, 0) || 1;
  const normalizedPercentages = numericWeights.map((w) => ((w / totalWeight) * 100).toFixed(1));

  const headers = options.columns
    .map((c, idx) => `<th style="text-align:${c.align || 'center'}; width:${normalizedPercentages[idx]}%; border:1px solid #000000; padding:5px 6px; font-weight:bold; font-size:10pt; background:transparent; color:#000000;">${escapeHtml(c.header)}</th>`)
    .join('');

  const rows = options.rows
    .map((row) => `<tr>${row.map((cell, j) => `<td style="text-align:${options.columns[j]?.align || (j === 0 ? 'center' : 'left')}; border:1px solid #000000; padding:5px 6px; font-size:10pt; color:#000000; word-break:break-word;">${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  const signers = options.signers || published?.footer?.signers || [
    { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỞNG PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký, đóng dấu)' },
  ];

  const signerHtml = `<table class="signers"><tr>${signers.map((s: any) => `<td><strong>${escapeHtml(s.title)}</strong><em>${escapeHtml(s.subtitle || '')}</em><div class="sig-line">...................................</div></td>`).join('')}</tr></table>`;
  const footerNotes = options.footerNotes || published?.footer?.note || '';

  printable.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title><style>*{box-sizing:border-box}body{font-family:'Times New Roman',Times,serif;font-size:11pt;color:#000000;padding:15px;margin:0}.header-table{width:100%;border-collapse:collapse;margin-bottom:10px;table-layout:fixed}.header-table td{vertical-align:top;border:none;padding:0}.inst-box{font-weight:bold;font-size:10.5pt;text-align:center;width:50%}.inst-box span{display:block;font-weight:normal;font-size:10pt;margin-top:1px}.motto-box{font-weight:bold;font-size:10.5pt;text-align:center;width:50%}.motto-box em{display:block;font-weight:bold;font-size:10pt;font-style:italic;margin-top:1px}.title{text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:10px 0 2px}.subtitle{text-align:center;font-style:italic;margin-bottom:8px;font-size:10pt;color:#000000}.meta{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;border-bottom:1px solid #000000;padding-bottom:6px;font-size:10pt;color:#000000}table.data{width:100%;border-collapse:collapse;margin:8px 0;table-layout:fixed;page-break-inside:auto}table.data thead{display:table-header-group}table.data tr{page-break-inside:avoid;page-break-after:auto}table.data th{background:transparent;font-weight:bold;font-size:10pt;border:1px solid #000000;padding:5px 6px;text-align:center;color:#000000}table.data td{border:1px solid #000000;padding:5px 6px;font-size:10pt;color:#000000;word-break:break-word}.signers{width:100%;margin-top:28px;border-collapse:collapse;border:none;table-layout:fixed;page-break-inside:avoid}.signers td{text-align:center;vertical-align:top;border:none;width:${100 / (signers.length || 1)}%}.signers strong{font-size:10.5pt;display:block;color:#000000}.signers em{display:block;margin-top:2px;min-height:50px;color:#000000;font-size:9.5pt}.sig-line{color:#000000;margin-top:4px}@media print{body{padding:0}@page{size:${pageSize} ${orientation};margin:${marginMm}mm}}</style></head><body><table class="header-table"><tr><td class="inst-box"><div>${escapeHtml(institutionName)}</div>${facultyName ? `<span>${escapeHtml(facultyName)}</span>` : ''}<div style="border-top:1px solid #000;display:inline-block;padding-top:2px;width:110px;margin-top:2px"></div></td><td class="motto-box"><div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div><em>${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em><div style="border-top:1px solid #000;display:inline-block;padding-top:2px;width:110px;margin-top:2px"></div></td></tr></table><h1 class="title">${escapeHtml(options.title)}</h1>${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}${metaHtml}<table class="data"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>${footerNotes ? `<p style="margin-top:8px;font-style:italic;font-size:9.5pt"><em>* ${escapeHtml(footerNotes)}</em></p>` : ''}<p style="text-align:right;font-style:italic;margin-top:14px;font-size:10.5pt">Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>${signerHtml}<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  printable.document.close();
  return true;
}

/** In 1 mã đề thi */
export function printExamPaper(options: PrintExamPaperOptions): boolean {
  return printBulkExamPapers([options]);
}

/** In trọn bộ N mã đề thi và Bảng ma trận đáp án tổng hợp */
export function printBulkExamPapers(papersList: PrintExamPaperOptions[]): boolean {
  if (!papersList || papersList.length === 0) return false;

  const printable = window.open('', '_blank', 'width=980,height=780');
  if (!printable) return false;

  const showAnswers = papersList.some((p) => p.showAnswers);
  const mappedPapers: ExamPaperExportModel[] = papersList.map((p) => ({
    paperCode: p.paperCode || '101',
    paperTitle: p.paperTitle,
    subjectName: p.subjectName,
    subjectCode: p.subjectCode,
    durationMinutes: p.durationMinutes,
    totalScore: p.totalScore || 10,
    examType: p.examType,
    essayHeaderMode: p.essayHeaderMode,
    duplexPrinting: p.duplexPrinting,
    institutionName: p.institutionName,
    facultyName: p.facultyName,
    motto: p.motto,
    subtitle: p.subtitle,
    instructionText: p.instructionText,
    showScoreBox: p.showScoreBox,
    showInstructions: p.showInstructions,
    footerNotes: p.footerNotes,
    pageSize: p.pageSize,
    signers: p.signers,
    questions: p.questions.map((q) => ({
      index: q.index,
      content: q.content,
      score: q.score,
      type: q.type,
      options: q.options?.map((opt) => ({
        key: opt.key,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      fillBlankAnswers: q.fillBlankAnswers,
      correctAnswer: q.correctAnswer,
      answerExplanation: q.answerExplanation,
    })),
  }));

  const fullHtml = generateUnifiedExamPaperHtml(mappedPapers, showAnswers);
  const printReadyHtml = fullHtml.replace(
    '</body>',
    '<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body>'
  );

  printable.document.write(printReadyHtml);
  printable.document.close();
  return true;
}
