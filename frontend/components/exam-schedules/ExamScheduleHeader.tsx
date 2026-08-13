'use client';

import React from 'react';
import { Download, Plus, Printer, FileSpreadsheet } from 'lucide-react';

import { Button } from '../ui';

interface ExamScheduleHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ExamScheduleHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ExamScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Description */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 tracking-tight">
          Xếp lịch thi
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-slate-500">
          Tạo, quản lý và theo dõi lịch thi của các kỳ thi trong hệ thống
        </p>
      </div>

      {/* Action Buttons: 1 Primary Blue + Secondary Buttons */}
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

        {onPrint && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onPrint}
            leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
          >
            In Báo cáo
          </Button>
        )}

        {isAdmin && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAdd}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tạo lịch thi
          </Button>
        )}
      </div>
    </div>
  );
}
