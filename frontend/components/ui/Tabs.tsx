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
    <div className={`inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium rounded-[10px] transition-all duration-150 cursor-pointer select-none ${
              isActive
                ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/50'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[13px] font-semibold ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-[#475569]'
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
    <div className={`flex items-center gap-6 border-b border-slate-200/80 ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`relative pb-3 text-[15px] font-medium transition-all duration-150 cursor-pointer select-none flex items-center gap-2 ${
              isActive ? 'text-blue-600 font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[13px] font-semibold ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-[#475569]'
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
