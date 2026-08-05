'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Filter, Calendar, X } from 'lucide-react';
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

export function QuestionBankFiltersCard({
  filters,
  subjects,
  onChange,
  onReset,
}: QuestionBankFiltersCardProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleChange = (key: keyof QuestionBankFilterValues, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleApplySearch = () => {
    onChange({
      ...filters,
      search: localSearch,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* 2 Symmetrical Rows of 4 Equal Columns Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1, Col 1: Search */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplySearch();
              }}
              placeholder="Tìm theo nội dung, mã câu hỏi..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-400"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  handleChange('search', '');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 1, Col 2: Môn học */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Môn học</label>
          <div className="relative">
            <select
              value={filters.subjectId}
              onChange={(e) => handleChange('subjectId', e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 1, Col 3: Chủ đề */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Chủ đề</label>
          <div className="relative">
            <select
              value={filters.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả chủ đề</option>
              <option value="Topic1">Lý thuyết cơ bản</option>
              <option value="Topic2">Bài tập ứng dụng</option>
              <option value="Topic3">Nâng cao</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 1, Col 4: Độ khó */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Độ khó</label>
          <div className="relative">
            <select
              value={filters.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 2, Col 1: Trạng thái */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Trạng thái</label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="DRAFT">Nháp</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 2, Col 2: Loại câu hỏi */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Loại câu hỏi</label>
          <div className="relative">
            <select
              value={filters.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả loại câu hỏi</option>
              <option value="SINGLE_CHOICE">Trắc nghiệm</option>
              <option value="ESSAY">Tự luận</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 2, Col 3: Người tạo */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Người tạo</label>
          <div className="relative">
            <select
              value={filters.creator}
              onChange={(e) => handleChange('creator', e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả người tạo</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="TEACHER">Giảng viên</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 2, Col 4: Ngày tạo */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Ngày tạo</label>
          <div className="relative">
            <input
              type="date"
              value={filters.dateRange}
              onChange={(e) => handleChange('dateRange', e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Filter Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Hiển thị bộ lọc</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onReset();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
            <span>Xóa bộ lọc</span>
          </button>

          <button
            type="button"
            onClick={handleApplySearch}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
