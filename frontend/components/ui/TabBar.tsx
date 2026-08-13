'use client';

import React, { startTransition } from 'react';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

interface TabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}

export function TabBar<T extends string = string>({
  tabs,
  active,
  onChange,
  className = '',
}: TabBarProps<T>) {
  return (
    <div className={`flex items-center gap-1 border-b border-slate-200/80 dark:border-slate-700 overflow-x-auto no-scrollbar w-full pt-1 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              startTransition(() => {
                onChange(tab.key);
              });
            }}
            className={`group relative flex items-center gap-1.5 px-3.5 py-2.5 text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none ${
              isActive ? 'text-primary-600 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-xl px-2.5 py-0.5 text-[13px] font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-primary-600 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}
              >
                ({tab.count.toLocaleString('vi-VN')})
              </span>
            )}

            {/* Active Blue Bottom Bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
