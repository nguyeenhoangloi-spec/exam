'use client';

import React from 'react';
import { List, LayoutGrid, Layers, CalendarDays } from 'lucide-react';

export type ViewMode = 'list' | 'grid' | 'compact' | 'calendar';

interface ViewModeSegmentedControlProps<T extends ViewMode = ViewMode> {
  viewMode: T;
  onChange: (mode: T) => void;
  className?: string;
  supportedModes?: T[];
}

export function ViewModeSegmentedControl<T extends ViewMode = ViewMode>({
  viewMode,
  onChange,
  className = '',
  supportedModes = ['list', 'grid', 'compact'] as T[],
}: ViewModeSegmentedControlProps<T>) {
  const activeIndex = supportedModes.indexOf(viewMode) >= 0 ? supportedModes.indexOf(viewMode) : 0;

  const modeConfig: Record<ViewMode, { label: string; icon: React.ElementType }> = {
    list: { label: 'Dạng danh sách', icon: List },
    grid: { label: 'Dạng thẻ', icon: LayoutGrid },
    compact: { label: 'Dạng thu gọn', icon: Layers },
    calendar: { label: 'Dạng lịch / Thời khóa biểu', icon: CalendarDays },
  };

  return (
    <div
      className={`relative h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs select-none ${className}`}
    >
      {/* Sliding Pill Indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 left-0.5 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 transition-transform duration-200 ease-out pointer-events-none"
        style={{
          transform: `translateX(${activeIndex * 38}px)`,
        }}
      />

      {supportedModes.map((mode) => {
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
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
