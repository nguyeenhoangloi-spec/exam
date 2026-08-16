'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExamSupervisorHeaderProps {
  onExport: () => void;
  onPrint: () => void;
}

export function ExamSupervisorHeader({
  onExport,
  onPrint,
}: ExamSupervisorHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Description */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-[28px] font-semibold leading-tight sm:leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Phân công coi thi
        </h1>
        <p className="text-sm sm:text-[15px] font-normal leading-relaxed text-slate-500 dark:text-slate-400">
          Theo dõi trạng thái xác nhận, phê duyệt yêu cầu đổi ca và phân công cán bộ coi thi
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onExport}
          leftIcon={<Download className="h-4 w-4 text-slate-500" />}
        >
          Xuất Excel
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onPrint}
          leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
        >
          In báo cáo
        </Button>
      </div>
    </div>
  );
}
