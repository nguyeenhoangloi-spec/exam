'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface ExamRoomTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ExamRoomTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    roomCode: true,
    building: true,
    capacity: true,
    computerCount: true,
    status: true,
  },
  onColumnToggle,
}: ExamRoomTableToolbarProps) {
  const columnsList = [
    { key: 'roomCode', label: 'Tên / Mã phòng thi' },
    { key: 'building', label: 'Tòa nhà / Địa điểm' },
    { key: 'capacity', label: 'Sức chứa Thí sinh' },
    { key: 'computerCount', label: 'Số máy tính khả dụng' },
    { key: 'status', label: 'Trạng thái hoạt động' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2">
        <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
          Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString('vi-VN')}</span> phòng thi
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
            { value: 'name_asc', label: 'Mã phòng: A - Z' },
            { value: 'capacity_desc', label: 'Sức chứa: Cao nhất' },
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
