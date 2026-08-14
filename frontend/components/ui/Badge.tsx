'use client';

import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';

const toneClasses: Record<BadgeTone, string> = {
  slate: 'text-slate-600 dark:text-slate-400',
  blue: 'text-primary-600 dark:text-blue-400',
  emerald: 'text-success-600 dark:text-emerald-400',
  amber: 'text-warning-600 dark:text-amber-400',
  rose: 'text-danger-600 dark:text-rose-400',
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
    ? 'text-xs'
    : size === 'lg'
      ? 'text-sm'
      : 'text-xs';

  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] font-medium leading-5 whitespace-nowrap select-none',
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
