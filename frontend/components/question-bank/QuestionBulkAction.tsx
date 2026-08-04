'use client';

import React from 'react';
import { CheckCircle2, XCircle, Archive, Trash2, RotateCcw, CheckSquare, X } from 'lucide-react';

interface QuestionBulkActionProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onAction: (action: string) => void;
  onClear: () => void;
}

export function QuestionBulkAction({
  totalCount,
  selectedCount,
  allSelected,
  onToggleAll,
  onAction,
  onClear,
}: QuestionBulkActionProps) {
  if (totalCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 p-3.5 shadow-sm text-xs font-semibold animate-in fade-in duration-200">
      {/* Selection Controls: Select All / Cancel All Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleAll}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 font-bold shadow-2xs transition ${
            allSelected
              ? 'bg-sky-600 border-sky-600 text-white hover:bg-sky-700'
              : 'bg-white border-sky-300 text-sky-800 hover:bg-sky-100'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          {allSelected ? 'Đang chọn tất cả' : `Chọn tất cả (${totalCount} câu)`}
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition"
          >
            <X className="h-4 w-4 text-slate-500" />
            Hủy chọn tất cả
          </button>
        )}

        {selectedCount > 0 && (
          <span className="text-sky-800 font-extrabold bg-sky-100 border border-sky-300 px-3 py-1.5 rounded-xl text-xs">
            Đã chọn {selectedCount} / {totalCount}
          </span>
        )}
      </div>

      {/* Action Buttons for Selected Items */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 text-[11px] font-bold">Thao tác hàng loạt:</span>

          <button
            type="button"
            onClick={() => onAction('APPROVE')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt hàng loạt
          </button>

          <button
            type="button"
            onClick={() => onAction('RESTORE')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Khôi phục hàng loạt
          </button>

          <button
            type="button"
            onClick={() => onAction('REJECT')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <XCircle className="h-3.5 w-3.5" /> Từ chối hàng loạt
          </button>

          <button
            type="button"
            onClick={() => onAction('ARCHIVE')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <Archive className="h-3.5 w-3.5" /> Lưu trữ
          </button>

          <button
            type="button"
            onClick={() => onAction('DELETE')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xóa đã chọn
          </button>
        </div>
      )}
    </div>
  );
}
