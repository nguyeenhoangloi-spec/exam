'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Printer, RefreshCw } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function DashboardHeader({
  onRefresh,
  isRefreshing,
  selectedPeriod = 'ALL',
  onPeriodChange,
  onExportPDF,
}: {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  onExportPDF?: () => void;
}) {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [lastUpdatedStr, setLastUpdatedStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(now);

    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    setCurrentDateStr(capitalizedDate);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setLastUpdatedStr(`${hours}:${minutes} ${dd}/${mm}/${yyyy}`);
  }, [isRefreshing]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Tổng quan hệ thống
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý
        </p>
      </div>

      {/* Right Controls: Date, Period Selector, Refresh & Export PDF */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Date & Timestamp Display */}
        {currentDateStr && (
          <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 select-none mr-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{currentDateStr}</span>
            {lastUpdatedStr && (
              <span className="text-[13px] text-slate-400 font-normal">
                ({lastUpdatedStr})
              </span>
            )}
          </div>
        )}

        {/* Semester / Exam Period Filter Selector */}
        {onPeriodChange && (
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
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        {/* Export Report PDF Button */}
        {onExportPDF && (
          <button
            type="button"
            onClick={onExportPDF}
            className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 hover:border-blue-300 transition shadow-2xs cursor-pointer active:scale-95 font-semibold text-[13.5px]"
            title="Xuất báo cáo PDF"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        )}
      </div>
    </div>
  );
}
