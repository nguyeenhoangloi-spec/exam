'use client';

import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';

const toneClasses: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-300/80',
  rose: 'bg-rose-50 text-rose-700 border-rose-300/80',
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | string;
  className?: string;
  leftIcon?: React.ReactNode;
};

/** Compact Badge Component (rounded-[8px], 24px height, 11px bold text, 1px border) */
export function Badge({ children, tone = 'slate', size, className = '', leftIcon }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-2xs h-6 select-none',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {leftIcon && <span className="shrink-0 text-current">{leftIcon}</span>}
      {children}
    </span>
  );
}
