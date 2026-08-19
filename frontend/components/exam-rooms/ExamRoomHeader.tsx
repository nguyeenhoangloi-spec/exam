'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface ExamRoomHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ExamRoomHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ExamRoomHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Quản lý phòng thi
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Quản lý danh mục phòng thi, sức chứa và phân loại phòng máy tính / lý thuyết
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
            Tạo phòng thi
          </Button>
        )}
      </div>
    </div>
  );
}
