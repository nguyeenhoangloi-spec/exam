'use client';

import React, { startTransition } from 'react';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
  variant?: 'line' | 'segmented';
}

export function TabBar<T extends string = string>({
  tabs,
  active,
  onChange,
  className = '',
  variant = 'line',
}: TabBarProps<T>) {
  if (variant === 'segmented') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar w-full ${className}`}>
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
              className={`group relative flex items-center justify-center gap-1.5 flex-1 px-2.5 py-1.5 text-type-body font-semibold rounded-xl focus-visible:outline-none transition-all duration-150 cursor-pointer whitespace-nowrap select-none ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-type-badge font-semibold ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count.toLocaleString('vi-VN')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

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
            className={`group relative flex items-center gap-1.5 px-3.5 py-2.5 text-type-body font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 select-none ${
              isActive
                ? 'text-primary-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>

            {typeof tab.count === 'number' && (
              <span
                className={`rounded-xl px-2.5 py-0.5 text-type-badge font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-600 dark:text-blue-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}
              >
                {tab.count.toLocaleString('vi-VN')}
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
