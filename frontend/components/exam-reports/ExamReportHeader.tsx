'use client';

import React from 'react';
import { DataActionsDropdown } from '../ui';

interface ExamReportHeaderProps {
  onExport?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

export function ExamReportHeader({
  onExport,
  onExportExcel,
  onPrint,
}: ExamReportHeaderProps) {
  const handleExport = onExportExcel || onExport;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Báo cáo thống kê
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Xem kết quả điểm thi chi tiết, tỷ lệ đạt, thống kê vi phạm và xuất báo cáo ca thi
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {(handleExport || onPrint) && (
          <DataActionsDropdown
            onExport={handleExport}
            onPrint={onPrint}
          />
        )}
      </div>
    </div>
  );
}
