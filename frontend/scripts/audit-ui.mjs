import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const sourceRoots = ['app', 'components'];
const sourceExtensions = new Set(['.ts', '.tsx', '.css']);
const violations = [];
const kpiBoldFiles = new Set([
  'components/KPICards.tsx',
  'components/dashboard/DashboardStatistics.tsx',
  'components/classes/ClassKPICards.tsx',
  'components/departments/DepartmentKPICards.tsx',
  'components/exam-papers/ExamPaperKPICards.tsx',
  'components/exam-periods/ExamPeriodKPICards.tsx',
  'components/exam-reports/ExamReportKPICards.tsx',
  'components/exam-rooms/ExamRoomKPICards.tsx',
  'components/exam-schedules/ExamScheduleKPICards.tsx',
  'components/regrade/RegradeKPICards.tsx',
  'components/students/StudentKPICards.tsx',
  'components/subjects/SubjectKPICards.tsx',
  'components/teachers/TeacherKPICards.tsx',
  'app/admin/activity-logs/page.tsx',
  'app/trash/page.tsx',
  'app/student/online-exam/[id]/lobby/page.tsx',
  'app/student/online-exam/[id]/take/page.tsx',
  'app/student/online-exam/[id]/result/page.tsx',
]);
const popupBoldFiles = new Set([
  'components/ConfirmModal.tsx',
  'components/CriticalConfirmModal.tsx',
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
    } else if (sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function report(file, rule) {
  violations.push(`${relative(root, file)}: ${rule}`);
}

for (const folder of sourceRoots) {
  const files = await collectFiles(join(root, folder));
  for (const file of files) {
    const content = await readFile(file, 'utf8');

    if (/font-serif/i.test(content)) {
      report(file, 'không được dùng font serif hoặc monospace trong Web UI');
    }

    if (/font-mono/i.test(content)) {
      report(file, 'Web UI phải dùng Inter; không dùng class font-mono');
    }

    const hasUppercaseUtility = /className\s*=\s*["'][^"']*\buppercase\b/i.test(content)
      || /class\s*=\s*["'][^"']*\buppercase\b/i.test(content);
    if (file.endsWith('.tsx') && hasUppercaseUtility) {
      report(file, 'Web UI dùng sentence case; không dùng utility uppercase');
    }

    if (/text-\[(?:[0-9]|10|10\.5|11|11\.5)px\]/i.test(content)) {
      report(file, 'cỡ chữ Web UI không được thấp hơn 12px');
    }

    if (/text-\[16px\]|\btext-(2xl|3xl|4xl)\b/i.test(content)) {
      report(file, 'Web UI must use the semantic typography scale; avoid 16px/2xl/3xl/4xl');
    }

    if (/(?:<label|<input|<select|<textarea)[^<>]*\btext-xs\b/i.test(content)
      || /(?:<label|<input|<select|<textarea)[^<>]*text-\[12px\]/i.test(content)) {
      report(file, 'label/control size must be at least 15px');
    }

    if (/(?:<table|<thead|<tbody|<th|<td)[^<>]*\btext-xs\b/i.test(content)
      || /(?:<table|<thead|<tbody|<th|<td)[^<>]*text-\[12px\]/i.test(content)) {
      report(file, 'table header/cell size must use the table scale');
    }

    for (const tableMatch of content.matchAll(/<table\b[\s\S]*?<\/table>/gi)) {
      for (const bodyMatch of tableMatch[0].matchAll(/<tbody\b[\s\S]*?<\/tbody>/gi)) {
        const body = bodyMatch[0]
          .replace(/<svg[\s\S]*?<\/svg>/gi, '')
          .replace(/[^\r\n]*(?:table-badge|table-avatar|table-action|table-tooltip|table-meta)[^\r\n]*/gi, '');
        if (/text-xs|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(body)) {
          report(file, 'table body text must be 15px; compact size is limited to table-badge/table-avatar/table-tooltip/table-meta');
        }
      }
    }

    if (/text-transform\s*:\s*;/i.test(content)) {
      report(file, 'không được để lại khai báo text-transform rỗng');
    }

    const relativeFile = relative(root, file).replaceAll('\\', '/');
    if (relativeFile !== 'app/exam-arrangement/page.tsx' && !popupBoldFiles.has(relativeFile) && (/font-(thin|extralight|light|black|extrabold)/i.test(content) || /font-weight:\s*(100|200|300|800|900)/i.test(content))) {
      report(file, 'Web UI chi duoc dung font weight 400-700');
    }

    if (file.endsWith('.tsx') && /font-bold/i.test(content) && !kpiBoldFiles.has(relativeFile) && !popupBoldFiles.has(relativeFile)) {
      report(file, 'font-bold (700) chi danh cho component KPI/tong so da duoc phe duyet');
    }

    if (/(?:bg|text|border|from|to|via)-(?:purple|violet|indigo|fuchsia|pink)-/i.test(content)) {
      report(file, 'không được dùng accent tím/indigo/pink ngoài hệ màu chuẩn');
    }

    if (file !== join(root, 'components', 'ui', 'DynamicImage.tsx') && /<img(?=\s|\/?>)/i.test(content)) {
      report(file, 'ảnh động phải dùng DynamicImage thay vì thẻ img trực tiếp');
    }

    for (const form of content.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)) {
      for (const button of form[1].matchAll(/<button\b[^>]*>/g)) {
        if (!/\btype\s*=/.test(button[0])) {
          report(file, 'mọi button thô trong form phải khai báo type rõ ràng');
        }
      }
    }
  }
}

const layout = await readFile(join(root, 'app', 'layout.tsx'), 'utf8');
const globalCss = await readFile(join(root, 'app', 'globals.css'), 'utf8');

if (!/import\s+\{\s*Inter\s*\}\s+from\s+['"]next\/font\/google['"]/.test(layout) || !/variable:\s*['"]--font-inter['"]/.test(layout)) {
  violations.push('app/layout.tsx: phải nạp Inter qua next/font/google với biến --font-inter');
}

if (!/font-family:\s*var\(--font-ui\)/.test(globalCss)) {
  violations.push('app/globals.css: body phải kế thừa font Inter dùng chung');
}

if (violations.length) {
  console.error('UI audit thất bại:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('UI audit passed: Inter, màu nhấn và DynamicImage đều đúng chuẩn.');
