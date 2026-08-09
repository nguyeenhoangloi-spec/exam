'use client';

import React from 'react';
import { Download, Plus, Printer } from 'lucide-react';

interface ExamPeriodHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ExamPeriodHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ExamPeriodHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[36px] text-[#0F172A] tracking-tight">
          Quản lý Kỳ thi
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
          Quản lý các kỳ thi, thời gian tổ chức, học kỳ và năm học trong hệ thống
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[15px] font-medium text-[#334155] shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#64748B]" />
          <span>Xuất Excel</span>
        </button>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[15px] font-medium text-[#334155] shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-[#64748B]" />
            <span>In Báo cáo</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 text-[15px] font-medium shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo kỳ thi</span>
          </button>
        )}
      </div>
    </div>
  );
}
