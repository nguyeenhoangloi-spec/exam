'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md';
  containerClassName?: string;
}

export function FilterSelect({
  leftIcon,
  size = 'sm',
  containerClassName = '',
  className = '',
  children,
  ...props
}: FilterSelectProps) {
  const sizeClasses =
    size === 'sm'
      ? `h-8 text-[13px] font-semibold ${leftIcon ? 'pl-8 pr-7' : 'px-3 pr-7'}`
      : `h-9 text-[14px] font-semibold ${leftIcon ? 'pl-9 pr-8' : 'px-3.5 pr-8'}`;

  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={`relative inline-flex items-center ${containerClassName}`}>
      {leftIcon && (
        <div className="pointer-events-none absolute left-2.5 text-slate-500 dark:text-slate-400 shrink-0 flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <select
        className={`appearance-none rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer shadow-2xs ${sizeClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${iconSizeClass} text-slate-400 dark:text-slate-500`}
      />
    </div>
  );
}
