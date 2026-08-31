import { formatFillBlankForPrint, FillBlankAnswerItem } from './fill-blank-helper';
import { getSchoolLogoUrl } from './school-logo';
import { fixHtmlImageUrls, getImageUrl } from './media-utils';

export interface ExamQuestionExportItem {
  index?: number;
  order?: number;
  code?: string;
  content: string;
  score?: number;
  type?: string;
  options?: Array<{ key?: string; label?: string; text?: string; content?: string; isCorrect?: boolean; media?: any[] }>;
  fillBlankAnswers?: FillBlankAnswerItem[];
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation?: string;
  answerExplanation?: string;
  media?: Array<{ id?: number | string; url?: string; type?: string; mimeType?: string; fileName?: string }>;
}

export interface ExamPaperExportModel {
  paperCode: string;
  title?: string;
  paperTitle?: string;
  subjectName: string;
  subjectCode: string;
  durationMinutes: number;
  totalScore: number;
  variantCount?: number;
  examType?: string;
  schoolName?: string;
  departmentName?: string;
  institutionName?: string;
  facultyName?: string;
  motto?: string;
  subtitle?: string;
  logoUrl?: string;
  showLogo?: boolean;
  instructionText?: string;
  showScoreBox?: boolean;
  showInstructions?: boolean;
  footerNotes?: string;
  pageSize?: 'A4' | 'A5';
  essayHeaderMode?: 'STANDARD' | 'ANONYMIZED_CUT';
  duplexPrinting?: boolean;
  phachCode?: string;
  signers?: Array<{ title: string; subtitle?: string }>;
  questions: ExamQuestionExportItem[];
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

let globalPublishedTemplates: Record<string, any> = {};

export function setGlobalPublishedTemplates(map: Record<string, any>) {
  globalPublishedTemplates = map || {};
}

export function getGlobalPublishedTemplates(): Record<string, any> {
  return globalPublishedTemplates;
}

/**
 * Xử lý định dạng nội dung câu hỏi và đáp án cho bản In & Word:
 * - Nếu chuỗi chứa HTML tags (b, i, sub, sup, p, img, table, br...), làm sạch và chuẩn hóa đường dẫn ảnh.
 * - Nếu chuỗi là văn bản thuần túy, escape ký tự đặc biệt an toàn.
 */
function formatQuestionContentForPrint(content?: string | null): string {
  if (!content) return '';
  const trimmed = String(content).trim();
  const hasHtmlTags = /<([a-z][a-z0-9]*)\b[^>]*>/i.test(trimmed);
  if (hasHtmlTags) {
    return fixHtmlImageUrls(trimmed);
  }
  return escapeHtml(trimmed);
}

/**
 * Sinh HTML hiển thị danh sách hình ảnh đính kèm (q.media)
 */
function renderQuestionMediaForPrint(media?: Array<{ url?: string; type?: string; mimeType?: string; fileName?: string }>): string {
  if (!media || media.length === 0) return '';
  const imageItems = media.filter((m) => {
    if (!m.url) return false;
    const type = String(m.type || '').toUpperCase();
    const mime = String(m.mimeType || '').toLowerCase();
    const isImgExt = /\.(png|jpe?g|webp|gif|svg)$/i.test(m.url);
    return type === 'IMAGE' || mime.startsWith('image/') || isImgExt;
  });

  if (imageItems.length === 0) return '';

  return `
    <div class="question-media-wrap" style="margin:6px 0 8px 14px; text-align:center;">
      ${imageItems
        .map(
          (m) => `
        <div style="display:inline-block; margin:4px 8px; text-align:center; vertical-align:top;">
          <img src="${getImageUrl(m.url)}" alt="${escapeHtml(m.fileName || 'Hình minh họa')}" style="max-width:340px; max-height:220px; object-fit:contain; display:inline-block; vertical-align:middle; border:1px solid #cbd5e1; border-radius:4px; padding:2px;" />
          ${m.fileName ? `<div style="font-size:9.5pt; font-style:italic; color:#475569; margin-top:2px;">${escapeHtml(m.fileName)}</div>` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Sinh bảng các phương án lựa chọn trắc nghiệm với cơ chế bố cục thông minh:
 * - Nếu bất kỳ phương án nào có hình ảnh hoặc chuỗi dài (> 55 ký tự) -> Tự động xếp 1 cột (100% dòng) để tránh lệch/đè chữ.
 * - Nếu tất cả phương án đều ngắn (<= 20 ký tự, 4 phương án) -> Xếp 4 cột (25% mỗi cột) trên 1 hàng.
 * - Mặc định -> Xếp 2 cột (50% / 50%) cân đối, đẹp mắt.
 */
function renderOptionsTableForPrint(
  options: Array<{ key?: string; label?: string; text?: string; content?: string; media?: any[] }>,
  optionLetters: string[]
): string {
  if (!options || options.length === 0) return '';

  const normalizedOptions = options.map((opt, oIdx) => {
    const letter = opt.key || opt.label || optionLetters[oIdx] || String(oIdx + 1);
    const rawText = opt.text || opt.content || '';
    const formattedText = formatQuestionContentForPrint(rawText);
    const hasMedia = opt.media && opt.media.length > 0;
    const mediaHtml = hasMedia ? renderQuestionMediaForPrint(opt.media) : '';
    const isLong = rawText.length > 55 || rawText.includes('<img') || rawText.includes('<p') || rawText.includes('<table') || hasMedia;
    return {
      letter,
      text: formattedText,
      mediaHtml,
      isLong,
      rawLength: rawText.length,
    };
  });

  const hasAnyLongOption = normalizedOptions.some((o) => o.isLong);
  const allShort = normalizedOptions.every((o) => o.rawLength <= 20 && !o.isLong) && normalizedOptions.length === 4;

  // 1 CỘT TOÀN DÒNG (Dành cho phương án dài hoặc có hình ảnh)
  if (hasAnyLongOption || normalizedOptions.length <= 1) {
    const rowsHtml = normalizedOptions.map((opt) => `
      <tr>
        <td style="width:100%; border:none; padding:4px 0; vertical-align:top;">
          <strong style="display:inline-block; min-width:24px;">${escapeHtml(opt.letter)}.</strong> ${opt.text}
          ${opt.mediaHtml}
        </td>
      </tr>
    `);
    return `<table class="options-table" style="width:100%; border-collapse:collapse; border:none; margin:4px 0 8px 14px; font-size:11.5pt; table-layout:fixed;">${rowsHtml.join('')}</table>`;
  }

  // 4 CỘT TRÊN 1 HÀNG (Dành cho các phương án siêu ngắn như số, chữ cái hoặc 1-2 từ)
  if (allShort) {
    const colsHtml = normalizedOptions.map((opt) => `
      <td style="width:25%; border:none; padding:4px 8px 4px 0; vertical-align:top;">
        <strong style="display:inline-block; min-width:20px;">${escapeHtml(opt.letter)}.</strong> ${opt.text}
      </td>
    `);
    return `<table class="options-table" style="width:100%; border-collapse:collapse; border:none; margin:4px 0 8px 14px; font-size:11.5pt; table-layout:fixed;"><tr>${colsHtml.join('')}</tr></table>`;
  }

  // 2 CỘT CÂN ĐỐI (50% / 50%)
  const rowsHtml: string[] = [];
  for (let i = 0; i < normalizedOptions.length; i += 2) {
    const opt1 = normalizedOptions[i];
    const opt2 = normalizedOptions[i + 1];

    const col1Html = opt1
      ? `<td style="width:50%; border:none; padding:4px 8px 4px 0; vertical-align:top;">
          <strong style="display:inline-block; min-width:22px;">${escapeHtml(opt1.letter)}.</strong> ${opt1.text}
          ${opt1.mediaHtml}
        </td>`
      : '<td style="width:50%; border:none;"></td>';

    const col2Html = opt2
      ? `<td style="width:50%; border:none; padding:4px 0 4px 8px; vertical-align:top;">
          <strong style="display:inline-block; min-width:22px;">${escapeHtml(opt2.letter)}.</strong> ${opt2.text}
          ${opt2.mediaHtml}
        </td>`
      : '<td style="width:50%; border:none;"></td>';

    rowsHtml.push(`<tr>${col1Html}${col2Html}</tr>`);
  }

  return `<table class="options-table" style="width:100%; border-collapse:collapse; border:none; margin:4px 0 8px 14px; font-size:11.5pt; table-layout:fixed;">${rowsHtml.join('')}</table>`;
}

/**
 * Thẻ ngắt trang tương thích tuyệt đối 100% cho Microsoft Word (.doc) và Trình duyệt In (Print / PDF)
 */
const WORD_PAGE_BREAK = '<br clear="all" style="page-break-before:always;" />';

/**
 * Tạo danh sách dòng kẻ chấm làm bài tự do dưới dạng bảng Table Rows
 */
function generateDottedLines(count = 5): string {
  const rows: string[] = [];
  for (let i = 0; i < count; i++) {
    rows.push('<tr><td style="border:none; border-bottom:1px dashed #000000; height:20pt; font-size:9pt; padding:0; vertical-align:bottom;">&nbsp;</td></tr>');
  }
  return `<table class="dotted-lines-table" style="width:100%; border-collapse:collapse; border:none; margin:2pt 0; table-layout:fixed;"><tbody>${rows.join('')}</tbody></table>`;
}

/**
 * Hàm sinh khối Đầu phách chuẩn Khảo thí dùng chung 100% cho mọi loại đề (Trắc nghiệm, Điền khuyết, Tự luận, Duplex)
 */
function renderUnifiedPaperHeader(
  paper: ExamPaperExportModel,
  config: {
    showLogo: boolean;
    logoUrl?: string;
    institutionName: string;
    facultyName: string;
    motto: string;
    title: string;
    subtitle: string;
    instructionText: string;
    showScoreBox?: boolean;
    isEssayCut?: boolean;
    phachCode?: string;
  }
): string {
  const {
    showLogo,
    logoUrl,
    institutionName,
    facultyName,
    motto,
    title,
    subtitle,
    instructionText,
    showScoreBox,
    isEssayCut,
    phachCode,
  } = config;

  // 1. NẾU LÀ ĐẦU PHÁCH CỦA ĐỀ THI TỰ LUẬN RỌC PHÁCH (CHUẨN 120MM MẶT 1)
  if (isEssayCut) {
    return `
    <!-- HEADER TRƯỜNG & QUỐC HIỆU CHUẨN GỐC -->
    <table class="header-grid" style="width:100%; border-collapse:collapse; margin-bottom:5px; table-layout:fixed;">
      <tr>
        <td class="inst-box" style="width:50%; text-align:center; vertical-align:top; font-size:11.5pt; font-weight:bold; border:none; padding:0;">
          <table style="border-collapse:collapse; margin:0 auto; border:none; width:auto;">
            <tr>
              ${showLogo && logoUrl ? `
                <td style="vertical-align:middle; padding-right:8px; border:none; width:52px; text-align:center;">
                  <img src="${logoUrl}" alt="Logo" width="52" height="52" style="width:52px; height:52px; max-width:52px; max-height:52px; display:block; margin:0 auto;" />
                </td>
              ` : ''}
              <td style="vertical-align:middle; text-align:center; border:none;">
                <div>${escapeHtml(institutionName)}</div>
                <div style="font-weight:normal; font-size:10.5pt; margin-top:1px;">${escapeHtml(facultyName)}</div>
                <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:130px; margin-top:2px;"></div>
              </td>
            </tr>
          </table>
        </td>
        <td class="motto-box" style="width:50%; text-align:center; vertical-align:top; font-size:11.5pt; font-weight:bold; border:none; padding:0;">
          <div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
          <em style="display:block; font-style:italic; font-size:11pt; margin-top:1px; font-weight:normal;">${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em>
          <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:130px; margin-top:2px;"></div>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ ĐỀ THI & HUY HIỆU MÃ ĐỀ -->
    <table style="width:100%; border-collapse:collapse; border:none; margin:3px 0 4px;">
      <tr>
        <td style="text-align:center; border:none; padding:0;">
          <h1 class="title" style="font-size:14pt; font-weight:bold; text-transform:uppercase; margin:0; line-height:1.2;">
            ${escapeHtml(title)}
          </h1>
          <div class="subtitle" style="font-style:italic; font-size:11pt; color:#475569; margin:2px 0 0;">
            ${escapeHtml(subtitle)}
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align:right; font-size:11pt; border:none; padding:2px 0 0;">
          MÃ ĐỀ THI: <strong>${escapeHtml(paper.paperCode)}</strong>
        </td>
      </tr>
    </table>

    <!-- KHUNG THÔNG TIN HỌC PHẦN (CHUẨN BẢNG 100%) -->
    <table class="exam-info-box" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin:4px 0; font-size:11pt; background:transparent; table-layout:fixed;">
      <tr>
        <td style="width:50%; border:none; padding:4px 8px;"><strong>Môn học:</strong> ${escapeHtml(paper.subjectName)}</td>
        <td style="width:50%; border:none; padding:4px 8px;"><strong>Mã học phần:</strong> ${escapeHtml(paper.subjectCode)}</td>
      </tr>
      <tr>
        <td style="width:50%; border:none; padding:4px 8px;"><strong>Thời gian làm bài:</strong> ${paper.durationMinutes} phút</td>
        <td style="width:50%; border:none; padding:4px 8px;"><strong>Thang điểm:</strong> ${paper.totalScore || 10} điểm</td>
      </tr>
    </table>

    <!-- BẢNG THÔNG TIN THÍ SINH & Ô SỐ PHÁCH 1 (RỘNG RÃI & RÕ NÉT) -->
    <table class="student-info-table" style="width:100%; border-collapse:collapse; margin:4px 0; border:1px solid #000000; font-size:11pt; table-layout:fixed;">
      <tr>
        <td colspan="2" style="width:54%; border:1px solid #000000; padding:5px 8px;"><strong>Họ và tên thí sinh:</strong> ................................................................</td>
        <td style="width:23%; border:1px solid #000000; padding:5px 8px;"><strong>MSSV:</strong> ...................................</td>
        <td rowspan="3" style="width:23%; border:1px solid #000000; padding:6px 4px; text-align:center; vertical-align:middle; background:#f8fafc;">
          <div style="font-size:10pt; font-weight:bold; text-transform:uppercase; color:#000000; letter-spacing:0.5px;">SỐ PHÁCH</div>
          <div style="font-size:8.5pt; font-style:italic; color:#475569; margin-bottom:3px;">(Phách 1)</div>
          <div style="margin:2px auto; font-size:13.5pt; font-weight:bold; font-family:Courier New, monospace; letter-spacing:1.5px; border:1.5px dashed #000000; padding:4px 8px; background:#ffffff; display:inline-block; border-radius:4px;">
            ${escapeHtml(phachCode || 'P-001')}
          </div>
        </td>
      </tr>
      <tr>
        <td style="width:28%; border:1px solid #000000; padding:5px 8px;"><strong>Lớp HP:</strong> ............................</td>
        <td style="width:26%; border:1px solid #000000; padding:5px 8px;"><strong>Phòng thi:</strong> ................</td>
        <td style="width:23%; border:1px solid #000000; padding:5px 8px;"><strong>SBD:</strong> ........................</td>
      </tr>
      <tr>
        <td style="width:28%; border:1px solid #000000; padding:5px 8px;"><strong>Ngày thi:</strong> ...../...../202...</td>
        <td style="width:26%; border:1px solid #000000; padding:5px 8px;"><strong>Ca thi:</strong> ................</td>
        <td style="width:23%; border:1px solid #000000; padding:5px 8px;"><strong>Chữ ký SV:</strong> ................</td>
      </tr>
    </table>

    <!-- KHUNG CÁN BỘ COI THI (ĐỦ CHIỀU CAO 54PX ĐỂ KÝ VÀ GHI RÕ HỌ TÊN) -->
    <table class="proctor-table" style="width:100%; border-collapse:collapse; margin:4px 0 0; border:1px solid #000000; table-layout:fixed;">
      <tr>
        <th style="width:50%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10.5pt; background:transparent;">CÁN BỘ COI THI 1</th>
        <th style="width:50%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10.5pt; background:transparent;">CÁN BỘ COI THI 2</th>
      </tr>
      <tr>
        <td style="width:50%; border:1px solid #000000; vertical-align:top; font-size:9.5pt; height:54px; text-align:center; padding:4px;"><em>(Ký và ghi rõ họ tên)</em></td>
        <td style="width:50%; border:1px solid #000000; vertical-align:top; font-size:9.5pt; height:54px; text-align:center; padding:4px;"><em>(Ký và ghi rõ họ tên)</em></td>
      </tr>
    </table>
    `;
  }

  return `
    <!-- HEADER TRƯỜNG & QUỐC HIỆU CHUẨN GỐC -->
    <table class="header-grid" style="width:100%; border-collapse:collapse; margin-bottom:5px; table-layout:fixed;">
      <tr>
        <td class="inst-box" style="width:50%; text-align:center; vertical-align:top; font-size:11.5pt; font-weight:bold; border:none; padding:0;">
          <table style="border-collapse:collapse; margin:0 auto; border:none; width:auto;">
            <tr>
              ${showLogo && logoUrl ? `
                <td style="vertical-align:middle; padding-right:8px; border:none; width:54px; text-align:center;">
                  <img src="${logoUrl}" alt="Logo" width="54" height="54" style="width:54px; height:54px; max-width:54px; max-height:54px; display:block; margin:0 auto;" />
                </td>
              ` : ''}
              <td style="vertical-align:middle; text-align:center; border:none;">
                <div>${escapeHtml(institutionName)}</div>
                <div style="font-weight:normal; font-size:10.5pt;">${escapeHtml(facultyName)}</div>
                <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:125px; margin-top:2px;"></div>
              </td>
            </tr>
          </table>
        </td>
        <td class="motto-box" style="width:50%; text-align:center; vertical-align:top; font-size:11.5pt; font-weight:bold; border:none; padding:0;">
          <div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
          <em style="display:block; font-style:italic; font-size:11pt; margin-top:1px; font-weight:normal;">${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em>
          <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:125px; margin-top:2px;"></div>
        </td>
      </tr>
    </table>

    <!-- HUY HIỆU MÃ ĐỀ THI -->
    <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:4px;">
      <tr>
        <td style="text-align:right; font-size:11.5pt; border:none; padding:0;">
          MÃ ĐỀ THI: <strong>${escapeHtml(paper.paperCode)}</strong>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ ĐỀ THI -->
    <div style="text-align:center; margin:3px 0;">
      <h1 class="title" style="font-size:14.5pt; font-weight:bold; text-transform:uppercase; margin:0 0 2px; line-height:1.2;">
        ${escapeHtml(title)}
      </h1>
      <div class="subtitle" style="font-style:italic; font-size:11pt; color:#475569; margin:0 0 5px;">
        ${escapeHtml(subtitle)}
      </div>
    </div>

    <!-- KHUNG THÔNG TIN HỌC PHẦN (CHUẨN BẢNG 100%) -->
    <table class="exam-info-box" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin:5px 0; font-size:11pt; background:transparent; table-layout:fixed;">
      <tr>
        <td style="width:50%; border:none; padding:5px 8px;"><strong>Môn học:</strong> ${escapeHtml(paper.subjectName)}</td>
        <td style="width:50%; border:none; padding:5px 8px;"><strong>Mã học phần:</strong> ${escapeHtml(paper.subjectCode)}</td>
      </tr>
      <tr>
        <td style="width:50%; border:none; padding:5px 8px;"><strong>Thời gian làm bài:</strong> ${paper.durationMinutes} phút</td>
        <td style="width:50%; border:none; padding:5px 8px;"><strong>Thang điểm:</strong> ${paper.totalScore || 10} điểm</td>
      </tr>
      <tr>
        <td colspan="2" style="border:none; text-align:center; font-style:italic; font-size:10.5pt; border-top:1px dashed #000000; padding:5px 8px;">
          ${escapeHtml(instructionText)}
        </td>
      </tr>
    </table>

    <!-- KHUNG ĐIỀN THÔNG TIN THÍ SINH (CHUẨN BẢNG 100% - KHÔNG BỊ TRÀN DÒNG) -->
    <table class="student-info-table" style="width:100%; border-collapse:collapse; margin:4px 0; border:1px solid #000000; font-size:11pt; table-layout:fixed;">
      <tr>
        <td colspan="2" style="width:68%; border:1px solid #000000; padding:5px 8px;"><strong>Họ và tên thí sinh:</strong> ................................................................</td>
        <td style="width:32%; border:1px solid #000000; padding:5px 8px;"><strong>MSSV:</strong> ...................................</td>
      </tr>
      <tr>
        <td style="width:36%; border:1px solid #000000; padding:5px 8px;"><strong>Lớp HP:</strong> ............................</td>
        <td style="width:32%; border:1px solid #000000; padding:5px 8px;"><strong>Phòng thi:</strong> ................</td>
        <td style="width:32%; border:1px solid #000000; padding:5px 8px;"><strong>SBD:</strong> ........................</td>
      </tr>
      <tr>
        <td style="width:36%; border:1px solid #000000; padding:5px 8px;"><strong>Ngày thi:</strong> ...../...../202...</td>
        <td style="width:32%; border:1px solid #000000; padding:5px 8px;"><strong>Ca thi:</strong> ................</td>
        <td style="width:32%; border:1px solid #000000; padding:5px 8px;"><strong>Chữ ký SV:</strong> ................</td>
      </tr>
    </table>

    <!-- KHUNG GIÁM THỊ VÀ CHẤM ĐIỂM (ĐỒNG BỘ CHIỀU CAO 56PX RỘNG RÃI) -->
    ${showScoreBox !== false ? `
    <table class="score-table" style="width:100%; border-collapse:collapse; margin:4px 0 0; border:1px solid #000000; table-layout:fixed;">
      <tr>
        <th style="width:24%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10.5pt; background:transparent;">CÁN BỘ COI THI 1</th>
        <th style="width:24%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10.5pt; background:transparent;">CÁN BỘ COI THI 2</th>
        <th style="width:22%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10.5pt; background:transparent;">ĐIỂM (Số)</th>
        <th style="width:30%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10.5pt; background:transparent;">ĐIỂM (Chữ) &amp; CB CHẤM</th>
      </tr>
      <tr>
        <td style="width:24%; border:1px solid #000000; vertical-align:top; font-size:9.5pt; height:56px; text-align:center; padding:4px;"><em>(Ký và ghi rõ họ tên)</em></td>
        <td style="width:24%; border:1px solid #000000; vertical-align:top; font-size:9.5pt; height:56px; text-align:center; padding:4px;"><em>(Ký và ghi rõ họ tên)</em></td>
        <td style="width:22%; border:1px solid #000000; vertical-align:middle; text-align:center; font-size:15pt; font-weight:bold; height:56px;"></td>
        <td style="width:30%; border:1px solid #000000; vertical-align:top; font-size:10pt; text-align:left; padding:4px 8px; height:56px;">
          <em>Điểm chữ: .............................</em><br>
          <em>CB Chấm: .............................</em>
        </td>
      </tr>
    </table>` : ''}
  `;
}

/**
 * Hàm sinh chuỗi HTML Đề thi chuẩn Khảo thí Quốc gia dùng chung 100% cho cả Bản In (PDF) và Xuất Word (.doc)
 */
export function generateUnifiedExamPaperHtml(
  papers: ExamPaperExportModel[],
  includeAnswerKey = false,
  customOptions?: Partial<ExamPaperExportModel>
): string {
  if (!papers || papers.length === 0) return '';

  const firstPaper = papers[0];
  const isEssay = firstPaper.examType === 'TU_LUAN' || customOptions?.examType === 'TU_LUAN';
  const isAnonymizedCut = customOptions?.essayHeaderMode === 'ANONYMIZED_CUT' || isEssay;

  // Đọc cấu hình mẫu published từ document-templates nếu có
  const examTemplate = globalPublishedTemplates['EXAM_PAPER_OFFICIAL'] || globalPublishedTemplates['EXAM_PAPER'] || null;

  const institutionName = customOptions?.institutionName || firstPaper.institutionName || examTemplate?.header?.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
  const facultyName = customOptions?.facultyName || firstPaper.facultyName || firstPaper.departmentName || examTemplate?.header?.facultyName || 'KHOA CÔNG NGHỆ THÔNG TIN';
  const motto = customOptions?.motto || firstPaper.motto || examTemplate?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const title = customOptions?.paperTitle || firstPaper.paperTitle || firstPaper.title || examTemplate?.header?.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN';
  const subtitle = customOptions?.subtitle || firstPaper.subtitle || examTemplate?.header?.subtitle || `Học kỳ 1 - Năm học ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
  const instructionText = customOptions?.instructionText || firstPaper.instructionText || examTemplate?.examInfo?.instructionText || '(Thí sinh làm bài trực tiếp vào phần BÀI LÀM bên dưới. Cán bộ coi thi không giải thích gì thêm.)';
  const signers = customOptions?.signers || firstPaper.signers || examTemplate?.footer?.signers || [
    { title: 'CÁN BỘ RA ĐỀ', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỞNG BỘ MÔN DUYỆT', subtitle: '(Ký, ghi rõ họ tên)' },
  ];

  const logoUrl = customOptions?.logoUrl || firstPaper.logoUrl || examTemplate?.header?.logoUrl || getSchoolLogoUrl();
  const showLogo = customOptions?.showLogo !== undefined ? customOptions.showLogo : (firstPaper.showLogo !== undefined ? firstPaper.showLogo : (examTemplate?.header?.showLogo !== false));

  const headerConfig = {
    showLogo,
    logoUrl,
    institutionName,
    facultyName,
    motto,
    title,
    subtitle,
    instructionText,
    showScoreBox: customOptions?.showScoreBox,
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 1. Render từng mã đề thi
  const papersHtml = papers.map((paper, paperIndex) => {
    // Tự động sinh hoặc gán mã phách in sẵn đồng nhất giữa Đầu phách và Thân bài thi
    const cleanCode = (paper.paperCode || 'TL').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const phachCode = paper.phachCode || customOptions?.phachCode || `P${cleanCode}-${String(paperIndex + 1).padStart(3, '0')}`;

    // NẾU LÀ ĐỀ THI TỰ LUẬN KẾT HỢP ĐẦU PHÁCH RỌC PHÁCH 2 MẶT (GOM ĐỀ + BÀI LÀM TỰ DO)
    if (isEssay && isAnonymizedCut) {
      // 1.1 Khối gom toàn bộ câu hỏi tự luận (Luôn sạch sẽ không kèm đáp án trực tiếp trong đề thi)
      const questionsListHtml = paper.questions.map((q, qIdx) => {
        const questionIndex = q.order || q.index || qIdx + 1;
        const scoreText = q.score != null ? ` (${q.score} điểm)` : '';
        const formattedContent = formatQuestionContentForPrint(q.content);
        const mediaHtml = renderQuestionMediaForPrint(q.media);

        return `
          <div class="essay-question-item" style="margin:4px 0; font-size:11pt; line-height:1.4;">
            <strong>Câu ${questionIndex}${scoreText}:</strong> ${formattedContent}
            ${mediaHtml}
          </div>
        `;
      }).join('');

      return `
        ${paperIndex > 0 ? WORD_PAGE_BREAK : ''}
        <!-- ======================= MẶT 1 (TRANG TRƯỚC) ======================= -->
        <div class="paper-page duplex-front${paperIndex > 0 ? ' page-break-before' : ''}">
          <!-- KHỐI ĐẦU PHÁCH CHUẨN ĐỒNG BỘ 100% VỚI HỆ THỐNG (120MM) -->
          <div class="anonymized-cut-header" style="height:120mm; max-height:120mm; box-sizing:border-box; overflow:hidden;">
            ${renderUnifiedPaperHeader(paper, { ...headerConfig, isEssayCut: true, phachCode })}
          </div>

          <!-- ĐƯỜNG CẮT PHÁCH MẶT 1 (TẠI ĐÚNG MỐC 120MM) -->
          <table class="perforated-cut-table" style="width:100%; border-collapse:collapse; margin:5px 0 6px; table-layout:fixed;">
            <tr>
              <td style="border:none; border-top:2px dashed #000000; text-align:center; padding-top:3px; font-size:9.5pt; font-weight:bold; color:#000000; letter-spacing:0.5px;">
                ✂ &nbsp; &mdash; &mdash; &mdash; &mdash; ĐƯỜNG CẮT PHÁCH (RỌC PHÁCH TRƯỚC KHI CHẤM BÀI) &mdash; &mdash; &mdash; &mdash; &nbsp; ✂
              </td>
            </tr>
          </table>

          <!-- THANH MINI-HEADER ĐỊNH DANH MÔN THI & MÃ ĐỀ -->
          <table style="width:100%; border-collapse:collapse; border:none; margin:2px 0 4px; font-size:10pt; font-weight:bold; table-layout:fixed;">
            <tr>
              <td style="border:none; padding:0; text-align:left;">
                MÔN THI: <span style="text-transform:uppercase;">${escapeHtml(paper.subjectName)}</span> (${escapeHtml(paper.subjectCode)})
              </td>
              <td style="border:none; padding:0; text-align:right;">
                MÃ ĐỀ THI: <strong>${escapeHtml(paper.paperCode)}</strong> | THỜI GIAN: ${paper.durationMinutes} PHÚT
              </td>
            </tr>
          </table>

          <!-- BẢNG KHỚP PHÁCH 2 & CHẤM ĐIỂM CỦA GIÁM KHẢO (CHUẨN 5 CỘT RỘNG RÃI) -->
          <table class="essay-grading-score-box" style="width:100%; border-collapse:collapse; margin:5px 0 10px; border:1px solid #000000; table-layout:fixed;">
            <tr>
              <th style="width:20%; border:1px solid #000000; padding:5px 4px; text-align:center; font-size:10.5pt; font-weight:bold; background:#f8fafc;">
                SỐ PHÁCH (Phách 2)
              </th>
              <th style="width:16%; border:1px solid #000000; padding:5px 4px; text-align:center; font-size:10.5pt; font-weight:bold; background:transparent;">
                ĐIỂM (Số)
              </th>
              <th style="width:24%; border:1px solid #000000; padding:5px 4px; text-align:center; font-size:10.5pt; font-weight:bold; background:transparent;">
                ĐIỂM (Chữ)
              </th>
              <th style="width:20%; border:1px solid #000000; padding:5px 4px; text-align:center; font-size:10.5pt; font-weight:bold; background:transparent;">
                CÁN BỘ CHẤM 1
              </th>
              <th style="width:20%; border:1px solid #000000; padding:5px 4px; text-align:center; font-size:10.5pt; font-weight:bold; background:transparent;">
                CÁN BỘ CHẤM 2
              </th>
            </tr>
            <tr>
              <td style="width:20%; border:1px solid #000000; vertical-align:middle; text-align:center; padding:6px 4px; background:#f8fafc; height:58px;">
                <div style="font-size:13.5pt; font-weight:bold; font-family:Courier New, monospace; letter-spacing:1.5px; border:1.5px dashed #000000; padding:4px 8px; background:#ffffff; display:inline-block; border-radius:4px;">
                  ${escapeHtml(phachCode || 'P-001')}
                </div>
              </td>
              <td style="width:16%; border:1px solid #000000; vertical-align:middle; text-align:center; font-size:15pt; font-weight:bold; height:58px;">
                &nbsp;
              </td>
              <td style="width:24%; border:1px solid #000000; vertical-align:top; font-size:10.5pt; padding:6px 8px; text-align:left; height:58px;">
                <em>Điểm chữ: .............................</em>
              </td>
              <td style="width:20%; border:1px solid #000000; vertical-align:top; font-size:9.5pt; padding:4px 6px; text-align:center; height:58px;">
                <em>(Ký, ghi rõ họ tên)</em>
              </td>
              <td style="width:20%; border:1px solid #000000; vertical-align:top; font-size:9.5pt; padding:4px 6px; text-align:center; height:58px;">
                <em>(Ký, ghi rõ họ tên)</em>
              </td>
            </tr>
          </table>

          <!-- KHỐI ĐỀ BÀI (GOM TẬP TRUNG TẤT CẢ CÂU HỎI TỰ LUẬN) -->
          <table class="gathered-exam-questions" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin:4px 0; background:transparent; table-layout:fixed;">
            <tr>
              <td style="padding:5px 8px; border:none;">
                <div style="font-weight:bold; font-size:11pt; text-transform:uppercase; margin-bottom:3px; color:#000000;">
                  ĐỀ BÀI:
                </div>
                <div class="questions-list">
                  ${questionsListHtml}
                </div>
                <div style="text-align:center; font-size:9.5pt; font-style:italic; color:#475569; margin-top:3px; border-top:1px dashed #000000; padding-top:2px;">
                  &mdash; &mdash; &mdash; (HẾT ĐỀ THI) &mdash; &mdash; &mdash;
                </div>
              </td>
            </tr>
          </table>

          <!-- KHỐI BÀI LÀM (DÒNG KẺ CHẤM TỰ DO MẶT 1) -->
          <div class="freeform-answer-zone" style="margin-top:4px; width:100%;">
            <div style="font-weight:bold; font-size:10.5pt; margin-bottom:2px; color:#000000;">
              BÀI LÀM:
            </div>
            <div class="dotted-lines-container">
              ${generateDottedLines(paper.questions.length >= 5 ? 4 : paper.questions.length >= 3 ? 6 : 8)}
            </div>
          </div>
        </div>

        <!-- ======================= MẶT 2 (TRANG SAU - DUPLEX) ======================= -->
        <div class="paper-page duplex-backside">
          <!-- 1. KHUNG KHÓA VÙNG PHÁCH BẢO MẬT (ĐÚNG 120MM - KHỚP TỌA ĐỘ 100% VỚI ĐẦU PHÁCH MẶT 1) -->
          <table class="security-anonymized-box" style="width:100%; height:120mm; max-height:120mm; border:1px dashed #000000; margin:0; background:transparent; table-layout:fixed; box-sizing:border-box;">
            <tr>
              <td style="text-align:center; vertical-align:middle; padding:14px; border:none;">
                <div style="font-size:12pt; font-weight:bold; color:#000000; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">
                  [ VÙNG PHÁCH BẢO MẬT &mdash; THÍ SINH TUYỆT ĐỐI KHÔNG VIẾT VÀO KHUNG NÀY ]
                </div>
                <div style="font-size:10.5pt; font-style:italic; color:#475569; max-width:520px; margin:0 auto; line-height:1.4;">
                  (Đây là mặt sau của phần Đầu Phách. Ban Rọc Phách sẽ cắt rời toàn bộ phần này theo đường cắt phách bên dưới để bảo mật thông tin trước khi bàn giao bài thi cho Cán bộ chấm thi)
                </div>
              </td>
            </tr>
          </table>

          <!-- 2. ĐƯỜNG RỌC PHÁCH MẶT 2 (KHỚP TỌA ĐỘ VỚI MẶT 1) -->
          <table class="perforated-cut-table" style="width:100%; border-collapse:collapse; margin:5px 0 6px; table-layout:fixed;">
            <tr>
              <td style="border:none; border-top:2px dashed #000000; text-align:center; padding-top:3px; font-size:9.5pt; font-weight:bold; color:#000000; letter-spacing:0.5px;">
                ✂ &nbsp; &mdash; &mdash; &mdash; &mdash; ĐƯỜNG CẮT PHÁCH (MẶT SAU) &mdash; &mdash; &mdash; &mdash; &nbsp; ✂
              </td>
            </tr>
          </table>

          <!-- 3. KHỐI BÀI LÀM TIẾP THEO (MẶT 2 TOÀN TRANG DÒNG KẺ CHẤM) -->
          <div class="freeform-answer-zone-back" style="font-size:11pt; width:100%; margin-top:4px;">
            <div style="font-weight:bold; font-size:10.5pt; margin-bottom:3px; color:#000000;">
              BÀI LÀM (Tiếp theo):
            </div>
            <div class="dotted-lines-container">
              ${generateDottedLines(15)}
            </div>
          </div>
        </div>
      `;
    }

    // TRƯỜNG HỢP ĐỀ THI TRẮC NGHIỆM HOẶC ĐỀ THI TIÊU CHUẨN (LUÔN SẠCH ĐÁP ÁN)
    const questionsHtml = paper.questions.map((q, qIdx) => {
      const questionIndex = q.order || q.index || qIdx + 1;
      const scoreText = q.score != null ? ` (${q.score} điểm)` : '';
      const isFillBlank = q.type === 'FILL_BLANK' || Boolean(q.fillBlankAnswers && q.fillBlankAnswers.length > 0);

      let optionsBody = '';
      if (isFillBlank) {
        optionsBody = '<div class="fill-blank-hint" style="margin:4px 0 6px 14px; font-style:italic; color:#475569; font-size:10.5pt;">(Thí sinh ghi đáp án điền vào các vị trí trống)</div>';
      } else if (q.options && q.options.length > 0) {
        optionsBody = renderOptionsTableForPrint(q.options, optionLetters);
      } else {
        optionsBody = `
          <table class="essay-space-table" style="width:100%; border-collapse:collapse; border:none; margin:6pt 0 10pt 14pt; table-layout:fixed;">
            <tbody>
              <tr><td style="border:none; border-bottom:1px dashed #000000; height:24pt; font-size:10pt; padding:0;">&nbsp;</td></tr>
              <tr><td style="border:none; border-bottom:1px dashed #000000; height:24pt; font-size:10pt; padding:0;">&nbsp;</td></tr>
              <tr><td style="border:none; border-bottom:1px dashed #000000; height:24pt; font-size:10pt; padding:0;">&nbsp;</td></tr>
              <tr><td style="border:none; border-bottom:1px dashed #000000; height:24pt; font-size:10pt; padding:0;">&nbsp;</td></tr>
            </tbody>
          </table>
        `;
      }

      const formattedContent = isFillBlank
        ? formatFillBlankForPrint(q.content, q.fillBlankAnswers, false)
        : formatQuestionContentForPrint(q.content);

      const mediaHtml = renderQuestionMediaForPrint(q.media);

      return `<div class="question-block" style="margin:14px 0; page-break-inside:avoid;">
        <div class="q-header" style="font-size:12pt; margin-bottom:4px; line-height:1.45;">
          <strong>Câu ${questionIndex}${scoreText}:</strong> ${formattedContent}
        </div>
        ${mediaHtml}
        ${optionsBody}
      </div>`;
    }).join('');

    return `
      ${paperIndex > 0 ? WORD_PAGE_BREAK : ''}
      <div class="paper-page${paperIndex > 0 ? ' page-break-before' : ''}">
        ${renderUnifiedPaperHeader(paper, headerConfig)}

        <!-- NỘI DUNG CÁC CÂU HỎI -->
        <div class="questions-container" style="margin-top:8px;">
          ${questionsHtml}
        </div>

        ${customOptions?.footerNotes ? `<p style="margin-top:12px; font-style:italic; font-size:10.5pt;"><em>* ${escapeHtml(customOptions.footerNotes)}</em></p>` : ''}

        <!-- KHUNG KÝ TÊN BAN ĐỀ & BỘ MÔN -->
        <table class="signers-table" style="width:100%; margin-top:28px; border-collapse:collapse; border:none; table-layout:fixed;">
          <tr>
            ${signers.map(s => `
              <td style="text-align:center; vertical-align:top; width:${100 / (signers.length || 1)}%; border:none; font-size:11.5pt;">
                <strong>${escapeHtml(s.title)}</strong>
                <em style="display:block; margin-top:4px; font-style:italic; color:#475569; font-size:11pt;">${escapeHtml(s.subtitle || '')}</em>
                <div style="min-height:48px;"></div>
              </td>
            `).join('')}
          </tr>
        </table>
      </div>
    `;
  }).join('');

  // 2. Render Bảng Đáp Án / Hướng Dẫn Chấm ở cuối file (Dành cho Cán bộ Chấm thi đối chiếu)
  let matrixAnswerKeyHtml = '';
  if (includeAnswerKey) {
    if (isEssay) {
      const essayAnswersRows = firstPaper.questions.map((q, qIdx) => {
        const questionIndex = q.order || q.index || qIdx + 1;
        const scoreText = q.score != null ? `${q.score} điểm` : '-';
        const answerText = q.explanation || q.answerExplanation || q.sampleAnswer || q.correctAnswer || 'Theo barem chấm của Bộ môn';
        return `
          <tr>
            <td style="width:15%; border:1px solid #000000; padding:6px 8px; text-align:center; font-weight:bold;">Câu ${questionIndex}</td>
            <td style="width:15%; border:1px solid #000000; padding:6px 8px; text-align:center; font-weight:bold;">${scoreText}</td>
            <td style="width:70%; border:1px solid #000000; padding:6px 10px; text-align:left;">${formatQuestionContentForPrint(answerText)}</td>
          </tr>
        `;
      }).join('');

      matrixAnswerKeyHtml = `
        ${WORD_PAGE_BREAK}
        <div class="paper-page answer-key-section">
          <div class="matrix-header" style="margin-bottom:14px;">
            <h2 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">
              HƯỚNG DẪN CHẤM &amp; ĐÁP ÁN ĐỀ THI TỰ LUẬN
            </h2>
            <p style="text-align:center; font-style:italic; margin-top:0; font-size:10pt;">
              (Dành cho Cán bộ Chấm thi đối chiếu thang điểm)
            </p>
            <p style="text-align:center; font-size:10.5pt;">
              <strong>Môn thi: ${escapeHtml(firstPaper.subjectName)} (${escapeHtml(firstPaper.subjectCode)})</strong>
            </p>
          </div>
          <table class="matrix-table" style="border-collapse:collapse; width:100% !important; margin-top:10px; font-size:10.5pt; table-layout:fixed;">
            <thead>
              <tr>
                <th style="width:15%; border:1px solid #000000; padding:6px 6px; background:transparent; font-weight:bold; text-align:center;">Câu hỏi</th>
                <th style="width:15%; border:1px solid #000000; padding:6px 6px; background:transparent; font-weight:bold; text-align:center;">Thang điểm</th>
                <th style="width:70%; border:1px solid #000000; padding:6px 6px; background:transparent; font-weight:bold; text-align:center;">Nội dung đáp án / Barem chấm</th>
              </tr>
            </thead>
            <tbody>
              ${essayAnswersRows}
            </tbody>
          </table>
        </div>
      `;
    } else {
      const maxQuestions = Math.max(...papers.map((p) => p.questions.length), 0);
      const tableHeaderCols = papers.map((p) => `
        <th style="border:1px solid #000000; padding:6px 6px; background:transparent; font-weight:bold; text-align:center;">
          Mã ${escapeHtml(p.paperCode)}
        </th>
      `).join('');

      let tableRows = '';
      for (let qIdx = 0; qIdx < maxQuestions; qIdx++) {
        const questionNum = qIdx + 1;
        const rowCols = papers.map((paper) => {
          const q = paper.questions[qIdx];
          if (!q) return '<td style="border:1px solid #000000; padding:6px 10px; text-align:center;">-</td>';

          if (q.options && q.options.length > 0) {
            const correctOpt = q.options.find((o) => o.isCorrect);
            const letter = correctOpt?.key || correctOpt?.label || '-';
            return `<td style="border:1px solid #000000; padding:6px 10px; text-align:center;"><strong>${escapeHtml(letter)}</strong></td>`;
          }

          if (q.fillBlankAnswers && q.fillBlankAnswers.length > 0) {
            const fillStr = q.fillBlankAnswers
              .map((a, i) => `${a.blankIndex || i + 1}: ${a.answer}`)
              .join('; ');
            return `<td style="border:1px solid #000000; padding:6px 10px; text-align:center;"><strong style="font-size:9.5pt;">${escapeHtml(fillStr)}</strong></td>`;
          }

          if (q.correctAnswer || q.sampleAnswer) {
            return `<td style="border:1px solid #000000; padding:6px 10px; text-align:center;"><strong>${escapeHtml(q.correctAnswer || q.sampleAnswer)}</strong></td>`;
          }

          return '<td style="border:1px solid #000000; padding:6px 10px; text-align:center;">(Tự luận)</td>';
        }).join('');

        tableRows += `<tr><th style="border:1px solid #000000; padding:6px 6px; background:transparent; font-weight:bold; text-align:center;">Câu ${questionNum}</th>${rowCols}</tr>`;
      }

      matrixAnswerKeyHtml = `
        ${WORD_PAGE_BREAK}
        <div class="paper-page answer-key-section">
          <div class="matrix-header" style="margin-bottom:14px;">
            <h2 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">
              BẢNG MA TRẬN ĐÁP ÁN TỔNG HỢP
            </h2>
            <p style="text-align:center; font-style:italic; margin-top:0; font-size:10pt;">
              (Dành cho Cán bộ Chấm thi và Khảo thí đối chiếu)
            </p>
            <p style="text-align:center; font-size:10.5pt;">
              <strong>Môn thi: ${escapeHtml(firstPaper.subjectName)} (${escapeHtml(firstPaper.subjectCode)})</strong>
            </p>
          </div>
          <table class="matrix-table" style="border-collapse:collapse; width:100% !important; margin-top:10px; font-size:10.5pt; table-layout:fixed;">
            <thead>
              <tr>
                <th style="border:1px solid #000000; padding:6px 6px; background:transparent; font-weight:bold; text-align:center;">Câu hỏi</th>
                ${tableHeaderCols}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="vi">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <title>${escapeHtml(title)} - ${escapeHtml(firstPaper.subjectName)}</title>
  <style>
    @page { size: 210mm 297mm; margin: 12mm 15mm 12mm 15mm; mso-page-orientation: portrait; }
    @page Section1 { size: 595.3pt 841.9pt; margin: 34pt 42.5pt 34pt 42.5pt; mso-header-margin: 28.3pt; mso-footer-margin: 28.3pt; mso-paper-source: 0; }
    div.Section1 { page: Section1; width: 100%; }
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; color: #000000; line-height: 1.35; margin: 0; padding: 0; }
    .page-break-before { page-break-before: always !important; break-before: page !important; }
    table { width: 100% !important; max-width: 100%; border-collapse: collapse; box-sizing: border-box; mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-table-tspace: 0pt; mso-table-bspace: 0pt; }
    .paper-page { width: 100%; margin: 0 auto; box-sizing: border-box; }
    .header-grid { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; }
    .header-grid td { vertical-align: top; border: none; padding: 0; }
    .inst-box { text-align: center; font-size: 11.5pt; font-weight: bold; width: 50%; }
    .inst-box table { width: auto; margin: 0 auto; border-collapse: collapse; }
    .inst-box img, img[alt="Logo"] { width: 54px !important; height: 54px !important; max-width: 54px !important; max-height: 54px !important; }
    .inst-box div { margin-bottom: 1px; }
    .inst-underline { border-top: 1px solid #000000; display: inline-block; width: 125px; margin-top: 2px; }
    .motto-box { text-align: center; font-size: 11.5pt; font-weight: bold; width: 50%; }
    .motto-box em { display: block; font-style: italic; margin-top: 1px; font-weight: normal; font-size: 11pt; }
    .title { text-align: center; font-size: 14.5pt; font-weight: bold; text-transform: uppercase; margin: 0 0 2px; line-height: 1.2; }
    .subtitle { text-align: center; font-style: italic; margin-bottom: 4px; font-size: 11pt; color: #475569; }
    .exam-info-box { width: 100%; border-collapse: collapse; border: 1px solid #000000; margin: 5px 0; font-size: 11pt; background: transparent; table-layout: fixed; }
    .student-info-table { width: 100%; border-collapse: collapse; margin: 5px 0; border: 1px solid #000000; font-size: 11pt; table-layout: fixed; }
    .student-info-table td { border: 1px solid #000000; padding: 5px 8px; vertical-align: middle; }
    .score-table th { border: 1px solid #000000; padding: 4px 6px; text-align: center; font-size: 10.5pt; font-weight: bold; background: transparent; }
    .score-table td { border: 1px solid #000000; height: 46px; vertical-align: top; font-size: 9.5pt; }
    .anonymized-cut-header { width: 100%; height: 120mm; max-height: 120mm; box-sizing: border-box; overflow: hidden; }
    .security-anonymized-box { width: 100%; height: 120mm; max-height: 120mm; border: 1px dashed #000000; box-sizing: border-box; table-layout: fixed; }
    .perforated-cut-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .perforated-cut-table td { border: none; border-top: 2px dashed #000000; text-align: center; font-size: 9.5pt; font-weight: bold; color: #000000; padding-top: 4px; letter-spacing: 0.5px; }
    .gathered-exam-questions { width: 100%; border-collapse: collapse; border: 1px solid #000000; margin: 6px 0; background: transparent; table-layout: fixed; }
    .essay-question-item { margin: 4px 0; font-size: 11.5pt; line-height: 1.4; }
    .question-block { margin: 14px 0; page-break-inside: avoid; }
    .q-header { font-size: 12pt; margin-bottom: 4px; line-height: 1.45; }
    .q-header p, .essay-question-item p { margin: 0 0 4px; }
    .options-table { width: 100%; border-collapse: collapse; border: none; margin: 4px 0 8px 14px; font-size: 11.5pt; table-layout: fixed; }
    .options-table td { border: none; padding: 4px 8px; vertical-align: top; line-height: 1.4; }
    .options-table p { margin: 0 0 2px; }
    .question-media-wrap { width: 100%; margin: 6px 0 8px; text-align: center; }
    .question-media-wrap img, .question-block img, .options-table img, .gathered-exam-questions img {
      max-width: 100% !important;
      max-height: 240px !important;
      height: auto !important;
      object-fit: contain;
      vertical-align: middle;
      margin: 4px 0;
      display: inline-block;
    }
    .fill-blank-hint { margin: 4px 0 6px 14px; font-style: italic; color: #475569; font-size: 10.5pt; }
    .dotted-lines-table { width: 100%; border-collapse: collapse; border: none; margin: 2pt 0; table-layout: fixed; }
    .dotted-lines-table td { border: none; border-bottom: 1px dashed #000000; height: 20pt; font-size: 9pt; padding: 0; vertical-align: bottom; }
    .essay-space-table { width: 100%; border-collapse: collapse; border: none; margin: 4pt 0 8pt 12px; table-layout: fixed; }
    .essay-space-table td { border: none; border-bottom: 1px dashed #000000; height: 20pt; font-size: 9pt; padding: 0; }
    .paper-code-badge { text-align: right; font-size: 11.5pt; margin-bottom: 3px; font-weight: bold; }
    .signers-table { width: 100%; margin-top: 28px; border-collapse: collapse; border: none; table-layout: fixed; }
    .signers-table td { text-align: center; vertical-align: top; border: none; font-size: 11.5pt; }
    .signers-table td em { display: block; margin-top: 4px; font-style: italic; color: #475569; font-size: 11pt; }
    .matrix-table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 10.5pt; }
    .matrix-table th, .matrix-table td { border: 1px solid #000000; padding: 6px 6px; text-align: center; background: transparent; }
    .matrix-table thead th { background-color: transparent; font-weight: bold; }
    .duplex-front { page-break-after: always !important; break-after: page !important; }
    .duplex-backside { page-break-before: always !important; break-before: page !important; }
    .answer-key-section { page-break-before: always !important; break-before: page !important; }
    @media print {
      body { padding: 0; }
      .paper-page { max-width: 100%; }
      .duplex-front { page-break-after: always !important; break-after: page !important; }
      .duplex-backside { page-break-before: always !important; break-before: page !important; }
      .page-break-before { page-break-before: always !important; break-before: page !important; }
      .answer-key-section { page-break-before: always !important; break-before: page !important; }
      @page { size: ${customOptions?.pageSize || 'A4'} portrait; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="Section1">
    ${papersHtml}
    ${matrixAnswerKeyHtml}
  </div>
</body>
</html>`;
}
