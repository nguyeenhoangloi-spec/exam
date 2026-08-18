'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface ExamPeriodHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ExamPeriodHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ExamPeriodHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Quản lý kỳ thi
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Quản lý các đợt thi, thời gian tổ chức, học kỳ và năm học trong hệ thống
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {(onExport || onPrint) && (
          <DataActionsDropdown
            onExport={onExport}
            onPrint={onPrint}
          />
        )}

        {isAdmin && onAdd && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAdd}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tạo kỳ thi
          </Button>
        )}
      </div>
    </div>
  );
}
