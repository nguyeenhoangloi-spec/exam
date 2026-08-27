'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface SubjectTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function SubjectTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    code: true,
    name: true,
    credits: true,
    department: true,
  },
  onColumnToggle,
}: SubjectTableToolbarProps) {
  const columnsList = [
    { key: 'code', label: 'Mã môn học' },
    { key: 'name', label: 'Tên môn học' },
    { key: 'credits', label: 'Số Tín chỉ' },
    { key: 'department', label: 'Khoa đào tạo' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2">
        <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
          Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString('vi-VN')}</span> môn học
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort */}
        <SortDropdown
          value={sortOrder}
          onChange={(val) => onSortChange?.(val)}
          options={[
            { value: 'newest', label: 'Mới nhất' },
            { value: 'oldest', label: 'Cũ nhất' },
            { value: 'name_asc', label: 'Tên môn: A - Z' },
            { value: 'credits_desc', label: 'Tín chỉ: Nhiều nhất' },
          ]}
        />

        {/* Column Selector */}
        <ColumnToggleDropdown
          columns={columnsList}
          visibleColumns={visibleColumns}
          onToggle={(key) => onColumnToggle?.(key)}
        />
      </div>
    </div>
  );
}