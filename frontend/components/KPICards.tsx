'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KPICardItem {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color: 'sky' | 'blue' | 'emerald' | 'amber' | 'skyDeep' | 'rose';
  trend?: string;
}

interface KPICardsProps {
  items: KPICardItem[];
}

const colorMap = {
  sky: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    iconBg: 'bg-blue-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100',
    iconBg: 'bg-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    iconBg: 'bg-amber-500',
  },
  skyDeep: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-600',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    iconBg: 'bg-rose-500',
  },
};

export const KPICards: React.FC<KPICardsProps> = ({ items }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {items.map((item, index) => {
        const Icon = item.icon;
        const style = colorMap[item.color] || colorMap.sky;
        return (
          <div
            key={index}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 leading-[38px] tracking-tight tabular-nums">
                  {item.value}
                </div>
              </div>

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.border} ${style.bg} ${style.text} transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
                <Icon className="h-5 w-5 stroke-[2]" />
              </div>
            </div>

            {(item.subtext || item.trend) && (
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2">
                {item.subtext && <span className="text-[13px] font-normal text-slate-500 block truncate">{item.subtext}</span>}
                {item.trend && <span className="text-[13px] font-medium text-slate-500 block shrink-0">{item.trend}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
