'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, List, LayoutGrid, Layers, RefreshCw, Check } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';

interface ExamPaperTableToolbarProps {
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

export function ExamPaperTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    paperCode: true,
    subjectName: true,
    status: true,
    questionCount: true,
    durationMinutes: true,
    totalScore: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: ExamPaperTableToolbarProps) {
  const [openColumnMenu, setOpenColumnMenu] = useState(false);
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
    { key: 'paperCode', label: 'Mã đề thi' },
    { key: 'subjectName', label: 'Tên môn học' },
    { key: 'status', label: 'Trạng thái phát hành' },
    { key: 'questionCount', label: 'Số câu hỏi' },
    { key: 'durationMinutes', label: 'Thời gian thi' },
    { key: 'totalScore', label: 'Tổng điểm đề' },
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
            { value: 'code_asc', label: 'Mã đề: A - Z' },
            { value: 'questions_desc', label: 'Số câu: Nhiều nhất' },
          ]}
        />

        {/* Column Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenColumnMenu(!openColumnMenu)}
            className="h-9 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-medium text-slate-700 transition-all hover:border-slate-300 shadow-2xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>Chọn cột</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
          </button>

          {openColumnMenu && (
            <div
              className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-xs space-y-2"
              onMouseLeave={() => setOpenColumnMenu(false)}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-900 text-xs">Hiển thị cột</span>
                <span className="text-[12px] text-slate-400 font-normal">Click để ẩn/hiện</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {columnsList.map((col) => {
                  const isVisible = visibleColumns[col.key] !== false;
                  return (
                    <label
                      key={col.key}
                      className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 cursor-pointer font-medium text-slate-700 select-none transition text-[15px]"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => onColumnToggle?.(col.key)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={isVisible ? 'text-slate-900' : 'text-slate-400 line-through'}>
                          {col.label}
                        </span>
                      </span>
                      {isVisible && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View Mode */}
        <div className="h-9 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange?.('list')}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng danh sách"
          >
            <List className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange?.('grid')}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng lưới"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange?.('compact')}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng thu gọn"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefreshClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 cursor-pointer shadow-2xs select-none"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
