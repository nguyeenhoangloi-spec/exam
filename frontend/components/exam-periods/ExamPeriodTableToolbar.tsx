'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface ExamPeriodTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ExamPeriodTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    title: true,
    academicYear: true,
    semester: true,
    startDate: true,
    endDate: true,
    status: true,
  },
  onColumnToggle,
}: ExamPeriodTableToolbarProps) {
  const columnsList = [
    { key: 'title', label: 'Tên đợt thi' },
    { key: 'academicYear', label: 'Năm học' },
    { key: 'semester', label: 'Học kỳ' },
    { key: 'startDate', label: 'Ngày bắt đầu' },
    { key: 'endDate', label: 'Ngày kết thúc' },
    { key: 'status', label: 'Trạng thái' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-type-helper font-semibold text-slate-600">
        <span className="font-semibold text-slate-900">{totalCount.toLocaleString('vi-VN')}</span> kết quả
      </span>

      <div className="flex items-center gap-2">
        {/* Sort */}
        <SortDropdown
          value={sortOrder}
          onChange={(val) => onSortChange?.(val)}
          options={[
            { value: 'newest', label: 'Mới nhất' },
            { value: 'oldest', label: 'Cũ nhất' },
            { value: 'date_desc', label: 'Ngày bắt đầu: Mới nhất' },
            { value: 'date_asc', label: 'Ngày bắt đầu: Cũ nhất' },
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
