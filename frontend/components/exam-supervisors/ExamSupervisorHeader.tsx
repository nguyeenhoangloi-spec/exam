'use client';

import React from 'react';
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-900 dark:text-slate-100 leading-[36px] tracking-tight">
          Quản lý & Phân công Giám thị
        </h1>
        <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi trạng thái xác nhận, phê duyệt yêu cầu đổi ca và phân công cán bộ coi thi
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onExport}
        >
          Xuất Excel
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onPrint}
        >
          In Báo Cáo
        </Button>
      </div>
    </div>
  );
}
