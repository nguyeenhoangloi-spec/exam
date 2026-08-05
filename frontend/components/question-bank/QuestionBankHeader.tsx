'use client';

import React from 'react';
import { Upload, Plus, Sparkles, Printer } from 'lucide-react';

interface QuestionBankHeaderProps {
  onAdd: () => void;
  onImport: () => void;
  onAi?: () => void;
  onPrint?: () => void;
}

export function QuestionBankHeader({
  onAdd,
  onImport,
  onAi,
  onPrint,
}: QuestionBankHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between pb-1">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Ngân hàng câu hỏi</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Quản lý, tạo mới và tổ chức hệ thống câu hỏi cho kỳ thi
        </p>
      </div>

      {/* Right Action Buttons matching Mockup Image */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {onAi && (
          <button
            type="button"
            onClick={onAi}
            className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-2xs transition hover:bg-purple-100 active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Tạo bằng AI</span>
          </button>
        )}

        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
        >
          <Upload className="h-4 w-4 text-slate-600" />
          <span>Nhập câu hỏi</span>
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm câu hỏi</span>
        </button>
      </div>
    </div>
  );
}
