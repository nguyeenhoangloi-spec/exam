'use client';

import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { DataActionsDropdown } from '../ui';

interface ExamArrangementHeaderProps {
  onPrintDoorList: () => void;
  onPrintAttendance: () => void;
}

export function ExamArrangementHeader({
  onPrintDoorList,
  onPrintAttendance,
}: ExamArrangementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Description */}
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Xếp phòng thi tự động
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Tự động phân bổ sinh viên vào phòng máy tính, kiểm tra phòng trống thời gian thực & lưu lịch sử
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <DataActionsDropdown
          customItems={[
            {
              label: 'In dán cửa',
              icon: <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />,
              onClick: onPrintDoorList,
            },
            {
              label: 'In điểm danh',
              icon: <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />,
              onClick: onPrintAttendance,
            },
          ]}
        />
      </div>
    </div>
  );
}
