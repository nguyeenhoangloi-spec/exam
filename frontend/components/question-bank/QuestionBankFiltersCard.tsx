'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, RotateCcw, ChevronDown } from 'lucide-react';
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
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition cursor-pointer appearance-none';

const labelCls = 'block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1';

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

  const handleChange = (key: keyof QuestionBankFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleApplySearch = () => {
    onChange({ ...filters, search: localSearch });
  };

  // Detect active filters count
  const activeFilters = Object.entries(filters).filter(([k, v]) => Boolean(v));

  const getSubjectName = (id: string) => {
    const s = subjects.find((sub) => String(sub.id) === String(id));
    return s ? s.subjectName : id;
  };

  const getDifficultyLabel = (diff: string) => {
    if (diff === 'EASY') return 'Dễ';
    if (diff === 'MEDIUM') return 'Trung bình';
    if (diff === 'HARD') return 'Khó';
    return diff;
  };

  const getTypeLabel = (t: string) => {
    if (t === 'SINGLE_CHOICE') return 'Trắc nghiệm';
    if (t === 'MULTIPLE_CHOICE') return 'Nhiều đáp án';
    if (t === 'TRUE_FALSE') return 'Đúng / Sai';
    if (t === 'FILL_BLANK') return 'Điền chỗ trống';
    if (t === 'ESSAY') return 'Tự luận';
    return t;
  };

  const getStatusLabel = (st: string) => {
    if (st === 'APPROVED') return 'Đã duyệt';
    if (st === 'PENDING') return 'Chờ duyệt';
    if (st === 'REJECTED') return 'Bị từ chối';
    if (st === 'DRAFT') return 'Nháp';
    return st;
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Row 1 — 4 columns */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div>
          <label className={labelCls}>Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocalSearch(val);
                handleChange('search', val);
              }}
              placeholder="Tìm theo nội dung, mã câu..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition placeholder:text-slate-400"
            />
            {localSearch ? (
              <button
                type="button"
                onClick={() => { setLocalSearch(''); handleChange('search', ''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Môn học */}
        <div>
          <label className={labelCls}>Môn học</label>
          <div className="relative">
            <select
              value={filters.subjectId}
              onChange={(e) => handleChange('subjectId', e.target.value)}
              className={selectCls}
            >
              <option value="">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Chủ đề / Phân loại */}
        <div>
          <label className={labelCls}>Chủ đề</label>
          <div className="relative">
            <select
              value={filters.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              className={selectCls}
            >
              <option value="">Tất cả chủ đề</option>
              <option value="Topic1">Lý thuyết cơ bản</option>
              <option value="Topic2">Bài tập ứng dụng</option>
              <option value="Topic3">Nâng cao</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Độ khó */}
        <div>
          <label className={labelCls}>Độ khó</label>
          <div className="relative">
            <select
              value={filters.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className={selectCls}
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2 — 4 columns */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Trạng thái */}
        <div>
          <label className={labelCls}>Trạng thái</label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className={selectCls}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="DRAFT">Nháp</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Loại câu hỏi */}
        <div>
          <label className={labelCls}>Loại câu hỏi</label>
          <div className="relative">
            <select
              value={filters.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className={selectCls}
            >
              <option value="">Tất cả loại câu hỏi</option>
              <option value="SINGLE_CHOICE">Trắc nghiệm</option>
              <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="FILL_BLANK">Điền vào chỗ trống</option>
              <option value="ESSAY">Tự luận</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Người tạo */}
        <div>
          <label className={labelCls}>Người tạo</label>
          <div className="relative">
            <select
              value={filters.creator}
              onChange={(e) => handleChange('creator', e.target.value)}
              className={selectCls}
            >
              <option value="">Tất cả người tạo</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="TEACHER">Giảng viên</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Ngày tạo */}
        <div>
          <label className={labelCls}>Ngày tạo</label>
          <input
            type="date"
            value={filters.dateRange}
            onChange={(e) => handleChange('dateRange', e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition cursor-pointer"
          />
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-400" /> Bộ lọc đang chọn:
          </span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
              Từ khóa: <strong className="font-bold">{filters.search}</strong>
              <button type="button" onClick={() => { setLocalSearch(''); handleChange('search', ''); }} className="text-slate-400 hover:text-rose-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {filters.subjectId && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
              Môn: <strong className="font-bold">{getSubjectName(filters.subjectId)}</strong>
              <button type="button" onClick={() => handleChange('subjectId', '')} className="text-slate-400 hover:text-rose-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {filters.difficulty && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
              Độ khó: <strong className="font-bold">{getDifficultyLabel(filters.difficulty)}</strong>
              <button type="button" onClick={() => handleChange('difficulty', '')} className="text-slate-400 hover:text-rose-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
              Loại: <strong className="font-bold">{getTypeLabel(filters.type)}</strong>
              <button type="button" onClick={() => handleChange('type', '')} className="text-slate-400 hover:text-rose-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
              Trạng thái: <strong className="font-bold">{getStatusLabel(filters.status)}</strong>
              <button type="button" onClick={() => handleChange('status', '')} className="text-slate-400 hover:text-rose-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {filters.dateRange && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
              Ngày: <strong className="font-bold">{filters.dateRange}</strong>
              <button type="button" onClick={() => handleChange('dateRange', '')} className="text-slate-400 hover:text-rose-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
