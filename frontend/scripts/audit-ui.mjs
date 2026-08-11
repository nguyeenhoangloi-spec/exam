import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const sourceRoots = ['app', 'components'];
const sourceExtensions = new Set(['.ts', '.tsx', '.css']);
const violations = [];

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

    if (/font-(serif|mono)|JetBrains Mono|ui-monospace/i.test(content)) {
      report(file, 'không được dùng font serif hoặc monospace trong Web UI');
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
