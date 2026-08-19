'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface TeacherHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function TeacherHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: TeacherHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
          Quản lý giảng viên
        </h1>
        <p className="text-type-body font-normal leading-[24px] text-slate-500 dark:text-slate-400">
          Quản lý danh mục cán bộ giảng dạy, học vị, khoa trực thuộc và phân công coi thi
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
            Thêm giảng viên
          </Button>
        )}
      </div>
    </div>
  );
}
