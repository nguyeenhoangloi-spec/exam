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
  CheckCheck,
  CalendarCheck,
  FileText,
  HelpCircle,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
} from 'lucide-react';

interface TrashStats {
  total: number;
  schedules: number;
  papers: number;
  questions: number;
  users?: number;
  classes?: number;
  subjects?: number;
}

interface TrashFilterPopoverProps {
  activeCategory: string;
  onActiveCategoryChange: (val: string) => void;
  expiryFilter?: string;
  onExpiryFilterChange?: (val: string) => void;
  stats: TrashStats;
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'categories' | 'expiry';

export function TrashFilterPopover({
  activeCategory,
  onActiveCategoryChange,
  expiryFilter = '',
  onExpiryFilterChange,
  stats,
  totalFilteredCount,
  onResetAll,
}: TrashFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currCategoryTab, setCurrCategoryTab] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFilterCount = [
    activeCategory !== 'schedules',
    Boolean(expiryFilter),
  ].filter(Boolean).length;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(480, vw - margin * 2);
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
      else if (e.key === '1') setCurrCategoryTab('presets');
      else if (e.key === '2') setCurrCategoryTab('categories');
      else if (e.key === '3') setCurrCategoryTab('expiry');
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
    { id: 'categories' as FilterCategory, label: 'Danh mục', shortcut: '2', icon: Filter, badge: activeCategory !== 'schedules' ? '1' : null },
    { id: 'expiry' as FilterCategory, label: 'Hạn lưu trữ', shortcut: '3', icon: Clock, badge: expiryFilter ? '1' : null },
  ];

  const categoryOptions = [
    { key: 'schedules', label: 'Lịch thi đã xóa', count: stats.schedules, icon: CalendarCheck },
    { key: 'papers', label: 'Đề thi đã xóa', count: stats.papers, icon: FileText },
    { key: 'questions', label: 'Ngân hàng câu hỏi', count: stats.questions, icon: HelpCircle },
    { key: 'users', label: 'Tài khoản / Sinh viên', count: stats.users || 0, icon: Users },
    { key: 'subjects', label: 'Môn học', count: stats.subjects || 0, icon: BookOpen },
    { key: 'classes', label: 'Lớp học', count: stats.classes || 0, icon: GraduationCap },
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
        title="Mở bảng điều khiển bộ lọc thùng rác"
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
              title="Nhấn để đặt lại bộ lọc về mặc định (1-Click Reset)"
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
            aria-label="Bảng bộ lọc thùng rác hệ thống"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
                    Bộ lọc thùng rác
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Lọc dữ liệu tạm xóa theo danh mục & thời hạn
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Đặt lại tất cả bộ lọc về mặc định"
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

            {/* 2. Thân bảng */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Cột Trái */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = currCategoryTab === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCurrCategoryTab(cat.id)}
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
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[9px] text-slate-600 dark:text-slate-400">1-3</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {currCategoryTab === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Danh mục dữ liệu phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => onActiveCategoryChange('schedules')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                        activeCategory === 'schedules'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-bold ${activeCategory === 'schedules' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Lịch thi đã xóa
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Các ca thi khảo thí đã bị hủy bỏ
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          activeCategory === 'schedules'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {stats.schedules}
                        </span>
                        {activeCategory === 'schedules' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onActiveCategoryChange('papers')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                        activeCategory === 'papers'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-bold ${activeCategory === 'papers' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đề thi đã xóa
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Các bộ đề trắc nghiệm và tự luận
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          activeCategory === 'papers'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {stats.papers}
                        </span>
                        {activeCategory === 'papers' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onActiveCategoryChange('questions')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                        activeCategory === 'questions'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-bold ${activeCategory === 'questions' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Ngân hàng câu hỏi
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Các câu hỏi đã bị xóa khỏi ngân hàng
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          activeCategory === 'questions'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {stats.questions}
                        </span>
                        {activeCategory === 'questions' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: DANH MỤC ── */}
                {currCategoryTab === 'categories' && (
                  <div className="space-y-1.5">
                    {categoryOptions.map((opt) => {
                      const isSelected = activeCategory === opt.key;
                      const IconComp = opt.icon;

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onActiveCategoryChange(opt.key)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <IconComp className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {opt.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {opt.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 3: HẠN LƯU TRỮ ── */}
                {currCategoryTab === 'expiry' && (
                  <div className="space-y-1.5">
                    {[
                      { key: '', label: 'Tất cả thời hạn', sub: 'Hiển thị mọi bản ghi trong 30 ngày' },
                      { key: 'URGENT', label: 'Sắp hết hạn (< 7 ngày)', sub: 'Sắp bị xóa vĩnh viễn tự động' },
                      { key: 'RECENT', label: 'Mới xóa gần đây (> 20 ngày)', sub: 'Mới được chuyển vào thùng rác' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onExpiryFilterChange?.(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                          expiryFilter === item.key
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold ${expiryFilter === item.key ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.sub}</div>
                        </div>
                        {expiryFilter === item.key && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                {totalFilteredCount !== undefined ? (
                  <>Khớp <strong className="font-bold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong> bản ghi</>
                ) : (
                  'Đã áp dụng bộ lọc'
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
