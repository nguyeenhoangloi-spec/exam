'use client';

import React from 'react';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SegmentControlProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function SegmentControl({ items, activeKey, onChange, className = '' }: SegmentControlProps) {
  return (
    <div className={`inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700 ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium rounded-xl transition-all duration-150 cursor-pointer select-none ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[13px] font-semibold ${
                  isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-700 ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`relative pb-3 text-[15px] font-medium transition-all duration-150 cursor-pointer select-none flex items-center gap-2 ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[13px] font-semibold ${
                  isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {item.count}
              </span>
            )}
            {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        );
      })}
    </div>
  );
}
