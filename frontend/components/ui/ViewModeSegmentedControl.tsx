'use client';

import React from 'react';
import { List, LayoutGrid, Layers } from 'lucide-react';

export type ViewMode = 'list' | 'grid' | 'compact';

interface ViewModeSegmentedControlProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeSegmentedControl({
  viewMode,
  onChange,
  className = '',
}: ViewModeSegmentedControlProps) {
  const activeIndex = viewMode === 'list' ? 0 : viewMode === 'grid' ? 1 : 2;

  return (
    <div
      className={`relative h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs select-none ${className}`}
    >
      {/* Sliding Pill Indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 left-0.5 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 transition-transform duration-200 ease-out pointer-events-none"
        style={{
          transform: `translateX(${activeIndex * 38}px)`,
        }}
      />

      <button
        type="button"
        onClick={() => onChange('list')}
        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer ${
          viewMode === 'list'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Dạng danh sách"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer ${
          viewMode === 'grid'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Dạng thẻ"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('compact')}
        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer ${
          viewMode === 'compact'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Dạng thu gọn"
      >
        <Layers className="h-4 w-4" />
      </button>
    </div>
  );
}
