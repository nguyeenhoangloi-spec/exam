'use client';

import React from 'react';
import { Search, X, RotateCcw, ChevronDown } from 'lucide-react';
import { TabBar, TabItem } from '../ui/TabBar';
import { Button } from '../ui/Button';

interface RegradeFiltersCardProps {
  tabs: TabItem[];
  statusTab: string;
  onStatusTabChange: (key: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  subjectsList: [number, string][];
  subjectFilter: string;
  onSubjectFilterChange: (val: string) => void;
  onResetFilters: () => void;
}

export function RegradeFiltersCard({
  tabs,
  statusTab,
  onStatusTabChange,
  search,
  onSearchChange,
  subjectsList,
  subjectFilter,
  onSubjectFilterChange,
  onResetFilters,
}: RegradeFiltersCardProps) {
  const hasActiveFilters = Boolean(search || subjectFilter !== 'ALL' || statusTab !== 'ALL');

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all">
      {/* TabBar on Left */}
      <div className="min-w-0 flex-1 border-b lg:border-b-0 border-slate-100 pb-2 lg:pb-0">
        <TabBar
          tabs={tabs}
          active={statusTab}
          onChange={onStatusTabChange}
          className="border-b-0 pt-0"
        />
      </div>

      {/* Search & Subject Dropdown on Right */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã SV, tên SV, lý do..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Subject Filter Dropdown */}
        {subjectsList.length > 0 && (
          <div className="relative min-w-[140px]">
            <select
              value={subjectFilter}
              onChange={(e) => onSubjectFilterChange(e.target.value)}
              className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-600 transition cursor-pointer shadow-2xs"
            >
              <option value="ALL">Tất cả Môn học</option>
              {subjectsList.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            title="Đặt lại tất cả bộ lọc"
          >
            Đặt lại
          </Button>
        )}
      </div>
    </div>
  );
}
