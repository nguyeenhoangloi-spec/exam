'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Printer, RefreshCw } from 'lucide-react';

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
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Tổng quan hệ thống
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý
        </p>
      </div>

      {/* Right Controls: Period Selector & PDF Export Button above, Date Display below on the right */}
      <div className="flex flex-col items-start lg:items-end gap-1.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Semester / Exam Period Filter Selector */}
          {onPeriodChange && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả đợt thi & Học kỳ</option>
                <option value="HK2_2025_2026">Học kỳ 2 (2025 - 2026)</option>
                <option value="HK1_2025_2026">Học kỳ 1 (2025 - 2026)</option>
                <option value="HK_HE_2025">Học kỳ Hè (2024 - 2025)</option>
              </select>
            </div>
          )}
        </div>

        {/* Date & Timestamp Display (Right-aligned below buttons) */}
        {currentDateStr && (
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-500 select-none">
            <span className="font-bold text-slate-700">{currentDateStr}</span>
            {lastUpdatedStr && (
              <span className="text-[11px] text-slate-400 font-medium">
                ({lastUpdatedStr})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
