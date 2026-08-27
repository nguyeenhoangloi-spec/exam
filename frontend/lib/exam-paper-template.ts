import { formatFillBlankForPrint, FillBlankAnswerItem } from './fill-blank-helper';

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
  instructionText?: string;
  showScoreBox?: boolean;
  showInstructions?: boolean;
  footerNotes?: string;
  pageSize?: 'A4' | 'A5';
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
 * Hàm sinh chuỗi HTML Đề thi chuẩn Khảo thí Quốc gia dùng chung 100% cho cả Bản In (PDF) và Xuất Word (.doc)
 */
export function generateUnifiedExamPaperHtml(
  papers: ExamPaperExportModel[],
  includeAnswerKey = false,
  customOptions?: Partial<ExamPaperExportModel>
): string {
  if (!papers || papers.length === 0) return '';

  const firstPaper = papers[0];
  const isEssay = firstPaper.examType === 'TU_LUAN';

  // Đọc cấu hình mẫu published từ document-templates nếu có
  const examTemplate = globalPublishedTemplates['EXAM_PAPER_OFFICIAL'] || globalPublishedTemplates['EXAM_PAPER'] || null;

  const institutionName = customOptions?.institutionName || firstPaper.institutionName || examTemplate?.header?.institutionName || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO';
  const facultyName = customOptions?.facultyName || firstPaper.facultyName || firstPaper.departmentName || examTemplate?.header?.facultyName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ - KHOA CÔNG NGHỆ THÔNG TIN';
  const motto = customOptions?.motto || firstPaper.motto || examTemplate?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const title = customOptions?.paperTitle || firstPaper.paperTitle || firstPaper.title || examTemplate?.header?.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN';
  const subtitle = customOptions?.subtitle || firstPaper.subtitle || examTemplate?.header?.subtitle || `Học kỳ 1 - Năm học ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
  const instructionText = customOptions?.instructionText || firstPaper.instructionText || examTemplate?.examInfo?.instructionText || '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)';
  const signers = customOptions?.signers || firstPaper.signers || examTemplate?.footer?.signers || [
    { title: 'CÁN BỘ RA ĐỀ', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỞNG BỘ MÔN DUYỆT', subtitle: '(Ký, ghi rõ họ tên)' },
  ];

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 1. Render từng mã đề thi
  const papersHtml = papers.map((paper, paperIndex) => {
    const questionsHtml = paper.questions.map((q, qIdx) => {
      const questionIndex = q.order || q.index || qIdx + 1;
      const scoreText = q.score != null ? ` (${q.score} điểm)` : '';
      const isFillBlank = q.type === 'FILL_BLANK' || Boolean(q.fillBlankAnswers && q.fillBlankAnswers.length > 0);

      // Render các phương án lựa chọn
      let optionsBody = '';
      if (isEssay) {
        if (includeAnswerKey && (q.correctAnswer || q.sampleAnswer)) {
          const essayAns = q.correctAnswer || q.sampleAnswer || '';
          optionsBody = `<div class="essay-box correct-box" style="margin:6px 0 10px 14px; padding:6px 10px; background:#f0fdf4; border-left:3px solid #16a34a; font-size:10.5pt; color:#166534;">
            <strong>Gợi ý đáp án / Thang điểm:</strong><br><span style="white-space:pre-wrap;">${escapeHtml(essayAns)}</span>
          </div>`;
        } else {
          optionsBody = '<div class="essay-space" style="margin:6px 0 10px 14px;"><div class="line" style="border-bottom:1px dashed #cbd5e1; height:24px;"></div><div class="line" style="border-bottom:1px dashed #cbd5e1; height:24px;"></div><div class="line" style="border-bottom:1px dashed #cbd5e1; height:24px;"></div></div>';
        }
      } else if (isFillBlank) {
        if (includeAnswerKey && q.fillBlankAnswers && q.fillBlankAnswers.length > 0) {
          const answersList = q.fillBlankAnswers
            .map((a, aIdx) => `Ô #${a.blankIndex || aIdx + 1}: <strong>${escapeHtml(a.answer || '')}</strong>`)
            .join(' &bull; ');
          optionsBody = `<div class="fill-blank-box correct-box" style="margin:6px 0 8px 14px; padding:6px 10px; background:#f0fdf4; border-left:3px solid #16a34a; font-size:10.5pt; color:#166534;">
            <strong>Đáp án các ô điền khuyết:</strong> ${answersList}
          </div>`;
        } else {
          optionsBody = '<div class="fill-blank-hint" style="margin:4px 0 6px 14px; font-style:italic; color:#475569; font-size:10.5pt;">(Thí sinh ghi đáp án điền vào các vị trí trống)</div>';
        }
      } else if (q.options && q.options.length > 0) {
        // Render bảng Table 2 cột ẩn viền để cả Word và In/PDF đều là lưới 2 cột 2 hàng chuẩn 100%
        const normalizedOptions = q.options.map((opt, oIdx) => {
          const letter = opt.key || opt.label || optionLetters[oIdx] || String(oIdx + 1);
          const text = opt.text || opt.content || '';
          const isCorrect = includeAnswerKey && Boolean(opt.isCorrect);
          return { letter, text, isCorrect };
        });

        const rowsHtml: string[] = [];
        for (let i = 0; i < normalizedOptions.length; i += 2) {
          const opt1 = normalizedOptions[i];
          const opt2 = normalizedOptions[i + 1];

          const col1Html = opt1
            ? `<td style="width:50%; border:none; padding:3px 8px 3px 0; vertical-align:top; ${opt1.isCorrect ? 'color:#15803d; font-weight:bold;' : ''}">
                <strong>${escapeHtml(opt1.letter)}.</strong> ${escapeHtml(opt1.text)} ${opt1.isCorrect ? '<span style="color:#15803d; font-size:9.5pt;">✓ (Đáp án đúng)</span>' : ''}
              </td>`
            : '<td style="width:50%; border:none;"></td>';

          const col2Html = opt2
            ? `<td style="width:50%; border:none; padding:3px 0 3px 8px; vertical-align:top; ${opt2.isCorrect ? 'color:#15803d; font-weight:bold;' : ''}">
                <strong>${escapeHtml(opt2.letter)}.</strong> ${escapeHtml(opt2.text)} ${opt2.isCorrect ? '<span style="color:#15803d; font-size:9.5pt;">✓ (Đáp án đúng)</span>' : ''}
              </td>`
            : '<td style="width:50%; border:none;"></td>';

          rowsHtml.push(`<tr>${col1Html}${col2Html}</tr>`);
        }

        optionsBody = `<table class="options-table" style="width:100%; border-collapse:collapse; border:none; margin:4px 0 6px 14px; font-size:11pt;">${rowsHtml.join('')}</table>`;
      } else {
        optionsBody = '<div class="essay-space" style="margin:6px 0 10px 14px;"><div class="line" style="border-bottom:1px dashed #cbd5e1; height:24px;"></div><div class="line" style="border-bottom:1px dashed #cbd5e1; height:24px;"></div><div class="line" style="border-bottom:1px dashed #cbd5e1; height:24px;"></div></div>';
      }

      // Lời giải / giải thích chi tiết
      const explanationText = q.explanation || q.answerExplanation || '';
      const explanationHtml = includeAnswerKey && explanationText
        ? `<div class="explanation" style="margin:6px 0 8px 14px; padding:6px 10px; background:#f0fdf4; border-left:3px solid #16a34a; font-size:10.5pt; color:#166534;">
            <strong>Lời giải / Hướng dẫn chi tiết:</strong> ${escapeHtml(explanationText)}
          </div>`
        : '';

      const formattedContent = isFillBlank
        ? formatFillBlankForPrint(q.content, q.fillBlankAnswers, includeAnswerKey)
        : q.content;

      return `<div class="question-block" style="margin:12px 0; page-break-inside:avoid;">
        <div class="q-header" style="font-size:11.5pt; margin-bottom:4px;">
          <strong>Câu ${questionIndex}${scoreText}:</strong> ${escapeHtml(formattedContent)}
        </div>
        ${optionsBody}
        ${explanationHtml}
      </div>`;
    }).join('');

    const pageBreakClass = paperIndex > 0 ? 'page-break-before' : '';

    return `
      <div class="paper-page ${pageBreakClass}">
        <!-- HEADER TRƯỜNG & QUỐC HIỆU -->
        <table class="header-grid" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
          <tr>
            <td class="inst-box" style="width:50%; text-align:center; vertical-align:top; font-size:11pt; font-weight:bold; border:none;">
              <div>${escapeHtml(institutionName)}</div>
              <div style="font-weight:normal;">${escapeHtml(facultyName)}</div>
              <div class="inst-underline" style="border-top:1px solid #0f172a; display:inline-block; width:120px; margin-top:4px;"></div>
            </td>
            <td class="motto-box" style="width:50%; text-align:center; vertical-align:top; font-size:11pt; font-weight:bold; border:none;">
              <div>${escapeHtml(motto.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div>
              <em style="display:block; font-style:italic; margin-top:2px;">${escapeHtml(motto.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc')}</em>
              <div class="inst-underline" style="border-top:1px solid #0f172a; display:inline-block; width:120px; margin-top:4px;"></div>
            </td>
          </tr>
        </table>

        <!-- HUY HIỆU MÃ ĐỀ THI -->
        <div class="paper-code-badge" style="text-align:right; font-size:11pt; margin-bottom:2px;">
          MÃ ĐỀ THI: <strong>${escapeHtml(paper.paperCode)}</strong>
        </div>

        <!-- TIÊU ĐỀ ĐỀ THI -->
        <h1 class="title" style="text-align:center; font-size:15pt; font-weight:bold; text-transform:uppercase; margin:6px 0 2px;">
          ${escapeHtml(title)}
        </h1>
        <div class="subtitle" style="text-align:center; font-style:italic; margin-bottom:8px; font-size:11pt;">
          ${escapeHtml(subtitle)}
        </div>

        <!-- KHUNG THÔNG TIN HỌC PHẦN -->
        <div class="exam-info-box" style="border:1px solid #334155; padding:6px 10px; margin:8px 0; font-size:11pt; background:#fafafa;">
          <table style="width:100%; border-collapse:collapse; border:none;">
            <tr>
              <td style="width:50%; border:none; padding:2px 0;"><strong>Môn học:</strong> ${escapeHtml(paper.subjectName)}</td>
              <td style="width:50%; border:none; padding:2px 0;"><strong>Mã học phần:</strong> ${escapeHtml(paper.subjectCode)}</td>
            </tr>
            <tr>
              <td style="width:50%; border:none; padding:2px 0;"><strong>Thời gian làm bài:</strong> ${paper.durationMinutes} phút</td>
              <td style="width:50%; border:none; padding:2px 0;"><strong>Thang điểm:</strong> ${paper.totalScore || 10} điểm</td>
            </tr>
            <tr>
              <td colspan="2" style="border:none; text-align:center; font-style:italic; font-size:10.5pt; border-top:1px dashed #cbd5e1; padding-top:4px; margin-top:3px;">
                ${escapeHtml(instructionText)}
              </td>
            </tr>
          </table>
        </div>

        <!-- KHUNG ĐIỀN THÔNG TIN THÍ SINH (CHUẨN KHẢO THÍ) -->
        <table class="student-info-table" style="width:100%; border-collapse:collapse; margin:8px 0; border:1px solid #334155; font-size:11pt;">
          <tr>
            <td colspan="2" style="width:65%; border:1px solid #334155; padding:5px 8px;"><strong>Họ và tên thí sinh:</strong> ....................................................................................................</td>
            <td style="width:35%; border:1px solid #334155; padding:5px 8px;"><strong>MSSV:</strong> ............................................</td>
          </tr>
          <tr>
            <td style="width:35%; border:1px solid #334155; padding:5px 8px;"><strong>Lớp học phần:</strong> ....................................</td>
            <td style="width:30%; border:1px solid #334155; padding:5px 8px;"><strong>Phòng thi số:</strong> ....................</td>
            <td style="width:35%; border:1px solid #334155; padding:5px 8px;"><strong>Số báo danh (SBD):</strong> ....................</td>
          </tr>
          <tr>
            <td style="width:35%; border:1px solid #334155; padding:5px 8px;"><strong>Ngày thi:</strong> ......./......./202...</td>
            <td style="width:30%; border:1px solid #334155; padding:5px 8px;"><strong>Ca thi:</strong> ....................</td>
            <td style="width:35%; border:1px solid #334155; padding:5px 8px;"><strong>Chữ ký thí sinh:</strong> ............................</td>
          </tr>
        </table>

        <!-- KHUNG GIÁM THỊ VÀ CHẤM ĐIỂM (4 Ô CÂN ĐỐI) -->
        ${customOptions?.showScoreBox !== false ? `
        <table class="score-table" style="width:100%; border-collapse:collapse; margin:8px 0 14px; border:1px solid #334155;">
          <tr>
            <th style="width:25%; border:1px solid #334155; padding:5px 6px; text-align:center; font-size:10.5pt; background:#f1f5f9;">Cán bộ coi thi 1</th>
            <th style="width:25%; border:1px solid #334155; padding:5px 6px; text-align:center; font-size:10.5pt; background:#f1f5f9;">Cán bộ coi thi 2</th>
            <th style="width:25%; border:1px solid #334155; padding:5px 6px; text-align:center; font-size:10.5pt; background:#f1f5f9;">Điểm bài thi (Số)</th>
            <th style="width:25%; border:1px solid #334155; padding:5px 6px; text-align:center; font-size:10.5pt; background:#f1f5f9;">Điểm (Chữ) &amp; Cán bộ chấm</th>
          </tr>
          <tr>
            <td style="border:1px solid #334155; vertical-align:top; font-size:9.5pt; height:45px; text-align:center;"><em>(Ký, ghi rõ họ tên)</em></td>
            <td style="border:1px solid #334155; vertical-align:top; font-size:9.5pt; height:45px; text-align:center;"><em>(Ký, ghi rõ họ tên)</em></td>
            <td style="border:1px solid #334155; vertical-align:middle; text-align:center; font-size:14pt; font-weight:bold; height:45px;"></td>
            <td style="border:1px solid #334155; vertical-align:top; font-size:9.5pt; text-align:left; padding:3px 6px; height:45px;">
              <em>Điểm chữ: ............................</em><br><em>CB Chấm: ............................</em>
            </td>
          </tr>
        </table>` : ''}

        <!-- NỘI DUNG CÁC CÂU HỎI -->
        <div class="questions-container">
          ${questionsHtml}
        </div>

        ${customOptions?.footerNotes ? `<p style="margin-top:12px; font-style:italic; font-size:10pt;"><em>* ${escapeHtml(customOptions.footerNotes)}</em></p>` : ''}

        <!-- KHUNG KÝ TÊN BAN ĐỀ & BỘ MÔN -->
        <table class="signers-table" style="width:100%; margin-top:28px; border-collapse:collapse; border:none;">
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

  // 2. Render Bảng Đáp Án Ma Trận Tổng Hợp (Dành cho Cán bộ Chấm thi)
  let matrixAnswerKeyHtml = '';
  if (!isEssay && includeAnswerKey) {
    const maxQuestions = Math.max(...papers.map((p) => p.questions.length));
    const paperCodes = papers.map((p) => p.paperCode || '101');

    const tableHeaderCols = paperCodes
      .map((code) => `<th style="border:1px solid #000; padding:6px 10px; background-color:#f1f5f9; font-weight:bold; text-align:center;">Mã đề ${escapeHtml(code)}</th>`)
      .join('');

    let tableRows = '';
    for (let qIdx = 0; qIdx < maxQuestions; qIdx++) {
      const questionNum = qIdx + 1;
      const rowCols = papers.map((paper) => {
        const q = paper.questions[qIdx];
        if (!q) return '<td style="border:1px solid #000; padding:6px 10px; text-align:center;">-</td>';

        if (q.options && q.options.length > 0) {
          const correctOpt = q.options.find((o) => o.isCorrect);
          const letter = correctOpt?.key || correctOpt?.label || '-';
          return `<td style="border:1px solid #000; padding:6px 10px; text-align:center;"><strong>${escapeHtml(letter)}</strong></td>`;
        }

        if (q.fillBlankAnswers && q.fillBlankAnswers.length > 0) {
          const fillStr = q.fillBlankAnswers
            .map((a, i) => `${a.blankIndex || i + 1}: ${a.answer}`)
            .join('; ');
          return `<td style="border:1px solid #000; padding:6px 10px; text-align:center;"><strong style="font-size:9.5pt;">${escapeHtml(fillStr)}</strong></td>`;
        }

        if (q.correctAnswer || q.sampleAnswer) {
          return `<td style="border:1px solid #000; padding:6px 10px; text-align:center;"><strong>${escapeHtml(q.correctAnswer || q.sampleAnswer)}</strong></td>`;
        }

        return '<td style="border:1px solid #000; padding:6px 10px; text-align:center;">(Tự luận)</td>';
      }).join('');

      tableRows += `<tr><th style="border:1px solid #000; padding:6px 10px; background-color:#f1f5f9; font-weight:bold; text-align:center;">Câu ${questionNum}</th>${rowCols}</tr>`;
    }

    matrixAnswerKeyHtml = `
      <div class="paper-page page-break-before answer-key-section">
        <div class="matrix-header" style="margin-bottom:14px;">
          <h2 style="text-align:center; font-size:15pt; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">
            BẢNG MA TRẬN ĐÁP ÁN TỔNG HỢP
          </h2>
          <p style="text-align:center; font-style:italic; margin-top:0;">
            (Dành cho Cán bộ Chấm thi và Khảo thí đối chiếu)
          </p>
          <p style="text-align:center;">
            <strong>Môn thi: ${escapeHtml(firstPaper.subjectName)} (${escapeHtml(firstPaper.subjectCode)})</strong>
          </p>
        </div>
        <table class="matrix-table" style="border-collapse:collapse; width:100%; margin-top:15px; font-size:11pt;">
          <thead>
            <tr>
              <th style="width:120px; border:1px solid #000; padding:6px 10px; background-color:#f1f5f9; font-weight:bold; text-align:center;">Câu hỏi</th>
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

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(firstPaper.subjectName)}</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #0f172a; line-height: 1.3; margin: 0; padding: 20px; }
    .paper-page { max-width: 850px; margin: 0 auto; }
    .header-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .header-grid td { vertical-align: top; border: none; }
    .inst-box { text-align: center; font-size: 11pt; font-weight: bold; width: 50%; }
    .inst-box div { margin-bottom: 2px; }
    .inst-underline { border-top: 1px solid #0f172a; display: inline-block; width: 120px; margin-top: 4px; }
    .motto-box { text-align: center; font-size: 11pt; font-weight: bold; width: 50%; }
    .motto-box em { display: block; font-style: italic; margin-top: 2px; font-weight: bold; }
    .title { text-align: center; font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 6px 0 2px; }
    .subtitle { text-align: center; font-style: italic; margin-bottom: 8px; font-size: 11pt; }
    .exam-info-box { border: 1px solid #334155; padding: 6px 10px; margin: 8px 0; font-size: 11pt; background: #fafafa; }
    .student-info-table { width: 100%; border-collapse: collapse; margin: 8px 0; border: 1px solid #334155; font-size: 11pt; }
    .student-info-table td { border: 1px solid #334155; padding: 5px 8px; vertical-align: middle; }
    .score-table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; border: 1px solid #334155; }
    .score-table th, .score-table td { border: 1px solid #334155; padding: 5px 6px; text-align: center; font-size: 10.5pt; }
    .score-table td { height: 45px; }
    .question-block { margin: 12px 0; page-break-inside: avoid; }
    .q-header { font-size: 11.5pt; margin-bottom: 4px; }
    .options-table { width: 100%; border-collapse: collapse; border: none; margin: 4px 0 6px 14px; font-size: 11pt; }
    .options-table td { border: none; padding: 3px 6px; }
    .correct-box { margin: 6px 0 8px 14px; padding: 6px 10px; background: #f0fdf4; border-left: 3px solid #16a34a; font-size: 10.5pt; color: #166534; }
    .fill-blank-hint { margin: 4px 0 6px 14px; font-style: italic; color: #475569; font-size: 10.5pt; }
    .essay-space { margin: 6px 0 10px 14px; }
    .essay-space .line { border-bottom: 1px dashed #cbd5e1; height: 24px; }
    .explanation { margin: 6px 0 8px 14px; padding: 6px 10px; background: #f0fdf4; border-left: 3px solid #16a34a; font-size: 10.5pt; color: #166534; }
    .paper-code-badge { text-align: right; font-size: 11pt; margin-bottom: 2px; }
    .signers-table { width: 100%; margin-top: 28px; border-collapse: collapse; border: none; }
    .signers-table td { text-align: center; vertical-align: top; border: none; }
    .matrix-table { border-collapse: collapse; width: 100%; margin-top: 15px; font-size: 11pt; }
    .matrix-table th, .matrix-table td { border: 1px solid #000; padding: 6px 10px; text-align: center; }
    .matrix-table thead th { background-color: #f1f5f9; font-weight: bold; }
    .page-break-before { page-break-before: always; margin-top: 30px; }
    @media print {
      body { padding: 0; }
      .paper-page { max-width: 100%; }
      @page { size: ${customOptions?.pageSize || 'A4'} portrait; margin: 12mm; }
    }
  </style>
</head>
<body>
  <main>
    ${papersHtml}
    ${matrixAnswerKeyHtml}
  </main>
</body>
</html>`;
}
