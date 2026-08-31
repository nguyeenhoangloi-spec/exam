'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { SparklineWave } from './ui/SparklineWave';

export type KPIColor = 'blue' | 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';

export interface KPICardItem {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: KPIColor;
  progressPercent?: number;
  showProgressBar?: boolean;
  sparklineData?: number[];
  showSparkline?: boolean;
  unit?: string;
  trend?: string;
  route?: string;
  onClick?: () => void;
  loading?: boolean;
  selected?: boolean;
}

export interface KPICardsProps {
  items: KPICardItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  showSparkline?: boolean;
}

const colorStyles: Record<KPIColor, { bg: string; text: string; border: string; bar: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100/80 dark:border-blue-900/50',
    bar: 'bg-blue-600 dark:bg-blue-500',
  },
  sky: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100/80 dark:border-blue-900/50',
    bar: 'bg-blue-600 dark:bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100/80 dark:border-emerald-900/50',
    bar: 'bg-emerald-600 dark:bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100/80 dark:border-amber-900/50',
    bar: 'bg-amber-600 dark:bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100/80 dark:border-rose-900/50',
    bar: 'bg-rose-600 dark:bg-rose-500',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    bar: 'bg-slate-600 dark:bg-slate-400',
  },
};

const columnGridStyles: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6',
};

export const KPICards: React.FC<KPICardsProps> = ({ items, columns, className = '', showSparkline = true }) => {
  const router = useRouter();

  const effectiveColumns = columns || (items.length >= 6 ? 6 : items.length === 5 ? 5 : items.length === 3 ? 3 : items.length === 2 ? 2 : 4);
  const gridClass = columnGridStyles[effectiveColumns] || columnGridStyles[4];

  return (
    <div className={`grid ${gridClass} gap-3.5 ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const style = colorStyles[item.color || 'blue'] || colorStyles.blue;
        const isClickable = Boolean(item.route || item.onClick);
        const isSparklineEnabled = item.showSparkline ?? showSparkline ?? true;

        const handleClick = () => {
          if (item.onClick) {
            item.onClick();
          } else if (item.route) {
            router.push(item.route);
          }
        };

        const handleKeyDown = (event: React.KeyboardEvent) => {
          if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            handleClick();
          }
        };

        const formattedValue =
          typeof item.value === 'number'
            ? item.value.toLocaleString('vi-VN')
            : item.value;

        return (
          <div
            key={item.title || index}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={isClickable ? handleKeyDown : undefined}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ease-out overflow-hidden ${
              item.selected
                ? 'bg-white dark:bg-slate-900 border-2 border-blue-500 ring-4 ring-blue-500/10 shadow-apple-card'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card hover:-translate-y-1 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:shadow-apple-card-hover'
            } ${isClickable ? 'cursor-pointer' : ''}`}
          >
            {/* Subtle Area Wave Sparkline Background Layer */}
            {isSparklineEnabled && (
              <SparklineWave
                data={item.sparklineData}
                color={item.color || 'blue'}
                height={46}
              />
            )}

            {/* Content Layer (relative z-10) */}
            <div className="relative z-10 space-y-2.5">
              {/* Top Row: Title + Big Value on Left, Icon on Right */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {item.title}
                  </span>
                  <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                    {item.loading ? '...' : formattedValue}
                    {item.unit ? <span className="text-type-body font-medium ml-0.5 text-slate-500 dark:text-slate-400">{item.unit}</span> : null}
                  </div>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold transition-transform duration-200 group-hover:scale-105 ${
                    item.selected
                      ? 'bg-blue-600 text-white'
                      : `${style.bg} ${style.text} group-hover:bg-blue-600 group-hover:text-white`
                  }`}
                >
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Optional Micro Progress Track */}
              {item.showProgressBar && typeof item.progressPercent === 'number' && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-0.5 rounded-full overflow-hidden">
                  <div
                    className={`${style.bar} h-full rounded-full transition-[width] duration-500`}
                    style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                  />
                </div>
              )}

              {/* Bottom Subtext / Trend */}
              {(item.subtext || item.trend) && (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  {item.subtext && (
                    <span
                      title={item.subtext}
                      className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    >
                      {item.subtext}
                    </span>
                  )}
                  {item.trend && (
                    <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 block shrink-0">
                      {item.trend}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
