'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  Zap,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';

interface StudentResultFilterPopoverProps {
  filterYear: string;
  onFilterYearChange: (val: string) => void;
  filterSemester: string;
  onFilterSemesterChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  academicYears: string[];
  results?: any[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'year' | 'semester' | 'status';

export function StudentResultFilterPopover({
  filterYear,
  onFilterYearChange,
  filterSemester,
  onFilterSemesterChange,
  filterStatus,
  onFilterStatusChange,
  academicYears = [],
  results = [],
  totalFilteredCount,
  onResetAll,
}: StudentResultFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const counts = useMemo(() => {
    let all = results.length;
    let passed = 0;
    let failed = 0;
    let grading = 0;
    let unpublished = 0;

    results.forEach((r) => {
      if (r.status === 'PASSED') passed++;
      else if (r.status === 'FAILED') failed++;
      else if (r.status === 'GRADING') grading++;
      else unpublished++;
    });

    return { all, passed, failed, grading, unpublished };
  }, [results]);

  const activeFilterCount = [
    filterYear !== 'ALL',
    filterSemester !== 'ALL',
    filterStatus !== 'ALL',
  ].filter(Boolean).length;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const width = Math.min(680, vw - margin * 2);
    let left = rect.left;
    if (left + width > vw - margin) {
      left = vw - margin - width;
    }
    left = Math.max(margin, left);

    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const maxHeight = Math.min(520, Math.max(spaceBelow, spaceAbove, 300) - 20);

    let top: number;
    if (spaceBelow >= 360 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
    } else {
      top = rect.top - 8 - maxHeight;
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const categories: { key: FilterCategory; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'presets', label: 'Bộ lọc nhanh', icon: Zap },
    {
      key: 'year',
      label: 'Năm học',
      icon: Calendar,
      badge: filterYear !== 'ALL' ? 1 : undefined,
    },
    {
      key: 'semester',
      label: 'Học kỳ',
      icon: Layers,
      badge: filterSemester !== 'ALL' ? 1 : undefined,
    },
    {
      key: 'status',
      label: 'Kết quả thi',
      icon: CheckCircle2,
      badge: filterStatus !== 'ALL' ? 1 : undefined,
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-10 px-3.5 rounded-xl border font-medium text-xs flex items-center gap-2 transition-all cursor-pointer select-none shrink-0 shadow-2xs ${
          isOpen || activeFilterCount > 0
            ? 'bg-blue-50/80 border-blue-400 text-blue-700 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/15'
            : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
        title="Mở bộ lọc nâng cao"
      >
        <SlidersHorizontal className={`h-4 w-4 ${activeFilterCount > 0 ? 'text-blue-600' : 'text-slate-500'}`} />
        <span>Bộ lọc</span>
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white px-1">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Bộ Lọc Kết Quả Thi
                </span>
                {activeFilterCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-semibold">
                    Đang bật {activeFilterCount} điều kiện
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-slate-100 dark:divide-slate-800">
              {/* Left Navigation */}
              <div className="w-48 shrink-0 bg-slate-50/40 dark:bg-slate-900/40 p-2 space-y-1 overflow-y-auto">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{cat.label}</span>
                      </div>
                      {cat.badge !== undefined && (
                        <span
                          className={`flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                            isActive ? 'bg-white/30 text-white' : 'bg-blue-600 text-white'
                          }`}
                        >
                          {cat.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Content */}
              <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-4">
                {/* PRESETS TAB */}
                {activeCategory === 'presets' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Bộ lọc nhanh theo kết quả
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onFilterStatusChange('ALL');
                          onFilterYearChange('ALL');
                          onFilterSemesterChange('ALL');
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterStatus === 'ALL' && filterYear === 'ALL' && filterSemester === 'ALL'
                            ? 'bg-blue-50/60 border-blue-500 text-blue-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Tất cả môn thi</span>
                          <span className="text-[11px] font-bold text-slate-500">{counts.all} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Toàn bộ các môn đã có kết quả</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterStatusChange('PASSED')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterStatus === 'PASSED'
                            ? 'bg-emerald-50/60 border-emerald-500 text-emerald-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600">Môn Đạt</span>
                          <span className="text-[11px] font-bold text-emerald-600">{counts.passed} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Các môn đã hoàn thành đạt chuẩn</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterStatusChange('FAILED')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterStatus === 'FAILED'
                            ? 'bg-rose-50/60 border-rose-500 text-rose-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-600">Chưa đạt</span>
                          <span className="text-[11px] font-bold text-rose-600">{counts.failed} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Cần đăng ký thi hoặc học lại</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterStatusChange('GRADING')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterStatus === 'GRADING'
                            ? 'bg-amber-50/60 border-amber-500 text-amber-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-600">Đang chấm</span>
                          <span className="text-[11px] font-bold text-amber-600">{counts.grading} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Bài thi đang được giảng viên chấm</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* YEAR TAB */}
                {activeCategory === 'year' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Chọn năm học
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onFilterYearChange('ALL')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          filterYear === 'ALL'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <span>Tất cả năm học</span>
                        {filterYear === 'ALL' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                      {academicYears.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => onFilterYearChange(yr)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                            filterYear === yr
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <span>Năm học {yr}</span>
                          {filterYear === yr && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEMESTER TAB */}
                {activeCategory === 'semester' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Chọn học kỳ
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'ALL', label: 'Tất cả học kỳ' },
                        { key: 'HK1', label: 'Học kỳ I' },
                        { key: 'HK2', label: 'Học kỳ II' },
                      ].map((sem) => (
                        <button
                          key={sem.key}
                          type="button"
                          onClick={() => onFilterSemesterChange(sem.key)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                            filterSemester === sem.key
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <span>{sem.label}</span>
                          {filterSemester === sem.key && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STATUS TAB */}
                {activeCategory === 'status' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Trạng thái kết quả
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'ALL', label: 'Tất cả trạng thái', count: counts.all, icon: Zap },
                        { key: 'PASSED', label: 'Môn Đạt (>= 4.0)', count: counts.passed, icon: CheckCircle2, color: 'text-emerald-600' },
                        { key: 'FAILED', label: 'Chưa đạt (< 4.0)', count: counts.failed, icon: XCircle, color: 'text-rose-600' },
                        { key: 'GRADING', label: 'Đang chấm điểm', count: counts.grading, icon: Loader2, color: 'text-amber-600' },
                        { key: 'UNPUBLISHED', label: 'Chờ công bố', count: counts.unpublished, icon: Clock, color: 'text-slate-500' },
                      ].map((st) => {
                        const Icon = st.icon;
                        const isSel = filterStatus === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => onFilterStatusChange(st.key)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                              isSel
                                ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${st.color || 'text-blue-600'}`} />
                              <span>{st.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-semibold">{st.count}</span>
                              {isSel && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
              <span className="text-xs font-medium text-slate-500">
                Tìm thấy{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                  {totalFilteredCount ?? results.length}
                </strong>{' '}
                kết quả
              </span>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
