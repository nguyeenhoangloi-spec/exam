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
import { Calculator, CheckCircle2, AlertCircle, CornerDownLeft } from 'lucide-react';

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
  const [activePresetTab, setActivePresetTab] = useState<'vars' | 'functions'>('vars');

  const availableVariables = useMemo(() => {
    return [...STANDARD_REPORT_VARIABLES, ...customVariables];
  }, [customVariables]);

  useEffect(() => {
    if (initialColumn) {
      setHeader(initialColumn.header || '');
      setFormula(initialColumn.formula || '');
      setAlign(initialColumn.align || 'center');
      setDecimals(initialColumn.decimals !== undefined ? initialColumn.decimals : 2);
    } else {
      setHeader('');
      setFormula('');
      setAlign('center');
      setDecimals(2);
    }
  }, [initialColumn, isOpen]);

  // Real-time validation
  const validation = useMemo(() => {
    if (!formula.trim()) return { valid: false, error: 'Vui lòng nhập công thức' };
    return validateFormula(formula);
  }, [formula]);

  const insertVariable = (varKey: string) => {
    const snippet = `{${varKey}}`;
    setFormula((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const insertFunction = (example: string) => {
    setFormula((prev) => (prev ? `${prev} ${example}` : example));
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
      subtitle="Thiết lập công thức toán học, logic xếp loại hoặc quy đổi điểm tự động theo yêu cầu riêng."
      size="xl"
    >
      <div className="space-y-4 py-1">
        {/* Tên hiển thị cột & Canh lề */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-type-label font-medium text-slate-800 dark:text-slate-200">
              Tên tiêu đề cột <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Điểm tổng kết hệ số, Điểm chữ, Điểm thang 4..."
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-type-label font-medium text-slate-800 dark:text-slate-200">
              Căn lề hiển thị
            </label>
            <div className="flex rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 p-0.5">
              <button
                type="button"
                onClick={() => setAlign('left')}
                className={`flex-1 py-1.5 text-type-body-sm font-medium rounded-xl transition ${
                  align === 'left'
                    ? 'bg-white shadow-2xs text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Trái
              </button>
              <button
                type="button"
                onClick={() => setAlign('center')}
                className={`flex-1 py-1.5 text-type-body-sm font-medium rounded-xl transition ${
                  align === 'center'
                    ? 'bg-white shadow-2xs text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giữa
              </button>
              <button
                type="button"
                onClick={() => setAlign('right')}
                className={`flex-1 py-1.5 text-type-body-sm font-medium rounded-xl transition ${
                  align === 'right'
                    ? 'bg-white shadow-2xs text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Phải
              </button>
            </div>
          </div>
        </div>

        {/* Ô nhập công thức */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-type-label font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-600" />
              Biểu thức công thức <span className="text-rose-500">*</span>
            </label>
            <span className="text-type-meta text-slate-400">
              Bọc tên biến trong dấu {'{'}tên_biến{'}'}
            </span>
          </div>

          <textarea
            rows={3}
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder='Ví dụ: ROUND({totalScore} * 0.7 + {bonusScore} * 0.3, 2) hoặc IF({totalScore} >= 5, "ĐẠT", "HỌC LẠI")'
            className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
          />

          {/* Validation & Sample Live Preview box */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-type-body-sm transition ${
              validation.valid
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/60 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            {validation.valid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
                  <span>Cú pháp hợp lệ</span>
                  <div className="flex items-center gap-1.5 text-type-body font-medium text-emerald-900 dark:text-emerald-100 bg-emerald-100/70 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                    <span>Kết quả mẫu:</span>
                    <span className="tabular-nums font-semibold">{String(validation.sampleResult ?? '---')}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{validation.error}</span>
              </>
            )}
          </div>
        </div>

        {/* Tab gợi ý: Danh sách Biến & Danh sách Hàm */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePresetTab('vars')}
                className={`text-type-body-sm pb-1 font-medium transition ${
                  activePresetTab === 'vars'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Trường dữ liệu có sẵn ({availableVariables.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePresetTab('functions')}
                className={`text-type-body-sm pb-1 font-medium transition ${
                  activePresetTab === 'functions'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hàm mẫu & Công thức phổ biến
              </button>
            </div>
            <span className="text-type-helper text-slate-400 hidden sm:inline-block">
              Nhấp vào để chèn nhanh
            </span>
          </div>

          {activePresetTab === 'vars' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
              {availableVariables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:bg-blue-50/40 text-left transition shadow-2xs group"
                >
                  <div className="truncate">
                    <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                      {`{${v.key}}`}
                    </p>
                    <p className="text-type-helper text-slate-500 truncate">{v.label}</p>
                  </div>
                  <CornerDownLeft className="h-3 w-3 text-slate-300 group-hover:text-blue-500 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto p-1 custom-scrollbar">
              {FORMULA_FUNCTIONS_HELP.map((fn, idx) => (
                <div
                  key={idx}
                  onClick={() => insertFunction(fn.example)}
                  className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-0.5 flex-1">
                    <p className="text-type-body-sm font-semibold text-blue-600 dark:text-blue-400">
                      {fn.example}
                    </p>
                    <p className="text-type-helper text-slate-500">{fn.description}</p>
                  </div>
                  <span className="ui-pill text-type-helper px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-600 font-medium group-hover:border-blue-300 group-hover:text-blue-600 shrink-0">
                    Chèn mẫu
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
