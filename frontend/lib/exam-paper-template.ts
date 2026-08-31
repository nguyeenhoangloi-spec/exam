import { formatFillBlankForPrint, FillBlankAnswerItem } from './fill-blank-helper';
import { getSchoolLogoUrl } from './school-logo';

export interface ExamQuestionExportItem {
  index?: number;
  order?: number;
  code?: string;
  content: string;
  score?: number;
  type?: string;
  options?: Array<{ key?: string; label?: string; text?: string; content?: string; isCorrect?: boolean }>;
  fillBlankAnswers?: FillBlankAnswerItem[];
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation?: string;
  answerExplanation?: string;
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
 * Thẻ ngắt trang tương thích tuyệt đối 100% cho Microsoft Word (.doc) và Trình duyệt In (Print / PDF)
 */
const WORD_PAGE_BREAK = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';

/**
 * Tạo danh sách dòng kẻ chấm làm bài tự do dưới dạng bảng Table Rows (Word không bao giờ bị collapse mất dòng)
 */
function generateDottedLines(count = 5): string {
  const rows: string[] = [];
  for (let i = 0; i < count; i++) {
    rows.push('<tr><td style="border:none; border-bottom:1px dashed #000000; height:20pt; font-size:9pt; padding:0; vertical-align:bottom;">&nbsp;</td></tr>');
  }
  return `<table class="dotted-lines-table" style="width:100%; border-collapse:collapse; border:none; margin:2pt 0; table-layout:fixed;"><tbody>${rows.join('')}</tbody></table>`;
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

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 1. Render từng mã đề thi
  const papersHtml = papers.map((paper, paperIndex) => {
    const pageBreakClass = paperIndex > 0 ? 'page-break-before' : '';
    const wordSectionBreak = paperIndex > 0 ? WORD_PAGE_BREAK : '';

    // NẾU LÀ ĐỀ THI TỰ LUẬN KẾT HỢP ĐẦU PHÁCH RỌC PHÁCH 2 MẶT (GOM ĐỀ + BÀI LÀM TỰ DO)
    if (isEssay && isAnonymizedCut) {
      // 1.1 Khối gom toàn bộ câu hỏi tự luận (Luôn sạch sẽ không kèm đáp án trực tiếp trong đề thi)
      const questionsListHtml = paper.questions.map((q, qIdx) => {
        const questionIndex = q.order || q.index || qIdx + 1;
        const scoreText = q.score != null ? ` (${q.score} điểm)` : '';

        return `
          <div class="essay-question-item" style="margin:6px 0; font-size:11pt; line-height:1.4;">
            <strong>Câu ${questionIndex}${scoreText}:</strong> ${escapeHtml(q.content)}
          </div>
        `;
      }).join('');

      return `
        ${wordSectionBreak}
        <!-- ======================= MẶT 1 (TRANG TRƯỚC) ======================= -->
        <div class="paper-page ${pageBreakClass} duplex-front" style="page-break-inside:avoid;">
          <!-- HEADER TRƯỜNG & QUỐC HIỆU CHUẨN GỐC -->
          <table class="header-grid" style="width:100%; border-collapse:collapse; margin-bottom:6px; table-layout:fixed;">
            <tr>
              <td class="inst-box" style="width:50%; text-align:center; vertical-align:top; font-size:11pt; font-weight:bold; border:none; padding:0;">
                <table style="border-collapse:collapse; margin:0 auto; border:none; width:auto;">
                  <tr>
                    ${showLogo && logoUrl ? `
                      <td style="vertical-align:middle; padding-right:8px; border:none; width:52px; text-align:center;">
                        <img src="${logoUrl}" alt="Logo" width="52" height="52" style="width:52px; height:52px; max-width:52px; max-height:52px; display:block; margin:0 auto;" />
                      </td>
                    ` : ''}
                    <td style="vertical-align:middle; text-align:center; border:none;">
                      <div>${escapeHtml(institutionName)}</div>
                      <div style="font-weight:normal; font-size:10pt;">${escapeHtml(facultyName)}</div>
                      <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:120px; margin-top:2px;"></div>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="motto-box" style="width:50%; text-align:center; vertical-align:top; font-size:11pt; font-weight:bold; border:none; padding:0;">
                <div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
                <em style="display:block; font-style:italic; font-size:10.5pt; margin-top:1px;">${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em>
                <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:120px; margin-top:2px;"></div>
              </td>
            </tr>
          </table>

          <!-- HUY HIỆU MÃ ĐỀ THI -->
          <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:4px;">
            <tr>
              <td style="text-align:right; font-size:11pt; border:none; padding:0;">
                MÃ ĐỀ THI: <strong>${escapeHtml(paper.paperCode)}</strong>
              </td>
            </tr>
          </table>

          <!-- TIÊU ĐỀ ĐỀ THI -->
          <div style="text-align:center; margin:2px 0;">
            <h1 class="title" style="font-size:14pt; font-weight:bold; text-transform:uppercase; margin:0 0 2px; line-height:1.2;">
              ${escapeHtml(title)}
            </h1>
            <div class="subtitle" style="font-style:italic; font-size:10.5pt; color:#475569; margin:0 0 6px;">
              ${escapeHtml(subtitle)}
            </div>
          </div>

          <!-- KHUNG THÔNG TIN HỌC PHẦN (CHUẨN BẢNG 100%) -->
          <table class="exam-info-box" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin:6px 0; font-size:10.5pt; background:transparent; table-layout:fixed;">
            <tr>
              <td style="width:50%; border:none; padding:3px 8px;"><strong>Môn học:</strong> ${escapeHtml(paper.subjectName)}</td>
              <td style="width:50%; border:none; padding:3px 8px;"><strong>Mã học phần:</strong> ${escapeHtml(paper.subjectCode)}</td>
            </tr>
            <tr>
              <td style="width:50%; border:none; padding:3px 8px;"><strong>Thời gian làm bài:</strong> ${paper.durationMinutes} phút</td>
              <td style="width:50%; border:none; padding:3px 8px;"><strong>Thang điểm:</strong> ${paper.totalScore || 10} điểm</td>
            </tr>
            <tr>
              <td colspan="2" style="border:none; text-align:center; font-style:italic; font-size:10pt; border-top:1px dashed #000000; padding:3px 8px;">
                ${escapeHtml(instructionText)}
              </td>
            </tr>
          </table>

          <!-- KHUNG ĐIỀN THÔNG TIN THÍ SINH (CHUẨN BẢNG 100%) -->
          <table class="student-info-table" style="width:100%; border-collapse:collapse; margin:6px 0; border:1px solid #000000; font-size:10.5pt; table-layout:fixed;">
            <tr>
              <td colspan="2" style="width:65%; border:1px solid #000000; padding:5px 8px;"><strong>Họ và tên thí sinh:</strong> ....................................................................................................</td>
              <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>MSSV:</strong> ............................................</td>
            </tr>
            <tr>
              <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Lớp học phần:</strong> ....................................</td>
              <td style="width:30%; border:1px solid #000000; padding:5px 8px;"><strong>Phòng thi số:</strong> ....................</td>
              <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Số báo danh (SBD):</strong> ....................</td>
            </tr>
            <tr>
              <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Ngày thi:</strong> ......./......./202...</td>
              <td style="width:30%; border:1px solid #000000; padding:5px 8px;"><strong>Ca thi:</strong> ....................</td>
              <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Chữ ký thí sinh:</strong> ............................</td>
            </tr>
          </table>

          <!-- KHUNG GIÁM THỊ VÀ CHẤM ĐIỂM (CHUẨN BẢNG 100%) -->
          ${customOptions?.showScoreBox !== false ? `
          <table class="score-table" style="width:100%; border-collapse:collapse; margin:6px 0 8px; border:1px solid #000000; table-layout:fixed;">
            <tr>
              <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Cán bộ coi thi 1</th>
              <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Cán bộ coi thi 2</th>
              <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Điểm bài thi (Số)</th>
              <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Điểm (Chữ) &amp; Cán bộ chấm</th>
            </tr>
            <tr>
              <td style="width:25%; border:1px solid #000000; vertical-align:top; font-size:9pt; height:42px; text-align:center;"><em>(Ký, ghi rõ họ tên)</em></td>
              <td style="width:25%; border:1px solid #000000; vertical-align:top; font-size:9pt; height:42px; text-align:center;"><em>(Ký, ghi rõ họ tên)</em></td>
              <td style="width:25%; border:1px solid #000000; vertical-align:middle; text-align:center; font-size:13pt; font-weight:bold; height:42px;"></td>
              <td style="width:25%; border:1px solid #000000; vertical-align:top; font-size:9pt; text-align:left; padding:2px 6px; height:42px;">
                <em>Điểm chữ: ............................</em><br><em>CB Chấm: ............................</em>
              </td>
            </tr>
          </table>` : ''}

          <!-- ĐƯỜNG CẮT PHÁCH (RỌC PHÁCH) -->
          <table class="perforated-cut-table" style="width:100%; border-collapse:collapse; margin:8pt 0 10pt; table-layout:fixed;">
            <tr>
              <td style="border:none; border-top:2px dashed #000000; text-align:center; padding-top:4pt; font-size:9.5pt; font-weight:bold; color:#000000; letter-spacing:0.5px;">
                ✂ &nbsp; &mdash; &mdash; &mdash; &mdash; ĐƯỜNG CẮT PHÁCH (RỌC PHÁCH TRƯỚC KHI CHẤM BÀI) &mdash; &mdash; &mdash; &mdash; &nbsp; ✂
              </td>
            </tr>
          </table>

          <!-- KHỐI ĐỀ BÀI (GOM TẬP TRUNG TẤT CẢ CÂU HỎI TỰ LUẬN) -->
          <table class="gathered-exam-questions" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin:6px 0; background:transparent; table-layout:fixed;">
            <tr>
              <td style="padding:8px 10px; border:none;">
                <div style="font-weight:bold; font-size:11pt; text-transform:uppercase; margin-bottom:4px; color:#000000;">
                  ĐỀ BÀI:
                </div>
                <div class="questions-list">
                  ${questionsListHtml}
                </div>
                <div style="text-align:center; font-size:9.5pt; font-style:italic; color:#475569; margin-top:6px; border-top:1px dashed #000000; padding-top:3px;">
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
              ${generateDottedLines(5)}
            </div>
          </div>
        </div>

        ${WORD_PAGE_BREAK}
        <!-- ======================= MẶT 2 (TRANG SAU - DUPLEX) ======================= -->
        <div class="paper-page page-break-before duplex-backside" style="page-break-before:always;">
          <!-- 1. KHUNG KHÓA VÙNG PHÁCH BẢO MẬT (55MM - KHỚP TỌA ĐỘ VỚI ĐẦU PHÁCH MẶT 1) -->
          <table style="width:100%; height:55mm; border:1px dashed #000000; margin-bottom:4px; background:transparent; table-layout:fixed;">
            <tr>
              <td style="text-align:center; vertical-align:middle; padding:6px; border:none;">
                <div style="font-size:10.5pt; font-weight:bold; color:#000000; margin-bottom:3px; text-transform:uppercase;">
                  [ VÙNG PHÁCH BẢO MẬT — THÍ SINH TUYỆT ĐỐI KHÔNG VIẾT VÀO KHUNG NÀY ]
                </div>
                <div style="font-size:9pt; font-style:italic; color:#475569; max-width:480px; margin:0 auto; line-height:1.3;">
                  (Mặt sau của phần Đầu Phách — Sẽ bị cắt rời khi Ban Rọc Phách thao tác để bảo mật danh tính khi chấm thi)
                </div>
              </td>
            </tr>
          </table>

          <!-- 2. ĐƯỜNG RỌC PHÁCH MẶT 2 (KHỚP TỌA ĐỘ MẶT 1) -->
          <table class="perforated-cut-table" style="width:100%; border-collapse:collapse; margin:4pt 0 6pt; table-layout:fixed;">
            <tr>
              <td style="border:none; border-top:2px dashed #000000; text-align:center; padding-top:3px; font-size:9pt; font-weight:bold; color:#000000; letter-spacing:0.5px;">
                ✂ &nbsp; &mdash; &mdash; &mdash; &mdash; ĐƯỜNG CẮT PHÁCH (MẶT SAU) &mdash; &mdash; &mdash; &mdash; &nbsp; ✂
              </td>
            </tr>
          </table>

          <!-- 3. KHỐI BÀI LÀM TIẾP THEO (MẶT 2 TOÀN TRANG DÒNG KẺ CHẤM) -->
          <div class="freeform-answer-zone-back" style="font-size:10.5pt; width:100%;">
            <div style="font-weight:bold; font-size:10.5pt; margin-bottom:4px; color:#000000;">
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
        optionsBody = '<div class="fill-blank-hint" style="margin:4px 0 6px 14px; font-style:italic; color:#475569; font-size:10pt;">(Thí sinh ghi đáp án điền vào các vị trí trống)</div>';
      } else if (q.options && q.options.length > 0) {
        const normalizedOptions = q.options.map((opt, oIdx) => {
          const letter = opt.key || opt.label || optionLetters[oIdx] || String(oIdx + 1);
          const text = opt.text || opt.content || '';
          return { letter, text };
        });

        const rowsHtml: string[] = [];
        for (let i = 0; i < normalizedOptions.length; i += 2) {
          const opt1 = normalizedOptions[i];
          const opt2 = normalizedOptions[i + 1];

          const col1Html = opt1
            ? `<td style="width:50%; border:none; padding:3px 8px 3px 0; vertical-align:top;">
                <strong>${escapeHtml(opt1.letter)}.</strong> ${escapeHtml(opt1.text)}
              </td>`
            : '<td style="width:50%; border:none;"></td>';

          const col2Html = opt2
            ? `<td style="width:50%; border:none; padding:3px 0 3px 8px; vertical-align:top;">
                <strong>${escapeHtml(opt2.letter)}.</strong> ${escapeHtml(opt2.text)}
              </td>`
            : '<td style="width:50%; border:none;"></td>';

          rowsHtml.push(`<tr>${col1Html}${col2Html}</tr>`);
        }

        optionsBody = `<table class="options-table" style="width:100%; border-collapse:collapse; border:none; margin:4px 0 8px 14px; font-size:11pt;">${rowsHtml.join('')}</table>`;
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
        : q.content;

      return `<div class="question-block" style="margin:12px 0; page-break-inside:avoid;">
        <div class="q-header" style="font-size:11.5pt; margin-bottom:4px; line-height:1.4;">
          <strong>Câu ${questionIndex}${scoreText}:</strong> ${escapeHtml(formattedContent)}
        </div>
        ${optionsBody}
      </div>`;
    }).join('');

    return `
      ${wordSectionBreak}
      <div class="paper-page ${pageBreakClass}" style="page-break-before: ${paperIndex > 0 ? 'always' : 'auto'};">
        <!-- HEADER TRƯỜNG & QUỐC HIỆU -->
        <table class="header-grid" style="width:100%; border-collapse:collapse; margin-bottom:6px; table-layout:fixed;">
          <tr>
            <td class="inst-box" style="width:50%; text-align:center; vertical-align:top; font-size:11pt; font-weight:bold; border:none; padding:0;">
              <table style="border-collapse:collapse; margin:0 auto; border:none; width:auto;">
                <tr>
                  ${showLogo && logoUrl ? `
                    <td style="vertical-align:middle; padding-right:8px; border:none; width:52px; text-align:center;">
                      <img src="${logoUrl}" alt="Logo" width="52" height="52" style="width:52px; height:52px; max-width:52px; max-height:52px; display:block; margin:0 auto;" />
                    </td>
                  ` : ''}
                  <td style="vertical-align:middle; text-align:center; border:none;">
                    <div>${escapeHtml(institutionName)}</div>
                    <div style="font-weight:normal; font-size:10pt;">${escapeHtml(facultyName)}</div>
                    <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:120px; margin-top:2px;"></div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="motto-box" style="width:50%; text-align:center; vertical-align:top; font-size:11pt; font-weight:bold; border:none; padding:0;">
              <div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
              <em style="display:block; font-style:italic; font-size:10.5pt; margin-top:1px;">${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em>
              <div class="inst-underline" style="border-top:1px solid #000000; display:inline-block; width:120px; margin-top:2px;"></div>
            </td>
          </tr>
        </table>

        <!-- HUY HIỆU MÃ ĐỀ THI -->
        <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:4px;">
          <tr>
            <td style="text-align:right; font-size:11pt; border:none; padding:0;">
              MÃ ĐỀ THI: <strong>${escapeHtml(paper.paperCode)}</strong>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ ĐỀ THI -->
        <div style="text-align:center; margin:2px 0;">
          <h1 class="title" style="font-size:14pt; font-weight:bold; text-transform:uppercase; margin:0 0 2px; line-height:1.2;">
            ${escapeHtml(title)}
          </h1>
          <div class="subtitle" style="font-style:italic; font-size:10.5pt; color:#475569; margin:0 0 6px;">
            ${escapeHtml(subtitle)}
          </div>
        </div>

        <!-- KHUNG THÔNG TIN HỌC PHẦN (CHUẨN BẢNG 100%) -->
        <table class="exam-info-box" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin:6px 0; font-size:10.5pt; background:transparent; table-layout:fixed;">
          <tr>
            <td style="width:50%; border:none; padding:3px 8px;"><strong>Môn học:</strong> ${escapeHtml(paper.subjectName)}</td>
            <td style="width:50%; border:none; padding:3px 8px;"><strong>Mã học phần:</strong> ${escapeHtml(paper.subjectCode)}</td>
          </tr>
          <tr>
            <td style="width:50%; border:none; padding:3px 8px;"><strong>Thời gian làm bài:</strong> ${paper.durationMinutes} phút</td>
            <td style="width:50%; border:none; padding:3px 8px;"><strong>Thang điểm:</strong> ${paper.totalScore || 10} điểm</td>
          </tr>
          <tr>
            <td colspan="2" style="border:none; text-align:center; font-style:italic; font-size:10pt; border-top:1px dashed #000000; padding:3px 8px;">
              ${escapeHtml(instructionText)}
            </td>
          </tr>
        </table>

        <!-- KHUNG ĐIỀN THÔNG TIN THÍ SINH (CHUẨN BẢNG 100%) -->
        <table class="student-info-table" style="width:100%; border-collapse:collapse; margin:6px 0; border:1px solid #000000; font-size:10.5pt; table-layout:fixed;">
          <tr>
            <td colspan="2" style="width:65%; border:1px solid #000000; padding:5px 8px;"><strong>Họ và tên thí sinh:</strong> ....................................................................................................</td>
            <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>MSSV:</strong> ............................................</td>
          </tr>
          <tr>
            <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Lớp học phần:</strong> ....................................</td>
            <td style="width:30%; border:1px solid #000000; padding:5px 8px;"><strong>Phòng thi số:</strong> ....................</td>
            <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Số báo danh (SBD):</strong> ....................</td>
          </tr>
          <tr>
            <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Ngày thi:</strong> ......./......./202...</td>
            <td style="width:30%; border:1px solid #000000; padding:5px 8px;"><strong>Ca thi:</strong> ....................</td>
            <td style="width:35%; border:1px solid #000000; padding:5px 8px;"><strong>Chữ ký thí sinh:</strong> ............................</td>
          </tr>
        </table>

        <!-- KHUNG GIÁM THỊ VÀ CHẤM ĐIỂM (CHUẨN BẢNG 100%) -->
        ${customOptions?.showScoreBox !== false ? `
        <table class="score-table" style="width:100%; border-collapse:collapse; margin:6px 0 8px; border:1px solid #000000; table-layout:fixed;">
          <tr>
            <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Cán bộ coi thi 1</th>
            <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Cán bộ coi thi 2</th>
            <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Điểm bài thi (Số)</th>
            <th style="width:25%; border:1px solid #000000; padding:4px 6px; text-align:center; font-size:10pt; background:transparent;">Điểm (Chữ) &amp; Cán bộ chấm</th>
          </tr>
          <tr>
            <td style="width:25%; border:1px solid #000000; vertical-align:top; font-size:9pt; height:42px; text-align:center;"><em>(Ký, ghi rõ họ tên)</em></td>
            <td style="width:25%; border:1px solid #000000; vertical-align:top; font-size:9pt; height:42px; text-align:center;"><em>(Ký, ghi rõ họ tên)</em></td>
            <td style="width:25%; border:1px solid #000000; vertical-align:middle; text-align:center; font-size:13pt; font-weight:bold; height:42px;"></td>
            <td style="width:25%; border:1px solid #000000; vertical-align:top; font-size:9pt; text-align:left; padding:2px 6px; height:42px;">
              <em>Điểm chữ: ............................</em><br><em>CB Chấm: ............................</em>
            </td>
          </tr>
        </table>` : ''}

        <!-- ĐƯỜNG CẮT PHÁCH (RỌC PHÁCH) -->
        <table class="perforated-cut-table" style="width:100%; border-collapse:collapse; margin:8pt 0 10pt; table-layout:fixed;">
          <tr>
            <td style="border:none; border-top:2px dashed #000000; text-align:center; padding-top:4pt; font-size:9.5pt; font-weight:bold; color:#000000; letter-spacing:0.5px;">
              ✂ &nbsp; &mdash; &mdash; &mdash; &mdash; ĐƯỜNG CẮT PHÁCH (RỌC PHÁCH TRƯỚC KHI CHẤM BÀI) &mdash; &mdash; &mdash; &mdash; &nbsp; ✂
            </td>
          </tr>
        </table>

        <!-- NỘI DUNG CÁC CÂU HỎI -->
        <div class="questions-container">
          ${questionsHtml}
        </div>

        ${customOptions?.footerNotes ? `<p style="margin-top:12px; font-style:italic; font-size:10pt;"><em>* ${escapeHtml(customOptions.footerNotes)}</em></p>` : ''}

        <!-- KHUNG KÝ TÊN BAN ĐỀ & BỘ MÔN -->
        <table class="signers-table" style="width:100%; margin-top:28px; border-collapse:collapse; border:none; table-layout:fixed;">
          <tr>
            ${signers.map(s => `
              <td style="text-align:center; vertical-align:top; width:${100 / (signers.length || 1)}%; border:none;">
                <strong>${escapeHtml(s.title)}</strong>
                <em style="display:block; margin-top:4px; font-style:italic; color:#475569; font-size:10.5pt;">${escapeHtml(s.subtitle || '')}</em>
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
            <td style="border:1px solid #000000; padding:6px 8px; text-align:center; font-weight:bold; width:15%; vertical-align:top;">Câu ${questionIndex} (${scoreText})</td>
            <td style="border:1px solid #000000; padding:6px 10px; width:85%; vertical-align:top; white-space:pre-wrap; line-height:1.4;">${escapeHtml(answerText)}</td>
          </tr>
        `;
      }).join('');

      matrixAnswerKeyHtml = `
        ${WORD_PAGE_BREAK}
        <div class="paper-page page-break-before answer-key-section" style="page-break-before:always;">
          <div class="matrix-header" style="margin-bottom:12px;">
            <h2 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:3px;">
              HƯỚNG DẪN CHẤM &amp; ĐÁP ÁN CHI TIẾT
            </h2>
            <p style="text-align:center; font-style:italic; margin-top:0; font-size:10pt;">
              (Dành cho Cán bộ Chấm thi và Ban Khảo thí đối chiếu)
            </p>
            <p style="text-align:center; font-size:10.5pt; margin-top:2px;">
              <strong>Môn thi: ${escapeHtml(firstPaper.subjectName)} (${escapeHtml(firstPaper.subjectCode)})</strong>
            </p>
          </div>
          <table class="matrix-table" style="border-collapse:collapse; width:100%; margin-top:10px; font-size:10pt; table-layout:fixed;">
            <thead>
              <tr>
                <th style="width:15%; border:1px solid #000000; padding:6px 8px; background:transparent; font-weight:bold; text-align:center;">Câu hỏi</th>
                <th style="width:85%; border:1px solid #000000; padding:6px 10px; background:transparent; font-weight:bold; text-align:center;">Đáp án gợi ý &amp; Thang điểm chi tiết</th>
              </tr>
            </thead>
            <tbody>
              ${essayAnswersRows}
            </tbody>
          </table>
        </div>
      `;
    } else {
      const maxQuestions = Math.max(...papers.map((p) => p.questions.length));
      const paperCodes = papers.map((p) => p.paperCode || '101');

      const tableHeaderCols = paperCodes
        .map((code) => `<th style="border:1px solid #000000; padding:6px 10px; background:transparent; font-weight:bold; text-align:center;">Mã đề ${escapeHtml(code)}</th>`)
        .join('');

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

        tableRows += `<tr><th style="border:1px solid #000000; padding:6px 10px; background:transparent; font-weight:bold; text-align:center;">Câu ${questionNum}</th>${rowCols}</tr>`;
      }

      matrixAnswerKeyHtml = `
        ${WORD_PAGE_BREAK}
        <div class="paper-page page-break-before answer-key-section" style="page-break-before:always;">
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
          <table class="matrix-table" style="border-collapse:collapse; width:100%; margin-top:10px; font-size:10.5pt; table-layout:fixed;">
            <thead>
              <tr>
                <th style="width:120px; border:1px solid #000000; padding:6px 10px; background:transparent; font-weight:bold; text-align:center;">Câu hỏi</th>
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
    @page Section1 { size: 595.3pt 841.9pt; margin: 28.3pt 35.4pt 28.3pt 35.4pt; mso-header-margin: 28.3pt; mso-footer-margin: 28.3pt; mso-paper-source: 0; }
    div.Section1 { page: Section1; }
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; line-height: 1.3; margin: 0; padding: 0; }
    p.MsoNormal, div.MsoNormal { margin: 0cm; margin-bottom: .0001pt; }
    .page-break-before { page-break-before: always; mso-break-type: section-break; }
    table { width: 100%; border-collapse: collapse; box-sizing: border-box; mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-table-tspace: 0pt; mso-table-bspace: 0pt; }
    .paper-page { width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; }
    .header-grid { width: 100%; border-collapse: collapse; margin-bottom: 4px; table-layout: fixed; }
    .header-grid td { vertical-align: top; border: none; padding: 0; }
    .inst-box { text-align: center; font-size: 10.5pt; font-weight: bold; width: 50%; }
    .inst-box table { width: auto; margin: 0 auto; border-collapse: collapse; }
    .inst-box img, img[alt="Logo"] { width: 52px !important; height: 52px !important; max-width: 52px !important; max-height: 52px !important; }
    .inst-box div { margin-bottom: 1px; }
    .inst-underline { border-top: 1px solid #000000; display: inline-block; width: 120px; margin-top: 2px; }
    .motto-box { text-align: center; font-size: 10.5pt; font-weight: bold; width: 50%; }
    .motto-box em { display: block; font-style: italic; margin-top: 1px; font-weight: bold; font-size: 10pt; }
    .title { text-align: center; font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0 0 2px; }
    .subtitle { text-align: center; font-style: italic; margin-bottom: 4px; font-size: 10pt; color: #475569; }
    .exam-info-box { width: 100%; border-collapse: collapse; border: 1px solid #000000; margin: 4px 0; font-size: 10pt; background: transparent; table-layout: fixed; }
    .student-info-table { width: 100%; border-collapse: collapse; margin: 4px 0; border: 1px solid #000000; font-size: 10pt; table-layout: fixed; }
    .student-info-table td { border: 1px solid #000000; padding: 4px 6px; vertical-align: middle; }
    .score-table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; border: 1px solid #000000; table-layout: fixed; }
    .score-table th, .score-table td { border: 1px solid #000000; padding: 3px 5px; text-align: center; font-size: 9.5pt; background: transparent; }
    .score-table td { height: 38px; }
    .perforated-cut-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .perforated-cut-table td { border: none; border-top: 2px dashed #000000; text-align: center; font-size: 9pt; font-weight: bold; color: #000000; padding-top: 3px; letter-spacing: 0.5px; }
    .gathered-exam-questions { width: 100%; border-collapse: collapse; border: 1px solid #000000; margin: 4px 0; background: transparent; table-layout: fixed; }
    .question-block { margin: 10px 0; page-break-inside: avoid; }
    .q-header { font-size: 11pt; margin-bottom: 3px; line-height: 1.35; }
    .options-table { width: 100%; border-collapse: collapse; border: none; margin: 3px 0 6px 12px; font-size: 10.5pt; }
    .options-table td { border: none; padding: 2px 5px; }
    .fill-blank-hint { margin: 3px 0 5px 12px; font-style: italic; color: #475569; font-size: 10pt; }
    .dotted-lines-table { width: 100%; border-collapse: collapse; border: none; margin: 2pt 0; table-layout: fixed; }
    .dotted-lines-table td { border: none; border-bottom: 1px dashed #000000; height: 20pt; font-size: 9pt; padding: 0; vertical-align: bottom; }
    .essay-space-table { width: 100%; border-collapse: collapse; border: none; margin: 4pt 0 8pt 12px; table-layout: fixed; }
    .essay-space-table td { border: none; border-bottom: 1px dashed #000000; height: 20pt; font-size: 9pt; padding: 0; }
    .paper-code-badge { text-align: right; font-size: 10.5pt; margin-bottom: 2px; }
    .signers-table { width: 100%; margin-top: 20px; border-collapse: collapse; border: none; table-layout: fixed; }
    .signers-table td { text-align: center; vertical-align: top; border: none; }
    .matrix-table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 10pt; }
    .matrix-table th, .matrix-table td { border: 1px solid #000000; padding: 4px 6px; text-align: center; background: transparent; }
    .matrix-table thead th { background-color: transparent; font-weight: bold; }
    @media print {
      body { padding: 0; }
      .paper-page { max-width: 100%; }
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
