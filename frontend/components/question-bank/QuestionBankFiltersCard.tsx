'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';
import { Button } from '../ui/Button';
import { Subject } from '../../types';

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
  onChange,
  onReset,
}: QuestionBankFiltersCardProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

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
      {/* 1. Flattened Filter Toolbar (1 Hàng ngang phẳng chuẩn Golden Master) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5">
        {/* Search Input Field */}
        <div className="relative flex-1 w-full min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              set('search', e.target.value);
            }}
            placeholder="Tìm theo nội dung, mã câu hỏi..."
            className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-9 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                set('search', '');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              title="Xoá từ khoá"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Chọn Môn học */}
          <FilterSelect
            size="md"
            value={filters.subjectId}
            onChange={(e) => set('subjectId', e.target.value)}
          >
            <option value="">Tất cả môn học</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectName}
              </option>
            ))}
          </FilterSelect>

          {/* Chọn Độ khó */}
          <FilterSelect
            size="md"
            value={filters.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </FilterSelect>

          {/* Chọn Loại câu hỏi */}
          <FilterSelect
            size="md"
            value={filters.type}
            onChange={(e) => set('type', e.target.value)}
          >
            <option value="">Tất cả loại câu</option>
            <option value="SINGLE_CHOICE">Trắc nghiệm</option>
            <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
            <option value="TRUE_FALSE">Đúng / Sai</option>
            <option value="FILL_BLANK">Điền khuyết</option>
            <option value="ESSAY">Tự luận</option>
          </FilterSelect>

          {/* Chọn Mức độ Bloom */}
          <FilterSelect
            size="md"
            value={filters.bloomLevel}
            onChange={(e) => set('bloomLevel', e.target.value)}
          >
            <option value="">Mức độ Bloom</option>
            <option value="REMEMBER">Nhận biết</option>
            <option value="UNDERSTAND">Thông hiểu</option>
            <option value="APPLY">Vận dụng</option>
            <option value="ANALYZE">Phân tích</option>
          </FilterSelect>

          {/* Nút Xoá lọc nhanh khi có tiêu chí active */}
          {hasActive && (
            <button
              type="button"
              onClick={onReset}
              className="ui-pressable inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-[15px] font-semibold bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Xoá tất cả bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xoá lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Active Filter Badges Bar (Dòng chip tag nhỏ gọn khi đang lọc) */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-[13px] font-medium text-slate-500">Đang lọc theo:</span>
          {activeChips.map(({ key, label, getVal }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-[12px] font-semibold text-blue-700 shadow-2xs"
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
