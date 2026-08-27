import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/** Dashboard loading state — mirrors the real layout 1:1 so there is zero layout shift. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải tổng quan">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <div className="hidden gap-3 lg:flex">
            <Skeleton className="h-16 w-36" />
            <Skeleton className="h-16 w-36" />
            <Skeleton className="h-16 w-36" />
          </div>
        </div>
      </div>

      {/* Task attention */}
      <div className="rounded-2xl border border-warning-200/80 bg-gradient-to-r from-warning-50/40 via-white to-blue-50/30 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>

      {/* Exam progress */}
      <Skeleton className="h-72" />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 lg:col-span-7 xl:col-span-8" />
        <Skeleton className="h-80 lg:col-span-5 xl:col-span-4" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-96 lg:col-span-6" />
        <Skeleton className="h-96 lg:col-span-6" />
      </div>

      {/* Activity + quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 lg:col-span-6" />
        <Skeleton className="h-80 lg:col-span-6" />
      </div>
    </div>
  );
}
