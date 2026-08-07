'use client';

import React from 'react';
import { Upload, Plus } from 'lucide-react';

interface QuestionBankHeaderProps {
  onAdd: () => void;
  onImport: () => void;
  onAi?: () => void;
  onPrint?: () => void;
}

export function QuestionBankHeader({
  onAdd,
  onImport,
}: QuestionBankHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Ngân hàng câu hỏi
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Quản lý, tạo mới và tổ chức hệ thống câu hỏi cho kỳ thi
        </p>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold leading-none transition active:scale-95 cursor-pointer whitespace-nowrap select-none border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
        >
          <Upload className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          <span>Nhập dữ liệu</span>
        </button>

        {/* Primary Action: Thêm câu hỏi mới */}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black leading-none transition active:scale-95 cursor-pointer whitespace-nowrap select-none border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span>Thêm câu hỏi mới</span>
        </button>
      </div>
    </div>
  );
}
