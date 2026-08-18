'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface DepartmentHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function DepartmentHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: DepartmentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
          Quản lý khoa
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Quản lý danh mục các khoa đào tạo, số lượng môn học và cấu hình khung chương trình đào tạo
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
            Tạo khoa mới
          </Button>
        )}
      </div>
    </div>
  );
}
