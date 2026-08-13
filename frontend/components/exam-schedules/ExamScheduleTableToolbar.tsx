'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, List, LayoutGrid, Layers, RefreshCw, Check } from 'lucide-react';
import { SortDropdown } from '../ui/SortDropdown';

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
    period: true,
    shift: true,
    room: true,
    date: true,
    startTime: true,
    endTime: true,
    students: true,
    supervisors: true,
    status: true,
  },
  onColumnToggle,
  onRefresh,
  loading = false,
}: ExamScheduleTableToolbarProps) {
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
    { key: 'code', label: 'Mã lịch thi' },
    { key: 'period', label: 'Kỳ thi' },
    { key: 'shift', label: 'Ca thi' },
    { key: 'room', label: 'Phòng thi' },
    { key: 'date', label: 'Ngày thi' },
    { key: 'startTime', label: 'Giờ bắt đầu' },
    { key: 'endTime', label: 'Giờ kết thúc' },
    { key: 'students', label: 'Số TS' },
    { key: 'supervisors', label: 'Giám thị' },
    { key: 'status', label: 'Trạng thái' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-xs font-semibold text-slate-600">
        <span className="font-semibold text-slate-900">{totalCount.toLocaleString('vi-VN')}</span> kết quả
      </span>

      <div className="flex items-center gap-2">
        {/* Sort selector */}
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenColumnMenu(!openColumnMenu)}
            className="h-9 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-medium text-slate-700 transition-all hover:border-slate-300 shadow-2xs cursor-pointer active:scale-95"
            title="Chọn cột hiển thị"
          >
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>Chọn cột</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Popover */}
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
