const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '..'));
const findings = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), f).replace(/\\/g, '/');
  if (rel.startsWith('scripts/')) return;

  // Check 1: IdentifierBadge containing prefixes like 'Mã ' or 'MSSV' or 'ID'
  const idBadgeMatches = content.match(/<IdentifierBadge[^>]*>([\s\S]*?)<\/IdentifierBadge>/gi) || [];
  idBadgeMatches.forEach(m => {
    if (/(?:Mã\s|MSSV|SBD|ID\s*:)/i.test(m)) {
      findings.push({ file: rel, issue: 'IdentifierBadge contains prefix: ' + m.trim().replace(/\s+/g, ' ') });
    }
    if (/●|•/.test(m)) {
      findings.push({ file: rel, issue: 'IdentifierBadge contains dot: ' + m.trim().replace(/\s+/g, ' ') });
    }
  });

  // Check 2: Role indicators with bullet dots
  if (/(?:giám thị|cán bộ|trưởng bộ môn|giảng viên|chủ nhiệm|admin|sinh viên)[^<>\n]*●/i.test(content) ||
      /●[^<>\n]*(?:giám thị|cán bộ|trưởng bộ môn|giảng viên|chủ nhiệm|admin|sinh viên)/i.test(content)) {
    findings.push({ file: rel, issue: 'Role contains dot bullet' });
  }
});

console.log('Total findings:', findings.length);
findings.forEach(item => console.log(`[${item.file}] ${item.issue}`));
