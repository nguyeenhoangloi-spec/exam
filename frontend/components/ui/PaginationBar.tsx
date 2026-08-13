'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterSelect } from './FilterSelect';

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
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3.5 pb-1 ${className}`}>
      <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
        Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span> -{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span> trong{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems.toLocaleString('vi-VN')}</span> {unit}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 cursor-pointer disabled:cursor-not-allowed shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Trang trước"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-sm font-medium text-slate-500 dark:text-slate-400">
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
                className={`flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2.5 text-sm transition cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs font-semibold dark:bg-blue-600'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 font-medium'
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
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 cursor-pointer disabled:cursor-not-allowed shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Trang sau"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <FilterSelect
          size="sm"
          value={limit}
          onChange={(e) => onLimit(Number(e.target.value))}
        >
          {limitOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / trang
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  );
}
