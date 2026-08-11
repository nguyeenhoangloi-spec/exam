'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, List, LayoutGrid, Layers, RefreshCw, Check } from 'lucide-react';

interface SubjectTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  viewMode?: 'list' | 'grid' | 'compact';
  onViewModeChange?: (mode: 'list' | 'grid' | 'compact') => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
}

export function SubjectTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    subjectCode: true,
    subjectName: true,
    credits: true,
    department: true,
  },
  onColumnToggle,
  onRefresh,
}: SubjectTableToolbarProps) {
  const [openColumnMenu, setOpenColumnMenu] = useState(false);

  const columnsList = [
    { key: 'subjectCode', label: 'Mã Môn học' },
    { key: 'subjectName', label: 'Tên Môn học' },
    { key: 'credits', label: 'Số Tín chỉ' },
    { key: 'department', label: 'Khoa đào tạo' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-xs font-semibold text-slate-600">
        <span className="font-semibold text-slate-900">{totalCount.toLocaleString('vi-VN')}</span> kết quả
      </span>

      <div className="flex items-center gap-2">
        {/* Sort */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="oldest">Sắp xếp: Cũ nhất</option>
            <option value="name_asc">Tên Môn: A - Z</option>
            <option value="credits_desc">Số tín chỉ: Cao nhất</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Column Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenColumnMenu(!openColumnMenu)}
            className="h-9 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            <span>Chọn cột</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
          </button>

          {openColumnMenu && (
            <div
              className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-xs space-y-2"
              onMouseLeave={() => setOpenColumnMenu(false)}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-900 text-xs">Hiển thị cột</span>
                <span className="text-[11px] text-slate-400 font-normal">Click để ẩn/hiện</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {columnsList.map((col) => {
                  const isVisible = visibleColumns[col.key] !== false;
                  return (
                    <label
                      key={col.key}
                      className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 cursor-pointer font-semibold text-slate-700 select-none transition text-xs"
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
            <List className="h-3.5 w-3.5" />
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
            <LayoutGrid className="h-3.5 w-3.5" />
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
            <Layers className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs select-none"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
