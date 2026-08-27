'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface TeacherTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function TeacherTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    teacherCode: true,
    fullName: true,
    degree: true,
    department: true,
    email: true,
    phone: true,
  },
  onColumnToggle,
}: TeacherTableToolbarProps) {
  const columnsList = [
    { key: 'teacherCode', label: 'Mã giảng viên' },
    { key: 'fullName', label: 'Họ và tên' },
    { key: 'degree', label: 'Học vị' },
    { key: 'department', label: 'Khoa trực thuộc' },
    { key: 'email', label: 'Email công vụ' },
    { key: 'phone', label: 'Số điện thoại' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2">
        <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
          Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString('vi-VN')}</span> giảng viên
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
            { value: 'name_asc', label: 'Tên giảng viên: A - Z' },
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