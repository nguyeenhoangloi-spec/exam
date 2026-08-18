'use client';

import React from 'react';
import { DataActionsDropdown } from '../ui';

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
      <div className="space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Phân công coi thi
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Theo dõi trạng thái xác nhận, phê duyệt yêu cầu đổi ca và phân công cán bộ coi thi
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <DataActionsDropdown
          onExport={onExport}
          onPrint={onPrint}
        />
      </div>
    </div>
  );
}
