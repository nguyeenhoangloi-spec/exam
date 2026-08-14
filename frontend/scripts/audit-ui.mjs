import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const sourceRoots = ['app', 'components', 'lib', 'types', 'scripts'];
const sourceExtensions = new Set(['.ts', '.tsx', '.css', '.js', '.mjs']);
const skippedFiles = new Set(['scripts/audit-ui.mjs']);
const violations = [];
const printExportFiles = new Set([
  'app/exam-arrangement/page.tsx',
  'app/exam-reports/page.tsx',
  'app/teacher/assignments/page.tsx',
  'lib/export-docx.ts',
  'lib/export-excel.ts',
  'lib/export-print.ts',
]);
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
const inherentlyDarkDialogFiles = new Set([
  'components/AudioLightboxModal.tsx',
  'components/ImageLightboxModal.tsx',
  'components/VideoLightboxModal.tsx',
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

function getStaticClassText(initializer, sourceFile, variables) {
  if (!initializer) return '';
  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.text;
  }
  if (ts.isIdentifier(initializer)) {
    return variables.get(initializer.text) || '';
  }
  if (ts.isJsxExpression(initializer) && initializer.expression) {
    const expression = initializer.expression;
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
      return expression.text;
    }
    if (ts.isIdentifier(expression)) {
      return variables.get(expression.text) || '';
    }
    if (ts.isTemplateExpression(expression)) {
      return expression.getText(sourceFile);
    }
  }
  return '';
}

