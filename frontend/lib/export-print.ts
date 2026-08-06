export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  metaInfo?: Array<{ label: string; value: string }>;
  columns: Array<{ header: string; width?: string; align?: 'left' | 'center' | 'right' }>;
  rows: Array<Array<string | number>>;
  footerNotes?: string;
  signers?: Array<{ title: string; subtitle?: string }>;
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

export function printReport(options: PrintReportOptions): boolean {
  const printable = window.open('', '_blank', 'width=980,height=780');
  if (!printable) return false;
  const metaHtml = options.metaInfo?.length ? `<div class="meta">${options.metaInfo.map(m => `<div><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}</div>`).join('')}</div>` : '';
  const headers = options.columns.map(c => `<th style="text-align:${c.align || 'center'};${c.width ? `width:${c.width};` : ''}">${escapeHtml(c.header)}</th>`).join('');
  const rows = options.rows.map((row, i) => `<tr class="${i % 2 ? 'alt' : ''}">${row.map((cell, j) => `<td style="text-align:${options.columns[j]?.align || (j === 0 ? 'center' : 'left')}">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  const signers = options.signers || [{ title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' }, { title: 'TRƯỞNG TRỰC KHẢO THÍ', subtitle: '(Ký, đóng dấu)' }];
  const signerHtml = `<table class="signers"><tr>${signers.map(s => `<td><strong>${escapeHtml(s.title)}</strong><em>${escapeHtml(s.subtitle || '')}</em><b>...................................</b></td>`).join('')}</tr></table>`;
  printable.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;color:#0f172a;padding:24px}.title{text-align:center;font-size:16pt;font-weight:bold;text-transform:uppercase}.subtitle{text-align:center;font-style:italic}.meta{display:flex;gap:20px;flex-wrap:wrap;margin:16px 0}.data{width:100%;border-collapse:collapse}.data th{background:#f1f5f9}.data th,.data td{border:1px solid #475569;padding:6px 8px}.alt{background:#f8fafc}.signers{width:100%;margin-top:40px}.signers td{text-align:center;vertical-align:top}.signers em,.signers b{display:block;margin-top:6px}.signers em{margin-bottom:55px;color:#475569}@media print{body{padding:0}@page{size:A4 portrait;margin:15mm}}</style></head><body><h1 class="title">${escapeHtml(options.title)}</h1>${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}${metaHtml}<table class="data"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>${options.footerNotes ? `<p><em>* ${escapeHtml(options.footerNotes)}</em></p>` : ''}<p style="text-align:right;font-style:italic">Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>${signerHtml}<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  printable.document.close();
  return true;
}
