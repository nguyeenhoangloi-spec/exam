import fs from 'node:fs';
import path from 'node:path';

const frontendDir = path.join(process.cwd(), 'frontend');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(walk(filePath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(frontendDir);
const report = {
  softVariantFound: [],
  nonGhostCancelButtons: [],
  uppercaseButtons: [],
  totalFilesAudited: files.length,
};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(frontendDir, file);

  // Check 1: variant="soft"
  if (/variant=["']soft["']/.test(content)) {
    report.softVariantFound.push(relPath);
  }

  // Check 2: Uppercase in button text (e.g. <Button>XÁC NHẬN</Button>)
  const buttonMatches = content.match(/<Button\b[^>]*>([\s\S]*?)<\/Button>/g) || [];
  for (const btn of buttonMatches) {
    const textOnly = btn.replace(/<[^>]+>/g, '').trim();
    if (textOnly && textOnly.length > 3 && textOnly === textOnly.toUpperCase() && /[A-ZÀ-Ỹ]/.test(textOnly)) {
      // Exclude simple acronyms like 'CSV', 'PDF', 'EXCEL'
      if (!['CSV', 'PDF', 'EXCEL', 'JSON', 'SQL', 'ID', 'AI'].includes(textOnly)) {
        report.uppercaseButtons.push({ file: relPath, text: textOnly });
      }
    }

    // Check if it is a cancel/close button and not ghost
    const isCancelText = /^(Đóng|Hủy|Hủy bỏ|Quay lại|Bỏ qua|Close|Cancel)$/i.test(textOnly);
    if (isCancelText) {
      // check if it's inside a Modal/Drawer and what variant it uses
      if (btn.includes('variant="secondary"') || btn.includes('variant="outline"')) {
        report.nonGhostCancelButtons.push({ file: relPath, btn: btn.slice(0, 100) });
      }
    }
  }
}

console.log('=== DEEP AUDIT SCAN RESULT ===');
console.log(`Total files audited: ${report.totalFilesAudited}`);
console.log(`Remaining variant="soft": ${report.softVariantFound.length}`);
if (report.softVariantFound.length > 0) {
  console.log(report.softVariantFound);
}
console.log(`Non-ghost cancel buttons: ${report.nonGhostCancelButtons.length}`);
if (report.nonGhostCancelButtons.length > 0) {
  console.log(report.nonGhostCancelButtons);
}
console.log(`Uppercase button labels: ${report.uppercaseButtons.length}`);
if (report.uppercaseButtons.length > 0) {
  console.log(report.uppercaseButtons);
}
