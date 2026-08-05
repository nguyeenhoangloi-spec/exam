/**
 * Utility function to generate professionally formatted Microsoft Excel (.xls / .xlsx) spreadsheets
 * with styled header row (Sapphire Blue background, white bold text), auto-fit column widths,
 * borders, text format preservation (mso-number-format), and alternating zebra rows.
 */

export interface ExcelColumnConfig {
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: number; // Optional explicit width override (in characters)
}

export interface ExportExcelOptions {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExcelColumnConfig[];
  rows: (string | number | boolean | null | undefined)[][];
}

export function exportToFormattedExcel({
  filename,
  title,
  subtitle,
  columns,
  rows,
}: ExportExcelOptions) {
  // Calculate auto-fit column widths based on maximum content length in each column
  const calculatedWidths = columns.map((col, colIdx) => {
    if (col.width) return col.width;
    let maxLen = col.header.length;
    rows.forEach((row) => {
      const val = row[colIdx];
      if (val !== null && val !== undefined) {
        const strVal = String(val);
        if (strVal.length > maxLen) maxLen = strVal.length;
      }
    });
    // Scale length + padding (min 12, max 60)
    return Math.min(Math.max(maxLen + 4, 12), 60);
  });

  const nowStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Construct HTML table with Microsoft Office Excel XML/CSS styling
  const colElements = calculatedWidths
    .map((w) => `<col style="width:${Math.round(w * 8.5)}px; mso-width-alt:${Math.round(w * 256)};" />`)
    .join('');

  const headerCells = columns
    .map(
      (col) =>
        `<th style="background-color:#1E66F5; color:#FFFFFF; font-weight:bold; font-size:11pt; font-family:Arial, sans-serif; text-align:${
          col.align || 'center'
        }; vertical-align:middle; height:32px; border:1px solid #0F172A; padding:6px 10px;">${escapeHtml(
          col.header,
        )}</th>`,
    )
    .join('');

  const bodyRows = rows
    .map((row, rIdx) => {
      const bgClass = rIdx % 2 === 1 ? 'background-color:#F8FAFC;' : 'background-color:#FFFFFF;';
      const cells = row
        .map((val, cIdx) => {
          const colConf = columns[cIdx] || { align: 'left' };
          const align = colConf.align || (typeof val === 'number' ? 'right' : 'left');
          const displayVal = val === null || val === undefined ? '' : String(val);

          return `<td style="${bgClass} border:1px solid #CBD5E1; color:#0F172A; font-size:10pt; font-family:Arial, sans-serif; text-align:${align}; vertical-align:middle; padding:6px 10px; mso-number-format:'\\@';">${escapeHtml(
            displayVal,
          )}</td>`;
        })
        .join('');
      return `<tr style="height:26px;">${cells}</tr>`;
    })
    .join('');

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Sheet1</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:FitToPage/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <table>
    <colgroup>${colElements}</colgroup>
    <thead>
      <tr>
        <th colspan="${columns.length}" style="font-size:15pt; font-weight:bold; color:#1E66F5; text-align:center; padding:12px; height:40px;">
          ${escapeHtml(title.toUpperCase())}
        </th>
      </tr>
      <tr>
        <th colspan="${columns.length}" style="font-size:9.5pt; color:#64748B; text-align:center; padding-bottom:10px; height:22px;">
          ${escapeHtml(subtitle || `Thời điểm xuất file: ${nowStr} | Tổng số bản ghi: ${rows.length}`)}
        </th>
      </tr>
      <tr style="height:32px;">${headerCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</body>
</html>
`.trim();

  // Create UTF-8 Blob and trigger download
  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const finalFilename = filename.toLowerCase().endsWith('.xls') || filename.toLowerCase().endsWith('.xlsx')
    ? filename
    : `${filename}.xls`;

  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
