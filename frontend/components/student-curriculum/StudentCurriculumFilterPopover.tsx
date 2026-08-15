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
  Layers,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface StudentCurriculumFilterPopoverProps {
  filterSemester: string;
  onFilterSemesterChange: (val: string) => void;
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  semesters: number[];
  curriculumList?: any[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'semester' | 'type' | 'status';

export function StudentCurriculumFilterPopover({
  filterSemester,
  onFilterSemesterChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  semesters = [],
  curriculumList = [],
  totalFilteredCount,
  onResetAll,
}: StudentCurriculumFilterPopoverProps) {
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
    let all = curriculumList.length;
    let mandatory = 0;
    let elective = 0;
    let completed = 0;
    let incomplete = 0;

    curriculumList.forEach((c) => {
      if (c.type === 'MANDATORY') mandatory++;
      if (c.type === 'ELECTIVE') elective++;
      if (c.isCompleted) completed++;
      else incomplete++;
    });

    return { all, mandatory, elective, completed, incomplete };
  }, [curriculumList]);

  const activeFilterCount = [
    filterSemester !== 'ALL',
    filterType !== 'ALL',
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
      key: 'semester',
      label: 'Học kỳ',
      icon: Layers,
      badge: filterSemester !== 'ALL' ? 1 : undefined,
    },
    {
      key: 'type',
      label: 'Loại môn học',
      icon: BookOpen,
      badge: filterType !== 'ALL' ? 1 : undefined,
    },
    {
      key: 'status',
      label: 'Trạng thái',
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
                  Bộ Lọc Khung Chương Trình
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
                      Bộ lọc nhanh môn học
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onFilterSemesterChange('ALL');
                          onFilterTypeChange('ALL');
                          onFilterStatusChange('ALL');
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterSemester === 'ALL' && filterType === 'ALL' && filterStatus === 'ALL'
                            ? 'bg-blue-50/60 border-blue-500 text-blue-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Tất cả môn học</span>
                          <span className="text-[11px] font-bold text-slate-500">{counts.all} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Toàn bộ chương trình đào tạo</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterTypeChange('MANDATORY')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterType === 'MANDATORY'
                            ? 'bg-blue-50/60 border-blue-500 text-blue-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600">Môn bắt buộc</span>
                          <span className="text-[11px] font-bold text-blue-600">{counts.mandatory} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Khối kiến thức bắt buộc tích lũy</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterTypeChange('ELECTIVE')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterType === 'ELECTIVE'
                            ? 'bg-purple-50/60 border-purple-500 text-purple-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-600">Môn tự chọn</span>
                          <span className="text-[11px] font-bold text-purple-600">{counts.elective} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Khối kiến thức chuyên ngành tự chọn</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterStatusChange('COMPLETED')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          filterStatus === 'COMPLETED'
                            ? 'bg-emerald-50/60 border-emerald-500 text-emerald-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600">Đã hoàn thành</span>
                          <span className="text-[11px] font-bold text-emerald-600">{counts.completed} môn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Các môn đã thi đạt tín chỉ</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* SEMESTER TAB */}
                {activeCategory === 'semester' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Chọn học kỳ đào tạo
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => onFilterSemesterChange('ALL')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          filterSemester === 'ALL'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <span>Tất cả học kỳ</span>
                        {filterSemester === 'ALL' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                      {semesters.map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => onFilterSemesterChange(String(sem))}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                            filterSemester === String(sem)
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <span>Học kỳ {sem}</span>
                          {filterSemester === String(sem) && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TYPE TAB */}
                {activeCategory === 'type' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Phân loại môn học
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'ALL', label: 'Tất cả loại môn', count: counts.all },
                        { key: 'MANDATORY', label: 'Môn học bắt buộc', count: counts.mandatory },
                        { key: 'ELECTIVE', label: 'Môn học tự chọn', count: counts.elective },
                      ].map((t) => {
                        const isSel = filterType === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => onFilterTypeChange(t.key)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                              isSel
                                ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                            }`}
                          >
                            <span className={isSel ? 'font-semibold text-blue-700' : ''}>{t.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-semibold">{t.count}</span>
                              {isSel && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STATUS TAB */}
                {activeCategory === 'status' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Trạng thái tích lũy
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'ALL', label: 'Tất cả trạng thái', count: counts.all },
                        { key: 'COMPLETED', label: 'Đã hoàn thành', count: counts.completed, color: 'text-emerald-600' },
                        { key: 'INCOMPLETE', label: 'Chưa tích lũy', count: counts.incomplete, color: 'text-slate-500' },
                      ].map((st) => {
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
                            <span className={isSel ? 'font-semibold text-blue-700' : ''}>{st.label}</span>
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
                  {totalFilteredCount ?? curriculumList.length}
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
