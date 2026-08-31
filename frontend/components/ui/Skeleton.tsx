import React from 'react';

type SkeletonProps = {
    className?: string;
    style?: React.CSSProperties;
};

/** Shimmering placeholder block. Zero layout shift while data loads. */
export function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div
            style={style}
            className={[
                'relative overflow-hidden rounded-xl bg-slate-200/70 dark:bg-slate-700/70',
                'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
                'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent dark:after:via-slate-500/30',
                className,
            ].join(' ')}
        />
    );
}

type SkeletonRowProps = {
    lines?: number;
    className?: string;
};

/** Simple paragraph skeleton. */
export function SkeletonRow({ lines = 3, className = '' }: SkeletonRowProps) {
    return (
        <div className={`space-y-2.5 ${className}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton key={index} className={index === lines - 1 ? 'w-2/3' : 'w-full'} />
            ))}
        </div>
    );
}

/** Unified KPI Cards Skeleton for page top metrics. */
export function KPICardsSkeleton({ count = 4, columns }: { count?: number; columns?: 2 | 3 | 4 | 5 | 6 }) {
    const effectiveCols = columns || (count >= 6 ? 6 : count === 5 ? 5 : count === 3 ? 3 : count === 2 ? 2 : 4);
    const gridColsClass =
        effectiveCols === 6
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
            : effectiveCols === 5
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
            : effectiveCols === 3
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : effectiveCols === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

    return (
        <div className={`grid ${gridColsClass} gap-3.5`} aria-hidden="true">
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-apple-card h-[110px]"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <Skeleton className="h-3.5 w-24 rounded" />
                            <Skeleton className="h-7 w-16 rounded-lg" />
                        </div>
                        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    </div>
                    <Skeleton className="h-3 w-32 rounded" />
                </div>
            ))}
        </div>
    );
}

/** Unified Table Skeleton for data lists (Teachers, Students, Schedules, Papers, etc.). */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-apple-card" aria-hidden="true">
            {/* Toolbar row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
            </div>
            {/* Table Rows */}
            <div className="space-y-3 pt-1">
                {Array.from({ length: rows }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-2 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                        <Skeleton className="h-4 w-6 rounded" />
                        <Skeleton className="h-4 w-40 rounded flex-1" />
                        <Skeleton className="h-4 w-28 rounded hidden sm:block" />
                        <Skeleton className="h-4 w-20 rounded hidden md:block" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-lg ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Unified Full Page Skeleton with header, optional KPIs and main content area. */
export function PageSkeleton({
    hasKPIs = true,
    kpiCount = 4,
    kpiColumns,
    showKpi,
    variant = 'table',
}: {
    hasKPIs?: boolean;
    kpiCount?: number;
    kpiColumns?: 2 | 3 | 4 | 5 | 6;
    showKpi?: boolean;
    variant?: 'table' | 'cards' | 'form';
}) {
    const shouldShowKPIs = showKpi !== undefined ? showKpi : hasKPIs;

    return (
        <div className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen" aria-busy="true" aria-live="polite">
            {/* Page Header Skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
                <div className="space-y-1.5">
                    <Skeleton className="h-7 w-48 sm:w-64 rounded-lg" />
                    <Skeleton className="h-4 w-64 sm:w-96 rounded" />
                </div>
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-10 w-28 rounded-xl" />
                    <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
            </div>

            {/* Optional KPI Metrics (1:1 with real KPICards) */}
            {shouldShowKPIs && <KPICardsSkeleton count={kpiCount} columns={kpiColumns} />}

            {/* Main Content Area Skeleton */}
            {variant === 'table' && <TableSkeleton rows={6} />}
            {variant === 'cards' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-apple-card">
                            <Skeleton className="h-5 w-40 rounded-lg" />
                            <Skeleton className="h-3 w-full rounded" />
                            <Skeleton className="h-3 w-2/3 rounded" />
                            <div className="pt-2 flex justify-between">
                                <Skeleton className="h-6 w-20 rounded-lg" />
                                <Skeleton className="h-6 w-16 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {variant === 'form' && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-apple-card max-w-4xl">
                    <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-6 w-48 rounded-lg" />
                        <Skeleton className="h-3.5 w-80 rounded" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
