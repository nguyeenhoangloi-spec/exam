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
            className={`group relative overflow-hidden rounded-2xl border ${style.border} bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-500">{item.title}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{item.value}</h3>
                {item.subtext && <p className="mt-1 text-xs text-slate-500 font-medium">{item.subtext}</p>}
                {item.trend && <span className="mt-1.5 block text-xs font-medium text-slate-500">{item.trend}</span>}
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text} transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
