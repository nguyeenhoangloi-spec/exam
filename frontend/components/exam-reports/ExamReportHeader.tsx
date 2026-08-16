'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

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

      <div className="flex flex-wrap items-center gap-2.5">
        {handleExport && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4 text-slate-500" />}
          >
            Xuất Excel
          </Button>
        )}

        {onPrint && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onPrint}
            leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
          >
            In Báo cáo Tổng kết
          </Button>
        )}
      </div>
    </div>
  );
}
