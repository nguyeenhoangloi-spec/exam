'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';
import { ViewModeSegmentedControl } from '../ui/ViewModeSegmentedControl';

interface RegradeTableToolbarProps {
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

export function RegradeTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    code: true,
    student: true,
    subject: true,
    oldScore: true,
    reason: true,
    status: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: RegradeTableToolbarProps) {
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
    { key: 'code', label: 'Mã đơn phó/khiếu nại' },
    { key: 'student', label: 'Thí sinh gửi đơn' },
    { key: 'subject', label: 'Môn thi phúc khảo' },
    { key: 'oldScore', label: 'Điểm công bố ban đầu' },
    { key: 'reason', label: 'Lý do phúc khảo' },
    { key: 'status', label: 'Trạng thái xử lý' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        {/* Sort */}
        <SortDropdown
          value={sortOrder}
          onChange={(val) => onSortChange?.(val)}
          options={[
            { value: 'newest', label: 'Đơn mới nhất' },
            { value: 'oldest', label: 'Đơn cũ nhất' },
            { value: 'score_desc', label: 'Điểm thi: Cao nhất' },
            { value: 'score_asc', label: 'Điểm thi: Thấp nhất' },
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
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 select-none"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </div>
  );
}