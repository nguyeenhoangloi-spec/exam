'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface QuestionBankPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems?: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function QuestionBankPaginationBar({
  page,
  totalPages,
  limit,
  totalItems = 0,
  onPage,
  onLimit,
}: QuestionBankPaginationBarProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers array
  const pages: (number | string)[] = [];
  const maxDisplayed = 5;

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
      {/* Left Item Counter matching Mockup Image */}
      <p className="text-xs font-semibold text-slate-500">
        Hiển thị <span className="font-semibold text-slate-900">{startItem} - {endItem}</span> trong{' '}
        <span className="font-semibold text-slate-900">{totalItems.toLocaleString('vi-VN')}</span> câu hỏi
      </p>

      {/* Right Page Controls & Limit Selector matching Mockup Image */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page buttons */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400 font-semibold">
                ...
              </span>
            );
          }

          const isCurrent = p === page;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPage(Number(p))}
              className={`flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Rows per page limit selector */}
        <div className="relative ml-1">
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="h-8 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 cursor-pointer shadow-2xs"
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
