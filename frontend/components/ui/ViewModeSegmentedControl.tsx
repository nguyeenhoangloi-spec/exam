'use client';

import React from 'react';
import { List, LayoutGrid, CalendarDays } from 'lucide-react';

export type ViewMode = 'list' | 'grid' | 'calendar' | 'matrix' | 'table';

export interface ViewModeSegmentedControlProps<T extends string = ViewMode> {
  viewMode: T;
  onChange: (mode: T) => void;
  className?: string;
  supportedModes?: readonly T[] | T[];
}

export function ViewModeSegmentedControl<T extends string = ViewMode>({
  viewMode,
  onChange,
  className = '',
  supportedModes,
}: ViewModeSegmentedControlProps<T>) {
  const modes = (supportedModes || ['list', 'grid', 'calendar']) as readonly T[];
  const activeIndex = modes.indexOf(viewMode) >= 0 ? modes.indexOf(viewMode) : 0;

  const modeConfig: Record<string, { label: string; icon: React.ElementType }> = {
    list: { label: 'Dạng bảng danh sách', icon: List },
    grid: { label: 'Dạng lưới thẻ', icon: LayoutGrid },
    calendar: { label: 'Dạng lịch tuần', icon: CalendarDays },
    matrix: { label: 'Xem sơ đồ ma trận chỗ ngồi', icon: LayoutGrid },
    table: { label: 'Xem bảng danh sách sinh viên', icon: List },
  };

  return (
    <div
      className={`relative h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/90 p-0.5 select-none ${className}`}
    >
      {/* Sliding Pill Indicator — Nổi 3D nhẹ trên rãnh xám */}
      <div
        className="absolute top-0.5 bottom-0.5 left-0.5 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-transform duration-200 ease-out pointer-events-none"
        style={{
          transform: `translateX(${activeIndex * 38}px)`,
        }}
      />

      {modes.map((mode) => {
        const item = modeConfig[mode];
        if (!item) return null;
        const { label, icon: Icon } = item;
        const isActive = viewMode === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title={label}
            aria-label={label}
          >
            <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.75} />
          </button>
        );
      })}
    </div>
  );
}
