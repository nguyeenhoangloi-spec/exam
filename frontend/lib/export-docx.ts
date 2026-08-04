/**
 * Module hỗ trợ Xuất Đề thi & Phiếu đáp án chuẩn định dạng Microsoft Word (.doc / .docx)
 * Tuân thủ định dạng chuẩn của Bộ Giáo dục & Đào tạo Việt Nam
 */

export interface ExamPaperExportData {
  paperCode: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  durationMinutes: number;
  totalScore: number;
  schoolName?: string;
  departmentName?: string;
  questions: Array<{
    order: number;
    code?: string;
    content: string;
    score: number;
    options: Array<{
      label: string;
      content: string;
      isCorrect: boolean;
    }>;
    explanation?: string;
  }>;
}

export function exportExamPaperToWord(data: ExamPaperExportData, includeAnswerKey: boolean = true) {
  const school = data.schoolName || 'TRƯỜNG ĐẠI HỌC KHẢO THÍ HỆ THỐNG';
  const dept = data.departmentName || 'KHOA CÔNG NGHỆ THÔNG TIN';

  // Render danh sách câu hỏi
  const questionsHtml = data.questions
    .map((q, idx) => {
      const optionsHtml = q.options
        .map(
          (opt) => `
          <div style="margin-left: 20px; margin-bottom: 4px; ${opt.isCorrect && includeAnswerKey ? 'font-weight: bold; color: #047857;' : ''}">
            <strong>${opt.label}.</strong> ${escapeHtml(opt.content)} ${opt.isCorrect && includeAnswerKey ? ' <i>(Đáp án đúng)</i>' : ''}
          </div>
        `
        )
        .join('');

      return `
        <div style="margin-bottom: 16px; page-break-inside: avoid;">
          <p style="margin: 0 0 6px 0; font-weight: bold;">
            Câu ${idx + 1} (${q.score} điểm): <span style="font-weight: normal;">${escapeHtml(q.content)}</span>
          </p>
          ${optionsHtml}
          ${
            includeAnswerKey && q.explanation
              ? `<p style="margin: 6px 0 0 20px; font-size: 11pt; color: #4b5563; font-style: italic;">
                  Lời giải chi tiết: ${escapeHtml(q.explanation)}
                </p>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  // Render Bảng Ma trận Đáp án (Answer Key Table) ở cuối đề thi nếu includeAnswerKey = true
  let answerKeyTableHtml = '';
  if (includeAnswerKey) {
    const colsPerRow = 10;
    const rows: string[] = [];

    for (let i = 0; i < data.questions.length; i += colsPerRow) {
      const chunk = data.questions.slice(i, i + colsPerRow);
      const headerCells = chunk.map((q) => `<th style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #f3f4f6; width: 40px;">C${q.order}</th>`).join('');
      const valCells = chunk
        .map((q) => {
          const correctOpt = q.options.find((o) => o.isCorrect);
          return `<td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; color: #047857;">${correctOpt ? correctOpt.label : '-'}</td>`;
        })
        .join('');

      rows.push(`
        <tr style="background-color: #f9fafb;">${headerCells}</tr>
        <tr>${valCells}</tr>
      `);
    }

    answerKeyTableHtml = `
      <div style="page-break-before: always; margin-top: 30px;">
        <h3 style="text-align: center; font-size: 14pt; margin-bottom: 12px; text-transform: uppercase;">
          🔑 BẢNG ĐÁP ÁN SOI ĐỀ THI - MÃ ĐỀ: ${escapeHtml(data.paperCode)}
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
          ${rows.join('')}
        </table>
      </div>
    `;
  }

  // Khung HTML nén định dạng Word (.doc / .docx)
  const fullDocumentHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(data.title)}</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.3;
          color: #000;
          margin: 0;
          padding: 20px;
        }
        table.header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table.header-table td {
          vertical-align: top;
        }
      </style>
    </head>
    <body>
      <!-- Header tiêu chuẩn Bộ GD&ĐT -->
      <table class="header-table">
        <tr>
          <td style="width: 45%; text-align: center;">
            <p style="margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(school)}</p>
            <p style="margin: 2px 0 0 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(dept)}</p>
            <p style="margin: 4px 0 0 0;">------------------------</p>
          </td>
          <td style="width: 55%; text-align: center;">
            <p style="margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase;">KỲ THI TRẮC NGHIỆM TỰ ĐỘNG</p>
            <p style="margin: 2px 0 0 0; font-size: 11pt; font-weight: bold;">Môn thi: ${escapeHtml(data.subjectName)} (${escapeHtml(data.subjectCode)})</p>
            <p style="margin: 2px 0 0 0; font-size: 10pt; font-style: italic;">Thời gian làm bài: ${data.durationMinutes} phút</p>
          </td>
        </tr>
      </table>

      <!-- Mã đề & Lời dặn -->
      <div style="text-align: center; margin-bottom: 20px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0;">
        <h2 style="margin: 0; font-size: 14pt; text-transform: uppercase;">ĐỀ THI MÃ SỐ: ${escapeHtml(data.paperCode)}</h2>
        <p style="margin: 4px 0 0 0; font-size: 10pt; font-style: italic;">(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm)</p>
      </div>

      <!-- Danh sách câu hỏi -->
      ${questionsHtml}

      <!-- Bảng đáp án -->
      ${answerKeyTableHtml}
    </body>
    </html>
  `;

  // Tải file về máy
  const blob = new Blob(['\ufeff' + fullDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const fileName = `De_Thi_${data.subjectCode}_Ma_${data.paperCode}.doc`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
