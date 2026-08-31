/**
 * Secure Formula Parser & Evaluator for Dynamic Exam Reports
 * Supports safe AST evaluation without eval() or new Function().
 * Handles arithmetic, logical conditions, grading conversion, and statistical helpers.
 */

export interface FormulaVariable {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  sampleValue?: any;
}

export const STANDARD_REPORT_VARIABLES: FormulaVariable[] = [
  { key: 'examScore', label: 'Điểm thi kết thúc ({examScore})', type: 'number', sampleValue: 8.5 },
  { key: 'totalScore', label: 'Điểm tổng kết ({totalScore})', type: 'number', sampleValue: 8.5 },
  { key: 'midtermScore', label: 'Điểm giữa kỳ / BTL ({midtermScore})', type: 'number', sampleValue: 7.5 },
  { key: 'attendanceScore', label: 'Điểm chuyên cần ({attendanceScore})', type: 'number', sampleValue: 9.0 },
  { key: 'practiceScore', label: 'Điểm thực hành ({practiceScore})', type: 'number', sampleValue: 8.0 },
  { key: 'bonusScore', label: 'Điểm cộng / Điểm thưởng ({bonusScore})', type: 'number', sampleValue: 1.0 },
  { key: 'penaltyScore', label: 'Điểm trừ vi phạm ({penaltyScore})', type: 'number', sampleValue: 0 },
  { key: 'violationCount', label: 'Số lần vi phạm ({violationCount})', type: 'number', sampleValue: 0 },
  { key: 'studentCode', label: 'Mã số sinh viên ({studentCode})', type: 'string', sampleValue: 'SV2025001' },
  { key: 'fullName', label: 'Họ và tên ({fullName})', type: 'string', sampleValue: 'Nguyễn Văn An' },
  { key: 'className', label: 'Lớp sinh hoạt ({className})', type: 'string', sampleValue: 'CNTT-K48A' },
  { key: 'status', label: 'Trạng thái bài thi ({status})', type: 'string', sampleValue: 'SUBMITTED' },
  { key: 'submitted', label: 'Số bài đã nộp ({submitted})', type: 'number', sampleValue: 48 },
  { key: 'assigned', label: 'Tổng SV được gán ({assigned})', type: 'number', sampleValue: 50 },
  { key: 'absent', label: 'Số SV vắng thi ({absent})', type: 'number', sampleValue: 2 },
  { key: 'passCount', label: 'Số SV đạt ({passCount})', type: 'number', sampleValue: 45 },
  { key: 'avgScore', label: 'Điểm trung bình ({avgScore})', type: 'number', sampleValue: 7.6 },
];

export const FORMULA_FUNCTIONS_HELP = [
  {
    name: 'IF(điều_kiện, giá_trị_đúng, giá_trị_sai)',
    example: 'IF({totalScore} >= 5, "ĐẠT", "HỌC LẠI")',
    description: 'Trả về giá trị tương ứng theo điều kiện logic.',
  },
  {
    name: 'ROUND(số, chữ_số_thập_phân)',
    example: 'ROUND({totalScore} * 0.7 + {bonusScore} * 0.3, 2)',
    description: 'Làm tròn số theo số lượng chữ số thập phân chỉ định.',
  },
  {
    name: 'GRADE4(điểm_thang_10)',
    example: 'GRADE4({totalScore})',
    description: 'Chuyển đổi điểm thang 10 sang thang điểm 4 (4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0).',
  },
  {
    name: 'LETTER_GRADE(điểm_thang_10)',
    example: 'LETTER_GRADE({totalScore})',
    description: 'Chuyển đổi điểm thang 10 sang điểm chữ (A, B+, B, C+, C, D+, D, F).',
  },
  {
    name: 'CLASSIFICATION(điểm_thang_10)',
    example: 'CLASSIFICATION({totalScore})',
    description: 'Xếp loại học lực: Xuất sắc (>=9), Giỏi (>=8), Khá (>=6.5), Trung bình (>=5), Yếu (<5).',
  },
  {
    name: 'WEIGHTED(điểm_1, hệ_số_1, điểm_2, hệ_số_2, ...)',
    example: 'WEIGHTED({totalScore}, 0.7, {bonusScore}, 0.3)',
    description: 'Tính điểm trung bình có trọng số theo các cặp (điểm, hệ số).',
  },
  {
    name: 'MIN(a, b, ...)',
    example: 'MIN(10, {totalScore} + {bonusScore})',
    description: 'Lấy giá trị nhỏ nhất.',
  },
  {
    name: 'MAX(a, b, ...)',
    example: 'MAX(0, {totalScore} - {penaltyScore})',
    description: 'Lấy giá trị lớn nhất.',
  },
  {
    name: 'CONCAT(chuỗi_1, chuỗi_2, ...)',
    example: 'CONCAT({studentCode}, " - ", {fullName})',
    description: 'Nối nhiều chuỗi ký tự lại với nhau.',
  },
];

