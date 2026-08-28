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

export function printArchivedDossier(data: any): boolean {
  if (!data) return false;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const published = templateCache ? (templateCache['EXAM_ARCHIVE_DOSSIER'] || templateCache['EXAM_PAPER_OFFICIAL']) : null;
  const institutionName = published?.header?.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
  const facultyName = published?.header?.facultyName || 'PHÒNG KHẢO THÍ & ĐBCL';
  const motto = published?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const title = published?.header?.title || 'HỒ SƠ LƯU TRỮ BÀI THI KẾT THÚC HỌC PHẦN';
  const subtitle = published?.header?.subtitle || '(Bản trích lục niêm phong lưu trữ đào tạo)';
  const marginMm = published?.page?.marginMm || 12;

  const [mottoTop, mottoBottom] = motto.split('\n');

  const signers = published?.footer?.signers?.length
    ? published.footer.signers
    : [
        { title: 'CÁN BỘ CHẤM THI', subtitle: '(Ký và ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ & ĐBCL', subtitle: '(Ký, đóng dấu xác nhận lưu trữ)' },
      ];

  const escapeHtml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const signersHtml = signers
    .map((s: any, idx: number) => {
      const isFirst = idx === 0;
      const signerName = isFirst
        ? data.submission?.gradedBy || 'Cán bộ chấm thi'
        : data.submission?.approvedBy || 'Hội đồng Khảo thí';
      return `
        <td>
          <div><strong>${escapeHtml(s.title || '')}</strong></div>
          <div style="font-style: italic; font-size: 9.5pt;">${escapeHtml(s.subtitle || '')}</div>
          <div style="height: 60px;"></div>
          <div>${escapeHtml(signerName)}</div>
        </td>
      `;
    })
    .join('');

  const questionsHtml = (data.questions || [])
    .map(
      (q: any) => `
    <div style="margin-bottom: 16px; page-break-inside: avoid;">
      <div style="font-weight: bold; margin-bottom: 4px;">
        Câu ${q.index} (${q.maxScore}đ) [${escapeHtml(q.code)}]: ${escapeHtml(q.content)}
      </div>
      ${
        q.type === 'ESSAY'
          ? `
        <div style="border: 1px solid #000; padding: 8px; margin-top: 4px; min-height: 40px;">
          <strong>Bài làm của thí sinh:</strong><br/>
          ${escapeHtml(q.studentAnswer?.textAnswer || '(Không có nội dung văn bản)')}
        </div>
        <div style="margin-top: 4px; font-size: 10pt; font-style: italic;">
          Điểm chấm: <strong>${q.studentAnswer?.finalScore}/${q.maxScore}</strong> | Nhận xét: ${escapeHtml(q.studentAnswer?.teacherComment || 'Đạt yêu cầu')}
        </div>
      `
          : q.type === 'FILL_BLANK' || (Array.isArray(q.fillBlankAnswers) && q.fillBlankAnswers.length > 0)
          ? `
        <div style="padding-left: 12px; margin-top: 4px;">
          ${(q.fillBlankAnswers || [])
            .map((fb: any) => {
              const studentFilled =
                (q.studentAnswer?.fillBlankAnswers && (q.studentAnswer.fillBlankAnswers[String(fb.blankIndex)] || q.studentAnswer.fillBlankAnswers[fb.blankIndex]))
                || q.studentAnswer?.textAnswer;
              return `
              <div style="margin: 3px 0;">
                - Vị trí {{blank_${fb.blankIndex}}}: Thí sinh điền: <strong>${escapeHtml(String(studentFilled || '(Bỏ trống)'))}</strong> | Đáp án chuẩn: <span style="color: #047857; font-weight: bold;">${escapeHtml(fb.answer)}</span> (${fb.score}đ)
              </div>`;
            })
            .join('')}
        </div>
      `
          : `
        <div style="padding-left: 12px;">
          ${(q.options || [])
            .map((opt: any) => {
              const isSelected = q.studentAnswer?.selectedOptionIds?.map(String).includes(String(opt.id));
              const isCorrect = opt.isCorrect;
              return `
              <div style="margin: 2px 0; ${isSelected ? 'font-weight: bold;' : ''}">
                ${opt.label}. ${escapeHtml(opt.content)}
                ${isSelected ? ' [X - Thí sinh chọn]' : ''}
                ${isCorrect ? ' [Đáp án chuẩn]' : ''}
              </div>`;
            })
            .join('')}
        </div>
      `
      }
    </div>`
    )
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hồ sơ lưu trữ bài thi - ${escapeHtml(data.student?.studentCode || '')}</title>
      <style>
        @page { size: A4 portrait; margin: ${marginMm}mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.35; margin: 0; padding: 10px; }
        table.header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.header-table td { border: none; padding: 0; vertical-align: top; }
        .title { text-align: center; margin: 12px 0; }
        .title h1 { font-size: 14pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .title p { margin: 3px 0 0; font-size: 10.5pt; font-style: italic; }
        table.meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
        table.meta-table td { border: 1px solid #000; padding: 5px 8px; }
        .seal-box { border: 1px solid #000; padding: 6px 10px; font-size: 9pt; margin-bottom: 16px; background: transparent; }
        .footer-table { width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid; }
        .footer-table td { border: none; text-align: center; vertical-align: top; width: 50%; font-size: 10.5pt; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; font-size: 10.5pt;">${escapeHtml(institutionName)}</div>
            <div style="font-size: 10pt;">${escapeHtml(facultyName)}</div>
            <div style="border-top: 1px solid #000; display: inline-block; width: 110px; margin-top: 2px;"></div>
          </td>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; font-size: 10.5pt;">${escapeHtml(mottoTop || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
            <div style="font-weight: bold; font-size: 10pt; font-style: italic;">${escapeHtml(mottoBottom || 'Độc lập - Tự do - Hạnh phúc')}</div>
            <div style="border-top: 1px solid #000; display: inline-block; width: 110px; margin-top: 2px;"></div>
          </td>
        </tr>
      </table>

      <div class="title">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 25%;"><strong>Họ và tên thí sinh:</strong></td>
          <td style="width: 35%; font-weight: bold;">${escapeHtml(data.student?.fullName || '')}</td>
          <td style="width: 20%;"><strong>Mã sinh viên:</strong></td>
          <td style="width: 20%; font-weight: bold;">${escapeHtml(data.student?.studentCode || '')}</td>
        </tr>
        <tr>
          <td><strong>Lớp học / Khoa:</strong></td>
          <td>${escapeHtml(data.student?.className || '')} - ${escapeHtml(data.student?.departmentName || '')}</td>
          <td><strong>Điểm chính thức:</strong></td>
          <td style="font-weight: bold; font-size: 12pt;">${data.submission?.totalScore ?? '0'}/${data.submission?.maxScore || 10}</td>
        </tr>
        <tr>
          <td><strong>Môn thi / Mã HP:</strong></td>
          <td>${escapeHtml(data.schedule?.subjectName || '')} (${escapeHtml(data.schedule?.subjectCode || '')})</td>
          <td><strong>Mã đề thi:</strong></td>
          <td>${escapeHtml(data.paperInfo?.paperCode || '')}</td>
        </tr>
        <tr>
          <td><strong>Ngày thi / Giờ thi:</strong></td>
          <td>${data.schedule?.examDate ? new Date(data.schedule.examDate).toLocaleDateString('vi-VN') : ''} (${escapeHtml(data.schedule?.timeSlot || '')})</td>
          <td><strong>Ngày công bố:</strong></td>
          <td>${data.submission?.publishedAt ? new Date(data.submission.publishedAt).toLocaleDateString('vi-VN') : 'Đã công bố'}</td>
        </tr>
      </table>

      <div class="seal-box">
        <strong>MÃ NIÊM PHONG SỐ (DIGITAL SEAL):</strong> ${escapeHtml(data.digitalSeal?.sealHash || '')}<br/>
        <em>Trạng thái chứng thực:</em> Đã niêm phong lưu trữ đào tạo | Cán bộ duyệt: ${escapeHtml(data.submission?.approvedBy || 'Hội đồng khảo thí')}
      </div>

      <div style="font-weight: bold; font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase;">
        NỘI DUNG CHI TIẾT BÀI LÀM CỦA THÍ SINH
      </div>

      ${questionsHtml}

      <table class="footer-table">
        <tr>
          ${signersHtml}
        </tr>
      </table>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
  return true;
}

/**
 * In trọn bộ túi hồ sơ bài thi của một ca thi (Batch Archive Dossier)
 * Trang 1: Bìa túi bài thi niêm phong & Bảng điểm tổng hợp
 * Trang 2+: Toàn bộ bài làm của từng sinh viên (phân trang chuẩn A4)
 */
export function printBatchArchivedDossier(data: any): boolean {
  if (!data || !data.schedule || !Array.isArray(data.attempts)) return false;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const published = templateCache ? (templateCache['EXAM_ARCHIVE_DOSSIER'] || templateCache['EXAM_PAPER_OFFICIAL']) : null;
  const institutionName = published?.header?.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
  const facultyName = published?.header?.facultyName || 'PHÒNG KHẢO THÍ & ĐBCL';
  const motto = published?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const marginMm = published?.page?.marginMm || 12;

  const [mottoTop, mottoBottom] = motto.split('\n');

  const escapeHtml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const schedule = data.schedule;
  const attempts = data.attempts;

  // Bảng tổng hợp danh sách thí sinh trang 1
  const summaryRowsHtml = attempts
    .map(
      (att: any, idx: number) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; font-weight: bold;">${escapeHtml(att.student.studentCode)}</td>
      <td>${escapeHtml(att.student.fullName)}</td>
      <td style="text-align: center;">${escapeHtml(att.student.className)}</td>
      <td style="text-align: center; font-weight: bold;">${att.submission.totalScore}</td>
      <td style="text-align: center; font-family: monospace; font-size: 8pt;">${escapeHtml(att.digitalSeal?.sealShort || '')}</td>
      <td>${escapeHtml(att.submission.approvedBy || 'Hội đồng Khảo thí')}</td>
    </tr>
  `
    )
    .join('');

  // Danh sách hồ sơ chi tiết từng thí sinh (từ trang 2 trở đi)
  const studentDossiersHtml = attempts
    .map((att: any, attIdx: number) => {
      const qHtml = (att.questions || [])
        .map(
          (q: any) => `
        <div style="margin-bottom: 14px; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 3px;">
            Câu ${q.index} (${q.maxScore}đ) [${escapeHtml(q.code)}]: ${escapeHtml(q.content)}
          </div>
          ${
            q.type === 'ESSAY'
              ? `
            <div style="border: 1px solid #000; padding: 6px; margin-top: 4px; min-height: 35px;">
              <strong>Bài làm của thí sinh:</strong><br/>
              ${escapeHtml(q.studentAnswer?.textAnswer || '(Không có nội dung văn bản)')}
            </div>
            <div style="margin-top: 3px; font-size: 9.5pt; font-style: italic;">
              Điểm: <strong>${q.studentAnswer?.finalScore}/${q.maxScore}</strong> | Nhận xét: ${escapeHtml(q.studentAnswer?.teacherComment || 'Đạt')}
            </div>
          `
              : `
            <div style="padding-left: 10px;">
              ${(q.options || [])
                .map((opt: any) => {
                  const isSelected = q.studentAnswer?.selectedOptionIds?.includes(opt.id);
                  const isCorrect = opt.isCorrect;
                  return `
                  <div style="margin: 2px 0; ${isSelected ? 'font-weight: bold;' : ''}">
                    ${opt.label}. ${escapeHtml(opt.content)}
                    ${isSelected ? ' [X - Chọn]' : ''}
                    ${isCorrect ? ' [Chuẩn]' : ''}
                  </div>`;
                })
                .join('')}
            </div>
          `
          }
        </div>
      `
        )
        .join('');

      return `
      <div style="page-break-before: always;">
        <table class="header-table">
          <tr>
            <td style="width: 50%; text-align: center;">
              <div style="font-weight: bold; font-size: 10pt;">${escapeHtml(institutionName)}</div>
              <div style="font-size: 9.5pt;">${escapeHtml(facultyName)}</div>
              <div style="border-top: 1px solid #000; display: inline-block; width: 100px; margin-top: 2px;"></div>
            </td>
            <td style="width: 50%; text-align: center;">
              <div style="font-weight: bold; font-size: 10pt;">${escapeHtml(mottoTop || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
              <div style="font-weight: bold; font-size: 9.5pt; font-style: italic;">${escapeHtml(mottoBottom || 'Độc lập - Tự do - Hạnh phúc')}</div>
              <div style="border-top: 1px solid #000; display: inline-block; width: 100px; margin-top: 2px;"></div>
            </td>
          </tr>
        </table>

        <div class="title" style="margin: 8px 0;">
          <h2 style="font-size: 12.5pt; margin: 0; text-transform: uppercase;">BÀI THI KẾT THÚC HỌC PHẦN (LƯU TRỮ CHÍNH QUY)</h2>
          <p style="margin: 2px 0; font-size: 9.5pt; font-style: italic;">(Bài thi số ${attIdx + 1}/${attempts.length}, thuộc túi bài thi niêm phong)</p>
        </div>

        <table class="meta-table" style="margin-bottom: 12px;">
          <tr>
            <td style="width: 25%;"><strong>Họ và tên thí sinh:</strong></td>
            <td style="width: 35%; font-weight: bold;">${escapeHtml(att.student.fullName)}</td>
            <td style="width: 20%;"><strong>Mã sinh viên:</strong></td>
            <td style="width: 20%; font-weight: bold;">${escapeHtml(att.student.studentCode)}</td>
          </tr>
          <tr>
            <td><strong>Lớp / Khoa:</strong></td>
            <td>${escapeHtml(att.student.className)} - ${escapeHtml(att.student.departmentName)}</td>
            <td><strong>Điểm chính thức:</strong></td>
            <td style="font-weight: bold; font-size: 11pt;">${att.submission.totalScore}/${att.submission.maxScore || 10}</td>
          </tr>
          <tr>
            <td><strong>Môn thi / Ca thi:</strong></td>
            <td>${escapeHtml(schedule.subjectName)} (${escapeHtml(schedule.subjectCode)})</td>
            <td><strong>Mã niêm phong:</strong></td>
            <td style="font-family: monospace; font-size: 8.5pt;">${escapeHtml(att.digitalSeal?.sealShort || '')}</td>
          </tr>
        </table>

        <div style="font-weight: bold; font-size: 10pt; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase;">
          NỘI DUNG BÀI LÀM CỦA THÍ SINH
        </div>

        ${qHtml}

        <table class="footer-table" style="margin-top: 20px;">
          <tr>
            <td>
              <div><strong>CÁN BỘ CHẤM THI</strong></div>
              <div style="font-style: italic; font-size: 9pt;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 50px;"></div>
              <div>${escapeHtml(att.submission.gradedBy || 'Cán bộ chấm thi')}</div>
            </td>
            <td>
              <div><strong>TRƯỞNG PHÒNG KHẢO THÍ &amp; ĐBCL</strong></div>
              <div style="font-style: italic; font-size: 9pt;">(Ký, đóng dấu lưu trữ)</div>
              <div style="height: 50px;"></div>
              <div>${escapeHtml(att.submission.approvedBy || 'Hội đồng Khảo thí')}</div>
            </td>
          </tr>
        </table>
      </div>
    `;
    })
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Trọn bộ túi hồ sơ bài thi - ${escapeHtml(schedule.subjectCode)}</title>
      <style>
        @page { size: A4 portrait; margin: ${marginMm}mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; line-height: 1.35; margin: 0; padding: 8px; }
        table.header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.header-table td { border: none; padding: 0; vertical-align: top; }
        .title { text-align: center; margin: 12px 0; }
        .title h1 { font-size: 14pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .title p { margin: 3px 0 0; font-size: 10pt; font-style: italic; }
        table.meta-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9.5pt; }
        table.meta-table td { border: 1px solid #000; padding: 4px 7px; }
        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
        table.data-table th, table.data-table td { border: 1px solid #000; padding: 5px 6px; }
        table.data-table th { background: #f2f2f2; font-weight: bold; text-align: center; }
        .footer-table { width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid; }
        .footer-table td { border: none; text-align: center; vertical-align: top; width: 50%; font-size: 10pt; }
        @media print {
          body { padding: 0; }
          table.data-table th { background: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <!-- TRANG 1: BÌA TÚI BÀI THI NIÊM PHONG & BẢNG ĐIỂM TỔNG HỢP -->
      <table class="header-table">
        <tr>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; font-size: 10.5pt;">${escapeHtml(institutionName)}</div>
            <div style="font-size: 10pt;">${escapeHtml(facultyName)}</div>
            <div style="border-top: 1px solid #000; display: inline-block; width: 110px; margin-top: 2px;"></div>
          </td>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; font-size: 10.5pt;">${escapeHtml(mottoTop || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
            <div style="font-weight: bold; font-size: 10pt; font-style: italic;">${escapeHtml(mottoBottom || 'Độc lập - Tự do - Hạnh phúc')}</div>
            <div style="border-top: 1px solid #000; display: inline-block; width: 110px; margin-top: 2px;"></div>
          </td>
        </tr>
      </table>

      <div class="title">
        <h1>TÚI HỒ SƠ BÀI THI LƯU TRỮ ĐÃ NIÊM PHONG</h1>
        <p>(Bản trích lục kiểm toán, thanh tra và kiểm định chất lượng đào tạo)</p>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 25%;"><strong>Môn học / Mã HP:</strong></td>
          <td style="width: 35%; font-weight: bold;">${escapeHtml(schedule.subjectName)} (${escapeHtml(schedule.subjectCode)})</td>
          <td style="width: 20%;"><strong>Kỳ thi / Niên khóa:</strong></td>
          <td style="width: 20%; font-weight: bold;">${escapeHtml(schedule.examPeriodName)}</td>
        </tr>
        <tr>
          <td><strong>Khoa / Đơn vị:</strong></td>
          <td>${escapeHtml(schedule.departmentName || 'Khoa đào tạo')}</td>
          <td><strong>Ngày thi / Giờ thi:</strong></td>
          <td>${schedule.examDate ? new Date(schedule.examDate).toLocaleDateString('vi-VN') : ''} (${escapeHtml(schedule.timeSlot)})</td>
        </tr>
        <tr>
          <td><strong>Mã đề thi gốc:</strong></td>
          <td>${escapeHtml(schedule.paperCode || 'Mã đề gốc')}</td>
          <td><strong>Tổng số bài thi:</strong></td>
          <td style="font-weight: bold; font-size: 11pt;">${attempts.length} bài thi niêm phong</td>
        </tr>
        <tr>
          <td><strong>Niên hạn lưu trữ:</strong></td>
          <td colspan="3">
            Thời hạn <strong>${schedule.retentionYears ? `${schedule.retentionYears} năm` : '02 năm'}</strong>, hết hạn vào ngày: 
            <strong>${schedule.retentionUntil ? new Date(schedule.retentionUntil).toLocaleDateString('vi-VN') : 'Đang tính toán'}</strong> 
            (${escapeHtml(schedule.remainingTimeText || '')})
          </td>
        </tr>
      </table>

      <div style="font-weight: bold; font-size: 10pt; margin-bottom: 6px; text-transform: uppercase;">
        DANH SÁCH BÀI THI TRONG TÚI HỒ SƠ NIÊM PHONG SỐ (SHA-256)
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 6%;">STT</th>
            <th style="width: 14%;">MSSV</th>
            <th style="width: 26%;">Họ và tên thí sinh</th>
            <th style="width: 14%;">Lớp</th>
            <th style="width: 10%;">Điểm</th>
            <th style="width: 14%;">Mã niêm phong</th>
            <th style="width: 16%;">Cán bộ duyệt</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRowsHtml}
        </tbody>
      </table>

      <table class="footer-table">
        <tr>
          <td>
            <div><strong>CÁN BỘ CHẤM THI</strong></div>
            <div style="font-style: italic; font-size: 9pt;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 55px;"></div>
            <div>...................................................</div>
          </td>
          <td>
            <div><strong>TRƯỞNG PHÒNG KHẢO THÍ &amp; ĐBCL</strong></div>
            <div style="font-style: italic; font-size: 9pt;">(Ký, đóng dấu xác nhận lưu trữ)</div>
            <div style="height: 55px;"></div>
            <div>...................................................</div>
          </td>
        </tr>
      </table>

      <!-- TRANG 2+: TOÀN BỘ BÀI THI CHI TIẾT CỦA TỪNG SINH VIÊN -->
      ${studentDossiersHtml}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
  return true;
}

/**
 * In Biên bản đề xuất tiêu hủy bài thi đã hết niên hạn 2 năm theo Thông tư 08/2021/TT-BGDĐT
 */
export function printDisposalProposal(data: any): boolean {
  if (!data || !data.schedule) return false;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const published = templateCache ? (templateCache['EXAM_ROOM_MINUTES'] || templateCache['EXAM_PAPER_OFFICIAL']) : null;
  const institutionName = published?.header?.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
  const facultyName = published?.header?.facultyName || 'HỘI ĐỒNG KHẢO THÍ & ĐBCL';
  const motto = published?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';

  const [mottoTop, mottoBottom] = motto.split('\n');

  const escapeHtml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const schedule = data.schedule;
  const regulations = data.regulations || [];
  const councilMembers = data.councilMembers || [];

  const regHtml = regulations.map((r: string) => `<li style="margin-bottom: 4px;">${escapeHtml(r)}</li>`).join('');
  const membersHtml = councilMembers
    .map(
      (m: any, idx: number) => `
    <tr>
      <td style="text-align: center; width: 8%;">${idx + 1}</td>
      <td style="font-weight: bold; width: 40%;">${escapeHtml(m.role)}</td>
      <td>${escapeHtml(m.title)}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Biên bản đề xuất tiêu hủy - ${escapeHtml(schedule.subjectCode)}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.4; margin: 0; padding: 10px; }
        table.header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.header-table td { border: none; padding: 0; vertical-align: top; }
        .title { text-align: center; margin: 16px 0; }
        .title h1 { font-size: 14pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .title p { margin: 4px 0 0; font-size: 10.5pt; font-style: italic; }
        table.meta-table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 10pt; }
        table.meta-table td { border: 1px solid #000; padding: 6px 8px; }
        table.data-table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 10pt; }
        table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px 8px; }
        table.data-table th { background: #f2f2f2; font-weight: bold; text-align: center; }
        .footer-table { width: 100%; border-collapse: collapse; margin-top: 32px; page-break-inside: avoid; }
        .footer-table td { border: none; text-align: center; vertical-align: top; width: 50%; font-size: 10.5pt; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; font-size: 10.5pt;">${escapeHtml(institutionName)}</div>
            <div style="font-size: 10pt;">${escapeHtml(facultyName)}</div>
            <div style="font-size: 9.5pt; margin-top: 2px;">Số: ${escapeHtml(data.proposalCode)}</div>
            <div style="border-top: 1px solid #000; display: inline-block; width: 110px; margin-top: 2px;"></div>
          </td>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold; font-size: 10.5pt;">${escapeHtml(mottoTop || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
            <div style="font-weight: bold; font-size: 10pt; font-style: italic;">${escapeHtml(mottoBottom || 'Độc lập - Tự do - Hạnh phúc')}</div>
            <div style="border-top: 1px solid #000; display: inline-block; width: 110px; margin-top: 2px;"></div>
            <div style="font-size: 9.5pt; font-style: italic; margin-top: 4px;">Cần Thơ, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</div>
          </td>
        </tr>
      </table>

      <div class="title">
        <h1>BIÊN BẢN ĐỀ XUẤT TIÊU HỦY BÀI THI KẾT THÚC HỌC PHẦN</h1>
        <p>(Theo niên hạn lưu trữ ${data.schedule?.retentionYears ? `${data.schedule.retentionYears} năm` : '02 năm'})</p>
      </div>

      <div style="margin-bottom: 12px;">
        <ul style="padding-left: 20px; margin: 0; font-size: 10pt; font-style: italic;">
          ${regHtml}
        </ul>
      </div>

      <div style="margin-bottom: 8px;">
        Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')}, Hội đồng Khảo thí tiến hành họp và lập biên bản kiểm kê, đề xuất tiêu hủy túi bài thi đã hết niên hạn lưu trữ theo quy chế đào tạo, chi tiết như sau:
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 28%;"><strong>Học phần / Mã HP:</strong></td>
          <td style="width: 72%; font-weight: bold;">${escapeHtml(schedule.subjectName)} (${escapeHtml(schedule.subjectCode)})</td>
        </tr>
        <tr>
          <td><strong>Khoa đào tạo:</strong></td>
          <td>${escapeHtml(schedule.departmentName)}</td>
        </tr>
        <tr>
          <td><strong>Kỳ thi / Đợt thi:</strong></td>
          <td>${escapeHtml(schedule.examPeriodName)}</td>
        </tr>
        <tr>
          <td><strong>Ngày thi chính thức:</strong></td>
          <td>${schedule.examDate ? new Date(schedule.examDate).toLocaleDateString('vi-VN') : ''}</td>
        </tr>
        <tr>
          <td><strong>Số lượng bài thi:</strong></td>
          <td style="font-weight: bold;">${schedule.attemptCount} bài thi kết thúc học phần</td>
        </tr>
        <tr>
          <td><strong>Thời hạn lưu trữ 02 năm:</strong></td>
          <td>
            Hết hạn vào ngày: <strong>${schedule.retentionUntil ? new Date(schedule.retentionUntil).toLocaleDateString('vi-VN') : ''}</strong> 
            (Tình trạng: <span style="font-weight: bold;">${escapeHtml(schedule.remainingTimeText || 'Đã đủ niên hạn')}</span>)
          </td>
        </tr>
      </table>

      <div style="font-weight: bold; margin: 12px 0 6px;">THÀNH PHẦN HỘI ĐỒNG XEM XÉT TIÊU HỦY:</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Trách nhiệm trong Hội đồng</th>
            <th>Chức danh / Đơn vị công tác</th>
          </tr>
        </thead>
        <tbody>
          ${membersHtml}
        </tbody>
      </table>

      <div style="margin: 12px 0;">
        <strong>KẾT LUẬN &amp; PHƯƠNG ÁN TIÊU HỦY:</strong>
        <p style="margin: 4px 0 0; text-align: justify;">
          Toàn bộ các bài thi nêu trên đã được đối chiếu, chốt điểm vào bảng điểm gốc lưu trữ vĩnh viễn và không có bất kỳ tranh chấp hoặc khiếu nại phúc khảo nào còn tồn đọng. Hội đồng kính trình Ban Giám hiệu phê duyệt cho phép tiêu hủy cơ học đối với tài liệu giấy và chuyển dữ liệu số sang phân vùng kho lưu trữ đóng băng (Cold Archive).
        </p>
      </div>

      <table class="footer-table">
        <tr>
          <td>
            <div><strong>THƯ KÝ HỘI ĐỒNG</strong></div>
            <div style="font-style: italic; font-size: 9.5pt;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div>...................................................</div>
          </td>
          <td>
            <div><strong>CHỦ TỊCH HỘI ĐỒNG</strong></div>
            <div style="font-style: italic; font-size: 9.5pt;">(Ký, đóng dấu phê duyệt)</div>
            <div style="height: 60px;"></div>
            <div>...................................................</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
  return true;
}
