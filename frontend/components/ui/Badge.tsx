'use client';

import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';

/** Màu trạng thái chỉ đặt trên icon; chữ luôn giữ màu trung tính. */
const toneIconClasses: Record<BadgeTone, string> = {
  slate: 'text-slate-400 dark:text-slate-500',
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | string;
  className?: string;
  leftIcon?: React.ReactNode;
};

/** Frameless Badge Component (no border/background, icon + text) */
export function Badge({ children, tone = 'slate', size, className = '', leftIcon }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap select-none',
        'text-slate-700 dark:text-slate-200',
        className,
      ].join(' ')}
    >
      {leftIcon && <span className={`shrink-0 ${toneIconClasses[tone]}`}>{leftIcon}</span>}
      {children}
    </span>
  );
}
