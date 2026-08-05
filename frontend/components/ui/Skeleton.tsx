import React from 'react';

type SkeletonProps = {
    className?: string;
};

/** Shimmering placeholder block. Zero layout shift while data loads. */
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={[
                'relative overflow-hidden rounded-xl bg-slate-200/70',
                'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
                'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
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
