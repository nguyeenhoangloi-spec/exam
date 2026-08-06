export interface ExamPaperExportData {
  paperCode: string; title: string; subjectName: string; subjectCode: string;
  durationMinutes: number; totalScore: number; schoolName?: string; departmentName?: string;
  questions: Array<{ order: number; code?: string; content: string; score: number; options: Array<{ label: string; content: string; isCorrect: boolean }>; explanation?: string }>;
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/** Exports a Word-compatible HTML document. It intentionally uses .doc because the payload is HTML, not OOXML. */
export function exportExamPaperToWord(data: ExamPaperExportData, includeAnswerKey = true) {
  const school = data.schoolName || 'TRƯỜNG ĐẠI HỌC KHẢO THÍ HỆ THỐNG';
  const department = data.departmentName || 'KHOA CÔNG NGHỆ THÔNG TIN';
  const questions = data.questions.map((q, i) => `<div class="question"><p><strong>Câu ${i + 1} (${q.score} điểm):</strong> ${escapeHtml(q.content)}</p>${q.options.map(o => `<div class="option"><strong>${escapeHtml(o.label)}.</strong> ${escapeHtml(o.content)}${includeAnswerKey && o.isCorrect ? ' <em>(Đáp án đúng)</em>' : ''}</div>`).join('')}${includeAnswerKey && q.explanation ? `<p class="explanation">Lời giải chi tiết: ${escapeHtml(q.explanation)}</p>` : ''}</div>`).join('');
  const key = includeAnswerKey ? `<div class="answer-key"><h3>BẢNG ĐÁP ÁN - MÃ ĐỀ: ${escapeHtml(data.paperCode)}</h3><table>${data.questions.map(q => `<tr><th>C${q.order}</th><td>${escapeHtml(q.options.find(o => o.isCorrect)?.label || '-')}</td></tr>`).join('')}</table></div>` : '';
  const html = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(data.title)}</title><style>body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.3;margin:20px}.header{width:100%;border-collapse:collapse}.header td{width:50%;text-align:center;vertical-align:top}.exam-title{text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:8px;margin:18px 0}.question{page-break-inside:avoid;margin-bottom:16px}.option{margin-left:20px;margin-bottom:4px}.explanation{margin-left:20px;font-size:11pt;font-style:italic;color:#4b5563}.answer-key{page-break-before:always}.answer-key h3{text-align:center}.answer-key table{border-collapse:collapse;width:100%}.answer-key th,.answer-key td{border:1px solid #000;padding:6px;text-align:center}</style></head><body><table class="header"><tr><td><strong>${escapeHtml(school)}</strong><br><strong>${escapeHtml(department)}</strong><br>------------------------</td><td><strong>KỲ THI TRẮC NGHIỆM TỰ ĐỘNG</strong><br><strong>Môn thi: ${escapeHtml(data.subjectName)} (${escapeHtml(data.subjectCode)})</strong><br><em>Thời gian làm bài: ${data.durationMinutes} phút</em></td></tr></table><div class="exam-title"><h2>ĐỀ THI MÃ SỐ: ${escapeHtml(data.paperCode)}</h2><em>(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm)</em></div>${questions}${key}</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `De_Thi_${data.subjectCode}_Ma_${data.paperCode}.doc`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
}
