'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';

interface ExamReportHeaderProps {
  onExport?: () => void;
  onPrint?: () => void;
}

export function ExamReportHeader({
  onExport,
  onPrint,
}: ExamReportHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[36px] text-[#0F172A] tracking-tight">
          Báo cáo Điểm thi & Tổng kết Ca thi
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
          Xem kết quả điểm thi chi tiết, tỷ lệ đạt, thống kê vi phạm và xuất báo cáo ca thi
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[15px] font-medium text-[#334155] shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#64748B]" />
          <span>Xuất File CSV</span>
        </button>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 text-[15px] font-medium shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>In Báo cáo Tổng kết</span>
          </button>
        )}
      </div>
    </div>
  );
}
