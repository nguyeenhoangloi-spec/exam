'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface BulkActionDockProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  children: ReactNode;
  selectLabel?: string;
}

export function BulkActionDock({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onClear,
  children,
  selectLabel,
}: BulkActionDockProps) {
  // Lắng nghe phím Esc để hủy chọn nhanh (Power-User Feature)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCount > 0) {
        onClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, onClear]);

  // Chỉ hiển thị khi có ít nhất 1 mục được chọn
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-8 left-0 right-0 md:left-[252px] [html.sidebar-collapsed_&]:md:left-[72px] flex justify-center z-50 pointer-events-none px-4 transition-[left] duration-300">
      <div className="pointer-events-auto max-w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-150 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22),0_8px_20px_-6px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-slate-900/5 dark:ring-white/10 rounded-2xl p-2 px-4 sm:px-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-300 ease-out">
        
        {/* Khối bên trái: Số lượng tương tác + Nút Bỏ chọn/Tất cả */}
        <div className="flex items-center gap-2.5 pr-3.5 border-r border-slate-200/90 dark:border-slate-800 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 px-3 py-1.5 text-blue-700 dark:text-blue-300 text-type-helper font-semibold select-none shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
            </span>
            <span className="tabular-nums font-semibold">
              {selectedCount} <span className="text-slate-500 dark:text-slate-400 font-normal">/ {totalCount}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleAll}
            className="h-9 px-3 text-type-helper font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-white rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer select-none"
          >
            {allSelected ? (selectLabel || 'Bỏ chọn') : 'Tất cả'}
          </button>
        </div>

        {/* Khối bên phải: Danh sách các nút hành động */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {children}

          {/* Nút hủy chọn / Đóng (Esc) */}
          <div className="pl-2 border-l border-slate-200/90 dark:border-slate-800 flex items-center">
            <button
              type="button"
              onClick={onClear}
              className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              title="Bỏ chọn tất cả (Esc)"
            >
              <X className="h-4 w-4" />
              <kbd className="hidden sm:inline-block text-type-helper font-semibold px-1.5 py-0.5 rounded bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Esc</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface BulkActionButtonProps {
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger';
  className?: string;
}

export function BulkActionButton({
  onClick,
  icon,
  label,
  variant = 'secondary',
  className = '',
}: BulkActionButtonProps) {
  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative overflow-hidden h-9 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-type-helper font-semibold shadow-xs shadow-blue-500/25 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${className}`}
      >
        <span className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out pointer-events-none" />
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'warning') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`h-9 flex items-center gap-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 px-3.5 text-type-helper font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${className}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`h-9 flex items-center gap-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 px-3.5 text-type-helper font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${className}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 flex items-center gap-2 rounded-xl text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-3.5 text-type-helper font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