// Token types
type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'VARIABLE'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// Tokenizer
export function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '{') {
      const closeIdx = formula.indexOf('}', i);
      if (closeIdx === -1) {
        throw new Error(`Thiếu dấu đóng ngoặc nhọn '}' cho biến tại vị trí ${i}`);
      }
      const varName = formula.substring(i + 1, closeIdx).trim();
      tokens.push({ type: 'VARIABLE', value: varName, position: i });
      i = closeIdx + 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = '';
      i++;
      while (i < formula.length && formula[i] !== quote) {
        if (formula[i] === '\\' && i + 1 < formula.length) {
          i++;
          str += formula[i];
        } else {
          str += formula[i];
        }
        i++;
      }
      if (i >= formula.length) {
        throw new Error(`Chuỗi ký tự chưa được đóng ngoặc kép/đơn tại vị trí ${i}`);
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: str, position: i });
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(formula[i + 1] || ''))) {
      let numStr = '';
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        numStr += formula[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, position: i });
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', position: i });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: i });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: i });
      i++;
      continue;
    }

    // Comparison or arithmetic operators (2 chars first, then 1 char)
    const twoChars = formula.substring(i, i + 2);
    if (['>=', '<=', '==', '!=', '&&', '||'].includes(twoChars)) {
      tokens.push({ type: 'OPERATOR', value: twoChars, position: i });
      i += 2;
      continue;
    }

    if (['+', '-', '*', '/', '%', '^', '>', '<', '=', '!'].includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch === '=' ? '==' : ch, position: i });
      i++;
      continue;
    }

    // Identifiers (function names or keywords like AND, OR, NOT, TRUE, FALSE)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
        ident += formula[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: ident.toUpperCase(), position: i });
      continue;
    }

    throw new Error(`Ký tự không hợp lệ '${ch}' tại vị trí ${i}`);
  }

  return tokens;
}

