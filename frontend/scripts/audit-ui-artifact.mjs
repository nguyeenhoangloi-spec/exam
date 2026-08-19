import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const nextRoot = join(root, '.next');
const violations = [];

async function collectFiles(directory, extensions) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path, extensions));
    } else if (extensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

const cssFiles = await collectFiles(join(nextRoot, 'static'), new Set(['.css']));
const jsFiles = await collectFiles(nextRoot, new Set(['.js']));

if (!cssFiles.length) {
  violations.push('.next không có CSS artifact; hãy chạy dev hoặc build trước');
}

const cssArtifacts = await Promise.all(cssFiles.map(async (file) => ({
  file,
  content: await readFile(file, 'utf8'),
})));
const runtimeCss = cssArtifacts.find(({ content }) => content.includes('--ui-text-primary'));

if (!runtimeCss) {
  violations.push('CSS artifact không chứa Deep Ink token');
} else {
  const css = runtimeCss.content;
  const contracts = [
    ['light primary', /--ui-text-primary:\s*#020617/i],
    ['light secondary', /--ui-text-secondary:\s*#111827/i],
    ['light helper', /--ui-text-muted-soft:\s*#1f2937/i],
    ['light disabled', /--ui-text-disabled:\s*#475569/i],
    ['dark primary', /--ui-text-primary:\s*#f8fafc/i],
    ['dark secondary', /--ui-text-secondary:\s*#e2e8f0/i],
    ['dark helper', /--ui-text-muted-soft:\s*#cbd5e1/i],
    ['dark disabled', /--ui-text-disabled:\s*#94a3b8/i],
    ['root typography shell', /\.typography-scale/],
    ['light neutral remap', /html:not\(\.dark\) \.typography-scale[\s\S]*?--ui-text-primary/],
    ['dark neutral remap', /html\.dark \.typography-scale[\s\S]*?--ui-text-muted-soft/],
    ['disabled opacity', /:disabled[\s\S]*?--ui-text-disabled[\s\S]*?opacity:\s*1\s*!important/],
    ['pill contract', /\.typography-scale \.ui-pill[\s\S]*?border-radius:\s*9999px\s*!important/],
    ['outline pill', /\.ui-pill:not\(\.ui-pill-solid\)[\s\S]*?background-color:\s*transparent\s*!important/],
  ];

  for (const [name, pattern] of contracts) {
    if (!pattern.test(css)) violations.push(`CSS artifact thiếu contract: ${name}`);
  }
}

const jsContents = await Promise.all(jsFiles.map((file) => readFile(file, 'utf8')));
if (!jsContents.some((content) => content.includes('typography-scale'))) {
  violations.push('JS/server artifact không gắn typography-scale vào application shell');
}
if (!jsContents.some((content) => content.includes('--font-inter'))) {
  violations.push('JS/server artifact không chứa biến next/font --font-inter');
}

if (violations.length) {
  console.error(`UI artifact audit thất bại:\n${violations.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log(`UI artifact audit passed: ${relative(root, runtimeCss.file)} chứa đầy đủ Inter, Deep Ink, disabled và pill contracts.`);
