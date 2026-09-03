'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import {
  STANDARD_REPORT_VARIABLES,
  FORMULA_FUNCTIONS_HELP,
  validateFormula,
  evaluateFormula,
} from '../../lib/formula-engine';
import { CheckCircle2, AlertCircle, Variable, Code2, Plus, ChevronDown, Check, Calculator } from 'lucide-react';

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

interface RuleCategoryItem {
  value: RuleType;
  title: string;
  shortTag: string;
  description: string;
  defaultHeader: string;
  defaultAlign: 'left' | 'center' | 'right';
}

interface RuleCategory {
  categoryTitle: string;
  items: RuleCategoryItem[];
}

const RULE_CATEGORIES: RuleCategory[] = [
  {
    categoryTitle: 'Đánh giá & xếp loại',
    items: [
      {
        value: 'PASS_FAIL',
        title: 'Kết quả Đạt / Không đạt',
        shortTag: 'Ngưỡng điểm tùy chọn',
        description: 'Thiết lập ngưỡng điểm xét đạt môn tùy chọn',
        defaultHeader: 'Kết quả',
        defaultAlign: 'center',
      },
      {
        value: 'MOET_5_LEVELS',
        title: 'Xếp loại Học lực 5 mức',
        shortTag: 'Chuẩn Bộ GD&ĐT',
        description: 'Xuất sắc, Giỏi, Khá, Trung bình, Yếu (Chuẩn Bộ GD&ĐT)',
        defaultHeader: 'Xếp loại',
        defaultAlign: 'center',
      },
    ],
  },
  {
    categoryTitle: 'Tính điểm tổng kết học phần',
    items: [
      {
        value: 'WEIGHTED_2',
        title: 'Điểm tổng kết 2 thành phần',
        shortTag: 'Thi % + Quá trình %',
        description: 'Thi cuối kỳ (%) + Điểm quá trình (%)',
        defaultHeader: 'Điểm tổng kết',
        defaultAlign: 'right',
      },
      {
        value: 'WEIGHTED_3',
        title: 'Điểm tổng kết 3 thành phần',
        shortTag: 'Thi % + Giữa kỳ % + Chuyên cần %',
        description: 'Thi cuối kỳ (%) + Điểm giữa kỳ (%) + Chuyên cần (%)',
        defaultHeader: 'Điểm tổng kết HP',
        defaultAlign: 'right',
      },
    ],
  },
  {
    categoryTitle: 'Quy đổi thang điểm',
    items: [
      {
        value: 'LETTER_GRADE',
        title: 'Quy đổi Điểm Chữ hệ tín chỉ',
        shortTag: 'A, B+, B, C, D, F',
        description: 'Thang chữ: A, B+, B, C+, C, D+, D, F',
        defaultHeader: 'Điểm chữ',
        defaultAlign: 'center',
      },
      {
        value: 'GRADE_4',
        title: 'Quy đổi Thang điểm 4.0',
        shortTag: 'Thang 4.0 chuẩn',
        description: 'Chuyển đổi hệ 10 sang hệ 4 (4.0, 3.5, 3.0, 2.5...)',
        defaultHeader: 'Điểm hệ 4',
        defaultAlign: 'center',
      },
      {
        value: 'RATE',
        title: 'Tỷ lệ sinh viên nộp bài',
        shortTag: 'Số bài nộp / Tổng SV',
        description: 'Tỷ lệ bài nộp / tổng sinh viên phân công (%)',
        defaultHeader: 'Tỷ lệ nộp bài',
        defaultAlign: 'right',
      },
    ],
  },
  {
    categoryTitle: 'Tùy biến công thức',
    items: [
      {
        value: 'CUSTOM',
        title: 'Tự nhập công thức tự do',
        shortTag: 'Hỗ trợ chèn biến & hàm',
        description: 'Chèn biến & hàm toán học',
        defaultHeader: 'Cột tính toán tùy biến',
        defaultAlign: 'center',
      },
    ],
  },
];

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

  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const methodDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; maxHeight: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 320,
    maxHeight: 380,
    openUp: false,
  });

  const formulaInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!methodDropdownButtonRef.current) return;
    const rect = methodDropdownButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(380, Math.max(200, openUp ? spaceAbove : spaceBelow));
    const width = rect.width;
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
    const top = openUp ? rect.top - 8 : rect.bottom + 8;

    setCoords({
      top,
      left,
      width,
      maxHeight,
      openUp,
    });
  }, []);

  useEffect(() => {
    if (!isMethodDropdownOpen) return;
    updatePosition();

    const handleScroll = (e: Event) => {
      // Không đóng menu nếu cuộn bên trong menu popover
      if (menuRef.current && (e.target === menuRef.current || menuRef.current.contains(e.target as Node))) {
        return;
      }
      setIsMethodDropdownOpen(false);
    };

    const handleResize = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMethodDropdownOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMethodDropdownOpen, updatePosition]);

  useEffect(() => {
    if (!isMethodDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        methodDropdownButtonRef.current &&
        !methodDropdownButtonRef.current.contains(e.target as Node)
      ) {
        setIsMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMethodDropdownOpen]);

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
    if (newType === 'CUSTOM' && !customFormula) {
      setCustomFormula('ROUND({examScore} * 0.5 + {midtermScore} * 0.3 + {attendanceScore} * 0.2, 2)');
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
      icon={<Calculator className="h-6 w-6 text-white" />}
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

        {/* ── HÀNG 2: CHỌN QUY CHUẨN ĐÁNH GIÁ (SMART POPOVER PORTAL CÁCH 1) ── */}
        <div className="space-y-1.5 relative">
          <label className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">
            Quy chuẩn đánh giá / Phương pháp tính <span className="text-rose-500">*</span>
          </label>

          {/* Trigger Button */}
          <button
            ref={methodDropdownButtonRef}
            type="button"
            aria-expanded={isMethodDropdownOpen}
            aria-haspopup="menu"
            onClick={() => setIsMethodDropdownOpen((prev) => !prev)}
            className={`w-full h-11 px-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-left select-none ${
              isMethodDropdownOpen
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 truncate">
                {RULE_OPTIONS.find((o) => o.value === ruleType)?.label || 'Chọn phương pháp tính...'}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
                isMethodDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
              }`}
            />
          </button>

          {/* Smart Positioning & Anti-Clipping Popover via createPortal */}
          {isMethodDropdownOpen &&
            mounted &&
            createPortal(
              <div
                ref={menuRef}
                role="menu"
                style={{
                  position: 'fixed',
                  top: coords.openUp ? 'auto' : `${coords.top}px`,
                  bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
                  left: `${coords.left}px`,
                  width: `${coords.width}px`,
                  maxHeight: `${coords.maxHeight}px`,
                }}
                className="z-[99999] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-apple-modal p-2 overflow-y-auto space-y-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-150 text-left select-none"
              >
                {RULE_CATEGORIES.map((cat, idx) => (
                  <div key={idx} className="space-y-0.5">
                    {/* Đường phân cách giữa các nhóm */}
                    {idx > 0 && <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />}

                    {/* Category Header */}
                    <div className="px-3 pt-1.5 pb-1">
                      <span className="text-type-tiny font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                        {cat.categoryTitle}
                      </span>
                    </div>

                    {/* Category Options */}
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const isSelected = item.value === ruleType;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              handleSelectRuleType(item.value);
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-2 border-blue-500 bg-white dark:bg-slate-900 shadow-2xs'
                                : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <span
                                className={`text-type-body block leading-5 text-slate-900 dark:text-slate-100 ${
                                  isSelected ? 'font-semibold' : 'font-medium'
                                }`}
                              >
                                {item.title}
                              </span>
                              <p className="text-type-helper leading-4 text-slate-500 dark:text-slate-400 font-normal">
                                {item.description}
                              </p>
                            </div>

                            {isSelected && (
                              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>,
              document.body
            )}
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
            <div className="space-y-4">
              {/* Tiêu đề & phụ đề phần công thức */}
              <div className="space-y-1">
                <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                  Biểu thức tính toán <span className="text-rose-500">*</span>
                </span>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                  Gõ công thức hoặc chọn nhanh các biến và hàm bên dưới
                </p>
              </div>

              {/* Khung nhập công thức tích hợp kèm dòng kiểm tra & kết quả thử nghiệm */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3.5 space-y-2.5">
                <textarea
                  ref={formulaInputRef}
                  rows={3}
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  placeholder="ROUND({examScore} * 0.5 + {midtermScore} * 0.3 + {attendanceScore} * 0.2, 2)"
                  className="w-full bg-transparent border-0 p-0 text-type-body font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none resize-none leading-relaxed shadow-none focus:ring-0"
                />

                {/* Dòng trạng thái kiểm tra cú pháp và kết quả inline ngay trong card */}
                <div className="pt-2 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between text-type-helper">
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
                      Mẫu thử (8.5, 7.0, 9.0) ={' '}
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {String(validationResult.sampleResult ?? '—')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Đường kẻ ngang hairline phân tách */}
              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* ── BIẾN DỮ LIỆU (CLICK ĐỂ CHÈN) ── */}
              <div className="space-y-2">
                <span className="block text-type-body-sm font-semibold text-slate-800 dark:text-slate-200">
                  BIẾN DỮ LIỆU (CLICK ĐỂ CHÈN)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{examScore}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Điểm bài thi kết thúc học phần (0 - 10)"
                  >
                    <span>Điểm thi</span>
                    <span className="text-type-tiny text-slate-400 dark:text-slate-500 font-normal">exam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{midtermScore}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Điểm giữa kỳ / bài tập lớn / thực hành (0 - 10)"
                  >
                    <span>Giữa kỳ</span>
                    <span className="text-type-tiny text-slate-400 dark:text-slate-500 font-normal">mid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{attendanceScore}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Điểm chuyên cần / thái độ học tập (0 - 10)"
                  >
                    <span>Chuyên cần</span>
                    <span className="text-type-tiny text-slate-400 dark:text-slate-500 font-normal">att</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{practiceScore}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Điểm thực hành / thí nghiệm"
                  >
                    <span>Thực hành</span>
                    <span className="text-type-tiny text-slate-400 dark:text-slate-500 font-normal">prac</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{violationCount}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Số lần vi phạm quy chế"
                  >
                    <span>Vi phạm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{submitted}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Số bài thi đã nộp"
                  >
                    <span>Đã nộp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{assigned}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Tổng số sinh viên được gán"
                  >
                    <span>Tổng SV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('{absent}')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-type-helper font-medium inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Số sinh viên vắng thi"
                  >
                    <span>Vắng thi</span>
                  </button>
                </div>
              </div>

              {/* ── HÀM TÍNH TOÁN / QUY ĐỔI ── */}
              <div className="space-y-2">
                <span className="block text-type-body-sm font-semibold text-slate-800 dark:text-slate-200">
                  HÀM TÍNH TOÁN / QUY ĐỔI
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertAtCursor('ROUND(, 2)')}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-type-helper font-semibold inline-flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Làm tròn số ROUND(số, chữ_số_thập_phân)"
                  >
                    ROUND()
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('IF(, "", "")')}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-type-helper font-semibold inline-flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Hàm điều kiện IF(điều_kiện, đúng, sai)"
                  >
                    IF()
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('GRADE4()')}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-type-helper font-semibold inline-flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Quy đổi sang thang điểm 4.0"
                  >
                    GRADE4()
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('LETTER_GRADE()')}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-type-helper font-semibold inline-flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Quy đổi sang điểm chữ (A, B+, B, C, D, F)"
                  >
                    LETTER_GRADE()
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('CLASSIFICATION()')}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-type-helper font-semibold inline-flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Xếp loại học lực 5 mức chuẩn Bộ GD&ĐT"
                  >
                    CLASSIFICATION()
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ĐƯỜNG KẺ NGANG & DÒNG TRẠNG THÁI / KẾT QUẢ THỬ NGHIỆM CHO CÁC MẪU CỐ ĐỊNH ── */}
          {ruleType !== 'CUSTOM' && (
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
          )}
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
