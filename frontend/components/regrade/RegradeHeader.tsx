'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { RefreshCw, Download, Printer } from 'lucide-react';

interface RegradeHeaderProps {
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onPrintReport?: () => void;
  loading?: boolean;
}

export function RegradeHeader({
  onRefresh,
  onExportExcel,
  onPrintReport,
  loading = false,
}: RegradeHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
          Thẩm định phúc khảo
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Tiếp nhận đơn khiếu nại từ sinh viên, thẩm định bài thi và công bố kết quả
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {onExportExcel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onExportExcel}
            leftIcon={<Download className="h-4 w-4 text-slate-500" />}
          >
            Xuất Excel
          </Button>
        )}

        {onPrintReport && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onPrintReport}
            leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
          >
            In báo cáo
          </Button>
        )}
      </div>
    </div>
  );
}
