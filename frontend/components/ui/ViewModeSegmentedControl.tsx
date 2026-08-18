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
  return (
    <div
      className={`h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
          viewMode === 'list'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Dạng danh sách"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Dạng thẻ"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('compact')}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${
          viewMode === 'compact'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Dạng thu gọn"
      >
        <Layers className="h-4 w-4" />
      </button>
    </div>
  );
}
