'use client';

import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
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
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[36px] text-[#0F172A] tracking-tight">
          Báo cáo Điểm thi & Tổng kết Ca thi
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
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
            leftIcon={<FileSpreadsheet className="h-4 w-4 text-[#15803D]" />}
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
            leftIcon={<Printer className="h-4 w-4 text-[#64748B]" />}
          >
            In Báo cáo Tổng kết
          </Button>
        )}
      </div>
    </div>
  );
}
