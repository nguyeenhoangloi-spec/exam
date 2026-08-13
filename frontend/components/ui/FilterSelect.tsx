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
  size = 'md',
  containerClassName = '',
  className = '',
  children,
  ...props
}: FilterSelectProps) {
  const sizeClasses =
    size === 'sm'
      ? `h-9 text-[15px] font-medium ${leftIcon ? 'pl-8 pr-7' : 'px-3 pr-7'}`
      : `h-9 text-[15px] font-medium ${leftIcon ? 'pl-9 pr-8' : 'px-3.5 pr-8'}`;

  const iconSizeClass = 'h-4 w-4';

  return (
    <div className={`relative inline-flex items-center ${containerClassName}`}>
      {leftIcon && (
        <div className="pointer-events-none absolute left-3 text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <select
        className={`appearance-none rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs leading-none ${sizeClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${iconSizeClass} text-slate-400 dark:text-slate-500`}
      />
    </div>
  );
}
