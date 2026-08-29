'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import {
  STANDARD_REPORT_VARIABLES,
  FORMULA_FUNCTIONS_HELP,
  validateFormula,
  FormulaVariable,
} from '../../lib/formula-engine';
import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  HelpCircle,
  Hash,
  Type,
  Layers,
} from 'lucide-react';

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
  customVariables?: FormulaVariable[];
}

interface QuickPreset {
  title: string;
  badge: string;
  headerName: string;
  formula: string;
  align: 'left' | 'center' | 'right';
  description: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    title: 'Xếp loại Đạt / Không đạt',
    badge: 'Phổ biến nhất',
    headerName: 'Kết quả',
    formula: 'IF({totalScore} >= 5, "ĐẠT", "KHÔNG ĐẠT")',
    align: 'center',
    description: 'Từ 5.0 trở lên là ĐẠT, dưới 5.0 là KHÔNG ĐẠT',
  },
  {
    title: 'Xếp loại Học lực (Xuất sắc – Giỏi – Khá...)',
    badge: 'Chuẩn Bộ GD',
    headerName: 'Xếp loại',
    formula: 'CLASSIFICATION({totalScore})',
    align: 'center',
    description: 'Tự động phân loại: Xuất sắc (>=9), Giỏi (>=8), Khá (>=6.5), TB (>=5), Yếu (<5)',
  },
  {
    title: 'Quy đổi Điểm Chữ (A, B, C, D, F)',
    badge: 'Hệ tín chỉ',
    headerName: 'Điểm chữ',
    formula: 'LETTER_GRADE({totalScore})',
    align: 'center',
    description: 'Chuyển điểm thang 10 sang A, B+, B, C+, C, D+, D, F',
  },
  {
    title: 'Quy đổi Thang điểm 4.0',
    badge: 'Thang 4',
    headerName: 'Điểm hệ 4',
    formula: 'GRADE4({totalScore})',
    align: 'center',
    description: 'Quy đổi tương ứng: 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.0',
  },
  {
    title: 'Điểm tổng kết hệ số (Thi 70% + Cộng 30%)',
    badge: 'Trọng số',
    headerName: 'Điểm tổng kết',
    formula: 'ROUND({totalScore} * 0.7 + {bonusScore} * 0.3, 2)',
    align: 'center',
    description: 'Nhân hệ số điểm thi 70% và điểm chuyên cần 30%, làm tròn 2 chữ số',
  },
  {
    title: 'Tỷ lệ sinh viên nộp bài (%)',
    badge: 'Thống kê ca',
    headerName: 'Tỷ lệ nộp bài',
    formula: 'ROUND(({submitted} / {assigned}) * 100, 1)',
    align: 'center',
    description: 'Tính phần trăm số bài nộp trên tổng số sinh viên được gán',
  },
];

const QUICK_OPERATORS = [
  { label: '+', insert: ' + ', tip: 'Cộng' },
  { label: '-', insert: ' - ', tip: 'Trừ' },
  { label: '×', insert: ' * ', tip: 'Nhân' },
  { label: '÷', insert: ' / ', tip: 'Chia' },
  { label: '(', insert: '(', tip: 'Mở ngoặc' },
  { label: ')', insert: ')', tip: 'Đóng ngoặc' },
  { label: '≥', insert: ' >= ', tip: 'Lớn hơn hoặc bằng' },
  { label: '≤', insert: ' <= ', tip: 'Nhỏ hơn hoặc bằng' },
  { label: '==', insert: ' == ', tip: 'Bằng' },
  { label: 'IF', insert: 'IF(điều_kiện, đúng, sai)', tip: 'Hàm điều kiện IF' },
  { label: 'ROUND', insert: 'ROUND(giá_trị, 2)', tip: 'Làm tròn thập phân' },
];

