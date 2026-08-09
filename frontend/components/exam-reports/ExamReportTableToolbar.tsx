'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, List, LayoutGrid, Layers, RefreshCw, Check } from 'lucide-react';

interface ExamReportTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  viewMode?: 'list' | 'grid' | 'compact';
  onViewModeChange?: (mode: 'list' | 'grid' | 'compact') => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
}

export function ExamReportTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    studentCode: true,
    fullName: true,
    className: true,
    status: true,
    totalScore: true,
    submittedAt: true,
    violationCount: true,
  },
  onColumnToggle,
  onRefresh,
}: ExamReportTableToolbarProps) {
  const [openColumnMenu, setOpenColumnMenu] = useState(false);

  const columnsList = [
    { key: 'studentCode', label: 'Mã Sinh viên' },
    { key: 'fullName', label: 'Họ và Tên' },
    { key: 'className', label: 'Lớp sinh viên' },
    { key: 'status', label: 'Trạng thái nộp bài' },
    { key: 'totalScore', label: 'Điểm số thi' },
    { key: 'submittedAt', label: 'Thời gian nộp' },
    { key: 'violationCount', label: 'Lượt vi phạm' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-[15px] font-normal text-[#334155]">
        <span className="font-bold text-[#0F172A]">{totalCount.toLocaleString('vi-VN')}</span> thí sinh trong báo cáo
      </span>

      <div className="flex items-center gap-2">
        {/* Sort */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 py-1.5 text-[15px] font-medium text-[#0F172A] outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value="score_desc">Điểm thi: Cao xuống thấp</option>
            <option value="score_asc">Điểm thi: Thấp đến cao</option>
            <option value="name_asc">Tên Thí sinh: A - Z</option>
            <option value="violation_desc">Nhiều vi phạm nhất</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
        </div>

        {/* Column Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenColumnMenu(!openColumnMenu)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[15px] font-medium text-[#334155] transition hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#2563EB]" />
            <span>Chọn cột</span>
            <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
          </button>

          {openColumnMenu && (
            <div
              className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-[14px] space-y-2"
              onMouseLeave={() => setOpenColumnMenu(false)}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-[#0F172A] text-[14px]">Hiển thị cột</span>
                <span className="text-[12px] text-[#64748B] font-normal">Click để ẩn/hiện</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {columnsList.map((col) => {
                  const isVisible = visibleColumns[col.key] !== false;
                  return (
                    <label
                      key={col.key}
                      className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 cursor-pointer font-medium text-[#334155] select-none transition"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => onColumnToggle?.(col.key)}
                          className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={isVisible ? 'text-[#0F172A]' : 'text-[#64748B] line-through'}>
                          {col.label}
                        </span>
                      </span>
                      {isVisible && <Check className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange?.('list')}
            className={`flex h-6 w-6 items-center justify-center rounded-lg transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng danh sách"
          >
            <List className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange?.('grid')}
            className={`flex h-6 w-6 items-center justify-center rounded-lg transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng lưới"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange?.('compact')}
            className={`flex h-6 w-6 items-center justify-center rounded-lg transition cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Dạng thu gọn"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
