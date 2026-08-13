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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 tracking-tight">
          Tổng quan hệ thống
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-slate-500">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý
        </p>
      </div>

      {/* Right Controls: Period Selector & PDF Export Button */}
      <div className="flex flex-col items-start lg:items-end gap-1.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Semester / Exam Period Filter Selector */}
          {onPeriodChange && (
            <FilterSelect
              size="md"
              variant="ghost"
              leftIcon={<Calendar className="w-4 h-4" />}
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
            >
              <option value="ALL">Tất cả đợt thi & Học kỳ</option>
              <option value="HK2_2025_2026">Học kỳ 2 (2025 - 2026)</option>
              <option value="HK1_2025_2026">Học kỳ 1 (2025 - 2026)</option>
              <option value="HK_HE_2025">Học kỳ Hè (2024 - 2025)</option>
            </FilterSelect>
          )}
        </div>

        {/* Date & Timestamp Display */}
        {currentDateStr && (
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 select-none">
            <span className="font-semibold text-slate-900">{currentDateStr}</span>
            {lastUpdatedStr && (
              <span className="text-[13px] text-slate-500 font-normal">
                ({lastUpdatedStr})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