function inspectJsxControlClasses(content) {
  const sourceFile = ts.createSourceFile('audit.tsx', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const variables = new Map();
  const elements = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const value = getStaticClassText(node.initializer, sourceFile, variables);
      if (value) variables.set(node.name.text, value);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      const roleAttribute = node.attributes.properties.find(
        (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === 'role',
      );
      const role = roleAttribute ? getStaticClassText(roleAttribute.initializer, sourceFile, variables).toLowerCase() : '';
      if (/^(button|input|select|textarea|label)$/i.test(tagName) || role === 'button') {
        const classAttribute = node.attributes.properties.find(
          (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === 'className',
        );
        const typeAttribute = node.attributes.properties.find(
          (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === 'type',
        );
        elements.push({
          tagName: tagName.toLowerCase(),
          role,
          classes: classAttribute ? getStaticClassText(classAttribute.initializer, sourceFile, variables) : '',
          type: typeAttribute ? getStaticClassText(typeAttribute.initializer, sourceFile, variables).toLowerCase() : '',
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return elements;
}

for (const folder of sourceRoots) {
  const files = await collectFiles(join(root, folder));
  for (const file of files) {
    const relativeFile = relative(root, file).replaceAll('\\', '/');
    if (skippedFiles.has(relativeFile)) continue;
    const content = await readFile(file, 'utf8');

    for (const control of inspectJsxControlClasses(content)) {
      if (['input', 'select', 'textarea'].includes(control.tagName) && !['hidden', 'file', 'checkbox', 'radio'].includes(control.type)) {
        if (/\brounded-(?:sm|md|lg)\b/i.test(control.classes)) {
          report(file, 'input/select/textarea phải dùng radius control rounded-xl');
        }
        if (/\btext-sm\b|\btext-xs\b|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(control.classes)) {
          report(file, 'input/select/textarea phải dùng cỡ chữ 15px');
        }
      }
      if (control.tagName === 'label') {
        if (/\btext-sm\b|\btext-xs\b|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(control.classes)) {
          report(file, 'label phải dùng cỡ chữ 15px');
        }
        if (/\bfont-(?:semibold|bold|extrabold|black)\b/i.test(control.classes)) {
          report(file, 'form label phải dùng font-weight 500 (font-medium)');
        }
      }
      if ((control.tagName === 'button' || control.role === 'button') && !/\brounded-full\b/i.test(control.classes)
        && (/\brounded-(?:sm|md|lg)\b/i.test(control.classes) || /(?:^|\s)rounded(?:\s|$)/i.test(control.classes))) {
        report(file, 'button khÃ´ng Ä‘Æ°á»£c dÃ¹ng radius legacy; pháº£i dÃ¹ng rounded-xl');
      }
      if (control.tagName === 'label' && /\bcursor-pointer\b/i.test(control.classes)
        && !/\brounded-full\b/i.test(control.classes)
        && (/\brounded-(?:sm|md|lg)\b/i.test(control.classes) || /(?:^|\s)rounded(?:\s|$)/i.test(control.classes))) {
        report(file, 'label control khÃ´ng Ä‘Æ°á»£c dÃ¹ng radius legacy; pháº£i dÃ¹ng rounded-xl');
      }
    }

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

    // The compact sidebar brand lockup is the only intentional 10px exception.
    // It is limited to the compact subtitle so the product name remains readable in the fixed-width sidebar header.
    const isCompactBrandSubtitle = file.replaceAll('\\', '/').endsWith('components/Sidebar.tsx')
      && /<h2\b[^>]*text-\[10px\][^>]*>/.test(content);
    if (/text-\[(?:[0-9]|10|10\.5|11|11\.5)px\]/i.test(content) && !isCompactBrandSubtitle) {
      report(file, 'cỡ chữ Web UI không được thấp hơn 12px');
    }

    if (file.endsWith('.tsx') && /fontSize\s*:\s*['"]?(?:10|11|[0-9])(?:px)?['"]?(?=\s*[,}])/i.test(content)) {
      report(file, 'fontSize inline của Web UI không được thấp hơn 12px');
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

    if (/<label\b[^>]*\bfont-(?:semibold|bold|extrabold|black)\b/i.test(content)) {
      report(file, 'form label phải dùng font-weight 500 (font-medium)');
    }

    if (/<tbody\b[^>]*\bfont-(?:medium|semibold|bold|extrabold|black)\b/i.test(content)) {
      report(file, 'tbody phải dùng font-weight 400 mặc định (font-normal)');
    }

    if (/<(?:thead|th)\b[^>]*\bfont-(?:semibold|bold|extrabold|black)\b/i.test(content)) {
      report(file, 'table header phải dùng font-weight 500 (font-medium)');
    }

    for (const tableMatch of content.matchAll(/<table\b[\s\S]*?<\/table>/gi)) {
      for (const bodyMatch of tableMatch[0].matchAll(/<tbody\b[\s\S]*?<\/tbody>/gi)) {
        const body = bodyMatch[0]
          .replace(/<svg[\s\S]*?<\/svg>/gi, '')
          .replace(/<td\b[^>]*colSpan[^>]*>[\s\S]*?<\/td>/gi, '')
          .replace(/[^\r\n]*(?:table-badge|table-avatar|table-action|table-tooltip|table-meta)[^\r\n]*/gi, '');
        if (/text-xs|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(body)) {
          report(file, 'table body text must be 15px; compact size is limited to table-badge/table-avatar/table-tooltip/table-meta');
        }

        if (/font-(?:bold|extrabold|black)/i.test(body)) {
          report(file, 'table body không được dùng font-weight trên 500');
        }
      }
    }

    if (/text-transform\s*:\s*;/i.test(content)) {
      report(file, 'không được để lại khai báo text-transform rỗng');
    }

    const isPrintExport = printExportFiles.has(relativeFile);
    // Print/export helpers may contain raw HTML tables, but JSX Web UI tables
    // (identified by className) must always use the shared contract.
    if (file.endsWith('.tsx') && /<table\b[^>]*\bclassName\s*=/i.test(content)
      && (!/ui-table-wrap/.test(content) || !/<table\b[^>]*\bui-table\b/i.test(content))) {
      report(file, 'Web table must use the shared ui-table-wrap/ui-table contract');
    }
    if (file.endsWith('.tsx') && /role=["']dialog["']/i.test(content)
      && !inherentlyDarkDialogFiles.has(relativeFile) && !/dark:/i.test(content)) {
      report(file, 'dialog/drawer phải có dark-mode; lightbox toàn màn hình là ngoại lệ tối có chủ đích');
    }
    if (relativeFile === 'components/SearchModal.tsx' && !/role=["']dialog["'][^>]*className=["'][^"']*z-\[100\]/i.test(content)) {
      report(file, 'SearchModal dùng z-[100] theo chuẩn Modal; không dùng z-index của ConfirmModal');
    }
    if (relativeFile === 'components/ProfileDrawer.tsx' && !/role=["']dialog["'][^>]*className=["'][^"']*z-\[100\]/i.test(content)) {
      report(file, 'ProfileDrawer dùng z-[100] theo chuẩn Drawer/Modal');
    }
    if (!isPrintExport && /font-family\s*:[^;{}]*(?:serif|Times New Roman|Georgia|Cambria)/i.test(content)) {
      report(file, 'Web UI khÃ´ng Ä‘Æ°á»£c khai bÃ¡o font serif; chá»‰ font Inter vÃ  fallback sans-serif');
    }
    if (/pointer-events-auto[^\n]*bg-white(?![^\n]*dark:bg)/i.test(content)) {
      report(file, 'custom overlay panel cÃ³ bg-white pháº£i cÃ³ dark:bg counterpart');
    }
    if (file.endsWith('.tsx') && !isPrintExport && /#[0-9a-f]{3,8}\b/i.test(content)) {
      report(file, 'màu UI inline/SVG/chart phải dùng token semantic; hex chỉ được phép trong print/export');
    }
    if (relativeFile !== 'app/exam-arrangement/page.tsx' && !popupBoldFiles.has(relativeFile) && (/font-(thin|extralight|light|black|extrabold)/i.test(content) || /font-weight:\s*(100|200|300|800|900)/i.test(content))) {
      report(file, 'Web UI chi duoc dung font weight 400-700');
    }

    const hasKpiMarker = /(?:edu-kpi|text-\[32px\][^"'\n]*font-bold|font-bold[^"'\n]*text-\[32px\])/i.test(content);
    if (file.endsWith('.tsx') && /font-bold/i.test(content) && !kpiBoldFiles.has(relativeFile) && !hasKpiMarker && !popupBoldFiles.has(relativeFile)) {
      report(file, 'font-bold (700) chi danh cho component KPI/tong so da duoc phe duyet');
    }

    if (/(?:bg|text|border|from|to|via)-\[#(?:[0-9a-f]{3,8})\]/i.test(content)) {
      report(file, 'màu giao diện phải dùng token semantic thay vì utility màu hex trực tiếp');
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
const tailwindConfig = await readFile(join(root, 'tailwind.config.js'), 'utf8');
const middleware = await readFile(join(root, 'middleware.ts'), 'utf8');
const accessRules = await readFile(join(root, 'lib', 'access.ts'), 'utf8');
const publicCsvFiles = [
  'public/file-mau-cau-hoi-test.csv',
  'public/mau-cau-hoi-7-cot-test.csv',
];
const publicRoutePrefixes = new Set(['/', '/login', '/contact', '/forgot-password']);
const fullscreenRoutePrefixes = ['/student/online-exam'];
if (!/fontFamily:\s*\{[\s\S]*?sans:\s*\[[\s\S]*?var\(--font-inter\)[\s\S]*?Inter[\s\S]*?sans-serif[\s\S]*?\]/.test(tailwindConfig)) {
  violations.push('tailwind.config.js: font-sans must use the Inter stack');
}
if (!/file-mau-cau-hoi-test\.csv/.test(middleware)
  || !/mau-cau-hoi-7-cot-test\.csv/.test(middleware)
  || !/status:\s*404/.test(middleware)) {
  violations.push('middleware.ts: public CSV mẫu có đáp án phải bị chặn truy cập trực tiếp');
}
if (!/prefix:\s*['"]\/student\/practice['"][\s\S]*?roles:\s*\[['"]STUDENT['"]\]/.test(accessRules)) {
  violations.push('lib/access.ts: student practice route must be available to STUDENT');
}
const routePageFiles = (await collectFiles(join(root, 'app')))
  .filter((file) => file.endsWith('/page.tsx') || file.endsWith('\\page.tsx'));
for (const routePageFile of routePageFiles) {
  const relativeRouteFile = relative(join(root, 'app'), routePageFile).replaceAll('\\', '/');
  let route = relativeRouteFile === 'page.tsx'
    ? '/'
    : `/${relativeRouteFile.replace(/\/page\.tsx$/, '')}`;
  route = route.replace(/\[[^\]]+\]/g, '*');
  const isPublicRoute = publicRoutePrefixes.has(route);
  const isFullscreenRoute = fullscreenRoutePrefixes.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`),
  );
  if (isFullscreenRoute) {
    const fullscreenPage = await readFile(routePageFile, 'utf8');
    if (!/dark:|isDark/.test(fullscreenPage)) {
      report(routePageFile, `route ${route} full-screen page must define dark-mode styling`);
    }
  }
  if (isPublicRoute || isFullscreenRoute) continue;
  const accessPrefix = route.replace(/\/\*$/, '');
  if (!new RegExp(`prefix\\s*:\\s*['"]${accessPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(accessRules)) {
    report(routePageFile, `route ${route} chưa có khai báo trong lib/access.ts`);
  }
}
for (const publicCsvFile of publicCsvFiles) {
  const publicCsv = await readFile(join(root, publicCsvFile), 'utf8');
  if (/Đáp án đúng|Giải thích|correctAnswer|answerKey|isCorrect/i.test(publicCsv)) {
    violations.push(`${publicCsvFile}: public sample must not contain an answer key or explanation`);
  }
}
const modal = await readFile(join(root, 'components', 'Modal.tsx'), 'utf8');
const confirmModal = await readFile(join(root, 'components', 'ConfirmModal.tsx'), 'utf8');
const criticalConfirmModal = await readFile(join(root, 'components', 'CriticalConfirmModal.tsx'), 'utf8');
const toast = await readFile(join(root, 'components', 'Toast.tsx'), 'utf8');
const filterSelect = await readFile(join(root, 'components', 'ui', 'FilterSelect.tsx'), 'utf8');
const button = await readFile(join(root, 'components', 'ui', 'Button.tsx'), 'utf8');
const input = await readFile(join(root, 'components', 'ui', 'Input.tsx'), 'utf8');
const identifierBadge = await readFile(join(root, 'components', 'ui', 'IdentifierBadge.tsx'), 'utf8');
const sharedUiPrimitiveFiles = [
  'components/ui/Button.tsx',
  'components/ui/Card.tsx',
  'components/ui/EmptyState.tsx',
  'components/ui/Input.tsx',
  'components/ui/Skeleton.tsx',
  'components/ui/TabBar.tsx',
  'components/ui/Tabs.tsx',
];

if (!/import\s+\{\s*Inter\s*\}\s+from\s+['"]next\/font\/google['"]/.test(layout) || !/variable:\s*['"]--font-inter['"]/.test(layout)) {
  violations.push('app/layout.tsx: phải nạp Inter qua next/font/google với biến --font-inter');
}

if (!/font-family:\s*var\(--font-ui\)/.test(globalCss)) {
  violations.push('app/globals.css: body phải kế thừa font Inter dùng chung');
}

if (!/code,\s*kbd,\s*pre,\s*samp\s*\{[\s\S]*font-family:\s*inherit/i.test(globalCss)) {
  violations.push('globals.css: code/pre/log metadata must inherit Inter instead of browser monospace');
}

if (!/--ui-motion-fast:\s*150ms/.test(globalCss)
  || !/ui-pressable:active/.test(globalCss)
  || !/prefers-reduced-motion:\s*reduce/.test(globalCss)) {
  violations.push('app/globals.css: motion contract must define shared press feedback and prefers-reduced-motion');
}

if (!/transition-property:\s*background-color,\s*border-color,\s*box-shadow,\s*color,\s*opacity,\s*transform/.test(globalCss)) {
  violations.push('app/globals.css: interactive controls must use the shared transition-property contract');
}

if (!/--ui-text-primary:\s*#0f172a/i.test(globalCss)
  || !/--ui-text-body:\s*#111827/i.test(globalCss)
  || !/--ui-text-secondary:\s*#1f2937/i.test(globalCss)
  || !/--ui-text-muted-soft:\s*#374151/i.test(globalCss)
  || !/--ui-text-disabled:\s*#64748b/i.test(globalCss)
  || !/\.text-slate-500[^\{]*\{\s*color:\s*var\(--ui-text-secondary\)/i.test(globalCss)) {
  violations.push('app/globals.css: neutral text phải theo black-forward palette');
}

if (!/variant\s*=\s*['"]default['"]/.test(modal)
  || !/bg-slate-50 dark:bg-slate-800/.test(modal)
  || !/text-lg font-semibold/.test(modal)
  || !/fixed inset-0 z-\[100\]/.test(modal)) {
  violations.push('components/Modal.tsx: Modal popup specification is incomplete');
}

if (!/max-w-sm/.test(confirmModal)
  || !/bg-slate-50\/80 dark:bg-slate-800\/80/.test(confirmModal)
  || !/text-sm font-black/.test(confirmModal)
  || !/text-xs sm:text-sm/.test(confirmModal)
  || !/text-xs leading-\[18px\] font-bold text-rose-600/.test(confirmModal)
  || !/z-\[9999\]/.test(confirmModal)) {
  violations.push('components/ConfirmModal.tsx: ConfirmModal popup specification is incomplete');
}

if (!/fixed inset-0 z-\[9999\]/.test(criticalConfirmModal)
  || !/from-rose-600 via-rose-700 to-amber-600/.test(criticalConfirmModal)
  || !/max-w-lg/.test(criticalConfirmModal)
  || !/bg-rose-50\/80 border border-rose-200/.test(criticalConfirmModal)) {
  violations.push('components/CriticalConfirmModal.tsx: CriticalConfirmModal popup specification is incomplete');
}

if (!/role="status"/.test(toast)
  || !/aria-live="polite"/.test(toast)
  || !/fixed bottom-5 right-5 z-\[110\]/.test(toast)
  || !/setTimeout\(\(\) => \{[\s\S]*?\}, 4000\)/.test(toast)
  || !/rounded-2xl/.test(toast)) {
  violations.push('components/Toast.tsx: Toast specification is incomplete');
}

if (!/appearance-none rounded-xl/.test(filterSelect) || !/dark:bg-slate-900/.test(filterSelect)) {
  violations.push('components/ui/FilterSelect.tsx: shared select must use rounded-xl and dark-mode surface');
}
if (!/rounded-xl/.test(button) || !/rounded-xl/.test(input)) {
  violations.push('components/ui/Button.tsx and Input.tsx: shared controls must use rounded-xl');
}

if (!/rounded-lg/.test(identifierBadge)
  || !/px-2 py-0\.5/.test(identifierBadge)
  || !/text-\[13px\]/.test(identifierBadge)
  || !/font-medium/.test(identifierBadge)
  || !/tabular-nums/.test(identifierBadge)
  || !/whitespace-nowrap/.test(identifierBadge)
  || !/toneClasses/.test(identifierBadge)) {
  violations.push('components/ui/IdentifierBadge.tsx: identifier badge phải dùng primitive chung và đủ contract typography/layout');
}

if (!/aria-busy=\{isLoading \|\| undefined\}/.test(button)) {
  violations.push('components/ui/Button.tsx: loading buttons must expose aria-busy');
}

if (!/aria-expanded=\{isOpen\}/.test(filterSelect)
  || !/aria-haspopup="listbox"/.test(filterSelect)
  || !/role="option"/.test(filterSelect)) {
  violations.push('components/ui/FilterSelect.tsx: dropdown state must expose listbox semantics');
}

for (const relativePrimitive of sharedUiPrimitiveFiles) {
  const primitive = await readFile(join(root, relativePrimitive), 'utf8');
  if (!/dark:/.test(primitive)) {
    violations.push(`${relativePrimitive}: shared UI primitive must define dark-mode variants`);
  }
}

if (violations.length) {
  console.error('UI audit thất bại:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('UI audit passed: Inter, màu nhấn và DynamicImage đều đúng chuẩn.');
