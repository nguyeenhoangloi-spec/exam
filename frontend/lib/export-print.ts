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

  const headers = options.columns
    .map(c => `<th style="text-align:${c.align || 'center'};${c.width ? `width:${c.width};` : ''}">${escapeHtml(c.header)}</th>`)
    .join('');

  const rows = options.rows
    .map((row, i) => `<tr class="${i % 2 ? 'alt' : ''}">${row.map((cell, j) => `<td style="text-align:${options.columns[j]?.align || (j === 0 ? 'center' : 'left')}">${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  const signers = options.signers || published?.footer?.signers || [
    { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỞNG PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký, đóng dấu)' },
  ];

  const signerHtml = `<table class="signers"><tr>${signers.map((s: any) => `<td><strong>${escapeHtml(s.title)}</strong><em>${escapeHtml(s.subtitle || '')}</em><div class="sig-line">...................................</div></td>`).join('')}</tr></table>`;
  const footerNotes = options.footerNotes || published?.footer?.note || '';

  printable.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;color:#0f172a;padding:24px;margin:0}.header-table{width:100%;border-collapse:collapse;margin-bottom:12px}.header-table td{vertical-align:top;border:none}.inst-box{font-weight:bold;font-size:11pt;text-align:center;width:50%}.inst-box span{display:block;font-weight:normal;font-size:10.5pt;margin-top:2px}.motto-box{font-weight:bold;font-size:11pt;text-align:center;width:50%}.motto-box em{display:block;font-weight:bold;font-size:11pt;font-style:italic;margin-top:2px}.title{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:12px 0 4px}.subtitle{text-align:center;font-style:italic;margin-bottom:12px;font-size:11pt}.meta{display:flex;gap:20px;flex-wrap:wrap;margin:12px 0;background:#f8fafc;padding:8px 12px;border:1px solid #e2e8f0;border-radius:4px}.data{width:100%;border-collapse:collapse;margin:10px 0}.data th{background:#f1f5f9;font-weight:bold;font-size:11pt}.data th,.data td{border:1px solid #334155;padding:6px 8px;font-size:11pt}.alt{background:#fafafa}.signers{width:100%;margin-top:34px;border-collapse:collapse}.signers td{text-align:center;vertical-align:top;width:${100 / (signers.length || 1)}%}.signers em{display:block;margin-top:4px;min-height:55px;color:#475569;font-size:10.5pt}.sig-line{color:#94a3b8;margin-top:4px}@media print{body{padding:0}@page{size:${pageSize} ${orientation};margin:${marginMm}mm}}</style></head><body><table class="header-table"><tr><td class="inst-box"><div>${escapeHtml(institutionName)}</div>${facultyName ? `<span>${escapeHtml(facultyName)}</span>` : ''}<div style="border-top:1px solid #334155;display:inline-block;padding-top:2px;width:110px;margin-top:4px"></div></td><td class="motto-box"><div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div><em>${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em><div style="border-top:1px solid #334155;display:inline-block;padding-top:2px;width:110px;margin-top:4px"></div></td></tr></table><h1 class="title">${escapeHtml(options.title)}</h1>${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}${metaHtml}<table class="data"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>${footerNotes ? `<p style="margin-top:10px;font-style:italic;font-size:10.5pt"><em>* ${escapeHtml(footerNotes)}</em></p>` : ''}<p style="text-align:right;font-style:italic;margin-top:16px;font-size:11pt">Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>${signerHtml}<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
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
