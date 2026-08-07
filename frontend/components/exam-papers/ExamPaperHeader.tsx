'use client';

import React from 'react';
import { Download, Sparkles, Printer } from 'lucide-react';

interface ExamPaperHeaderProps {
  onExportAll?: () => void;
  onPrintAll?: () => void;
  isAdmin?: boolean;
}

export function ExamPaperHeader({
  onExportAll,
  onPrintAll,
  isAdmin = true,
}: ExamPaperHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Quản lý Đề thi & Ma trận đề</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-blue-600 border border-blue-200">
            Tự động sinh đề
          </span>
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Sinh đề thi ngẫu nhiên theo ma trận độ khó, phát hành, đảo đề thi và lưu trữ đề thi theo quy chuẩn
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onExportAll && (
          <button
            type="button"
            onClick={onExportAll}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Xuất báo cáo</span>
          </button>
        )}

        {onPrintAll && (
          <button
            type="button"
            onClick={onPrintAll}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>In danh sách đề</span>
          </button>
        )}
      </div>
    </div>
  );
}
