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
  onRefresh: () => void;
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-1 border-b border-slate-100/80 pb-3">
      {/* Title & Subtitle matching QuestionBankHeader standard */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Tổng quan hệ thống
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý
        </p>
      </div>

      {/* Right Controls: Period Selector, PDF Export Button, Date Text, Refresh Button */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Semester / Exam Period Filter Selector */}
        {onPeriodChange && (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

        {/* PDF Export Button - Primary Action */}
        {onExportPDF && (
          <button
            type="button"
            onClick={onExportPDF}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-extrabold shadow-xs transition active:scale-95 cursor-pointer"
            title="Xuất Báo cáo tổng quan Dashboard ra file PDF A4 theo chuẩn Bộ GD&ĐT"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Xuất Báo cáo PDF</span>
          </button>
        )}

        {/* Date & timestamp */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-none hidden xl:flex">
          <span className="text-slate-700 font-bold">{currentDateStr}</span>
          {lastUpdatedStr && (
            <span className="text-[11px] text-slate-400 font-medium">
              ({lastUpdatedStr})
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer select-none"
        >
          {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
        </button>
      </div>
    </div>
  );
}
