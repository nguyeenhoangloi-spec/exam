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

function inspectJsxClassLists(content) {
  const sourceFile = ts.createSourceFile('audit.tsx', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const variables = new Map();
  const classLists = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const value = getStaticClassText(node.initializer, sourceFile, variables);
      if (value) variables.set(node.name.text, value);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const classAttribute = node.attributes.properties.find(
        (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === 'className',
      );
      if (classAttribute) {
        classLists.push(getStaticClassText(classAttribute.initializer, sourceFile, variables));
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return classLists;
}

for (const folder of sourceRoots) {
  const files = await collectFiles(join(root, folder));
  for (const file of files) {
    const relativeFile = relative(root, file).replaceAll('\\', '/');
    if (skippedFiles.has(relativeFile)) continue;
    const content = await readFile(file, 'utf8');

    if (file.endsWith('.tsx') && !popupBoldFiles.has(relativeFile)) {
      for (const classes of inspectJsxClassLists(content)) {
        if (/\bfont-bold\b/i.test(classes) && !/\btext-type-kpi\b/i.test(classes)) {
          report(file, 'font-bold (700) chỉ được dùng trực tiếp cho KPI/tổng số quan trọng');
          break;
        }
      }
    }

    for (const control of inspectJsxControlClasses(content)) {
      if (['input', 'select', 'textarea'].includes(control.tagName) && !['hidden', 'file', 'checkbox', 'radio'].includes(control.type)) {
        if (/\brounded-(?:sm|md|lg)\b/i.test(control.classes)) {
          report(file, 'input/select/textarea phải dùng radius control rounded-xl');
        }
        if (/text-type-(?:badge|helper|body-sm)|\btext-(?:xs|sm)\b|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(control.classes)) {
          report(file, 'input/select/textarea phải dùng cỡ chữ 15px');
        }
      }
      if (control.tagName === 'label') {
        if (/text-type-(?:badge|helper|body-sm)|\btext-(?:xs|sm)\b|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(control.classes)) {
          report(file, 'label phải dùng cỡ chữ 15px');
        }
        if (/\bfont-(?:semibold|bold|extrabold|black)\b/i.test(control.classes)) {
          report(file, 'form label phải dùng font-weight 500 (font-medium)');
        }
      }
      if ((control.tagName === 'button' || control.role === 'button') && !/\brounded-full\b/i.test(control.classes)
        && (/\brounded-(?:sm|md|lg)\b/i.test(control.classes) || /(?:^|\s)rounded(?:\s|$)/i.test(control.classes))) {
        report(file, 'button không được dùng radius legacy; phải dùng rounded-xl');
      }
      if (control.tagName === 'label' && /\bcursor-pointer\b/i.test(control.classes)
        && !/\brounded-full\b/i.test(control.classes)
        && (/\brounded-(?:sm|md|lg)\b/i.test(control.classes) || /(?:^|\s)rounded(?:\s|$)/i.test(control.classes))) {
        report(file, 'label control không được dùng radius legacy; phải dùng rounded-xl');
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

    if (!printExportFiles.has(relativeFile)) {
      if (/\bfont-(?:thin|extralight|light|black|extrabold)\b/i.test(content)
        || /font(?:-weight)?\s*[:=]\s*['"]?(?:100|200|300|800|900)/i.test(content)) {
        report(file, 'Web UI chỉ dùng font-weight 400–700; không dùng weight quá mỏng hoặc quá đậm');
      }
      if (/text-transform\s*:\s*uppercase/i.test(content)) {
        report(file, 'Web UI dùng sentence case; chữ in hoa chỉ dành cho tiêu đề tài liệu xuất/in');
      }
    }

    if (file.endsWith('.tsx')) {
      if (/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/i.test(content)) {
        report(file, 'Web UI phải dùng token text-type-*; không dùng thang cỡ mặc định của Tailwind');
      }
      if (/text-\[[0-9]+(?:\.[0-9]+)?px\]/i.test(content)) {
        report(file, 'Web UI phải dùng token text-type-*; không dùng cỡ px tùy ý');
      }
      if (/fontSize\s*:\s*['"]?[0-9]+(?:\.[0-9]+)?(?:px)?['"]?/i.test(content)) {
        report(file, 'Web UI phải dùng token cỡ chữ; không dùng fontSize inline dạng số');
      }
      if (/\bleading-none\b/i.test(content)) {
        report(file, 'không dùng leading-none vì có thể cắt dấu tiếng Việt; dùng line-height của token typography');
      }
    }

    if (file.endsWith('.tsx') && /fontSize\s*:\s*['"]?(?:10|11|[0-9])(?:px)?['"]?(?=\s*[,}])/i.test(content)) {
      report(file, 'fontSize inline của Web UI không được thấp hơn 12px');
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
        if (/text-type-(?:badge|helper|body-sm)|text-xs|text-\[(?:12|13|14)(?:\.5)?px\]/i.test(body)) {
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
      report(file, 'Web UI không được khai báo font serif; chỉ font Inter và fallback sans-serif');
    }
    if (/pointer-events-auto[^\n]*bg-white(?![^\n]*dark:bg)/i.test(content)) {
      report(file, 'custom overlay panel có bg-white phải có dark:bg counterpart');
    }
    if (file.endsWith('.tsx') && !isPrintExport && /#[0-9a-f]{3,8}\b/i.test(content)) {
      report(file, 'màu UI inline/SVG/chart phải dùng token semantic; hex chỉ được phép trong print/export');
    }
    if (relativeFile !== 'app/exam-arrangement/page.tsx' && !popupBoldFiles.has(relativeFile) && (/font-(thin|extralight|light|black|extrabold)/i.test(content) || /font-weight:\s*(100|200|300|800|900)/i.test(content))) {
      report(file, 'Web UI chi duoc dung font weight 400-700');
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
const statusBadge = await readFile(join(root, 'components', 'common', 'StatusBadge.tsx'), 'utf8');
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

if (!/\.typography-scale\s+:where\(h1\)\s*\{[\s\S]*?font-weight:\s*600/.test(globalCss)
  || !/\.edu-page-title\s*\{[\s\S]*?font-semibold/.test(globalCss)
  || !/\.edu-card-title\s*\{[\s\S]*?font-semibold/.test(globalCss)
  || !/\.edu-kpi\s*\{[\s\S]*?font-bold/.test(globalCss)) {
  violations.push('app/globals.css: page/card title phải dùng 600 và KPI mới dùng 700');
}

if (!/html:not\(\.dark\)\s+\.typography-scale\s+:where\(\.text-slate-300,\s*\.text-gray-300\)[\s\S]*?color:\s*var\(--ui-text-muted-soft\)/.test(globalCss)
  || !/\.ui-dark-surface\s+:where\(\.text-slate-300,\s*\.text-gray-300\)/.test(globalCss)) {
  violations.push('app/globals.css: light-theme neutral text must be readable with a dark-surface exception');
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

if (!/--fs-page-title:\s*28px/.test(globalCss)
  || !/--fs-section-title:\s*20px/.test(globalCss)
  || !/--fs-card-title:\s*18px/.test(globalCss)
  || !/--fs-body:\s*15px/.test(globalCss)
  || !/--fs-body-sm:\s*14px/.test(globalCss)
  || !/--fs-helper:\s*13px/.test(globalCss)
  || !/--fs-badge:\s*12px/.test(globalCss)
  || !/--fs-kpi:\s*32px/.test(globalCss)
  || !/--fs-reading:\s*16px/.test(globalCss)
  || !/'type-page':\s*\['var\(--fs-page-title\)'/.test(tailwindConfig)
  || !/'type-body':\s*\['var\(--fs-body\)'/.test(tailwindConfig)
  || !/'type-badge':\s*\['var\(--fs-badge\)'/.test(tailwindConfig)) {
  violations.push('Tailwind/globals.css: semantic typography token chưa được cấu hình đầy đủ');
}

if (!/variant\s*=\s*['"]default['"]/.test(modal)
  || !/bg-slate-50 dark:bg-slate-800/.test(modal)
  || !/(?:text-lg|text-type-card|text-\[18px\]) font-semibold/.test(modal)
  || !/fixed inset-0 z-\[100\]/.test(modal)) {
  violations.push('components/Modal.tsx: Modal popup specification is incomplete');
}

if (!/max-w-sm/.test(confirmModal)
  || !/bg-slate-50\/80 dark:bg-slate-800\/80/.test(confirmModal)
  || !/(?:text-sm|text-type-body-sm) font-semibold/.test(confirmModal)
  || !/(?:text-xs sm:text-sm|text-type-helper sm:text-type-body-sm)/.test(confirmModal)
  || !/(?:text-xs leading-\[18px\]|text-type-helper leading-\[18px\]) font-semibold text-rose-600/.test(confirmModal)
  || !/z-\[9999\]/.test(confirmModal)) {
  violations.push('components/ConfirmModal.tsx: ConfirmModal popup specification is incomplete');
}

if (!/fixed inset-0 z-\[9999\]/.test(criticalConfirmModal)
  || !/ShieldAlert/.test(criticalConfirmModal)
  || !/max-w-lg/.test(criticalConfirmModal)
  || !/bg-rose-50\/[78]0 border border-rose-200/.test(criticalConfirmModal)) {
  violations.push('components/CriticalConfirmModal.tsx: CriticalConfirmModal popup specification is incomplete');
}

if (!/role="status"/.test(toast)
  || !/aria-live="polite"/.test(toast)
  || !/fixed bottom-5 right-5 z-\[110\]/.test(toast)
  || !/setTimeout\(\(\) => \{[\s\S]*?\}, 4000\)/.test(toast)
  || !/rounded-2xl/.test(toast)) {
  violations.push('components/Toast.tsx: Toast specification is incomplete');
}

if (!/appearance-none rounded-xl/.test(filterSelect)
  || !/dark:bg-slate-900/.test(filterSelect)
  || !/size\?: 'sm' \| 'md' \| 'lg'/.test(filterSelect)
  || !/data-ui-size=\{size\}/.test(filterSelect)
  || !/data-ui-size='lg'/.test(globalCss)) {
  violations.push('components/ui/FilterSelect.tsx: shared select must support the standard 40px and form 44px control sizes');
}
if (!/rounded-xl/.test(button) || !/rounded-xl/.test(input)) {
  violations.push('components/ui/Button.tsx and Input.tsx: shared controls must use rounded-xl');
}

if (!/lg:\s*'[^']*\bh-11\b/.test(button)
  || !/icon:\s*'[^']*\bh-9\b[^']*\bw-9\b/.test(button)
  || !/['"]icon-lg['"]:\s*'[^']*\bh-10\b[^']*\bw-10\b/.test(button)
  || !/(?:text-\[15px\]|text-type-body) font-semibold/.test(button)) {
  violations.push('components/ui/Button.tsx: button sizes and typography must follow xs32/sm36/md40/lg44 and 15px/600');
}

if (!/const isBtnDisabled = disabled \|\| isLoading/.test(button)
  || !/disabled=\{isBtnDisabled\}/.test(button)
  || !/aria-disabled=\{isBtnDisabled \|\| undefined\}/.test(button)
  || !/focus-visible:ring/.test(button)) {
  violations.push('components/ui/Button.tsx: loading must disable the button and the focus contract must use focus-visible');
}

if (!/button:not\(\.rounded-full\)[\s\S]*border-radius:\s*var\(--ui-radius\)/.test(globalCss)
  || !/button,\s*\[role='button'\]\s*\{[\s\S]*min-height:\s*2\.25rem/.test(globalCss)
  || !/button,\s*\[role='button'\]\s*\{[\s\S]*font-size:\s*var\(--fs-body\)/.test(globalCss)
  || !/button,\s*\[role='button'\]\s*\{[\s\S]*font-weight:\s*600/.test(globalCss)
  || !/@media \(max-width: 767px\)[\s\S]*min-height:\s*2\.75rem !important/.test(globalCss)
  || !/\.typography-scale :where\(button, \[role='button'\]\)[\s\S]*font-size:\s*var\(--fs-body\) !important/.test(globalCss)) {
  violations.push('app/globals.css: native buttons must share radius, touch target, and 15px control typography');
}

for (const interactivePrimitive of [
  'components/ui/FilterSelect.tsx',
  'components/ui/SortDropdown.tsx',
  'components/ui/ColumnToggleDropdown.tsx',
  'components/ui/Tabs.tsx',
  'components/ui/TabBar.tsx',
]) {
  const primitive = await readFile(join(root, interactivePrimitive), 'utf8');
  if (!/focus-visible:ring/.test(primitive)) {
    violations.push(`${interactivePrimitive}: interactive controls must expose a focus-visible state`);
  }
}

if (!/rounded-lg/.test(identifierBadge)
  || !/px-2 py-0\.5/.test(identifierBadge)
  || !/(?:text-\[13px\]|text-type-helper)/.test(identifierBadge)
  || !/font-medium/.test(identifierBadge)
  || !/tabular-nums/.test(identifierBadge)
  || !/whitespace-nowrap/.test(identifierBadge)
  || !/toneClasses/.test(identifierBadge)) {
  violations.push('components/ui/IdentifierBadge.tsx: identifier badge phải dùng primitive chung và đủ contract typography/layout');
}

if (!/variant === 'pill'/.test(statusBadge)
  || !/categoryStyles/.test(statusBadge)
  || !/dark:/.test(statusBadge)
  || !/text-amber-700/.test(statusBadge)
  || !/text-emerald-700/.test(statusBadge)
  || !/text-type-badge/.test(statusBadge)) {
  violations.push('components/common/StatusBadge.tsx: status badge phải có 5 nhóm màu semantic chuẩn và hỗ trợ 2 variants dot/pill');
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

console.log('UI audit passed: Inter, cỡ chữ, độ đậm, màu nhấn và DynamicImage đều đúng chuẩn.');
