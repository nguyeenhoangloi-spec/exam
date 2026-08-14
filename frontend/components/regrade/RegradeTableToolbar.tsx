'use client';

import React, { useState } from 'react';
import { List, LayoutGrid, Layers, RefreshCw } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

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
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-[15px] font-normal text-slate-700 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString('vi-VN')}</span> kết quả
      </span>

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

        {/* View Mode */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange?.('list')}
            className={`rounded-xl p-1.5 transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng danh sách"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('grid')}
            className={`rounded-xl p-1.5 transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng thẻ"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('compact')}
            className={`rounded-xl p-1.5 transition cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng thu gọn"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={handleRefreshClick}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer select-none shrink-0"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </div>
  );
}
