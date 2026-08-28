import { getPublishedTemplatesMap } from './export-print';

/**
 * Utility function to generate professionally formatted Microsoft Excel (.xls / .xlsx) spreadsheets
 * with full official academic layout (University header, National Motto, Title, Subtitle,
 * styled data table with Times New Roman typography, auto-fit column widths, borders,
 * number formatting, and signatory footer) synchronized with Document Templates.
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
  institutionName?: string;
  facultyName?: string;
  motto?: string;
  metaInfo?: Array<{ label: string; value: string }>;
  columns: ExcelColumnConfig[];
  rows: (string | number | boolean | null | undefined)[][];
  signers?: Array<{ title: string; subtitle?: string }>;
  footerNotes?: string;
  templateCode?: string;
}

export async function exportToFormattedExcel({
  filename,
  title,
  subtitle,
  institutionName,
  facultyName,
  motto,
  metaInfo,
  columns,
  rows,
  signers,
  footerNotes,
  templateCode,
}: ExportExcelOptions) {
  let tplConfig: any = null;
  if (templateCode) {
    try {
      const map = await getPublishedTemplatesMap();
      tplConfig = map[templateCode] || null;
    } catch {
      // Fallback to defaults
    }
  }

  const finalInstitution = institutionName || tplConfig?.header?.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
  const finalFaculty = facultyName !== undefined ? facultyName : (tplConfig?.header?.facultyName || 'KHOA CÔNG NGHỆ THÔNG TIN');
  const finalMotto = motto || tplConfig?.header?.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
  const mottoLines = finalMotto.split('\n');
  const mottoLine1 = mottoLines[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  const mottoLine2 = mottoLines[1] || 'Độc lập - Tự do - Hạnh phúc';

  const finalTitle = title || tplConfig?.header?.title || 'BÁO CÁO KHẢO THÍ';
  const finalSubtitle = subtitle !== undefined ? subtitle : (tplConfig?.header?.subtitle || '');
  const finalFooterNotes = footerNotes !== undefined ? footerNotes : (tplConfig?.footer?.note || '');
  const finalSigners = signers || tplConfig?.footer?.signers || [
    { title: 'NGƯỜI LẬP BẢNG', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'TRƯỜNG PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký, đóng dấu)' },
  ];

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

  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, '0');
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const yearStr = String(now.getFullYear());

  // Split columns between left header and right header
  const totalCols = Math.max(columns.length, 4);
  const leftSpan = Math.max(2, Math.floor(totalCols / 2));
  const rightSpan = totalCols - leftSpan;

  // Construct HTML table with Microsoft Office Excel XML/CSS styling
  const colElements = calculatedWidths
    .map((w) => `<col style="width:${Math.round(w * 8.5)}px; mso-width-alt:${Math.round(w * 256)};" />`)
    .join('');

  // 1. Header 2 bên (Đơn vị & Quốc hiệu)
  const headerSection = `
    <!-- Header: Left Unit & Right Motto -->
    <tr style="height:24px;">
      <td colspan="${leftSpan}" style="font-family:'Times New Roman', Times, serif; font-size:11pt; font-weight:bold; text-align:center; vertical-align:middle; color:#000000;">
        ${escapeHtml(finalInstitution.toUpperCase())}
      </td>
      <td colspan="${rightSpan}" style="font-family:'Times New Roman', Times, serif; font-size:11pt; font-weight:bold; text-align:center; vertical-align:middle; color:#000000;">
        ${escapeHtml(mottoLine1.toUpperCase())}
      </td>
    </tr>
    <tr style="height:24px;">
      <td colspan="${leftSpan}" style="font-family:'Times New Roman', Times, serif; font-size:10.5pt; font-weight:bold; text-decoration:underline; text-align:center; vertical-align:middle; color:#000000;">
        ${escapeHtml(finalFaculty ? finalFaculty.toUpperCase() : '')}
      </td>
      <td colspan="${rightSpan}" style="font-family:'Times New Roman', Times, serif; font-size:10.5pt; font-weight:bold; font-style:italic; text-decoration:underline; text-align:center; vertical-align:middle; color:#000000;">
        ${escapeHtml(mottoLine2)}
      </td>
    </tr>
    <tr style="height:14px;"><td colspan="${totalCols}" style="border:none;"></td></tr>
  `;

  // 2. Tiêu đề chính & Phụ đề
  const titleSection = `
    <tr style="height:36px;">
      <td colspan="${totalCols}" style="font-family:'Times New Roman', Times, serif; font-size:15pt; font-weight:bold; text-align:center; vertical-align:middle; color:#000000;">
        ${escapeHtml(finalTitle.toUpperCase())}
      </td>
    </tr>
    ${finalSubtitle ? `
    <tr style="height:22px;">
      <td colspan="${totalCols}" style="font-family:'Times New Roman', Times, serif; font-size:11pt; font-style:italic; text-align:center; vertical-align:middle; color:#000000;">
        ${escapeHtml(finalSubtitle)}
      </td>
    </tr>` : ''}
    ${metaInfo && metaInfo.length > 0 ? `
    <tr style="height:24px;">
      <td colspan="${totalCols}" style="font-family:'Times New Roman', Times, serif; font-size:10pt; font-style:italic; text-align:center; vertical-align:middle; color:#000000; background-color:transparent; border:1px solid #000000;">
        ${escapeHtml(metaInfo.map(m => `${m.label}: ${m.value}`).join('   |   '))}
      </td>
    </tr>` : ''}
    <tr style="height:10px;"><td colspan="${totalCols}" style="border:none;"></td></tr>
  `;

  // 3. Table Column Headers
  const headerCells = columns
    .map(
      (col) =>
        `<th style="background-color:transparent; color:#000000; font-weight:bold; font-size:11pt; font-family:'Times New Roman', Times, serif; text-align:${
          col.align || 'center'
        }; vertical-align:middle; height:32px; border:1px solid #000000; padding:6px 10px;">${escapeHtml(
          col.header,
        )}</th>`,
    )
    .join('');

  // 4. Data Rows
  const bodyRows = rows
    .map((row) => {
      const cells = row
        .map((val, cIdx) => {
          const colConf = columns[cIdx] || { align: 'left' };
          const align = colConf.align || (typeof val === 'number' ? 'right' : 'left');
          const displayVal = val === null || val === undefined ? '' : String(val);

          return `<td style="background-color:transparent; border:1px solid #000000; color:#000000; font-size:11pt; font-family:'Times New Roman', Times, serif; text-align:${align}; vertical-align:middle; padding:6px 10px; mso-number-format:'\\@';">${escapeHtml(
            displayVal,
          )}</td>`;
        })
        .join('');
      return `<tr style="height:26px;">${cells}</tr>`;
    })
    .join('');

  // 5. Footer & Signers
  const signersCount = Math.max(finalSigners.length, 1);
  const signerColSpan = Math.floor(totalCols / signersCount);
  const signerCells = finalSigners.map((s, idx) => {
    const isLast = idx === finalSigners.length - 1;
    const span = isLast ? totalCols - signerColSpan * (finalSigners.length - 1) : signerColSpan;
    return `
      <td colspan="${span}" style="font-family:'Times New Roman', Times, serif; text-align:center; vertical-align:top; border:none; padding:10px;">
        <div style="font-weight:bold; font-size:11pt; color:#000000;">${escapeHtml(s.title.toUpperCase())}</div>
        <div style="font-style:italic; font-size:10pt; color:#000000; margin-top:2px;">${escapeHtml(s.subtitle || '(Ký, ghi rõ họ tên)')}</div>
        <div style="height:60px;"></div>
        <div style="color:#000000; font-size:10pt;">...................................</div>
      </td>
    `;
  }).join('');

  const footerSection = `
    <tr style="height:14px;"><td colspan="${totalCols}" style="border:none;"></td></tr>
    ${finalFooterNotes ? `
    <tr style="height:20px;">
      <td colspan="${totalCols}" style="font-family:'Times New Roman', Times, serif; font-size:10pt; font-style:italic; color:#000000; border:none;">
        * ${escapeHtml(finalFooterNotes)}
      </td>
    </tr>` : ''}
    <tr style="height:24px;">
      <td colspan="${totalCols}" style="font-family:'Times New Roman', Times, serif; font-size:11pt; font-style:italic; text-align:right; border:none; padding-right:15px; color:#000000;">
        Ngày ${dayStr} tháng ${monthStr} năm ${yearStr}
      </td>
    </tr>
    <tr style="height:120px;">
      ${signerCells}
    </tr>
  `;

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
    body { font-family: 'Times New Roman', Times, serif; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <table>
    <colgroup>${colElements}</colgroup>
    <thead>
      ${headerSection}
      ${titleSection}
      <tr style="height:32px;">${headerCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
      ${footerSection}
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
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
