'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
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

const selectCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition cursor-pointer appearance-none';

const labelCls = 'block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1';

const DIFFICULTY_LABELS: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
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
  DRAFT: 'Nháp',
};

export function QuestionBankFiltersCard({ filters, subjects, onChange, onReset }: QuestionBankFiltersCardProps) {
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
    { key: 'type', label: 'Loai', getVal: (v) => TYPE_LABELS[v] ?? v },
    { key: 'status', label: 'Trạng thái', getVal: (v) => STATUS_LABELS[v] ?? v },
    { key: 'creator', label: 'Người tạo', getVal: (v) => (v === 'ADMIN' ? 'Quản trị viên' : v === 'TEACHER' ? 'Giảng viên' : v) },
    { key: 'dateRange', label: 'Ngày tạo', getVal: (v) => v },
  ];

  const activeChips = CHIP_MAP.filter(({ key }) => Boolean(filters[key]));
  const hasActive = activeChips.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
          </span>
          <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-600">Bộ lọc tìm kiếm</span>
          {hasActive && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
              {activeChips.length}
            </span>
          )}
        </div>
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            Xoá bộ lọc
          </button>
        )}
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-1 lg:col-span-2">
          <label className={labelCls}>Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => { setLocalSearch(e.target.value); set('search', e.target.value); }}
              placeholder="Nội dung, mã câu hỏi..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition placeholder:text-slate-400 placeholder:font-normal"
            />
            {localSearch ? (
              <button type="button" onClick={() => { setLocalSearch(''); set('search', ''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Môn học</label>
          <div className="relative">
            <select value={filters.subjectId} onChange={(e) => set('subjectId', e.target.value)} className={selectCls}>
              <option value="">Tất cả</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.subjectName}</option>))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Độ khó</label>
          <div className="relative">
            <select value={filters.difficulty} onChange={(e) => set('difficulty', e.target.value)} className={selectCls}>
              <option value="">Tất cả</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung binh</option>
              <option value="HARD">Khó</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Loại câu hỏi</label>
          <div className="relative">
            <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={selectCls}>
              <option value="">Tất cả</option>
              <option value="SINGLE_CHOICE">Trac nghiem</option>
              <option value="MULTIPLE_CHOICE">Nhieu dap an</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="FILL_BLANK">Dien khuyet</option>
              <option value="ESSAY">Tu luan</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Trạng thái</label>
          <div className="relative">
            <select value={filters.status} onChange={(e) => set('status', e.target.value)} className={selectCls}>
              <option value="">Tất cả</option>
              <option value="APPROVED">Da duyet</option>
              <option value="PENDING">Cho duyet</option>
              <option value="REJECTED">Bi tu choi</option>
              <option value="DRAFT">Nhap</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {hasActive && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-t border-slate-100 bg-blue-50/40">
          {activeChips.map(({ key, label, getVal }) => (
            <span key={key} className="inline-flex items-center gap-1 rounded-full bg-white border border-blue-200 px-2.5 py-0.5 text-[10.5px] font-semibold text-blue-700 shadow-sm">
              <span className="text-blue-400 font-bold">{label}:</span>
              {getVal(filters[key])}
              <button type="button" onClick={() => { if (key === 'search') setLocalSearch(''); set(key, ''); }} className="ml-0.5 text-blue-400 hover:text-rose-500 transition">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
