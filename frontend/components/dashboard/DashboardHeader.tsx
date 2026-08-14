'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function DashboardHeader({
  selectedPeriod = 'ALL',
  onPeriodChange,
}: {
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Left: Page Title & Executive Subtitle */}
      <div className="space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Tổng quan hệ thống
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Trung tâm điều hành và giám sát khảo thí toàn trường
        </p>
      </div>

      {/* Right: Clean Semester Filter Selector only (No reload button, No export button) */}
      {onPeriodChange && (
        <div className="shrink-0">
          <FilterSelect
            size="md"
            variant="ghost"
            leftIcon={<Calendar className="w-4 h-4 text-slate-500" />}
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
          >
            <option value="ALL">Tất cả đợt thi & Học kỳ</option>
            <option value="HK2_2025_2026">Học kỳ 2 (2025 - 2026)</option>
            <option value="HK1_2025_2026">Học kỳ 1 (2025 - 2026)</option>
            <option value="HK_HE_2025">Học kỳ Hè (2024 - 2025)</option>
          </FilterSelect>
        </div>
      )}
    </div>
  );
}
