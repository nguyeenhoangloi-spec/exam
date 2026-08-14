'use client';

import React from 'react';
import { Users, DoorOpen, Clock, Trash2, Download, X } from 'lucide-react';

interface ExamScheduleBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onAssignSupervisors?: () => void;
  onChangeRoom?: () => void;
  onChangeShift?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onClear: () => void;
}

export function ExamScheduleBulkAction({
  selectedCount,
  onToggleAll,
  onAssignSupervisors,
  onChangeRoom,
  onChangeShift,
  onDelete,
  onExport,
  onClear,
}: ExamScheduleBulkActionProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-2.5 px-4 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-semibold text-xs">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold">Đã chọn</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold">
        {onAssignSupervisors && (
          <button
            type="button"
            onClick={onAssignSupervisors}
            className="h-10 flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 hover:bg-slate-700 transition cursor-pointer text-blue-300 active:scale-95"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Phân công giám thị</span>
          </button>
        )}

        {onChangeRoom && (
          <button
            type="button"
            onClick={onChangeRoom}
            className="h-10 flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 hover:bg-slate-700 transition cursor-pointer text-blue-300 active:scale-95"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Đổi phòng</span>
          </button>
        )}

        {onChangeShift && (
          <button
            type="button"
            onClick={onChangeShift}
            className="h-10 flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 hover:bg-slate-700 transition cursor-pointer text-blue-300 active:scale-95"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Đổi ca</span>
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="h-10 flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 hover:bg-slate-700 transition cursor-pointer text-slate-200 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất danh sách</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="h-10 flex items-center gap-1.5 rounded-xl bg-rose-600/30 text-rose-300 px-3.5 hover:bg-rose-600/50 transition cursor-pointer active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>Xóa</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        title="Bỏ chọn tất cả"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
