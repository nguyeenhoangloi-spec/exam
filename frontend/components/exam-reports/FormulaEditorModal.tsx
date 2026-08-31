'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import {
  STANDARD_REPORT_VARIABLES,
  FORMULA_FUNCTIONS_HELP,
  validateFormula,
  evaluateFormula,
} from '../../lib/formula-engine';
import { CheckCircle2, AlertCircle, Variable, Code2, Plus } from 'lucide-react';

export interface DynamicColumnDefinition {
  id: string;
  key: string;
  header: string;
  type: 'FIELD' | 'FORMULA';
  formula?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  decimals?: number;
  visible: boolean;
}

interface FormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (col: DynamicColumnDefinition) => void;
  initialColumn?: DynamicColumnDefinition | null;
  customVariables?: any[];
}

type RuleType =
  | 'PASS_FAIL'
  | 'MOET_5_LEVELS'
  | 'WEIGHTED_2'
  | 'WEIGHTED_3'
  | 'LETTER_GRADE'
  | 'GRADE_4'
  | 'RATE'
  | 'CUSTOM';

interface RuleOption {
  value: RuleType;
  label: string;
  defaultHeader: string;
  defaultAlign: 'left' | 'center' | 'right';
  description: string;
}

const RULE_OPTIONS: RuleOption[] = [
  {
    value: 'PASS_FAIL',
    label: 'Kết quả Đạt / Không đạt (Ngưỡng điểm tùy chọn)',
    defaultHeader: 'Kết quả',
    defaultAlign: 'center',
    description: 'Thí sinh đạt từ mức điểm quy định trở lên là ĐẠT, dưới là KHÔNG ĐẠT',
  },
  {
    value: 'MOET_5_LEVELS',
    label: 'Xếp loại Học lực 5 mức (Chuẩn Bộ GD&ĐT)',
    defaultHeader: 'Xếp loại',
    defaultAlign: 'center',
    description: 'Tự động phân loại: Xuất sắc (≥9), Giỏi (≥8), Khá (≥6.5), TB (≥5), Yếu (<5)',
  },
  {
    value: 'WEIGHTED_2',
    label: 'Điểm tổng kết 2 thành phần (Thi % + Quá trình %)',
    defaultHeader: 'Điểm tổng kết',
    defaultAlign: 'right',
    description: 'Tính điểm = (% Điểm thi) + (% Điểm chuyên cần / quá trình)',
  },
  {
    value: 'WEIGHTED_3',
    label: 'Điểm tổng kết 3 thành phần (Thi % + Giữa kỳ % + Chuyên cần %)',
    defaultHeader: 'Điểm tổng kết HP',
    defaultAlign: 'right',
    description: 'Tính điểm = (% Điểm thi) + (% Điểm giữa kỳ / BTL) + (% Điểm chuyên cần)',
  },
  {
    value: 'LETTER_GRADE',
    label: 'Quy đổi Điểm Chữ hệ tín chỉ (A, B+, B, C, D, F)',
    defaultHeader: 'Điểm chữ',
    defaultAlign: 'center',
    description: 'Chuyển điểm thang 10 sang A, B+, B, C+, C, D+, D, F theo hệ tín chỉ',
  },
  {
    value: 'GRADE_4',
    label: 'Quy đổi Thang điểm 4.0 (4.0, 3.5, 3.0, 2.5...)',
    defaultHeader: 'Điểm hệ 4',
    defaultAlign: 'center',
    description: 'Quy đổi tương ứng điểm thang 10 sang thang điểm 4 chuẩn quy chế',
  },
  {
    value: 'RATE',
    label: 'Tỷ lệ sinh viên nộp bài (%)',
    defaultHeader: 'Tỷ lệ nộp bài',
    defaultAlign: 'right',
    description: 'Tự động tính: (Số bài đã nộp / Tổng sinh viên được gán) × 100%',
  },
  {
    value: 'CUSTOM',
    label: 'Tự nhập công thức tự do (Hỗ trợ bấm chèn biến & hàm)',
    defaultHeader: 'Cột tính toán tùy biến',
    defaultAlign: 'center',
    description: 'Tự do kết hợp các biến điểm số, số liệu thi và các hàm IF, ROUND, WEIGHTED...',
  },
];

