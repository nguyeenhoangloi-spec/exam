'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  Calendar,
  BookOpen,
  Building2,
  GraduationCap,
  Zap,
  Filter,
  CheckCheck,
} from 'lucide-react';

interface ExamReportFilterPopoverProps {
  summaryFilters: {
    examPeriodId: string;
    subjectId: string;
    departmentId: string;
    classId: string;
    fromDate: string;
    toDate: string;
  };
  setSummaryFilters: React.Dispatch<React.SetStateAction<{
    examPeriodId: string;
    subjectId: string;
    departmentId: string;
    classId: string;
    fromDate: string;
    toDate: string;
  }>>;
  summaryOptions?: {
    classes?: Array<{ id: number; name: string }>;
    periods?: Array<{ id: number; name: string }>;
    subjects?: Array<{ id: number; code: string; name: string }>;
    departments?: Array<{ id: number; name: string }>;
  };
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'periods' | 'subjects' | 'departments' | 'classes' | 'dates';

export function ExamReportFilterPopover({
  summaryFilters,
  setSummaryFilters,
  summaryOptions,
  onResetAll,
}: ExamReportFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFilterCount = [
    summaryFilters?.examPeriodId && summaryFilters.examPeriodId !== 'ALL',
    summaryFilters?.subjectId && summaryFilters.subjectId !== 'ALL',
    summaryFilters?.departmentId && summaryFilters.departmentId !== 'ALL',
    summaryFilters?.classId && summaryFilters.classId !== 'ALL',
    Boolean(summaryFilters?.fromDate),
    Boolean(summaryFilters?.toDate),
  ].filter(Boolean).length;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(500, vw - margin * 2);
    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const preferUpward = spaceBelow < 370 && spaceAbove > spaceBelow;

    let top: number;
    let availableMaxHeight: number;

    if (preferUpward) {
      availableMaxHeight = Math.min(460, spaceAbove - 8);
      top = Math.max(margin, rect.top - availableMaxHeight - 8);
    } else {
      top = rect.bottom + 8;
      availableMaxHeight = Math.min(460, spaceBelow - 8);
    }

    let left = rect.left;
    if (left + popoverWidth > vw - margin) {
      left = Math.max(margin, vw - popoverWidth - margin);
    }
    if (left < margin) {
      left = margin;
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${Math.max(margin, top)}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxHeight: `${Math.max(280, availableMaxHeight)}px`,
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
      else if (e.key === '2') setActiveCategory('periods');
      else if (e.key === '3') setActiveCategory('subjects');
      else if (e.key === '4') setActiveCategory('departments');
      else if (e.key === '5') setActiveCategory('classes');
    };

    const handleResize = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Khóa cuộn trang nền có bù trừ thanh cuộn (0 layout shift)
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const categories = [
    { id: 'presets' as FilterCategory, label: 'Lọc nhanh', shortcut: '1', icon: Zap, badge: null },
    { id: 'periods' as FilterCategory, label: 'Kỳ thi', shortcut: '2', icon: Calendar, badge: summaryFilters.examPeriodId !== 'ALL' ? '1' : null },
    { id: 'subjects' as FilterCategory, label: 'Môn học', shortcut: '3', icon: BookOpen, badge: summaryFilters.subjectId !== 'ALL' ? '1' : null },
    { id: 'departments' as FilterCategory, label: 'Khoa', shortcut: '4', icon: Building2, badge: summaryFilters.departmentId !== 'ALL' ? '1' : null },
    { id: 'classes' as FilterCategory, label: 'Lớp học', shortcut: '5', icon: GraduationCap, badge: summaryFilters.classId !== 'ALL' ? '1' : null },
  ];

  return (
    <div className="relative inline-block">
      {/* ── Nút kích hoạt Bộ lọc cố định chiều rộng 100% ── */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-10 w-[116px] shrink-0 items-center justify-between rounded-xl border px-3 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs select-none ${
          activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15 font-bold'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        title="Mở bảng điều khiển bộ lọc báo cáo"
      >
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal
            className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
              activeFilterCount > 0
                ? 'text-blue-600 dark:text-blue-400 stroke-[2.3]'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 group-hover:scale-105'
            }`}
          />
          <span>Bộ lọc</span>
        </div>

        {/* Cột phải kích thước cố định */}
        <div className="flex h-5 w-5 items-center justify-center shrink-0">
          {activeFilterCount > 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onResetAll();
              }}
              title="Nhấn để xóa nhanh toàn bộ lọc (1-Click Reset)"
              className="group/badge relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 hover:bg-rose-500 text-[10.5px] font-bold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <span className="group-hover/badge:hidden">{activeFilterCount}</span>
              <X className="hidden h-3 w-3 group-hover/badge:block stroke-[3]" />
            </div>
          ) : (
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* ── Bảng Popover 2 Cột Đồng Bộ & Chuẩn Mực ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc phạm vi báo cáo"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
                    Phạm vi thống kê
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Lọc dữ liệu tổng hợp & bảng điểm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Xóa tất cả bộ lọc đang áp dụng"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại ({activeFilterCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Thân bảng: Bố cục 2 Cột Đồng Bộ Tuyệt Đối */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Cột Trái (Sidebar Danh mục Tabs) */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer border ${
                        isActive
                          ? 'border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>

                      {cat.badge ? (
                        <span className="h-4 min-w-[16px] rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                          {cat.badge}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-mono ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                          {cat.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 px-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <span>Phím:</span>
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[9px] text-slate-600 dark:text-slate-400">1-5</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý phạm vi báo cáo:
                    </p>

                    {summaryOptions?.periods && summaryOptions.periods[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryFilters((f) => ({ ...f, examPeriodId: String(summaryOptions.periods![0].id) }));
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                          summaryFilters.examPeriodId === String(summaryOptions.periods[0].id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-bold ${summaryFilters.examPeriodId === String(summaryOptions.periods[0].id) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            Kỳ thi: {summaryOptions.periods[0].name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Kỳ thi mới nhất trong hệ thống
                          </div>
                        </div>

                        {summaryFilters.examPeriodId === String(summaryOptions.periods[0].id) && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    )}

                    {summaryOptions?.departments && summaryOptions.departments[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryFilters((f) => ({ ...f, departmentId: String(summaryOptions.departments![0].id) }));
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                          summaryFilters.departmentId === String(summaryOptions.departments[0].id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-bold ${summaryFilters.departmentId === String(summaryOptions.departments[0].id) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            Khoa: {summaryOptions.departments[0].name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Thống kê toàn khoa đầu tiên
                          </div>
                        </div>

                        {summaryFilters.departmentId === String(summaryOptions.departments[0].id) && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* ── TAB 2: KỲ THI ── */}
                {activeCategory === 'periods' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSummaryFilters((f) => ({ ...f, examPeriodId: 'ALL' }))}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                        summaryFilters.examPeriodId === 'ALL'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${summaryFilters.examPeriodId === 'ALL' ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả kỳ thi
                        </div>
                      </div>
                      {summaryFilters.examPeriodId === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {summaryOptions?.periods?.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSummaryFilters((f) => ({ ...f, examPeriodId: String(item.id) }))}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                          summaryFilters.examPeriodId === String(item.id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold ${summaryFilters.examPeriodId === String(item.id) ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.name}
                          </div>
                        </div>
                        {summaryFilters.examPeriodId === String(item.id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── TAB 3: MÔN HỌC ── */}
                {activeCategory === 'subjects' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSummaryFilters((f) => ({ ...f, subjectId: 'ALL' }))}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                        summaryFilters.subjectId === 'ALL'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${summaryFilters.subjectId === 'ALL' ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả môn học
                        </div>
                      </div>
                      {summaryFilters.subjectId === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {summaryOptions?.subjects?.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSummaryFilters((f) => ({ ...f, subjectId: String(item.id) }))}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                          summaryFilters.subjectId === String(item.id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold ${summaryFilters.subjectId === String(item.id) ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">Mã môn: {item.code}</div>
                        </div>
                        {summaryFilters.subjectId === String(item.id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── TAB 4: KHOA ── */}
                {activeCategory === 'departments' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSummaryFilters((f) => ({ ...f, departmentId: 'ALL' }))}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                        summaryFilters.departmentId === 'ALL'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${summaryFilters.departmentId === 'ALL' ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả các khoa
                        </div>
                      </div>
                      {summaryFilters.departmentId === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {summaryOptions?.departments?.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSummaryFilters((f) => ({ ...f, departmentId: String(item.id) }))}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                          summaryFilters.departmentId === String(item.id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold ${summaryFilters.departmentId === String(item.id) ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.name}
                          </div>
                        </div>
                        {summaryFilters.departmentId === String(item.id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── TAB 5: LỚP HỌC ── */}
                {activeCategory === 'classes' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSummaryFilters((f) => ({ ...f, classId: 'ALL' }))}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                        summaryFilters.classId === 'ALL'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${summaryFilters.classId === 'ALL' ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả các lớp
                        </div>
                      </div>
                      {summaryFilters.classId === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {summaryOptions?.classes?.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSummaryFilters((f) => ({ ...f, classId: String(item.id) }))}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                          summaryFilters.classId === String(item.id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold ${summaryFilters.classId === String(item.id) ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.name}
                          </div>
                        </div>
                        {summaryFilters.classId === String(item.id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                {activeFilterCount > 0 ? (
                  <>Đang áp dụng <strong className="font-bold text-blue-600 dark:text-blue-400">{activeFilterCount}</strong> tiêu chí lọc</>
                ) : (
                  'Toàn bộ phạm vi hệ thống'
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Xem kết quả</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
