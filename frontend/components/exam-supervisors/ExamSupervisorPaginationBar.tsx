'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

interface ExamSupervisorPaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

export function ExamSupervisorPaginationBar({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: ExamSupervisorPaginationBarProps) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2">
      <div className="flex items-center gap-2">
        <span>
          Hiển thị <strong>{start}</strong> - <strong>{end}</strong> trên tổng số <strong>{totalItems}</strong> cán bộ
        </span>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="flex items-center gap-1.5">
          <span>Hiển thị:</span>
          <FilterSelect
            value={String(itemsPerPage)}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            options={[
              { value: '8', label: '8 / trang' },
              { value: '15', label: '15 / trang' },
              { value: '30', label: '30 / trang' },
              { value: '50', label: '50 / trang' },
            ]}
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
