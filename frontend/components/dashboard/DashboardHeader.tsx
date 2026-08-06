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
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between pb-2">
      {/* Left Title & Subtitle matching Screenshot */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tổng quan hệ thống</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý
        </p>
      </div>

      {/* Right Action Toolbar Controls matching Screenshot */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date pill */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="h-4 w-4 shrink-0 text-blue-600" />
            <span>{currentDateStr}</span>
          </div>

          {/* Refresh button with dropdown arrow matching Screenshot */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-600 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* Timestamp subtext matching Screenshot */}
        <span className="text-[11px] font-medium text-slate-400 pr-1">
          Cập nhật lần cuối: {lastUpdatedStr}
        </span>
      </div>
    </div>
  );
}
