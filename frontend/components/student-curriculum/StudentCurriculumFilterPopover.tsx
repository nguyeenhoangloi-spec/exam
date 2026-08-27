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
  BookOpen,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface StudentCurriculumFilterPopoverProps {
  filterSemester: string;
  onFilterSemesterChange: (val: string) => void;
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  semesters: (string | number)[];
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

    const semesterCounts: Record<string, number> = {};

    curriculumList.forEach((c) => {
      if (c.type === 'MANDATORY') mandatory++;
      if (c.type === 'ELECTIVE') elective++;
      if (c.isCompleted) completed++;
      else incomplete++;

      if (c.semester) {
        semesterCounts[c.semester] = (semesterCounts[c.semester] || 0) + 1;
      }
    });

    return { all, mandatory, elective, completed, incomplete, semesterCounts };
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

    const popoverWidth = Math.min(500, vw - margin * 2);
    const top = rect.bottom + 8;
    const availableMaxHeight = Math.min(480, Math.max(260, vh - top - margin));

    let left = rect.left;
    if (left + popoverWidth > vw - margin) {
      left = Math.max(margin, vw - popoverWidth - margin);
    }
    if (left < margin) {
      left = margin;
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxHeight: `${availableMaxHeight}px`,
      maxWidth: `calc(100vw - ${margin * 2}px)`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      else if (e.key === '1') setActiveCategory('presets');
      else if (e.key === '2') setActiveCategory('semester');
      else if (e.key === '3') setActiveCategory('type');
      else if (e.key === '4') setActiveCategory('status');
    };

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const categories = [
    { id: 'presets' as FilterCategory, label: 'Lọc nhanh', shortcut: '1', icon: Zap },
    {
      id: 'semester' as FilterCategory,
      label: 'Học kỳ',
      shortcut: '2',
      icon: Layers,
      badge: filterSemester !== 'ALL' ? 1 : undefined,
    },
    {
      id: 'type' as FilterCategory,
      label: 'Loại môn học',
      shortcut: '3',
      icon: BookOpen,
      badge: filterType !== 'ALL' ? 1 : undefined,
    },
    {
      id: 'status' as FilterCategory,
      label: 'Tiến độ',
      shortcut: '4',
      icon: CheckCircle2,
      badge: filterStatus !== 'ALL' ? 1 : undefined,
    },
  ];

  return (
    <div className="relative inline-flex items-center">
      {/* ── Nút kích hoạt SlidersHorizontal thuần túy không khung viền nhúng trong Search Bar ── */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors cursor-pointer select-none ${
          activeFilterCount > 0
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
        }`}
        title="Bộ lọc chương trình đào tạo"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />

        {activeFilterCount > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onResetAll();
            }}
            title="Nhấn để xóa nhanh toàn bộ lọc (1-Click Reset)"
            className="table-badge absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-type-helper font-semibold text-white hover:bg-rose-500 transition-colors shadow-2xs"
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* ── Bảng Popover 2 Cột Đồng Bộ Chuẩn Question Bank ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc khung chương trình đào tạo"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Bộ lọc chương trình đào tạo
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Lọc danh sách học phần theo học kỳ &amp; điều kiện tích lũy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex items-center gap-1.5 text-type-helper font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    title="Xóa tất cả bộ lọc đang áp dụng"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại ({activeFilterCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Thân bảng 2 cột */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Cột Trái (Sidebar Tabs) */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-type-helper transition-all duration-150 cursor-pointer ${isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>

                      {cat.badge ? (
                        <span className="h-4 min-w-[16px] rounded-full bg-blue-600 px-1 text-type-helper font-semibold text-white flex items-center justify-center">
                          {cat.badge}
                        </span>
                      ) : (
                        <span className={`text-type-helper font-normal ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                          {cat.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 px-2">
                  <div className="text-type-helper text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <span>Phím:</span>
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-type-helper text-slate-600 dark:text-slate-400">1-4</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-type-helper font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý bộ lọc phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => onFilterStatusChange('COMPLETED')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterStatus === 'COMPLETED'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Học phần đã hoàn thành
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Đã học và đạt điểm tích lũy
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.completed}
                        </span>
                        {filterStatus === 'COMPLETED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterStatusChange('INCOMPLETE')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterStatus === 'INCOMPLETE'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Học phần chưa hoàn thành
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Cần đăng ký học và thi
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === 'INCOMPLETE'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.incomplete}
                        </span>
                        {filterStatus === 'INCOMPLETE' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterTypeChange('MANDATORY')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterType === 'MANDATORY'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Các môn Bắt buộc
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Học phần tiên quyết theo chuyên ngành
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === 'MANDATORY'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.mandatory}
                        </span>
                        {filterType === 'MANDATORY' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: HỌC KỲ ── */}
                {activeCategory === 'semester' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterSemesterChange('ALL')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterSemester === 'ALL'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả các học kỳ
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Toàn bộ lộ trình đào tạo
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterSemester === 'ALL'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.all}
                        </span>
                        {filterSemester === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {semesters.map((sem) => {
                      const semStr = sem.toString();
                      const isSelected = filterSemester === semStr;
                      const c = counts.semesterCounts[semStr] || 0;
                      return (
                        <button
                          key={semStr}
                          type="button"
                          onClick={() => onFilterSemesterChange(semStr)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                              Học kỳ {semStr}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              Khối kiến thức kỳ {semStr}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                                : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                              }`}>
                              {c}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 3: LOẠI MÔN HỌC ── */}
                {activeCategory === 'type' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterTypeChange('ALL')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterType === 'ALL'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả loại môn học
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Bắt buộc &amp; Tự chọn
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === 'ALL'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.all}
                        </span>
                        {filterType === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterTypeChange('MANDATORY')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterType === 'MANDATORY'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Môn Bắt buộc
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Bắt buộc phải tích lũy
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === 'MANDATORY'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.mandatory}
                        </span>
                        {filterType === 'MANDATORY' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterTypeChange('ELECTIVE')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterType === 'ELECTIVE'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Môn Tự chọn
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Lựa chọn theo định hướng chuyên sâu
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === 'ELECTIVE'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.elective}
                        </span>
                        {filterType === 'ELECTIVE' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 4: TIẾN ĐỘ ── */}
                {activeCategory === 'status' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterStatusChange('ALL')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterStatus === 'ALL'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả tiến độ
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Toàn bộ học phần
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === 'ALL'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.all}
                        </span>
                        {filterStatus === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterStatusChange('COMPLETED')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterStatus === 'COMPLETED'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Đã hoàn thành
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Đã tích lũy đủ tín chỉ
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.completed}
                        </span>
                        {filterStatus === 'COMPLETED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterStatusChange('INCOMPLETE')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filterStatus === 'INCOMPLETE'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Chưa hoàn thành
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Chưa học hoặc chưa đạt điểm tích lũy
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === 'INCOMPLETE'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.incomplete}
                        </span>
                        {filterStatus === 'INCOMPLETE' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer tinh gọn & thanh lịch */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                {activeFilterCount > 0 ? (
                  <>Đang áp dụng <strong className="font-semibold text-blue-600 dark:text-blue-400">{activeFilterCount}</strong> tiêu chí lọc</>
                ) : (
                  'Toàn bộ khung chương trình'
                )}
              </div>

              <span className="text-type-helper text-slate-400 dark:text-slate-500">
                Nhấn Esc hoặc click ra ngoài để đóng
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