// AST Nodes
export type ASTNode =
  | { type: 'Literal'; value: number | string | boolean | null }
  | { type: 'Variable'; name: string }
  | { type: 'UnaryOp'; op: string; argument: ASTNode }
  | { type: 'BinaryOp'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

// Recursive Descent Parser
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }

  public parse(): ASTNode {
    if (this.tokens.length === 0) {
      return { type: 'Literal', value: null };
    }
    const node = this.parseLogicalOr();
    if (this.pos < this.tokens.length) {
      const remaining = this.tokens[this.pos];
      throw new Error(`Cú pháp không hợp lệ gần '${remaining.value}' tại vị trí ${remaining.position}`);
    }
    return node;
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();
    while (
      this.peek()?.type === 'OPERATOR' &&
      (this.peek()?.value === '||' || this.peek()?.value === 'OR')
    ) {
      const op = this.next().value;
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryOp', op: '||', left, right };
    }
    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseComparison();
    while (
      this.peek()?.type === 'OPERATOR' &&
      (this.peek()?.value === '&&' || this.peek()?.value === 'AND')
    ) {
      const op = this.next().value;
      const right = this.parseComparison();
      left = { type: 'BinaryOp', op: '&&', left, right };
    }
    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAddSub();
    while (
      this.peek()?.type === 'OPERATOR' &&
      ['==', '!=', '>', '<', '>=', '<='].includes(this.peek()?.value || '')
    ) {
      const op = this.next().value;
      const right = this.parseAddSub();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();
    while (
      this.peek()?.type === 'OPERATOR' &&
      ['+', '-'].includes(this.peek()?.value || '')
    ) {
      const op = this.next().value;
      const right = this.parseMulDiv();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parsePower();
    while (
      this.peek()?.type === 'OPERATOR' &&
      ['*', '/', '%'].includes(this.peek()?.value || '')
    ) {
      const op = this.next().value;
      const right = this.parsePower();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  private parsePower(): ASTNode {
    let left = this.parseUnary();
    while (this.peek()?.type === 'OPERATOR' && this.peek()?.value === '^') {
      this.next();
      const right = this.parseUnary();
      left = { type: 'BinaryOp', op: '^', left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek()?.type === 'OPERATOR' && ['-', '+', '!'].includes(this.peek()?.value || '')) {
      const op = this.next().value;
      const argument = this.parseUnary();
      return { type: 'UnaryOp', op, argument };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();
    if (!token) {
      throw new Error('Biểu thức kết thúc đột ngột');
    }

    if (token.type === 'NUMBER') {
      this.next();
      return { type: 'Literal', value: parseFloat(token.value) };
    }

    if (token.type === 'STRING') {
      this.next();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'VARIABLE') {
      this.next();
      return { type: 'Variable', name: token.value };
    }

    if (token.type === 'IDENTIFIER') {
      const ident = this.next().value;
      if (ident === 'TRUE') return { type: 'Literal', value: true };
      if (ident === 'FALSE') return { type: 'Literal', value: false };
      if (ident === 'NULL') return { type: 'Literal', value: null };

      // Function call
      if (this.peek()?.type === 'LPAREN') {
        this.next(); // skip '('
        const args: ASTNode[] = [];
        if (this.peek()?.type !== 'RPAREN') {
          args.push(this.parseLogicalOr());
          while (this.peek()?.type === 'COMMA') {
            this.next(); // skip ','
            args.push(this.parseLogicalOr());
          }
        }
        if (this.peek()?.type !== 'RPAREN') {
          throw new Error(`Thiếu dấu đóng ngoặc ')' cho hàm ${ident}`);
        }
        this.next(); // skip ')'
        return { type: 'FunctionCall', name: ident, args };
      }

      // If identifier without parentheses, treat as variable fallback
      return { type: 'Variable', name: ident };
    }

    if (token.type === 'LPAREN') {
      this.next(); // skip '('
      const node = this.parseLogicalOr();
      if (this.peek()?.type !== 'RPAREN') {
        throw new Error("Thiếu dấu đóng ngoặc ')'");
      }
      this.next(); // skip ')'
      return node;
    }

    throw new Error(`Cú pháp không mong muốn '${token.value}' tại vị trí ${token.position}`);
  }
}

// Evaluator
export function evaluateAST(node: ASTNode, context: Record<string, any>): any {
  if (node.type === 'Literal') {
    return node.value;
  }

  if (node.type === 'Variable') {
    const key = node.name;
    let val = context[key];
    if (val === undefined || val === null) {
      if (key === 'examScore') val = context.totalScore ?? context.score;
      else if (key === 'totalScore') val = context.examScore ?? context.score;
      else if (key === 'midtermScore') val = context.midtermScore ?? context.processScore ?? context.bonusScore;
      else if (key === 'attendanceScore') val = context.attendanceScore ?? context.bonusScore;
      else if (key === 'practiceScore') val = context.practiceScore ?? context.midtermScore;
      else if (key === 'assigned') val = context.totalAssigned ?? context.assigned;
      else if (key === 'submitted') val = context.totalSubmitted ?? context.submitted;
      else if (key === 'absent') val = context.totalAbsent ?? context.absent;
      else if (key === 'passCount') val = context.passCount;
      else if (key === 'avgScore') val = context.avgScore;
    }
    if (val === undefined || val === null) {
      return null;
    }
    return val;
  }

  if (node.type === 'UnaryOp') {
    const arg = evaluateAST(node.argument, context);
    if (node.op === '-') return -(Number(arg) || 0);
    if (node.op === '+') return +(Number(arg) || 0);
    if (node.op === '!') return !arg;
    return arg;
  }

  if (node.type === 'BinaryOp') {
    const left = evaluateAST(node.left, context);
    const right = evaluateAST(node.right, context);

    switch (node.op) {
      case '+': {
        if (typeof left === 'string' || typeof right === 'string') {
          return `${left ?? ''}${right ?? ''}`;
        }
        return (Number(left) || 0) + (Number(right) || 0);
      }
      case '-':
        return (Number(left) || 0) - (Number(right) || 0);
      case '*':
        return (Number(left) || 0) * (Number(right) || 0);
      case '/': {
        const r = Number(right) || 0;
        if (r === 0) return 0; // Safe division by zero
        return (Number(left) || 0) / r;
      }
      case '%': {
        const r = Number(right) || 0;
        if (r === 0) return 0;
        return (Number(left) || 0) % r;
      }
      case '^':
        return Math.pow(Number(left) || 0, Number(right) || 0);
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '>':
        return (Number(left) || 0) > (Number(right) || 0);
      case '<':
        return (Number(left) || 0) < (Number(right) || 0);
      case '>=':
        return (Number(left) || 0) >= (Number(right) || 0);
      case '<=':
        return (Number(left) || 0) <= (Number(right) || 0);
      case '&&':
        return Boolean(left) && Boolean(right);
      case '||':
        return Boolean(left) || Boolean(right);
      default:
        return null;
    }
  }

  if (node.type === 'FunctionCall') {
    const fnName = node.name.toUpperCase();
    const args = node.args.map((a) => evaluateAST(a, context));

    switch (fnName) {
      case 'IF': {
        const [condition, trueVal, falseVal] = args;
        return condition ? trueVal : falseVal;
      }

      case 'ROUND': {
        const val = Number(args[0]) || 0;
        const decimals = Math.max(0, Math.min(10, Math.round(Number(args[1]) || 0)));
        const factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
      }

      case 'FLOOR': {
        return Math.floor(Number(args[0]) || 0);
      }

      case 'CEIL': {
        return Math.ceil(Number(args[0]) || 0);
      }

      case 'MIN': {
        const nums = args.map((n) => Number(n) || 0);
        return nums.length ? Math.min(...nums) : 0;
      }

      case 'MAX': {
        const nums = args.map((n) => Number(n) || 0);
        return nums.length ? Math.max(...nums) : 0;
      }

      case 'CONCAT': {
        return args.map((a) => (a === null || a === undefined ? '' : String(a))).join('');
      }

      case 'WEIGHTED': {
        // Pairs: (score1, w1, score2, w2, ...)
        let totalWeighted = 0;
        let totalWeights = 0;
        for (let i = 0; i < args.length; i += 2) {
          const score = Number(args[i]) || 0;
          const weight = Number(args[i + 1]) || 0;
          totalWeighted += score * weight;
          totalWeights += weight;
        }
        if (totalWeights === 0) return 0;
        return totalWeighted / totalWeights;
      }

      case 'GRADE4': {
        // Convert scale 10 to scale 4
        const score = Number(args[0]) || 0;
        if (score >= 8.5) return 4.0;
        if (score >= 8.0) return 3.5;
        if (score >= 7.0) return 3.0;
        if (score >= 6.5) return 2.5;
        if (score >= 5.5) return 2.0;
        if (score >= 5.0) return 1.5;
        if (score >= 4.0) return 1.0;
        return 0.0;
      }

      case 'LETTER_GRADE': {
        const score = Number(args[0]) || 0;
        if (score >= 8.5) return 'A';
        if (score >= 8.0) return 'B+';
        if (score >= 7.0) return 'B';
        if (score >= 6.5) return 'C+';
        if (score >= 5.5) return 'C';
        if (score >= 5.0) return 'D+';
        if (score >= 4.0) return 'D';
        return 'F';
      }

      case 'CLASSIFICATION': {
        const score = Number(args[0]) || 0;
        if (score >= 9.0) return 'Xuất sắc';
        if (score >= 8.0) return 'Giỏi';
        if (score >= 6.5) return 'Khá';
        if (score >= 5.0) return 'Trung bình';
        return 'Yếu';
      }

      default:
        throw new Error(`Hàm '${fnName}' không được hỗ trợ`);
    }
  }

  return null;
}

/**
 * Validates a formula string and returns any syntax errors.
 */
export function validateFormula(
  formula: string,
  sampleContext?: Record<string, any>,
): { valid: boolean; error?: string; sampleResult?: any } {
  if (!formula || !formula.trim()) {
    return { valid: false, error: 'Công thức không được để trống' };
  }

  try {
    const tokens = tokenize(formula);
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const ctx = sampleContext || {
      totalScore: 8.5,
      maxScore: 10,
      violationCount: 0,
      studentCode: 'SV2025001',
      fullName: 'Nguyễn Văn An',
      className: 'CNTT-K48A',
      status: 'SUBMITTED',
      bonusScore: 1.0,
      penaltyScore: 0,
    };

    const sampleResult = evaluateAST(ast, ctx);
    return { valid: true, sampleResult };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Công thức không hợp lệ' };
  }
}

/**
 * Evaluates a formula against an actual row record.
 */
export function evaluateFormula(formula: string, rowData: Record<string, any>): any {
  if (!formula || !formula.trim()) return null;
  try {
    const tokens = tokenize(formula);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return evaluateAST(ast, rowData);
  } catch {
    return null;
  }
}
