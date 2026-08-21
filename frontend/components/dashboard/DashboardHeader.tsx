'use client';

import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function DashboardHeader({
  selectedPeriod = 'ALL',
  onPeriodChange,
  title = 'Tổng quan hệ thống',
  subtitle = 'Trung tâm điều hành và giám sát khảo thí toàn trường',
}: {
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  title?: string;
  subtitle?: string;
}) {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [lastUpdatedStr, setLastUpdatedStr] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
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
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      setLastUpdatedStr(`${hours}:${minutes}:${seconds} - ${dd}/${mm}/${yyyy}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Left: Page Title & Executive Subtitle */}
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>

      {/* Right: Semester Filter & Current Date/Time right underneath */}
      {onPeriodChange && (
        <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
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

          {/* Real-time Date and Time right below the dropdown */}
          {currentDateStr && (
            <div className="flex items-center gap-1.5 text-type-helper font-medium text-slate-500 dark:text-slate-400 select-none px-1">
              <span className="text-slate-600 dark:text-slate-300">{currentDateStr}</span>
              {lastUpdatedStr && (
                <span className="text-slate-400 font-normal">
                  ({lastUpdatedStr})
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
