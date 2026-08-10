'use client';

import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';

const toneClasses: Record<BadgeTone, string> = {
  slate: 'text-[#475569] dark:text-slate-400',
  blue: 'text-[#2563EB] dark:text-blue-400',
  emerald: 'text-[#15803D] dark:text-emerald-400',
  amber: 'text-[#D97706] dark:text-amber-400',
  rose: 'text-[#DC2626] dark:text-rose-400',
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | string;
  className?: string;
  leftIcon?: React.ReactNode;
};

/** Inline semantic label for categories and priorities; no filled container. */
export function Badge({ children, tone = 'slate', size, className = '', leftIcon }: BadgeProps) {
  const sizeClass = size === 'xs'
    ? 'text-[12px]'
    : size === 'lg'
      ? 'text-[14px]'
      : 'text-[13px]';

  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] font-semibold leading-5 whitespace-nowrap select-none',
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
