'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface ClassHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ClassHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ClassHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Quản lý lớp học
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Quản lý danh mục các lớp sinh viên, khoa trực thuộc và số lượng sinh viên theo lớp
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
            Tạo lớp mới
          </Button>
        )}
      </div>
    </div>
  );
}
