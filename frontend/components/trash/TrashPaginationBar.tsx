'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface TrashPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  categoryLabel?: string;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function TrashPaginationBar({
  page,
  totalPages,
  limit,
  totalItems,
  categoryLabel = 'mục',
  onPage,
  onLimit,
}: TrashPaginationBarProps) {
  const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, totalItems);

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3">
      <p className="text-xs font-semibold text-slate-500">
        Hiển thị <span className="font-extrabold text-slate-900">{startItem}</span> -{' '}
        <span className="font-extrabold text-slate-900">{endItem}</span> trong{' '}
        <span className="font-extrabold text-slate-900">{totalItems.toLocaleString('vi-VN')}</span> {categoryLabel}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-xs font-bold text-slate-400">
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
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-xs font-extrabold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
