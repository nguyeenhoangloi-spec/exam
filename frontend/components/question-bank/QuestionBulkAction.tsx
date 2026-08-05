'use client';

import React from 'react';
import { CheckCircle2, XCircle, Archive, Trash2, RotateCcw, CheckSquare, X, Send } from 'lucide-react';

interface QuestionBulkActionProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canRestore?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
  onToggleAll: () => void;
  onAction: (action: string) => void;
  onClear: () => void;
}

export function QuestionBulkAction({
  totalCount,
  selectedCount,
  allSelected,
  canSubmit = false,
  canApprove = false,
  canReject = false,
  canRestore = false,
  canArchive = false,
  canDelete = false,
  onToggleAll,
  onAction,
  onClear,
}: QuestionBulkActionProps) {
  // Only display the floating bottom bar when at least 1 item is checked
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-white/95 border border-slate-200/90 shadow-2xl rounded-2xl p-2.5 px-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-300">
      {/* Left side counter & clear buttons */}
      <div className="flex items-center gap-2 border-r border-slate-200/80 pr-3">
        <span className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 font-bold text-blue-600">
          <CheckSquare className="h-4 w-4" />
          <span>Đã chọn {selectedCount} / {totalCount}</span>
        </span>

        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
        >
          {allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
        </button>

        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition flex items-center gap-1"
        >
          <X className="h-3.5 w-3.5" /> Hủy chọn
        </button>
      </div>

      {/* Right side bulk action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mr-1 hidden sm:inline">
          Thao tác:
        </span>

        {canSubmit && (
          <button
            type="button"
            onClick={() => onAction('SUBMIT')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <Send className="h-3.5 w-3.5" /> Gửi duyệt ({selectedCount})
          </button>
        )}

        {canApprove && (
          <button
            type="button"
            onClick={() => onAction('APPROVE')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt ({selectedCount})
          </button>
        )}

        {canRestore && (
          <button
            type="button"
            onClick={() => onAction('RESTORE')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Khôi phục ({selectedCount})
          </button>
        )}

        {canReject && (
          <button
            type="button"
            onClick={() => onAction('REJECT')}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <XCircle className="h-3.5 w-3.5" /> Từ chối ({selectedCount})
          </button>
        )}

        {canArchive && (
          <button
            type="button"
            onClick={() => onAction('ARCHIVE')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 font-semibold transition"
          >
            <Archive className="h-3.5 w-3.5 text-blue-600" /> Lưu trữ
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => onAction('DELETE')}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 font-bold shadow-2xs transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xóa ({selectedCount})
          </button>
        )}
      </div>
    </div>
  );
}
