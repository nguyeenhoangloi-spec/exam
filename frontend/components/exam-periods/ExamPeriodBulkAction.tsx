'use client';

import React, { useEffect } from 'react';
import { FileSpreadsheet, Printer, Trash2, X } from 'lucide-react';

interface ExamPeriodBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export function ExamPeriodBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExportExcel,
  onPrint,
  onDelete,
  onClear,
}: ExamPeriodBulkActionProps) {
  // Lắng nghe phím Esc để hủy chọn nhanh (Power-User Feature)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCount > 0) {
        onClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, onClear]);

  // Chỉ hiển thị floating bar khi có ít nhất 1 mục được chọn
  if (selectedCount <= 0) return null;

  const progressPercent = Math.min(100, Math.round((selectedCount / Math.max(1, totalCount)) * 100));

  return (
    <div className="fixed bottom-7 left-0 right-0 md:left-[252px] [html.sidebar-collapsed_&]:md:left-[72px] flex justify-center z-50 pointer-events-none px-4 transition-[left] duration-300">
      <div className="pointer-events-auto max-w-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] rounded-2xl p-2 px-4 sm:px-5 backdrop-blur-xl ring-1 ring-slate-900/5 dark:ring-white/10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-300">
        
        {/* Khối bên trái: Số lượng tương tác + Thanh tiến độ mini + Chuyển đổi nhanh */}
        <div className="flex items-center gap-2.5 pr-3.5 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <div className="inline-flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 select-none shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
            </span>
            <span className="font-semibold tabular-nums">
              {selectedCount} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {totalCount}</span>
            </span>

            {/* Thanh tiến độ mini cho biết tỷ lệ đã chọn */}
            <div className="w-9 h-1.5 bg-blue-200/70 dark:bg-blue-900/70 rounded-full overflow-hidden hidden sm:block" title={`Đã chọn ${progressPercent}% danh sách`}>
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleAll}
            className="h-9 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none"
          >
            {allSelected ? 'Bỏ chọn' : 'Tất cả'}
          </button>
        </div>

        {/* Khối bên phải: Chủ đạo Xanh Dương - Trắng + Nút Phẳng (Flat/Ghost) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {/* Xuất Excel: Primary Blue chủ đạo */}
          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="group relative overflow-hidden h-9 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs font-semibold shadow-xs shadow-blue-500/25 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <span className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out pointer-events-none" />
              <FileSpreadsheet className="h-4 w-4" />
              <span>Xuất Excel</span>
            </button>
          )}

          {/* In báo cáo: Nút Phẳng (Flat Ghost) */}
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="h-9 flex items-center gap-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 text-xs font-medium transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>In báo cáo</span>
            </button>
          )}

          {/* Xóa: Nút Phẳng Cảnh Báo Đỏ (Flat Danger) */}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="h-9 flex items-center gap-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3.5 text-xs font-medium transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              <span>Xóa</span>
            </button>
          )}

          {/* Nút đóng / hủy chọn nhanh tách biệt bằng vách ngăn mờ */}
          <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center">
            <button
              type="button"
              onClick={onClear}
              className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Bỏ chọn tất cả (Esc)"
            >
              <X className="h-4 w-4" />
              <kbd className="hidden sm:inline-block text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">Esc</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
