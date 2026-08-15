'use client';

import React, { useState } from 'react';
import { List, LayoutGrid, Layers, RefreshCw } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface ExamReportTableToolbarProps {
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

export function ExamReportTableToolbar({
  totalCount,
  sortOrder = 'score_desc',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    student: true,
    examPeriod: true,
    subject: true,
    paper: true,
    score: true,
    violations: true,
    status: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: ExamReportTableToolbarProps) {
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
    { key: 'student', label: 'Mã & Họ tên thí sinh' },
    { key: 'examPeriod', label: 'Đợt / Kỳ thi' },
    { key: 'subject', label: 'Môn thi' },
    { key: 'paper', label: 'Mã đề thi' },
    { key: 'score', label: 'Điểm tổng kết' },
    { key: 'violations', label: 'Số lần vi phạm quy chế' },
    { key: 'status', label: 'Trạng thái chấm thi' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {/* Sort */}
      <SortDropdown
        value={sortOrder}
        onChange={(val) => onSortChange?.(val)}
        options={[
          { value: 'score_desc', label: 'Điểm thi: Cao nhất' },
          { value: 'score_asc', label: 'Điểm thi: Thấp nhất' },
          { value: 'name_asc', label: 'Thí sinh: A - Z' },
          { value: 'violation_desc', label: 'Vi phạm: Nhiều nhất' },
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
          title="Dạng rút gọn"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <button
          type="button"
          onClick={handleRefreshClick}
          disabled={loading || isSpinning}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-4 w-4 ${isSpinning ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      )}
    </div>
  );
}
