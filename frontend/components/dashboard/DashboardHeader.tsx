'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

export function DashboardHeader({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing?: boolean;
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Subtitle matching QuestionBankHeader standard */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Tổng quan hệ thống
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý
        </p>
      </div>

      {/* Right Controls: Date Text, Refresh Button */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {/* Date & timestamp as clean flat text without icons */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-none">
          <span className="text-slate-700 font-bold">{currentDateStr}</span>
          {lastUpdatedStr && (
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              (Cập nhật {lastUpdatedStr})
            </span>
          )}
        </div>

        {/* Refresh button without leading icon */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer select-none"
        >
          {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
        </button>
      </div>
    </div>
  );
}
