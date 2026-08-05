'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, RefreshCw, Plus, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';

export function DashboardHeader({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const router = useRouter();
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(now);

    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    setCurrentDateStr(capitalized);
  }, []);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-2">
      {/* Title & Description */}
      <div>
        <nav className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
          <span
            className="cursor-pointer transition hover:text-slate-800"
            onClick={() => router.push('/dashboard')}
          >
            Trang chủ
          </span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-900">Tổng quan</span>
        </nav>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tổng quan hệ thống</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Theo dõi hoạt động khảo thí và xử lý các công việc quan trọng.
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date pill */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
          <Calendar className="h-4 w-4 shrink-0 text-blue-600" />
          <span>{currentDateStr}</span>
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>

        {/* Primary Create Button */}
        <Button
          onClick={() => router.push('/exam-periods?action=create')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Tạo kỳ thi</span>
        </Button>
      </div>
    </div>
  );
}