const SAMPLE_CONTEXT = {
  examScore: 8.5,
  totalScore: 8.5,
  midtermScore: 7.5,
  attendanceScore: 9.0,
  practiceScore: 8.0,
  bonusScore: 1.0,
  penaltyScore: 0,
  violationCount: 0,
  studentCode: 'SV2025001',
  fullName: 'Nguyễn Văn An',
  className: 'CNTT-K48A',
  status: 'SUBMITTED',
  submitted: 48,
  assigned: 50,
  absent: 2,
  passCount: 45,
  avgScore: 7.6,
};

export function FormulaEditorModal({
  isOpen,
  onClose,
  onSave,
  initialColumn,
}: FormulaEditorModalProps) {
  const [header, setHeader] = useState('Kết quả');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [ruleType, setRuleType] = useState<RuleType>('PASS_FAIL');
  const [passScore, setPassScore] = useState<number>(5.0);
  const [examWeight, setExamWeight] = useState<number>(70);
  const [bonusWeight, setBonusWeight] = useState<number>(30);
  const [midtermWeight, setMidtermWeight] = useState<number>(30);
  const [finalWeight3, setFinalWeight3] = useState<number>(50);
  const [attendWeight3, setAttendWeight3] = useState<number>(20);
  const [customFormula, setCustomFormula] = useState<string>('');

  const formulaInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialColumn) {
      setHeader(initialColumn.header || '');
      setAlign(initialColumn.align || 'center');

      const f = initialColumn.formula || '';
      if (f.includes('CLASSIFICATION')) {
        setRuleType('MOET_5_LEVELS');
      } else if (f.includes('LETTER_GRADE')) {
        setRuleType('LETTER_GRADE');
      } else if (f.includes('GRADE4')) {
        setRuleType('GRADE_4');
      } else if (f.includes('ĐẠT') || f.includes('HỌC LẠI') || f.includes('KHÔNG ĐẠT')) {
        setRuleType('PASS_FAIL');
        const match = f.match(/>=\s*([0-9.]+)/);
        if (match && match[1]) {
          setPassScore(Number(match[1]));
        }
      } else if (f.includes('{midtermScore}') && f.includes('*')) {
        setRuleType('WEIGHTED_3');
      } else if (f.includes('*') && f.includes('+')) {
        setRuleType('WEIGHTED_2');
      } else if (f.includes('/ {assigned}')) {
        setRuleType('RATE');
      } else {
        setRuleType('CUSTOM');
        setCustomFormula(f);
      }
    } else {
      setHeader('Kết quả');
      setAlign('center');
      setRuleType('PASS_FAIL');
      setPassScore(5.0);
      setExamWeight(70);
      setBonusWeight(30);
      setFinalWeight3(50);
      setMidtermWeight(30);
      setAttendWeight3(20);
      setCustomFormula('');
    }
  }, [initialColumn, isOpen]);

  const handleSelectRuleType = (newType: RuleType) => {
    setRuleType(newType);
    const opt = RULE_OPTIONS.find((o) => o.value === newType);
    if (opt && !initialColumn) {
      setHeader(opt.defaultHeader);
      setAlign(opt.defaultAlign);
    }
  };

  // Chèn chuỗi vào ô nhập công thức tại vị trí con trỏ
  const insertAtCursor = (textToInsert: string) => {
    const input = formulaInputRef.current;
    if (!input) {
      setCustomFormula((prev) => prev + textToInsert);
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = customFormula;
    const updated = current.substring(0, start) + textToInsert + current.substring(end);
    setCustomFormula(updated);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 10);
  };

  const getExplanation = (): string => {
    if (ruleType === 'PASS_FAIL') {
      return `Điểm ≥ ${passScore.toFixed(1)} ghi "ĐẠT", dưới ${passScore.toFixed(1)} ghi "KHÔNG ĐẠT"`;
    }
    if (ruleType === 'MOET_5_LEVELS') {
      return 'Điểm ≥ 9.0 "Xuất sắc", ≥ 8.0 "Giỏi", ≥ 6.5 "Khá", ≥ 5.0 "Trung bình", < 5.0 "Yếu"';
    }
    if (ruleType === 'WEIGHTED_2') {
      return `Điểm = (${examWeight}% × Điểm thi) + (${bonusWeight}% × Điểm chuyên cần)`;
    }
    if (ruleType === 'WEIGHTED_3') {
      return `Điểm = (${finalWeight3}% × Điểm thi) + (${midtermWeight}% × Giữa kỳ) + (${attendWeight3}% × Chuyên cần)`;
    }
    if (ruleType === 'LETTER_GRADE') {
      return 'Điểm ≥ 8.5 "A", ≥ 8.0 "B+", ≥ 7.0 "B", ≥ 6.5 "C+", ≥ 5.5 "C", ≥ 5.0 "D+", ≥ 4.0 "D", < 4.0 "F"';
    }
    if (ruleType === 'GRADE_4') {
      return 'Quy đổi sang thang điểm 4: 8.5 → 4.0, 8.0 → 3.5, 7.0 → 3.0, 6.5 → 2.5, 5.5 → 2.0...';
    }
    if (ruleType === 'RATE') {
      return 'Tỷ lệ nộp bài = (Số bài đã nộp / Tổng SV được gán) × 100%';
    }
    return 'Áp dụng công thức tính toán tùy biến do bạn nhập.';
  };

  const currentFormula = useMemo((): string => {
    if (ruleType === 'PASS_FAIL') {
      return `IF({totalScore} >= ${passScore}, "ĐẠT", "KHÔNG ĐẠT")`;
    }
    if (ruleType === 'MOET_5_LEVELS') {
      return 'CLASSIFICATION({totalScore})';
    }
    if (ruleType === 'WEIGHTED_2') {
      const w1 = Number((examWeight / 100).toFixed(2));
      const w2 = Number((bonusWeight / 100).toFixed(2));
      return `ROUND({totalScore} * ${w1} + {bonusScore} * ${w2}, 2)`;
    }
    if (ruleType === 'WEIGHTED_3') {
      const w1 = Number((finalWeight3 / 100).toFixed(2));
      const w2 = Number((midtermWeight / 100).toFixed(2));
      const w3 = Number((attendWeight3 / 100).toFixed(2));
      return `ROUND({examScore} * ${w1} + {midtermScore} * ${w2} + {attendanceScore} * ${w3}, 2)`;
    }
    if (ruleType === 'LETTER_GRADE') {
      return 'LETTER_GRADE({totalScore})';
    }
    if (ruleType === 'GRADE_4') {
      return 'GRADE4({totalScore})';
    }
    if (ruleType === 'RATE') {
      return 'ROUND(({submitted} / {assigned}) * 100, 1)';
    }
    return customFormula.trim();
  }, [
    ruleType,
    passScore,
    examWeight,
    bonusWeight,
    finalWeight3,
    midtermWeight,
    attendWeight3,
    customFormula,
  ]);

  // Đánh giá thử nghiệm kết quả
  const validationResult = useMemo(() => {
    if (!currentFormula) return { valid: false, error: 'Chưa có công thức' };
    return validateFormula(currentFormula, SAMPLE_CONTEXT);
  }, [currentFormula]);

  const handleSave = () => {
    if (!header.trim()) return;
    if (!currentFormula) return;

    const id = initialColumn?.id || `calc_${Date.now()}`;
    const col: DynamicColumnDefinition = {
      id,
      key: id,
      header: header.trim(),
      type: 'FORMULA',
      formula: currentFormula,
      align,
      decimals: 2,
      visible: true,
    };
    onSave(col);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialColumn ? 'Chỉnh sửa cột tính toán' : 'Thêm tiêu chuẩn / công thức điểm'}
      subtitle="Tạo cột tự động tính toán hoặc phân loại kết quả"
      size="lg"
    >
      <div className="space-y-4 py-1">
        {/* ── HÀNG 1: TÊN CỘT & CĂN LỀ ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
              Tên tiêu đề cột <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Kết quả, Xếp loại, Điểm chữ..."
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-type-body font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
              Căn lề
            </label>
            <div className="relative flex h-11 w-full rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/80 p-1 select-none">
              {/* Sliding Background Indicator Pill */}
              <div
                className="absolute top-1 bottom-1 w-[calc(33.333%-2.67px)] rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 ease-out pointer-events-none"
                style={{
                  left:
                    align === 'left'
                      ? '4px'
                      : align === 'center'
                      ? 'calc(33.333% + 1.33px)'
                      : 'calc(66.666% - 1.33px)',
                }}
              />

              <button
                type="button"
                onClick={() => setAlign('left')}
                className={`relative z-10 flex-1 h-full flex items-center justify-center text-type-body rounded-full transition-colors duration-200 cursor-pointer ${
                  align === 'left'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Trái
              </button>
              <button
                type="button"
                onClick={() => setAlign('center')}
                className={`relative z-10 flex-1 h-full flex items-center justify-center text-type-body rounded-full transition-colors duration-200 cursor-pointer ${
                  align === 'center'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Giữa
              </button>
              <button
                type="button"
                onClick={() => setAlign('right')}
                className={`relative z-10 flex-1 h-full flex items-center justify-center text-type-body rounded-full transition-colors duration-200 cursor-pointer ${
                  align === 'right'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Phải
              </button>
            </div>
          </div>
        </div>

        {/* ── HÀNG 2: CHỌN QUY CHUẨN ĐÁNH GIÁ ── */}
        <div className="space-y-1.5">
          <label className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">
            Quy chuẩn đánh giá / Phương pháp tính <span className="text-rose-500">*</span>
          </label>
          <select
            value={ruleType}
            onChange={(e) => handleSelectRuleType(e.target.value as RuleType)}
            className="h-11 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-type-body font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition shadow-2xs cursor-pointer"
          >
            {RULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── HÀNG 3: CARD CẤU HÌNH THÔNG SỐ & DÒNG KẾT QUẢ THỬ NGHIỆM ĐÚNG THEO MẪU ── */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          {ruleType === 'PASS_FAIL' && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  Mức điểm đạt tối thiểu:
                </span>
                <div className="inline-flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value) || 5.0)}
                    className="h-10 w-20 text-center rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-900 text-type-body font-semibold text-blue-600 outline-none shadow-2xs focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-type-helper text-slate-500 font-normal">/ 10 điểm</span>
                </div>
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'MOET_5_LEVELS' && (
            <div className="space-y-2">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                Quy cách xếp loại 5 mức Bộ GD&ĐT:
              </span>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'WEIGHTED_2' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                    Tỷ lệ Điểm thi (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={examWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setExamWeight(val);
                      setBonusWeight(Math.max(0, 100 - val));
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                    Tỷ lệ Điểm chuyên cần (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bonusWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setBonusWeight(val);
                      setExamWeight(Math.max(0, 100 - val));
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'WEIGHTED_3' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                    Thi kết thúc (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={finalWeight3}
                    onChange={(e) => setFinalWeight3(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                    Giữa kỳ / BTL (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={midtermWeight}
                    onChange={(e) => setMidtermWeight(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                    Chuyên cần (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendWeight3}
                    onChange={(e) => setAttendWeight3(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'LETTER_GRADE' && (
            <div className="space-y-2">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                Quy đổi Điểm Chữ hệ tín chỉ:
              </span>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'GRADE_4' && (
            <div className="space-y-2">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                Quy đổi Thang điểm 4.0:
              </span>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'RATE' && (
            <div className="space-y-2">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                Tỷ lệ sinh viên nộp bài thi:
              </span>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                {getExplanation()}
              </p>
            </div>
          )}

          {ruleType === 'CUSTOM' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Nhập biểu thức công thức tính toán:</span>
                  <span className="text-type-tiny text-slate-500">Gõ hoặc bấm các nút bên dưới để chèn nhanh</span>
                </label>
                <textarea
                  ref={formulaInputRef}
                  rows={3}
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  placeholder='Ví dụ: ROUND({examScore} * 0.5 + {midtermScore} * 0.3 + {attendanceScore} * 0.2, 2)'
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs leading-relaxed"
                />
              </div>

              {/* ── BẢNG DANH MỤC BIẾN (CLICK-TO-INSERT CHIPS) ── */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
                  <Variable className="h-4 w-4 text-blue-600" />
                  <span>Bấm để chèn biến dữ liệu vào công thức:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{examScore}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-type-helper font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                    title="Điểm bài thi kết thúc học phần (0 - 10)"
                  >
                    <Plus className="h-3 w-3" /> Điểm thi <span className="text-type-tiny text-blue-500">{"{examScore}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{midtermScore}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-type-helper font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                    title="Điểm giữa kỳ / bài tập lớn / thực hành (0 - 10)"
                  >
                    <Plus className="h-3 w-3" /> Điểm giữa kỳ <span className="text-type-tiny text-blue-500">{"{midtermScore}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{attendanceScore}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-type-helper font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                    title="Điểm chuyên cần / thái độ học tập (0 - 10)"
                  >
                    <Plus className="h-3 w-3" /> Chuyên cần <span className="text-type-tiny text-blue-500">{"{attendanceScore}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{practiceScore}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-type-helper font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                    title="Điểm thực hành / thí nghiệm"
                  >
                    <Plus className="h-3 w-3" /> Thực hành <span className="text-type-tiny text-blue-500">{"{practiceScore}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{violationCount}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-type-helper font-medium hover:bg-amber-100 transition cursor-pointer"
                    title="Số lần vi phạm quy chế"
                  >
                    <Plus className="h-3 w-3" /> Vi phạm <span className="text-type-tiny text-amber-600">{"{violationCount}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{submitted}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-type-helper font-medium hover:bg-slate-100 transition cursor-pointer"
                    title="Số bài thi đã nộp"
                  >
                    <Plus className="h-3 w-3" /> Đã nộp <span className="text-type-tiny text-slate-500">{"{submitted}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{assigned}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-type-helper font-medium hover:bg-slate-100 transition cursor-pointer"
                    title="Tổng số sinh viên được gán"
                  >
                    <Plus className="h-3 w-3" /> Tổng SV <span className="text-type-tiny text-slate-500">{"{assigned}"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{absent}')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-type-helper font-medium hover:bg-slate-100 transition cursor-pointer"
                    title="Số sinh viên vắng thi"
                  >
                    <Plus className="h-3 w-3" /> Vắng thi <span className="text-type-tiny text-slate-500">{"{absent}"}</span>
                  </button>
                </div>
              </div>

              {/* ── BẢNG DANH MỤC HÀM TOÁN HỌC & QUY ĐỔI ── */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                  <span>Bấm để chèn hàm tính toán / quy đổi:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertAtCursor('IF({examScore} >= 5, "ĐẠT", "HỌC LẠI")')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-type-helper font-medium hover:bg-emerald-100 transition cursor-pointer"
                    title="Hàm điều kiện IF(điều_kiện, đúng, sai)"
                  >
                    <Plus className="h-3 w-3" /> Hàm IF(...)
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('ROUND({examScore} * 0.7 + {attendanceScore} * 0.3, 2)')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-type-helper font-medium hover:bg-emerald-100 transition cursor-pointer"
                    title="Làm tròn số ROUND(số, chữ_số_thập_phân)"
                  >
                    <Plus className="h-3 w-3" /> Làm tròn ROUND(...)
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('GRADE4({examScore})')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-type-helper font-medium hover:bg-emerald-100 transition cursor-pointer"
                    title="Quy đổi sang thang điểm 4.0"
                  >
                    <Plus className="h-3 w-3" /> Thang điểm 4 GRADE4(...)
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('LETTER_GRADE({examScore})')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-type-helper font-medium hover:bg-emerald-100 transition cursor-pointer"
                    title="Quy đổi sang điểm chữ (A, B+, B, C, D, F)"
                  >
                    <Plus className="h-3 w-3" /> Điểm chữ LETTER_GRADE(...)
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('CLASSIFICATION({examScore})')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-type-helper font-medium hover:bg-emerald-100 transition cursor-pointer"
                    title="Xếp loại học lực 5 mức chuẩn Bộ GD&ĐT"
                  >
                    <Plus className="h-3 w-3" /> Xếp loại CLASSIFICATION(...)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ĐƯỜNG KẺ NGANG & DÒNG TRẠNG THÁI / KẾT QUẢ THỬ NGHIỆM INLINE PHẲNG ĐÚNG MẪU ── */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between text-type-helper">
            <div className="flex items-center gap-1.5">
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Cú pháp hợp lệ
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    {validationResult.error || 'Cú pháp chưa đúng'}
                  </span>
                </>
              )}
            </div>

            {validationResult.valid && (
              <div className="text-slate-500 dark:text-slate-400 font-normal">
                Thử nghiệm (8.5):{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  {String(validationResult.sampleResult ?? '—')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ACTIONS (BUTTON HIERARCHY 2026) ── */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!header.trim() || !validationResult.valid}
            onClick={handleSave}
          >
            {initialColumn ? 'Cập nhật cột' : 'Lưu vào bảng báo cáo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
