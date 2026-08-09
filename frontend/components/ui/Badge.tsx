'use client';

import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';

const toneClasses: Record<BadgeTone, string> = {
  slate: 'bg-[#F8FAFC] text-[#475569] dark:bg-slate-800 dark:text-slate-300',
  blue: 'bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-300',
  emerald: 'bg-[#F0FDF4] text-[#15803D] dark:bg-emerald-950/40 dark:text-emerald-300',
  amber: 'bg-[#FFF7ED] text-[#D97706] dark:bg-amber-950/40 dark:text-amber-300',
  rose: 'bg-[#FEF2F2] text-[#DC2626] dark:bg-rose-950/40 dark:text-rose-300',
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | string;
  className?: string;
  leftIcon?: React.ReactNode;
};

/** Soft badge dành cho thông tin phân loại hoặc ưu tiên có ý nghĩa ngữ nghĩa. */
export function Badge({ children, tone = 'slate', size, className = '', leftIcon }: BadgeProps) {
  const sizeClass = size === 'xs'
    ? 'px-1.5 py-0.5 text-[12px]'
    : size === 'lg'
      ? 'px-2.5 py-1.5 text-[14px]'
      : 'px-2 py-1 text-[13px]';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-[6px] font-semibold whitespace-nowrap select-none',
        sizeClass,
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
    </span>
  );
}
