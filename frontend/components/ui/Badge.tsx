'use client';

import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';

const toneClasses: Record<BadgeTone, string> = {
  slate: 'text-slate-600 dark:text-slate-400 font-bold',
  blue: 'text-blue-600 dark:text-blue-400 font-bold',
  emerald: 'text-emerald-600 dark:text-emerald-400 font-bold',
  amber: 'text-amber-600 dark:text-amber-400 font-bold',
  rose: 'text-rose-600 dark:text-rose-400 font-bold',
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
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {leftIcon && <span className="shrink-0 text-current">{leftIcon}</span>}
      {children}
    </span>
  );
}