export function FormulaEditorModal({
  isOpen,
  onClose,
  onSave,
  initialColumn,
  customVariables = [],
}: FormulaEditorModalProps) {
  const [header, setHeader] = useState('');
  const [formula, setFormula] = useState('');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [decimals, setDecimals] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'presets' | 'variables' | 'functions'>('presets');
  const [varFilter, setVarFilter] = useState<'ALL' | 'NUMBER' | 'STRING'>('ALL');

  // Khử trùng lặp danh sách biến
  const uniqueVariables = useMemo(() => {
    const map = new Map<string, FormulaVariable>();

    // Nạp custom variables trước (ưu tiên nhãn thực tế của báo cáo hiện hành)
    customVariables.forEach((v) => {
      if (v.key) {
        map.set(v.key, {
          key: v.key,
          label: v.label,
          type: v.type || 'number',
          sampleValue: v.sampleValue ?? 8.5,
        });
      }
    });

    // Nạp thêm biến chuẩn nếu chưa có
    STANDARD_REPORT_VARIABLES.forEach((v) => {
      if (!map.has(v.key)) {
        map.set(v.key, v);
      }
    });

    return Array.from(map.values());
  }, [customVariables]);

  const filteredVariables = useMemo(() => {
    if (varFilter === 'NUMBER') return uniqueVariables.filter((v) => v.type === 'number');
    if (varFilter === 'STRING') return uniqueVariables.filter((v) => v.type === 'string');
    return uniqueVariables;
  }, [uniqueVariables, varFilter]);

  useEffect(() => {
    if (initialColumn) {
      setHeader(initialColumn.header || '');
      setFormula(initialColumn.formula || '');
      setAlign(initialColumn.align || 'center');
      setDecimals(initialColumn.decimals !== undefined ? initialColumn.decimals : 2);
      setActiveTab('variables');
    } else {
      setHeader('');
      setFormula('');
      setAlign('center');
      setDecimals(2);
      setActiveTab('presets');
    }
  }, [initialColumn, isOpen]);

  // Real-time validation & live sample evaluation
  const validation = useMemo(() => {
    if (!formula.trim()) return { valid: false, error: 'Vui lòng nhập công thức tính toán hoặc chọn mẫu có sẵn bên dưới' };
    return validateFormula(formula);
  }, [formula]);

  const applyPreset = (preset: QuickPreset) => {
    setHeader(preset.headerName);
    setFormula(preset.formula);
    setAlign(preset.align);
  };

  const insertSnippet = (snippet: string) => {
    setFormula((prev) => {
      if (!prev) return snippet.trim();
      return `${prev}${snippet}`;
    });
  };

  const insertVariable = (varKey: string) => {
    insertSnippet(`{${varKey}}`);
  };

  const handleSave = () => {
    if (!header.trim()) return;
    if (!validation.valid) return;

    const id = initialColumn?.id || `calc_${Date.now()}`;
    const col: DynamicColumnDefinition = {
      id,
      key: id,
      header: header.trim(),
      type: 'FORMULA',
      formula: formula.trim(),
      align,
      decimals,
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
      title={initialColumn ? 'Chỉnh sửa cột công thức tính toán' : 'Tạo mới cột công thức tính toán'}
      subtitle="Tự động tính toán, xếp loại học lực hoặc quy đổi điểm số trực tiếp vào bảng báo cáo"
      size="2xl"
    >
      <div className="space-y-4 py-1">
        {/* ── 1. Tên tiêu đề & Canh lề ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-type-label font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>
                Tên tiêu đề cột <span className="text-rose-500">*</span>
              </span>
              <span className="text-type-helper text-slate-400 font-normal">Hiển thị trên đầu bảng</span>
            </label>
            <input
              type="text"
              placeholder="VD: Kết quả, Xếp loại, Điểm chữ, Điểm hệ 4..."
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-type-label font-medium text-slate-900 dark:text-slate-100">
              Căn lề hiển thị
            </label>
            <div className="flex h-10 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-0.5">
              <button
                type="button"
                onClick={() => setAlign('left')}
                className={`flex-1 py-1 text-type-body-sm rounded-lg transition cursor-pointer ${
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
                className={`flex-1 py-1 text-type-body-sm rounded-lg transition cursor-pointer ${
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
                className={`flex-1 py-1 text-type-body-sm rounded-lg transition cursor-pointer ${
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

        {/* ── 2. Biểu thức công thức & Thanh toán tử nhanh ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-type-label font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>
                Biểu thức công thức <span className="text-rose-500">*</span>
              </span>
            </label>
            <span className="text-type-helper text-slate-400 font-normal">
              Biến đặt trong dấu <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded font-mono text-xs">{'{tên_biến}'}</code>
            </span>
          </div>

          <textarea
            rows={3}
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder='Chọn mẫu có sẵn bên dưới hoặc tự nhập ví dụ: IF({totalScore} >= 5, "ĐẠT", "KHÔNG ĐẠT")'
            className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 font-mono text-type-body text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-sans focus:border-blue-500 focus:outline-none transition shadow-2xs leading-relaxed"
          />

          {/* Thanh toán tử bấm nhanh (Quick Operators) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-type-helper text-slate-400 font-medium mr-1 select-none">Chèn nhanh:</span>
            {QUICK_OPERATORS.map((op) => (
              <button
                key={op.label}
                type="button"
                onClick={() => insertSnippet(op.insert)}
                title={op.tip}
                className="h-7 px-2 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-type-body-sm font-mono font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 hover:border-blue-300 transition shadow-2xs cursor-pointer select-none"
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* Hộp xem trước kết quả thời gian thực (Live Preview & Test Run) */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-type-body-sm transition ${
              validation.valid
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                : formula.trim()
                ? 'bg-rose-50/50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {validation.valid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : formula.trim() ? (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              ) : (
                <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <span className="truncate">
                {validation.valid
                  ? 'Công thức hợp lệ và sẵn sàng tính toán'
                  : validation.error || 'Vui lòng nhập công thức'}
              </span>
            </div>

            {validation.valid && (
              <div className="flex items-center gap-1.5 shrink-0 text-type-helper">
                <span className="text-slate-500 dark:text-slate-400">Kết quả tính thử:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-mono">
                  {String(validation.sampleResult ?? '—')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Khu vực Hỗ trợ Công thức: Mẫu 1-Click / Danh sách Biến / Danh sách Hàm ── */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Header TabBar phẳng */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-type-body-sm font-medium transition cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Mẫu công thức 1-Click</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('variables')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-type-body-sm font-medium transition cursor-pointer ${
                  activeTab === 'variables'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>Trường dữ liệu ({uniqueVariables.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('functions')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-type-body-sm font-medium transition cursor-pointer ${
                  activeTab === 'functions'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                <span>Hàm nâng cao ({FORMULA_FUNCTIONS_HELP.length})</span>
              </button>
            </div>

            <span className="text-type-helper text-slate-400 hidden sm:inline-block">
              {activeTab === 'presets' ? 'Bấm để tự động điền' : 'Bấm vào để chèn'}
            </span>
          </div>

          {/* TAB 1: MẪU CÔNG THỨC 1-CLICK */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-0.5 custom-scrollbar">
              {QUICK_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/40 transition cursor-pointer shadow-2xs group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        {preset.title}
                      </p>
                      <span className="text-type-helper font-medium px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs shrink-0">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal mt-1 leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="truncate pr-2">{preset.formula}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-sans font-medium shrink-0 group-hover:underline">
                      Áp dụng ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TRƯỜNG DỮ LIỆU ĐÃ KHỬ TRÙNG LẶP */}
          {activeTab === 'variables' && (
            <div className="space-y-2">
              {/* Lọc nhanh theo dạng biến Số vs Ký tự */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setVarFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    varFilter === 'ALL'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({uniqueVariables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVarFilter('NUMBER')}
                  className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                    varFilter === 'NUMBER'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Hash className="h-3 w-3" />
                  <span>Trường Số học ({uniqueVariables.filter((v) => v.type === 'number').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVarFilter('STRING')}
                  className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                    varFilter === 'STRING'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Type className="h-3 w-3" />
                  <span>Trường Thông tin ({uniqueVariables.filter((v) => v.type === 'string').length})</span>
                </button>
              </div>

              {/* Danh sách biến phẳng */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-0.5 custom-scrollbar">
                {filteredVariables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50/40 text-left transition shadow-2xs group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-type-body-sm font-mono font-semibold text-blue-700 dark:text-blue-400 group-hover:text-blue-600 truncate">
                        {`{${v.key}}`}
                      </p>
                      <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {v.label}
                      </p>
                    </div>
                    <span className="text-xs text-slate-300 group-hover:text-blue-500 shrink-0 font-medium">
                      + Chèn
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HÀM TOÁN HỌC & LOGIC NÂNG CAO */}
          {activeTab === 'functions' && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto p-0.5 custom-scrollbar">
              {FORMULA_FUNCTIONS_HELP.map((fn, idx) => (
                <div
                  key={idx}
                  onClick={() => insertSnippet(fn.example)}
                  className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-type-body-sm font-mono font-semibold text-blue-600 dark:text-blue-400 truncate">
                      {fn.example}
                    </p>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400">{fn.description}</p>
                  </div>
                  <span className="text-type-helper px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium group-hover:border-blue-300 group-hover:text-blue-600 shrink-0">
                    Chèn mẫu
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. Footer Actions (Button Hierarchy 2026) ── */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!header.trim() || !validation.valid}
            onClick={handleSave}
          >
            {initialColumn ? 'Cập nhật cột' : 'Thêm vào bảng báo cáo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

