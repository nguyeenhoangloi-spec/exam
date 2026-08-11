'use client';

import React from 'react';
import { Download, Plus, Upload, Printer } from 'lucide-react';

interface QuestionToolbarProps {
  onAdd: () => void;
  onImport: () => void;
  onAi?: () => void;
  onExport: () => void;
  onPrint?: () => void;
}

export function QuestionToolbar({ onAdd, onImport, onExport, onPrint }: QuestionToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold px-3.5 py-2 text-xs text-white shadow-xs transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          In Báo cáo
        </button>
      )}
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
      >
        <Download className="h-4 w-4 text-blue-600" />
        Xuất CSV
      </button>

      <button
        type="button"
        onClick={onImport}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
      >
        <Upload className="h-4 w-4 text-slate-600" />
        Nhập dữ liệu
      </button>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Thêm câu hỏi
      </button>
    </div>
  );
}
