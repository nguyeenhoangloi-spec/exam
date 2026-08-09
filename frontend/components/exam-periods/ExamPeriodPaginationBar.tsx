'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface ExamPeriodPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamPeriodPaginationBar({
  page,
  totalPages,
  limit,
  totalItems,
  onPage,
  onLimit,
}: ExamPeriodPaginationBarProps) {
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
      <p className="text-[14px] font-normal text-[#64748B]">
        Hiển thị <span className="font-semibold text-[#0F172A]">{startItem}</span> -{' '}
        <span className="font-semibold text-[#0F172A]">{endItem}</span> trong{' '}
        <span className="font-semibold text-[#0F172A]">{totalItems.toLocaleString('vi-VN')}</span> kỳ thi
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-[14px] font-medium text-[#64748B]">
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
                className={`flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2.5 text-[14px] font-medium transition cursor-pointer shadow-2xs ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                    : 'border border-slate-200 bg-white text-[#334155] hover:bg-slate-50'
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
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 py-1.5 text-[14px] font-medium text-[#0F172A] outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value={8}>8 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
        </div>
      </div>
    </div>
  );
}
