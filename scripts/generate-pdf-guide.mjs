import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const USER_GUIDE_DIR = path.join(ROOT_DIR, 'docs', 'user-guide');
const OUTPUT_DIR = path.join(ROOT_DIR, 'docs', 'pdf');

// Đảm bảo thư mục output tồn tại
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Hàm chuyển đổi Markdown cơ bản sang HTML ngữ nghĩa
function markdownToHtml(markdown) {
  let lines = markdown.split('\n');
  let html = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let inAlert = false;
  let alertType = '';
  let alertContent = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      let tableHtml = '<div class="table-container"><table>';
      tableRows.forEach((row, index) => {
        let isHeader = index === 0;
        let tag = isHeader ? 'th' : 'td';
        let cells = row.split('|').map(c => c.trim()).slice(1, -1);
        if (cells.length > 0 && !cells[0].includes('---')) {
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<${tag}>${formatInline(cell)}</${tag}>`;
          });
          tableHtml += '</tr>';
        }
      });
      tableHtml += '</table></div>';
      html.push(tableHtml);
      tableRows = [];
      inTable = false;
    }
  };

  const flushAlert = () => {
    if (inAlert) {
      let icon = 'ℹ️';
      let title = 'Lưu ý quan trọng';
      if (alertType === 'TIP') { icon = '💡'; title = 'Mẹo hay'; }
      else if (alertType === 'IMPORTANT') { icon = '❗'; title = 'Quy định bắt buộc'; }
      else if (alertType === 'WARNING') { icon = '⚠️'; title = 'Cảnh báo an toàn'; }
      else if (alertType === 'CAUTION') { icon = '🛑'; title = 'Nguy hiểm'; }

      html.push(`
        <div class="alert alert-${alertType.toLowerCase()}">
          <div class="alert-header"><span class="alert-icon">${icon}</span> <strong>${title}</strong></div>
          <div class="alert-body">${alertContent.map(l => formatInline(l)).join('<br/>')}</div>
        </div>
      `);
      inAlert = false;
      alertType = '';
      alertContent = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Xử lý Code block
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        if (inTable) flushTable();
        if (inAlert) flushAlert();
        inCodeBlock = true;
        codeBlockLang = line.trim().replace('```', '');
        html.push(`<pre><code class="language-${codeBlockLang}">`);
      } else {
        inCodeBlock = false;
        html.push('</code></pre>');
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    // Xử lý Alert block: > [!NOTE], > [!TIP], etc.
    let alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
    if (alertMatch) {
      if (inTable) flushTable();
      if (inAlert) flushAlert();
      inAlert = true;
      alertType = alertMatch[1].toUpperCase();
      alertContent = [];
      continue;
    }

    if (inAlert) {
      if (line.trim().startsWith('>')) {
        alertContent.push(line.replace(/^>\s?/, ''));
        continue;
      } else {
        flushAlert();
      }
    }

    // Xử lý Bảng biểu (Table)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Dòng kẻ ngang
    if (line.trim() === '---' || line.trim() === '***') {
      html.push('<hr class="divider"/>');
      continue;
    }

    // Tiêu đề Heading
    if (line.startsWith('# ')) {
      html.push(`<h1>${formatInline(line.substring(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      html.push(`<h2>${formatInline(line.substring(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      html.push(`<h3>${formatInline(line.substring(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      html.push(`<h4>${formatInline(line.substring(5))}</h4>`);
      continue;
    }

    // Danh sách không thứ tự
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      let content = line.trim().substring(2);
      html.push(`<li>${formatInline(content)}</li>`);
      continue;
    }

    // Danh sách có thứ tự
    let olMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      html.push(`<li value="${olMatch[1]}">${formatInline(olMatch[2])}</li>`);
      continue;
    }

    // Đoạn văn thông thường
    if (line.trim().length > 0) {
      html.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inTable) flushTable();
  if (inAlert) flushAlert();

  return html.join('\n');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="doc-img"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="doc-link">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Tạo CSS Print A4 chuẩn mực học thuật
const PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 25mm;
  }
  
  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    font-family: 'Times New Roman', 'Segoe UI', serif;
    font-size: 12.5pt;
    line-height: 1.55;
    color: #111827;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* TRANG BÌA SANG TRỌNG */
  .cover-container {
    width: 100%;
    min-height: 90vh;
    border: 3px double #1e3a8a;
    padding: 40px 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    page-break-after: always;
    break-after: page;
    background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
  }

  .cover-header-national {
    font-size: 13pt;
    font-weight: bold;
    color: #1e293b;
    text-transform: uppercase;
    line-height: 1.4;
  }

  .cover-motto {
    font-size: 11pt;
    font-weight: normal;
    color: #334155;
    margin-top: 4px;
    border-bottom: 1px solid #64748b;
    display: inline-block;
    padding-bottom: 4px;
  }

  .cover-badge {
    margin: 30px 0;
    font-size: 40pt;
  }

  .cover-title-main {
    font-size: 22pt;
    font-weight: 900;
    color: #1e3a8a;
    text-transform: uppercase;
    line-height: 1.3;
    margin: 10px 0;
    letter-spacing: 0.5px;
  }

  .cover-title-sub {
    font-size: 16pt;
    font-weight: bold;
    color: #0369a1;
    text-transform: uppercase;
    margin-bottom: 25px;
  }

  .cover-desc-box {
    max-width: 580px;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 20px auto;
    font-size: 11pt;
    color: #334155;
    text-align: left;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  }

  .cover-desc-box ul {
    margin: 6px 0;
    padding-left: 20px;
  }

  .cover-footer {
    margin-top: 40px;
    font-size: 11.5pt;
    color: #475569;
    line-height: 1.6;
    border-top: 1px solid #e2e8f0;
    width: 100%;
    padding-top: 15px;
  }

  /* MỤC LỤC TỰ ĐỘNG */
  .toc-container {
    page-break-after: always;
    break-after: page;
    padding: 10px 0;
  }

  .toc-title {
    font-size: 18pt;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 8px;
    margin-bottom: 20px;
    text-align: center;
  }

  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item-part {
    font-size: 13pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-top: 16px;
    padding-bottom: 4px;
    border-bottom: 1px dashed #cbd5e1;
  }

  .toc-item-sub {
    font-size: 11.5pt;
    color: #334155;
    margin: 6px 0 6px 20px;
    display: flex;
    justify-content: space-between;
  }

  /* NỘI DUNG CHƯƠNG MỤC */
  .chapter-section {
    page-break-before: always;
    break-before: page;
    margin-top: 20px;
  }

  h1 {
    font-size: 18pt;
    font-weight: bold;
    color: #1e3a8a;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 8px;
    margin-top: 10px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 14.5pt;
    font-weight: bold;
    color: #0f172a;
    margin-top: 24px;
    margin-bottom: 10px;
    page-break-after: avoid;
    break-after: avoid;
  }

  h3 {
    font-size: 13pt;
    font-weight: bold;
    color: #1e293b;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
    break-after: avoid;
  }

  p {
    margin: 8px 0;
    text-align: justify;
  }

  /* BẢNG BIỂU CHUẨN MỰC */
  .table-container {
    margin: 14px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11pt;
  }

  th, td {
    border: 1px solid #94a3b8;
    padding: 7px 10px;
    vertical-align: top;
  }

  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: bold;
    text-align: center;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  /* ALERT BOXES */
  .alert {
    padding: 10px 14px;
    margin: 14px 0;
    border-radius: 6px;
    border-left: 4px solid;
    font-size: 11pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .alert-header {
    font-weight: bold;
    margin-bottom: 4px;
  }

  .alert-note { background-color: #eff6ff; border-color: #3b82f6; color: #1e40af; }
  .alert-tip { background-color: #f0fdf4; border-color: #22c55e; color: #15803d; }
  .alert-important { background-color: #fffbeb; border-color: #f59e0b; color: #b45309; }
  .alert-warning { background-color: #fff7ed; border-color: #ea580c; color: #c2410c; }
  .alert-caution { background-color: #fef2f2; border-color: #ef4444; color: #b91c1c; }

  /* CODE BLOCKS */
  pre {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 10pt;
    overflow-x: auto;
    page-break-inside: avoid;
    break-inside: avoid;
    line-height: 1.4;
  }

  code {
    font-family: 'Consolas', 'Courier New', monospace;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #0f172a;
  }

  pre code {
    background: none;
    padding: 0;
  }

  hr.divider {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  /* HEADER & FOOTER KHI IN */
  @media print {
    .no-print {
      display: none !important;
    }
    body {
      padding: 0;
    }
  }
`;

// Cấu trúc danh mục các bài viết
const GUIDES_STRUCTURE = [
  {
    id: 'overview',
    title: 'Phần 0: Tổng Quan Hệ Thống & Kiến Trúc Nghiệp Vụ',
    files: [
      path.join(USER_GUIDE_DIR, '00-tong-quan-he-thong.md')
    ]
  },
  {
    id: 'admin',
    title: 'Phần 1: Cẩm Nang Quản Trị Viên & Phòng Khảo Thí (Admin)',
    files: [
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '01-dang-nhap-va-phan-quyen.md'),
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '02-quan-ly-dao-tao.md'),
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '03-to-chuc-ky-thi.md'),
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '04-xep-phong-va-phan-cong.md'),
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '05-ngan-hang-cau-hoi-de-thi.md'),
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '06-tong-hop-va-xuat-bao-cao.md'),
      path.join(USER_GUIDE_DIR, '01-huong-dan-admin', '07-sao-luu-va-nhat-ky.md')
    ]
  },
  {
    id: 'teacher',
    title: 'Phần 2: Cẩm Nang Giảng Viên & Cán Bộ Coi Thi / Chấm Thi (Teachers)',
    files: [
      path.join(USER_GUIDE_DIR, '02-huong-dan-giang-vien', '01-tong-quan-giao-dien.md'),
      path.join(USER_GUIDE_DIR, '02-huong-dan-giang-vien', '02-lich-coi-thi-phan-cong.md'),
      path.join(USER_GUIDE_DIR, '02-huong-dan-giang-vien', '03-giam-sat-phong-thi.md'),
      path.join(USER_GUIDE_DIR, '02-huong-dan-giang-vien', '04-cham-thi-tu-luan.md'),
      path.join(USER_GUIDE_DIR, '02-huong-dan-giang-vien', '05-giai-quyet-phuc-khao.md')
    ]
  },
  {
    id: 'student',
    title: 'Phần 3: Cẩm Nang Thí Sinh / Sinh Viên (Students)',
    files: [
      path.join(USER_GUIDE_DIR, '03-huong-dan-sinh-vien', '01-tra-cuu-lich-thi.md'),
      path.join(USER_GUIDE_DIR, '03-huong-dan-sinh-vien', '02-huong-dan-thi-truc-tuyen.md'),
      path.join(USER_GUIDE_DIR, '03-huong-dan-sinh-vien', '03-quy-che-va-chong-gian-lan.md'),
      path.join(USER_GUIDE_DIR, '03-huong-dan-sinh-vien', '04-xem-ket-qua-va-bang-diem.md'),
      path.join(USER_GUIDE_DIR, '03-huong-dan-sinh-vien', '05-nop-don-phuc-khao.md')
    ]
  },
  {
    id: 'it',
    title: 'Phần 4: Sổ Tay Kỹ Thuật & Vận Hành Khẩn Cấp (IT / DevOps)',
    files: [
      path.join(USER_GUIDE_DIR, '04-huong-dan-ky-thuat-it', '01-cai-dat-moi-truong.md'),
      path.join(USER_GUIDE_DIR, '04-huong-dan-ky-thuat-it', '02-van-hanh-docker.md'),
      path.join(USER_GUIDE_DIR, '04-huong-dan-ky-thuat-it', '03-khac-phuc-su-co.md')
    ]
  }
];

// Hàm tạo Trang bìa
function generateCoverPage(mainTitle, subTitle, targetRole) {
  return `
    <div class="cover-container">
      <div class="cover-header-national">
        BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC<br/>
        <span class="cover-motto">Độc lập – Tự do – Hạnh phúc</span>
      </div>

      <div>
        <div class="cover-badge">🎓 ⚖️ 📚</div>
        <div class="cover-title-main">${mainTitle}</div>
        <div class="cover-title-sub">${subTitle}</div>
        
        <div class="cover-desc-box">
          <strong>ĐỐI TƯỢNG VÀ PHẠM VI ÁP DỤNG:</strong>
          <ul>
            <li>${targetRole}</li>
            <li>Chuẩn hóa theo Quy chế Khảo thí Đại học hiện hành</li>
            <li>Hỗ trợ khảo thí trực tuyến, chống gian lận & Trợ lý AI</li>
          </ul>
        </div>
      </div>

      <div class="cover-footer">
        <strong>HỆ THỐNG QUẢN LÝ KHẢO THÍ SINH VIÊN (EXAM MANAGEMENT SYSTEM)</strong><br/>
        Phiên bản Phát hành: Version 1.0 — Năm học 2025 – 2026<br/>
        Lưu hành nội bộ — Xuất bản ngày ${new Date().toLocaleDateString('vi-VN')}
      </div>
    </div>
  `;
}

// Hàm sinh Mục Lục
function generateTableOfContents(sections) {
  let tocHtml = `
    <div class="toc-container">
      <div class="toc-title">MỤC LỤC TỔNG THỂ</div>
      <ul class="toc-list">
  `;

  sections.forEach((sec, sIdx) => {
    tocHtml += `<li class="toc-item-part">${sec.title}</li>`;
    sec.files.forEach(f => {
      let content = fs.readFileSync(f, 'utf-8');
      let firstLine = content.split('\n').find(l => l.startsWith('# '));
      let title = firstLine ? firstLine.replace('# ', '').trim() : path.basename(f, '.md');
      tocHtml += `<li class="toc-item-sub"><span>• ${title}</span></li>`;
    });
  });

  tocHtml += `
      </ul>
    </div>
  `;
  return tocHtml;
}

// Hàm tạo toàn bộ tài liệu HTML hoàn chỉnh
function buildHtmlDocument(title, coverHtml, tocHtml, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${PRINT_CSS}
  </style>
</head>
<body>
  ${coverHtml}
  ${tocHtml ? tocHtml : ''}
  <div class="main-content">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

// Tìm đường dẫn thực thi trình duyệt trên Windows
function getBrowserExecutable() {
  const paths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (let p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Chuyển đổi HTML sang PDF bằng Headless Edge/Chrome
function exportHtmlToPdf(htmlPath, pdfPath) {
  const browserPath = getBrowserExecutable();
  if (!browserPath) {
    console.warn(`[CẢNH BÁO] Không tìm thấy Edge/Chrome để in PDF trực tiếp. File HTML vẫn sẵn sàng tại: ${htmlPath}`);
    return false;
  }

  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${fileUrl}"`;
  
  try {
    console.log(`Đang xuất PDF: ${path.basename(pdfPath)}...`);
    execSync(cmd, { stdio: 'ignore' });
    console.log(`✅ Xuất thành công: ${pdfPath}`);
    return true;
  } catch (err) {
    console.error(`❌ Lỗi khi xuất PDF ${pdfPath}:`, err.message);
    return false;
  }
}

// ==========================================
// TIẾN TRÌNH THỰC THI CHÍNH
// ==========================================
async function main() {
  console.log('🚀 Bắt đầu quá trình biên dịch tài liệu PDF Hướng Dẫn Sử Dụng...');

  // 1. Xuất TẬP TỔNG HỢP TOÀN BỘ HỆ THỐNG
  console.log('📦 Đang tạo Tập Tổng Hợp Toàn Bộ Hệ Thống...');
  let fullBodyHtml = '';
  GUIDES_STRUCTURE.forEach(sec => {
    fullBodyHtml += `<div class="chapter-section"><h1 style="color: #1e3a8a; border-bottom: 3px double #1e3a8a;">${sec.title}</h1></div>`;
    sec.files.forEach(f => {
      let md = fs.readFileSync(f, 'utf-8');
      fullBodyHtml += `<div class="chapter-article">${markdownToHtml(md)}</div><div class="page-break"></div>`;
    });
  });

  const fullCover = generateCoverPage(
    'CẨM NANG HƯỚNG DẪN SỬ DỤNG VÀ VẬN HÀNH',
    'TỔNG TẬP TOÀN DIỆN HỆ THỐNG KHẢO THÍ HỌC ĐƯỜNG',
    'Ban Giám Hiệu, Phòng Khảo Thí, Giảng Viên, Sinh Viên & Kỹ Sư IT'
  );
  const fullToc = generateTableOfContents(GUIDES_STRUCTURE);
  const fullHtml = buildHtmlDocument('Tổng Tập Hướng Dẫn Khảo Thí', fullCover, fullToc, fullBodyHtml);

  const fullHtmlPath = path.join(OUTPUT_DIR, 'Tong-Tap-Huong-Dan-Khao-Thi.html');
  const fullPdfPath = path.join(OUTPUT_DIR, 'Tong-Tap-Huong-Dan-Khao-Thi.pdf');
  fs.writeFileSync(fullHtmlPath, fullHtml, 'utf-8');
  exportHtmlToPdf(fullHtmlPath, fullPdfPath);

  // 2. Xuất các TẬP RỜI CHUYÊN BIỆT
  const modularConfigs = [
    {
      key: 'admin',
      section: GUIDES_STRUCTURE.find(s => s.id === 'admin'),
      filename: '01-Huong-Dan-Admin',
      mainTitle: 'CẨM NANG QUẢN TRỊ VIÊN & KHẢO THÍ',
      subTitle: 'HƯỚNG DẪN TỔ CHỨC THI, ĐỀ THI & BÁO CÁO',
      targetRole: 'Ban Giám Hiệu, Lãnh Đạo Phòng Khảo Thí & Đảm Bảo Chất Lượng'
    },
    {
      key: 'teacher',
      section: GUIDES_STRUCTURE.find(s => s.id === 'teacher'),
      filename: '02-Huong-Dan-Giang-Vien',
      mainTitle: 'CẨM NANG GIẢNG VIÊN COI THI & CHẤM THI',
      subTitle: 'GIÁM SÁT TRỰC TUYẾN, CHẤM TỰ LUẬN AI & PHÚC KHẢO',
      targetRole: 'Cán Bộ Coi Thi (Giám Thị 1 & 2), Cán Bộ Chấm Thi & Hội Đồng Thẩm Định'
    },
    {
      key: 'student',
      section: GUIDES_STRUCTURE.find(s => s.id === 'student'),
      filename: '03-Huong-Dan-Sinh-Vien',
      mainTitle: 'CẨM NANG THÍ SINH & SINH VIÊN',
      subTitle: 'LỊCH THI, THI TRỰC TUYẾN, XEM ĐIỂM & PHÚC KHẢO',
      targetRole: 'Toàn thể Thí sinh, Sinh viên các hệ Đào tạo chính quy & Vừa làm vừa học'
    },
    {
      key: 'it',
      section: GUIDES_STRUCTURE.find(s => s.id === 'it'),
      filename: '04-So-Tay-Ky-Thuat-IT',
      mainTitle: 'SỔ TAY KỸ THUẬT & VẬN HÀNH MÁY CHỦ',
      subTitle: 'CÀI ĐẶT MÔI TRƯỜNG, DOCKER & ỨNG CỨU SỰ CỐ',
      targetRole: 'Đội ngũ Kỹ sư Trung tâm CNTT, Quản trị viên Mạng & DevOps'
    }
  ];

  for (let mod of modularConfigs) {
    console.log(`📦 Đang tạo cẩm nang: ${mod.filename}...`);
    let modBodyHtml = '';
    mod.section.files.forEach(f => {
      let md = fs.readFileSync(f, 'utf-8');
      modBodyHtml += `<div class="chapter-article">${markdownToHtml(md)}</div><div class="page-break"></div>`;
    });

    let modCover = generateCoverPage(mod.mainTitle, mod.subTitle, mod.targetRole);
    let modToc = generateTableOfContents([mod.section]);
    let modHtml = buildHtmlDocument(mod.mainTitle, modCover, modToc, modBodyHtml);

    let modHtmlPath = path.join(OUTPUT_DIR, `${mod.filename}.html`);
    let modPdfPath = path.join(OUTPUT_DIR, `${mod.filename}.pdf`);
    fs.writeFileSync(modHtmlPath, modHtml, 'utf-8');
    exportHtmlToPdf(modHtmlPath, modPdfPath);
  }

  console.log('\n🎉 TOÀN BỘ QUÁ TRÌNH BIÊN DỊCH PDF ĐÃ HOÀN TẤT!');
  console.log(`📁 Thư mục lưu trữ tài liệu PDF: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
