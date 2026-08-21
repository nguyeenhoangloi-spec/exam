'use client';

import React from 'react';
import { DataActionsDropdown } from '../ui';

interface ExamReportHeaderProps {
  title?: string;
  subtitle?: string;
  onExport?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

export function ExamReportHeader({
  title = 'Báo cáo & Thống kê',
  subtitle = 'Xem số liệu thống kê tổng hợp toàn trường, phân tích phổ điểm và bảng điểm chi tiết ca thi',
  onExport,
  onExportExcel,
  onPrint,
}: ExamReportHeaderProps) {
  const handleExport = onExportExcel || onExport;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          {subtitle}
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
