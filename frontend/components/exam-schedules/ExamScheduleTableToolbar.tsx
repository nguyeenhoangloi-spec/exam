'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';
import { ViewModeSegmentedControl } from '../ui/ViewModeSegmentedControl';

interface ExamScheduleTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  viewMode?: 'list' | 'grid' | 'compact';
  onViewModeChange?: (mode: 'list' | 'grid' | 'compact') => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ExamScheduleTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    code: true,
    subject: true,
    examPeriod: true,
    paper: true,
    examDate: true,
    shiftTime: true,
    room: true,
    supervisor: true,
    status: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: ExamScheduleTableToolbarProps) {
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
    { key: 'code', label: 'Mã lịch thi' },
    { key: 'subject', label: 'Môn học' },
    { key: 'examPeriod', label: 'Kỳ thi' },
    { key: 'paper', label: 'Đề thi' },
    { key: 'examDate', label: 'Ngày thi' },
    { key: 'shiftTime', label: 'Ca thi' },
    { key: 'room', label: 'Phòng thi' },
    { key: 'supervisor', label: 'Cán bộ coi thi' },
    { key: 'status', label: 'Trạng thái' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-xs font-semibold text-slate-600">
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
            { value: 'date', label: 'Ngày thi: Mới nhất' },
          ]}
        />

        {/* Column Selector */}
        <ColumnToggleDropdown
          columns={columnsList}
          visibleColumns={visibleColumns}
          onToggle={(key) => onColumnToggle?.(key)}
        />

        {/* View Mode Segmented Control */}
        <ViewModeSegmentedControl
          viewMode={viewMode}
          onChange={(mode) => onViewModeChange?.(mode)}
        />

        {/* Refresh */}
        <button
          type="button"
          onClick={handleRefreshClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </div>
  );
}
