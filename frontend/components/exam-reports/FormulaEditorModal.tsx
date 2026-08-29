'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';

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
  | 'WEIGHTED'
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
    label: 'Kết quả Đạt / Không đạt (Từ 5.0 điểm trở lên)',
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
    value: 'WEIGHTED',
    label: 'Điểm tổng kết theo hệ số (Thi % + Quá trình %)',
    defaultHeader: 'Điểm tổng kết',
    defaultAlign: 'right',
    description: 'Tính điểm = (% Điểm thi) + (% Điểm chuyên cần / quá trình)',
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
    label: 'Tự nhập công thức tùy biến khác...',
    defaultHeader: 'Cột tùy biến',
    defaultAlign: 'center',
    description: 'Áp dụng biểu thức tính toán tùy biến do bạn nhập',
  },
];

export function FormulaEditorModal({
  isOpen,
  onClose,
  onSave,
  initialColumn,
}: FormulaEditorModalProps) {
  const [header, setHeader] = useState('');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [ruleType, setRuleType] = useState<RuleType>('PASS_FAIL');
  const [passScore, setPassScore] = useState<number>(5.0);
  const [examWeight, setExamWeight] = useState<number>(70);
  const [bonusWeight, setBonusWeight] = useState<number>(30);
  const [customFormula, setCustomFormula] = useState<string>('');

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
      } else if (f.includes('ĐẠT') || f.includes('HỌC LẠI')) {
        setRuleType('PASS_FAIL');
      } else if (f.includes('*') && f.includes('+')) {
        setRuleType('WEIGHTED');
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

  const getExplanation = (): string => {
    if (ruleType === 'PASS_FAIL') {
      return `Ví dụ: Thí sinh đạt từ ${passScore} điểm trở lên sẽ ghi "ĐẠT", dưới ${passScore} ghi "KHÔNG ĐẠT".`;
    }
    if (ruleType === 'MOET_5_LEVELS') {
      return 'Ví dụ: 9.0 ghi "Xuất sắc", 8.5 ghi "Giỏi", 7.0 ghi "Khá", 5.5 ghi "Trung bình", dưới 5.0 ghi "Yếu".';
    }
    if (ruleType === 'WEIGHTED') {
      return `Ví dụ: Tính điểm = (${examWeight}% Điểm thi) + (${bonusWeight}% Điểm chuyên cần).`;
    }
    if (ruleType === 'LETTER_GRADE') {
      return 'Ví dụ: 9.0 ghi "A", 8.0 ghi "B+", 7.0 ghi "B", 6.0 ghi "C", 5.0 ghi "D", dưới 4.0 ghi "F".';
    }
    if (ruleType === 'GRADE_4') {
      return 'Ví dụ: 8.5 điểm chuyển thành 4.0, 7.0 chuyển thành 3.0, 5.0 chuyển thành 1.5...';
    }
    if (ruleType === 'RATE') {
      return 'Ví dụ: Tự động lấy số bài nộp chia tổng số sinh viên được phân công để ra phần trăm (%).';
    }
    return 'Áp dụng công thức tính toán tùy biến do bạn nhập.';
  };

  const buildFormula = (): string => {
    if (ruleType === 'PASS_FAIL') {
      return `IF({totalScore} >= ${passScore}, "ĐẠT", "KHÔNG ĐẠT")`;
    }
    if (ruleType === 'MOET_5_LEVELS') {
      return 'CLASSIFICATION({totalScore})';
    }
    if (ruleType === 'WEIGHTED') {
      const w1 = Number((examWeight / 100).toFixed(2));
      const w2 = Number((bonusWeight / 100).toFixed(2));
      return `ROUND({totalScore} * ${w1} + {bonusScore} * ${w2}, 2)`;
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
  };

  const handleSave = () => {
    if (!header.trim()) return;
    const formula = buildFormula();
    if (!formula) return;

    const id = initialColumn?.id || `calc_${Date.now()}`;
    const col: DynamicColumnDefinition = {
      id,
      key: id,
      header: header.trim(),
      type: 'FORMULA',
      formula,
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
      title={initialColumn ? 'Chỉnh sửa cột báo cáo' : 'Thêm cột mới vào báo cáo'}
      subtitle="Thiết lập tiêu chuẩn đánh giá hoặc quy cách tính điểm theo yêu cầu của cấp trên"
      size="lg"
    >
      <div className="space-y-4 py-1">
        {/* ── HÀNG 1: TÊN CỘT & CĂN LỀ ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
              Tên tiêu đề cột hiển thị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Kết quả, Xếp loại, Điểm chữ, Điểm hệ 4..."
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-type-body font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
              Căn lề
            </label>
            <div className="flex h-10 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-0.5">
              <button
                type="button"
                onClick={() => setAlign('left')}
                className={`flex-1 py-1 text-type-body font-medium rounded-xl transition cursor-pointer ${
                  align === 'left'
                    ? 'bg-white dark:bg-slate-900 shadow-2xs text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Trái
              </button>
              <button
                type="button"
                onClick={() => setAlign('center')}
                className={`flex-1 py-1 text-type-body font-medium rounded-xl transition cursor-pointer ${
                  align === 'center'
                    ? 'bg-white dark:bg-slate-900 shadow-2xs text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Giữa
              </button>
              <button
                type="button"
                onClick={() => setAlign('right')}
                className={`flex-1 py-1 text-type-body font-medium rounded-xl transition cursor-pointer ${
                  align === 'right'
                    ? 'bg-white dark:bg-slate-900 shadow-2xs text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Phải
              </button>
            </div>
          </div>
        </div>

        {/* ── HÀNG 2: CHỌN QUY CHUẨN ĐÁNH GIÁ (DROPDOWN 1 CỘT RỘNG RÃI) ── */}
        <div className="space-y-1.5">
          <label className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">
            Chọn quy chuẩn đánh giá / cách tính <span className="text-rose-500">*</span>
          </label>
          <select
            value={ruleType}
            onChange={(e) => handleSelectRuleType(e.target.value as RuleType)}
            className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition shadow-2xs"
          >
            {RULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── HÀNG 3: CÁC Ô NHẬP THÔNG SỐ TƯƠNG ỨNG (RÕ RÀNG & THOÁNG ĐÃNG) ── */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          {ruleType === 'PASS_FAIL' && (
            <div className="flex items-center gap-3">
              <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                Mức điểm đạt tối thiểu:
              </label>
              <div className="inline-flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={passScore}
                  onChange={(e) => setPassScore(Number(e.target.value) || 5.0)}
                  className="h-10 w-20 text-center rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500"
                />
                <span className="text-type-helper text-slate-400 font-normal">/ 10 điểm</span>
              </div>
            </div>
          )}

          {ruleType === 'WEIGHTED' && (
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
          )}

          {ruleType === 'CUSTOM' && (
            <div className="space-y-1">
              <label className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                Nhập biểu thức công thức
              </label>
              <input
                type="text"
                value={customFormula}
                onChange={(e) => setCustomFormula(e.target.value)}
                placeholder="Ví dụ: {totalScore} - {penaltyScore}"
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Dòng giải thích mẫu bằng Tiếng Việt */}
          <p className="text-type-helper text-slate-600 dark:text-slate-400 leading-relaxed">
            {getExplanation()}
          </p>
        </div>

        {/* ── FOOTER ACTIONS (BUTTON HIERARCHY 2026) ── */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!header.trim()}
            onClick={handleSave}
          >
            {initialColumn ? 'Cập nhật cột' : 'Lưu vào báo cáo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
