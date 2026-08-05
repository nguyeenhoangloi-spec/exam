/**
 * Utility function to generate and open a standardized A4 Print Report window.
 */
export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  metaInfo?: Array<{ label: string; value: string }>;
  columns: Array<{ header: string; width?: string; align?: 'left' | 'center' | 'right' }>;
  rows: Array<Array<string | number>>;
  footerNotes?: string;
  signers?: Array<{ title: string; subtitle?: string }>;
}

function escapeHtml(val: unknown) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function printReport(options: PrintReportOptions): boolean {
  const printable = window.open('', '_blank', 'width=980,height=780');
  if (!printable) return false;

  const metaHtml = options.metaInfo && options.metaInfo.length > 0
    ? `<div style="margin-bottom: 16px; font-size: 11pt; line-height: 1.6; display: flex; flex-wrap: wrap; gap: 20px;">
        ${options.metaInfo.map(m => `<div><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}</div>`).join('')}
       </div>`
    : '';

  const headersHtml = options.columns
    .map(c => `<th style="border: 1px solid #475569; background-color: #f1f5f9; padding: 8px 6px; text-align: ${c.align || 'center'}; ${c.width ? `width: ${c.width};` : ''}">${escapeHtml(c.header)}</th>`)
    .join('');

  const rowsHtml = options.rows
    .map((row, idx) => `
      <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        ${row.map((cell, cIdx) => {
          const colDef = options.columns[cIdx];
          const align = colDef?.align || (cIdx === 0 ? 'center' : 'left');
          return `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${align};">${escapeHtml(cell)}</td>`;
        }).join('')}
      </tr>
    `)
    .join('');

  const signersList = options.signers || [
    { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỞNG TRỰC KHẢO THÍ', subtitle: '(Ký, đóng dấu)' }
  ];

  const signersHtml = `
    <table style="width: 100%; margin-top: 40px; border-collapse: collapse; font-size: 11pt;">
      <tr>
        ${signersList.map(s => `
          <td style="width: ${100 / signersList.length}%; text-align: center; vertical-align: top;">
            <p style="margin: 0; font-weight: bold; text-transform: uppercase;">${escapeHtml(s.title)}</p>
            <p style="margin: 4px 0 60px 0; font-style: italic; font-size: 10pt; color: #475569;">${escapeHtml(s.subtitle || '')}</p>
            <p style="margin: 0; font-weight: bold;">...................................</p>
          </td>
        `).join('')}
      </tr>
    </table>
  `;

  printable.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(options.title)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; color: #0f172a; padding: 24px; margin: 0; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 16px 0 6px 0; color: #0f172a; }
    .subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 16px; color: #334155; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 10.5pt; }
    @media print {
      body { padding: 0; }
      @page { size: A4 portrait; margin: 15mm; }
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="margin: 0; font-weight: bold; font-size: 11pt;">TRƯỜNG ĐẠI HỌC KHẢO THÍ</p>
        <p style="margin: 0; font-weight: bold; font-size: 11pt; color: #1e3a8a;">HỘI ĐỒNG KHẢO THÍ TRỰC TUYẾN</p>
        <p style="margin: 2px 0 0 0;">-----------------</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <p style="margin: 0; font-weight: bold; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="margin: 0; font-weight: bold; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
        <p style="margin: 2px 0 0 0;">-----------------</p>
      </td>
    </tr>
  </table>

  <h1 class="title">${escapeHtml(options.title)}</h1>
  ${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ''}

  ${metaHtml}

  <table class="data-table">
    <thead>
      <tr>${headersHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${options.footerNotes ? `<p style="font-size: 10pt; font-style: italic; margin-top: 10px;">* ${escapeHtml(options.footerNotes)}</p>` : ''}

  <div style="text-align: right; font-size: 11pt; margin-top: 20px; font-style: italic;">
    Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}
  </div>

  ${signersHtml}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`);
  printable.document.close();
  return true;
}
