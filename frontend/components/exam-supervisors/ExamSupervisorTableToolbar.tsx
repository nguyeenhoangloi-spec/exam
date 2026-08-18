'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';
import { ViewModeSegmentedControl } from '../ui/ViewModeSegmentedControl';

interface ExamSupervisorTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (val: string) => void;
  viewMode?: 'list' | 'grid' | 'compact';
  onViewModeChange?: (mode: 'list' | 'grid' | 'compact') => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (key: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ExamSupervisorTableToolbar({
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    code: true,
    name: true,
    room: true,
    role: true,
    status: true,
    note: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: ExamSupervisorTableToolbarProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    if (!onRefresh) return;
    setIsSpinning(true);
    try {
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSpinning(false), 600);
    }
  };

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
          { value: 'name_asc', label: 'Tên cán bộ A - Z' },
          { value: 'name_desc', label: 'Tên cán bộ Z - A' },
          { value: 'room_asc', label: 'Phòng thi' },
        ]}
      />

      {/* 2. Column Selector */}
      <ColumnToggleDropdown
        columns={columnsList}
        visibleColumns={visibleColumns}
        onToggle={(key) => onColumnToggle?.(key)}
      />

      {/* 3. View Mode Segmented Control */}
      <ViewModeSegmentedControl
        viewMode={viewMode}
        onChange={(mode) => onViewModeChange?.(mode)}
      />

      {/* 4. Refresh Button (Borderless Hover) */}
      <button
        type="button"
        onClick={handleRefreshClick}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
        title="Làm mới dữ liệu"
      >
        <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
      </button>
    </div>
  );
}
