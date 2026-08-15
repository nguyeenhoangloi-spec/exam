'use client';

import React, { useState } from 'react';
import { List, LayoutGrid, Layers, RefreshCw } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface ExamRoomTableToolbarProps {
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

export function ExamRoomTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    roomCode: true,
    building: true,
    capacity: true,
    computerCount: true,
    status: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: ExamRoomTableToolbarProps) {
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
    { key: 'roomCode', label: 'Tên / Mã phòng thi' },
    { key: 'building', label: 'Tòa nhà / Địa điểm' },
    { key: 'capacity', label: 'Sức chứa Thí sinh' },
    { key: 'computerCount', label: 'Số máy tính khả dụng' },
    { key: 'status', label: 'Trạng thái hoạt động' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
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

        {/* View Mode Pills */}
        <div className="h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange?.('list')}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Dạng danh sách"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('grid')}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Dạng thẻ"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('compact')}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Dạng thu gọn"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Refresh button (borderless) */}
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
