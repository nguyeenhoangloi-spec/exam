'use client';

import React from 'react';
import { Download, Plus, Printer, FileSpreadsheet } from 'lucide-react';

interface StudentHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onImport?: () => void;
  isAdmin?: boolean;
}

export function StudentHeader({
  onAdd,
  onExport,
  onPrint,
  onImport,
  isAdmin = true,
}: StudentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Quản lý Sinh viên
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Quản lý danh sách sinh viên chính quy, phân lớp và điều kiện dự thi
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Xuất Excel</span>
        </button>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>In Báo cáo</span>
          </button>
        )}

        {isAdmin && onImport && (
          <button
            type="button"
            onClick={onImport}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            <span>Nhập Excel</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Sinh viên</span>
          </button>
        )}
      </div>
    </div>
  );
}
