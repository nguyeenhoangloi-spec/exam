'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, List, LayoutGrid, Layers, Check } from 'lucide-react';

interface QuestionBankTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  viewMode?: 'list' | 'grid' | 'compact';
  onViewModeChange?: (mode: 'list' | 'grid' | 'compact') => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
}

export function QuestionBankTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  visibleColumns = {
    code: true,
    content: true,
    subject: true,
    difficulty: true,
    type: true,
    status: true,
    creator: true,
    createdAt: true,
  },
  onColumnToggle,
}: QuestionBankTableToolbarProps) {
  const [openColumnMenu, setOpenColumnMenu] = useState(false);

  const columnsList = [
    { key: 'code', label: 'Mã câu hỏi' },
    { key: 'content', label: 'Nội dung & Các đáp án' },
    { key: 'subject', label: 'Môn học' },
    { key: 'difficulty', label: 'Độ khó' },
    { key: 'type', label: 'Loại câu hỏi' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'creator', label: 'Người tạo' },
    { key: 'createdAt', label: 'Ngày tạo' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      {/* Left Total Count text */}
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString('vi-VN')}</span> kết quả
      </span>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Sort selector */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] pl-3 pr-8 text-[14px] font-semibold text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="oldest">Sắp xếp: Cũ nhất</option>
            <option value="code">Sắp xếp: Mã câu hỏi</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Column Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenColumnMenu(!openColumnMenu)}
            className="h-9 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            <span>Chọn cột</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Popover */}
          {openColumnMenu && (
            <div
            className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] p-3 shadow-xl text-xs space-y-2"
              onMouseLeave={() => setOpenColumnMenu(false)}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Hiển thị cột</span>
                <span className="text-[12px] text-slate-400 font-normal">Click để ẩn/hiện</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {columnsList.map((col) => {
                  const isVisible = visibleColumns[col.key] !== false;
                  return (
                    <label
                      key={col.key}
                      className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-semibold text-slate-700 dark:text-slate-200 select-none transition text-[13px]"
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

        {/* View Mode Toggle Icons */}
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
      </div>
    </div>
  );
}
