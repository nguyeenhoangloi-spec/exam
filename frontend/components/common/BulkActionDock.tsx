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
      <div className="pointer-events-auto inline-flex items-center justify-center gap-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/75 dark:border-slate-700/75 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] rounded-full p-1.5 pl-3.5 pr-2.5 animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out whitespace-nowrap select-none shrink-0">
        
        {/* Khối bên trái: Số lượng tương tác + Nút Bỏ chọn/Tất cả */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-900/5 dark:border-white/10 shrink-0 whitespace-nowrap">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-400/15 px-3.5 py-1 text-blue-600 dark:text-blue-400 text-type-helper font-semibold select-none shrink-0 whitespace-nowrap">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
            </span>
            <span className="tabular-nums font-semibold shrink-0">
              {selectedCount} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {totalCount}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleAll}
            className="h-9 px-3 text-type-helper font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white rounded-full hover:bg-slate-900/5 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer select-none shrink-0 whitespace-nowrap"
          >
            {allSelected ? (selectLabel || 'Bỏ chọn') : 'Tất cả'}
          </button>
        </div>

        {/* Khối bên phải: Danh sách các nút hành động */}
        <div className="flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">
          {children}

          {/* Nút hủy chọn / Đóng (Esc) */}
          <div className="pl-1.5 border-l border-slate-900/5 dark:border-white/10 flex items-center shrink-0">
            <button
              type="button"
              onClick={onClear}
              className="h-9 flex items-center gap-1.5 px-3 rounded-full text-slate-500 hover:bg-slate-900/5 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95 transition cursor-pointer shrink-0 select-none"
              title="Bỏ chọn tất cả (Esc)"
            >
              <X className="h-4 w-4 shrink-0" />
              <kbd className="hidden sm:inline-block text-type-helper font-semibold px-2 py-0.5 rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0">Esc</kbd>
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
        className={`group relative overflow-hidden h-9 flex items-center gap-2 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-600 text-white px-4 text-type-helper font-semibold shadow-md shadow-blue-500/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0 whitespace-nowrap select-none ${className}`}
      >
        <span className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out pointer-events-none" />
        {icon}
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  }

  if (variant === 'warning') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`h-9 flex items-center gap-2 rounded-full text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 active:scale-95 px-3.5 text-type-helper font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shrink-0 whitespace-nowrap select-none ${className}`}
      >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`h-9 flex items-center gap-2 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 active:scale-95 px-3.5 text-type-helper font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shrink-0 whitespace-nowrap select-none ${className}`}
      >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 flex items-center gap-2 rounded-full text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-900/5 dark:hover:bg-white/10 active:scale-95 px-3.5 text-type-helper font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shrink-0 whitespace-nowrap select-none ${className}`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
