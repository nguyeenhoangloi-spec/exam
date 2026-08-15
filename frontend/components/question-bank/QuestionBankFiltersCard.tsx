'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Subject, Question } from '../../types';
import { QuestionBankFilterPopover } from './QuestionBankFilterPopover';

export interface QuestionBankFilterValues {
  search: string;
  subjectId: string;
  chapterId: string;
  topic: string;
  difficulty: string;
  status: string;
  creator: string;
  dateRange: string;
  type: string;
  bloomLevel: string;
}

interface QuestionBankFiltersCardProps {
  filters: QuestionBankFilterValues;
  subjects: Subject[];
  questions?: Question[];
  onChange: (next: QuestionBankFilterValues) => void;
  onReset: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  FILL_BLANK: 'Điền khuyết',
  ESSAY: 'Tự luận',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Bị từ chối',
  DRAFT: 'Bản nháp',
};

const BLOOM_LABELS: Record<string, string> = {
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
};

export function QuestionBankFiltersCard({
  filters,
  subjects,
  questions = [],
  onChange,
  onReset,
}: QuestionBankFiltersCardProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const set = (key: keyof QuestionBankFilterValues, value: string) =>
    onChange({ ...filters, [key]: value });

  const CHIP_MAP: { key: keyof QuestionBankFilterValues; label: string; getVal: (v: string) => string }[] = [
    { key: 'search', label: 'Từ khóa', getVal: (v) => v },
    { key: 'subjectId', label: 'Môn học', getVal: (v) => subjects.find((s) => String(s.id) === v)?.subjectName ?? v },
    { key: 'difficulty', label: 'Độ khó', getVal: (v) => DIFFICULTY_LABELS[v] ?? v },
    { key: 'type', label: 'Loại câu', getVal: (v) => TYPE_LABELS[v] ?? v },
    { key: 'bloomLevel', label: 'Bloom', getVal: (v) => BLOOM_LABELS[v] ?? v },
    { key: 'status', label: 'Trạng thái', getVal: (v) => STATUS_LABELS[v] ?? v },
  ];

  const activeChips = CHIP_MAP.filter(({ key }) => Boolean(filters[key]));
  const hasActive = activeChips.length > 0;

  return (
    <div className="space-y-2.5">
      {/* 1. Unified Search + Filter Popover Row */}
      <div className="flex items-center gap-2 max-w-2xl">
        {/* Search Input Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              set('search', e.target.value);
            }}
            placeholder="Tìm theo nội dung, mã câu hỏi..."
            className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                set('search', '');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Xoá từ khoá"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd
              className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-[12px] text-slate-400 select-none cursor-pointer"
              onClick={() => searchInputRef.current?.focus()}
              title="Nhấn phím / để tìm nhanh"
            >
              /
            </kbd>
          )}
        </div>

        {/* 1 Nút Bộ Lọc Duy Nhất Đa Chiều */}
        <QuestionBankFilterPopover
          filters={filters}
          onChange={onChange}
          subjects={subjects}
          questions={questions}
          totalFilteredCount={questions.length}
          onResetAll={onReset}
        />
      </div>

      {/* 2. Active Filter Badges Bar (Dòng chip tag nhỏ gọn khi đang lọc) */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs font-medium text-slate-500">Đang lọc theo:</span>
          {activeChips.map(({ key, label, getVal }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs"
            >
              <span className="text-blue-500 font-medium">{label}:</span>
              <span>{getVal(filters[key])}</span>
              <button
                type="button"
                onClick={() => {
                  if (key === 'search') setLocalSearch('');
                  set(key, '');
                }}
                className="text-blue-400 hover:text-rose-600 transition cursor-pointer ml-0.5"
                title={`Bỏ lọc ${label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
