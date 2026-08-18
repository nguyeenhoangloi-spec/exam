'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface StudentHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function StudentHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: StudentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
          Quản lý sinh viên
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Quản lý danh sách sinh viên chính quy, phân lớp và điều kiện dự thi
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
            Thêm sinh viên
          </Button>
        )}
      </div>
    </div>
  );
}
