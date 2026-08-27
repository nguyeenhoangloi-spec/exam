'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';
import { ViewMode, ViewModeSegmentedControl } from '../ui/ViewModeSegmentedControl';

interface ExamScheduleTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
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
}: ExamScheduleTableToolbarProps) {
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
            { value: 'date', label: 'Ngày thi: Mới nhất' },
          ]}
        />

        {/* Column Selector - Chỉ hiển thị khi ở chế độ xem Bảng (List) */}
        {viewMode === 'list' && (
          <ColumnToggleDropdown
            columns={columnsList}
            visibleColumns={visibleColumns}
            onToggle={(key) => onColumnToggle?.(key)}
          />
        )}

        {/* View Mode Segmented Control: Bảng [ ☰ ] & Lịch [ 📅 ] (Ưu tiên Bảng trước) */}
        <ViewModeSegmentedControl
          viewMode={viewMode}
          onChange={(mode) => onViewModeChange?.(mode)}
          supportedModes={['list', 'calendar']}
        />
      </div>
    </div>
  );
}
