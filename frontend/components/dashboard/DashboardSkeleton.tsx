import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/**
 * Dashboard loading skeleton — mirrors the real 2026 Dashboard layout 1:1 for zero layout shift (CLS = 0).
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Đang tải tổng quan">
      {/* 1. Section 1: 6 KPI Statistic Cards Grid (1:1 với DashboardStatistics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs h-[110px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-7 w-14 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            </div>
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* 2. Section 2: Quick Action Launchpad Bar (1:1 với QuickActionsBar 4 nút) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs h-[68px]"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-36 max-w-full rounded" />
              </div>
            </div>
            <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 3. Section 3: Row 2 - Biểu đồ Lịch thi (7 cols) + Donut Trạng thái câu hỏi (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-44 rounded-lg" />
                <Skeleton className="h-3 w-64 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <div className="flex-1 flex items-end gap-3 pt-6 pb-2 px-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton
                    className="w-full rounded-t-lg"
                    style={{ height: `${35 + ((i * 19) % 55)}%` }}
                  />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
              <Skeleton className="h-44 w-44 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section 4: Row 3 - Kỳ thi sắp tới (6 cols) + Tác vụ cần xử lý (3 cols) + Hoạt động gần đây (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-12 xl:col-span-6 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[380px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-xl" />
            </div>
            <div className="space-y-3 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-48 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-3 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[380px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="space-y-3 flex-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-3 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[380px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-xl" />
            </div>
            <div className="space-y-3.5 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-full rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section 5: Row 4 - Tiến độ đợt thi (4 cols) + Câu hỏi chờ duyệt (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[360px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-xl" />
            </div>
            <div className="space-y-4 flex-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-[360px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-xl" />
            </div>
            <div className="space-y-3 flex-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-40 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-xl" />
                    <Skeleton className="h-8 w-16 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
