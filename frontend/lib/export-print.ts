import api from './api';

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
  type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE' | string;
  options?: Array<{ key?: string; text: string; isCorrect?: boolean }>;
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
    lastCacheTime = now;
    return map;
  } catch {
    return templateCache || {};
  }
}

/** Print standard tabular reports (schedules, student lists, grade reports, etc.) */
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

/** Print official exam paper test sheet with questions, choices, score box and signatures */
export function printExamPaper(options: PrintExamPaperOptions): boolean {
  const printable = window.open('', '_blank', 'width=980,height=780');
  if (!printable) return false;

  const institutionName = options.institutionName || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO';
  const facultyName = options.facultyName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ - KHOA CÔNG NGHỆ THÔNG TIN';
  const motto = options.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const title = options.paperTitle || 'ĐỀ THI KẾT THÚC HỌC PHẦN';
  const subtitle = options.subtitle || `Học kỳ 1 - Năm học ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
  const instructionText = options.instructionText || '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)';
  const signers = options.signers || [
    { title: 'CÁN BỘ RA ĐỀ', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỞNG BỘ MÔN DUYỆT', subtitle: '(Ký, ghi rõ họ tên)' },
  ];

  const questionsHtml = options.questions.map((q, idx) => {
    const questionIndex = q.index || idx + 1;
    const scoreText = q.score != null ? ` (${q.score} điểm)` : '';
    let bodyHtml = '';

    if (q.options && q.options.length > 0) {
      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const optionsContent = q.options.map((opt, oIdx) => {
        const letter = opt.key || optionLetters[oIdx] || String(oIdx + 1);
        const isCorrect = options.showAnswers && opt.isCorrect;
        return `<div class="opt ${isCorrect ? 'correct' : ''}"><strong>${letter}.</strong> ${escapeHtml(opt.text)} ${isCorrect ? '✓ (Đáp án đúng)' : ''}</div>`;
      }).join('');
      bodyHtml = `<div class="options-grid">${optionsContent}</div>`;
    } else {
      // Essay answer space
      bodyHtml = `<div class="essay-space"><div class="line"></div><div class="line"></div><div class="line"></div></div>`;
    }

    if (options.showAnswers && q.answerExplanation) {
      bodyHtml += `<div class="explanation"><strong>Lời giải / Hướng dẫn:</strong> ${escapeHtml(q.answerExplanation)}</div>`;
    }

    return `<div class="question-block"><div class="q-header"><strong>Câu ${questionIndex}${scoreText}:</strong> ${escapeHtml(q.content)}</div>${bodyHtml}</div>`;
  }).join('');

  const signersHtml = `<table class="signers-table"><tr>${signers.map(s => `<td><strong>${escapeHtml(s.title)}</strong><em>${escapeHtml(s.subtitle || '')}</em><div class="sig-space"></div></td>`).join('')}</tr></table>`;

  const paperCodeBadge = options.paperCode ? `<div class="paper-code-badge">MÃ ĐỀ THI: <strong>${escapeHtml(options.paperCode)}</strong></div>` : '';

  printable.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(title)} - ${escapeHtml(options.subjectName)}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;color:#0f172a;padding:24px;margin:0}.document{max-width:850px;margin:0 auto}.header-grid{width:100%;border-collapse:collapse;margin-bottom:12px}.header-grid td{vertical-align:top;border:none}.inst-box{text-align:center;font-size:11pt;font-weight:bold;width:50%}.inst-box div{margin-bottom:2px}.inst-underline{border-top:1px solid #0f172a;display:inline-block;width:120px;margin-top:4px}.motto-box{text-align:center;font-size:11pt;font-weight:bold;width:50%}.motto-box em{display:block;font-style:italic;margin-top:2px;font-weight:bold}.title{text-align:center;font-size:16pt;font-weight:bold;text-transform:uppercase;margin:10px 0 2px}.subtitle{text-align:center;font-style:italic;margin-bottom:10px;font-size:11pt}.exam-info-box{border:1px solid #334155;padding:8px 12px;margin:10px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:11pt}.exam-info-full{grid-column:1 / -1;text-align:center;font-style:italic;font-size:10.5pt;border-top:1px dashed #cbd5e1;padding-top:4px;margin-top:4px}.score-table{width:100%;border-collapse:collapse;margin:12px 0}.score-table th,.score-table td{border:1px solid #334155;padding:6px 8px;text-align:center;font-size:11pt}.score-table td{height:42px}.question-block{margin:14px 0;page-break-inside:avoid}.q-header{font-size:11.5pt;margin-bottom:6px}.options-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;padding-left:14px;font-size:11pt}.opt.correct{color:#15803d;font-weight:600}.essay-space{margin:8px 0 12px 14px}.essay-space .line{border-bottom:1px dashed #cbd5e1;height:24px}.explanation{margin:8px 0 8px 14px;padding:6px 10px;background:#f0fdf4;border-left:3px solid #16a34a;font-size:10.5pt;color:#166534}.paper-code-badge{text-align:right;font-size:11pt;margin-bottom:4px}.signers-table{width:100%;margin-top:34px;border-collapse:collapse}.signers-table td{text-align:center;vertical-align:top;width:${100 / (signers.length || 1)}%}.signers-table em{display:block;margin-top:4px;font-style:italic;color:#475569;font-size:10.5pt}.sig-space{min-height:55px}@media print{body{padding:0}.document{max-width:100%}@page{size:${options.pageSize || 'A4'} portrait;margin:15mm}}</style></head><body><main class="document"><table class="header-grid"><tr><td class="inst-box"><div>${escapeHtml(institutionName)}</div><div style="font-weight:normal">${escapeHtml(facultyName)}</div><div class="inst-underline"></div></td><td class="motto-box"><div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div><em>${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em><div class="inst-underline"></div></td></tr></table>${paperCodeBadge}<h1 class="title">${escapeHtml(title)}</h1>${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}<div class="exam-info-box"><div><strong>Môn học:</strong> ${escapeHtml(options.subjectName)}</div><div><strong>Mã học phần:</strong> ${escapeHtml(options.subjectCode)}</div><div><strong>Thời gian làm bài:</strong> ${options.durationMinutes} phút</div><div><strong>Thang điểm:</strong> ${options.totalScore || 10} điểm</div>${options.showInstructions ? `<div class="exam-info-full">${escapeHtml(instructionText)}</div>` : ''}</div>${options.showScoreBox !== false ? `<table class="score-table"><tr><th style="width:25%">Điểm bằng số</th><th style="width:25%">Điểm bằng chữ</th><th style="width:25%">Cán bộ chấm thi 1</th><th style="width:25%">Cán bộ chấm thi 2</th></tr><tr><td></td><td></td><td></td><td></td></tr></table>` : ''}<div class="questions-container">${questionsHtml}</div>${options.footerNotes ? `<p style="margin-top:14px;font-style:italic;font-size:10.5pt"><em>* ${escapeHtml(options.footerNotes)}</em></p>` : ''}${signersHtml}</main><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  printable.document.close();
  return true;
}
