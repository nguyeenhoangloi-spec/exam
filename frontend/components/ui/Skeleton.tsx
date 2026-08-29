import React from 'react';

type SkeletonProps = {
    className?: string;
};

/** Shimmering placeholder block. Zero layout shift while data loads. */
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
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
export function KPICardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-5 shadow-2xs"
                >
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-36" />
                </div>
            ))}
        </div>
    );
}

/** Unified Table Skeleton for data lists (Teachers, Students, Schedules, Papers, etc.). */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-6 shadow-2xs" aria-hidden="true">
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
            <div className="space-y-3 pt-2">
                {Array.from({ length: rows }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-2 border-b border-slate-100/60 dark:border-slate-800/60 last:border-0">
                        <Skeleton className="h-4 w-8 rounded-md" />
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-4 w-48 flex-1 rounded-md" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-7 w-16 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Unified Full Page Skeleton with header, optional KPIs and main content area. */
export function PageSkeleton({
    hasKPIs = true,
    variant = 'table',
}: {
    hasKPIs?: boolean;
    variant?: 'table' | 'cards' | 'form';
}) {
    return (
        <div className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen animate-in fade-in-0 duration-200" aria-busy="true" aria-live="polite">
            {/* Page Header Skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48 sm:w-64" />
                    <Skeleton className="h-4 w-64 sm:w-96" />
                </div>
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-10 w-28 rounded-xl" />
                    <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
            </div>

            {/* Optional KPI Metrics */}
            {hasKPIs && <KPICardsSkeleton count={4} />}

            {/* Main Content Area Skeleton */}
            {variant === 'table' && <TableSkeleton rows={6} />}
            {variant === 'cards' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-5 space-y-3">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <div className="pt-2 flex justify-between">
                                <Skeleton className="h-6 w-20 rounded-lg" />
                                <Skeleton className="h-6 w-16 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
