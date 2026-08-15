'use client';

import React from 'react';
import { Printer, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

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
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Xếp phòng thi tự động
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Tự động phân bổ sinh viên vào phòng máy tính, kiểm tra phòng trống thời gian thực & lưu lịch sử
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onPrintDoorList}
          leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
        >
          In Dán Cửa
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onPrintAttendance}
          leftIcon={<FileText className="h-4 w-4 text-slate-500" />}
        >
          In Báo Cáo
        </Button>
      </div>
    </div>
  );
}
