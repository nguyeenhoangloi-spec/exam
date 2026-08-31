'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  unit?: string;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
  limitOptions?: number[];
  className?: string;
}

export function PaginationBar({
  page,
  totalPages,
  limit,
  totalItems,
  unit = 'mục',
  onPage,
  onLimit,
  limitOptions = [10, 20, 50, 100],
  className = '',
}: PaginationBarProps) {
  const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, totalItems);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const pages: (number | string)[] = [];
  const safeTotalPages = Math.max(1, totalPages);

  if (safeTotalPages <= 7) {
    for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(safeTotalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (page < safeTotalPages - 2) pages.push('...');
    if (!pages.includes(safeTotalPages)) pages.push(safeTotalPages);
  }

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 pb-1 ${className}`}>
      <p className="text-type-body-sm font-normal text-slate-500 dark:text-slate-400">
        Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span> -{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span> trong{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems.toLocaleString('vi-VN')}</span> {unit}
      </p>

      <div className="flex items-center gap-3">
        {/* Nút điều hướng số trang */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="ui-pressable flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 cursor-pointer disabled:cursor-not-allowed shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Trang trước"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-type-body-sm font-medium text-slate-500 dark:text-slate-400">
                  ...
                </span>
              );
            }

            const pNum = Number(p);
            const isCurrent = pNum === page;

            return (
              <button
                key={pNum}
                type="button"
                onClick={() => onPage(pNum)}
                className={`ui-pressable flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-type-body-sm transition-all duration-150 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs font-semibold dark:bg-blue-600'
                    : 'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 font-medium'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {pNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= safeTotalPages}
            onClick={() => onPage(page + 1)}
            className="ui-pressable flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 cursor-pointer disabled:cursor-not-allowed shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Trang sau"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Custom Limit Dropdown đồng bộ 100% Design System */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-9 items-center justify-between gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-3 pr-2.5 text-type-body-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Chọn số mục hiển thị trên mỗi trang"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span>{limit} / trang</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-150 ${dropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 bottom-full mb-1.5 min-w-[125px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-apple-modal z-50 animate-popover-in"
            >
              <div className="space-y-0.5">
                {limitOptions.map((opt) => {
                  const isSelected = opt === limit;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onLimit(opt);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-type-body-sm rounded-xl transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                          : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      <span>{opt} / trang</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
