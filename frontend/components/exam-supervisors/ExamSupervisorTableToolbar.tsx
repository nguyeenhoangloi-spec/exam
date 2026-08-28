'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface ExamSupervisorTableToolbarProps {
  totalCount?: number;
  sortOrder?: string;
  onSortChange?: (val: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (key: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ExamSupervisorTableToolbar({
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    code: true,
    name: true,
    room: true,
    role: true,
    status: true,
    note: true,
  },
  onColumnToggle,
}: ExamSupervisorTableToolbarProps) {
  const columnsList = [
    { key: 'code', label: 'Mã cán bộ' },
    { key: 'name', label: 'Họ và tên cán bộ' },
    { key: 'room', label: 'Phòng thi phân công' },
    { key: 'role', label: 'Vai trò nhiệm vụ' },
    { key: 'status', label: 'Trạng thái xác nhận' },
    { key: 'note', label: 'Ghi chú phân công' },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* 1. Sort Dropdown */}
      <SortDropdown
        value={sortOrder}
        onChange={(val) => onSortChange?.(val)}
        options={[
          { value: 'newest', label: 'Mới nhất' },
          { value: 'oldest', label: 'Cũ nhất' },
          { value: 'name_asc', label: 'Tên cán bộ: A – Z' },
          { value: 'name_desc', label: 'Tên cán bộ: Z – A' },
          { value: 'room_asc', label: 'Phòng thi' },
        ]}
      />

      {/* 2. Column Selector */}
      <ColumnToggleDropdown
        columns={columnsList}
        visibleColumns={visibleColumns}
        onToggle={(key) => onColumnToggle?.(key)}
      />
    </div>
  );
}
