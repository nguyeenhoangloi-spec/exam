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
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Scale,
} from 'lucide-react';
import { GradeAppealItem } from './RegradeReviewDrawer';

interface RegradeFilterPopoverProps {
  statusTab: string;
  onStatusTabChange: (val: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (val: string) => void;
  appeals: GradeAppealItem[];
  subjectsList: [number, string][];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'status' | 'subjects';

export function RegradeFilterPopover({
  statusTab,
  onStatusTabChange,
  subjectFilter,
  onSubjectFilterChange,
  appeals = [],
  subjectsList = [],
  totalFilteredCount,
  onResetAll,
}: RegradeFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính toán số lượng theo trạng thái
  const counts = useMemo(() => {
    let all = 0, pending = 0, approved = 0, rejected = 0;
    appeals.forEach((a) => {
      all++;
      if (a.status === 'APPROVED_REGRADE') approved++;
      else if (a.status === 'REJECTED') rejected++;
      else pending++;
    });
    return { all, pending, approved, rejected };
  }, [appeals]);

  const activeFilterCount = [
    statusTab !== 'ALL',
    subjectFilter !== 'ALL',
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
      else if (e.key === '2') setActiveCategory('status');
      else if (e.key === '3') setActiveCategory('subjects');
    };

    const handleResize = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);


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
    { id: 'status' as FilterCategory, label: 'Trạng thái', shortcut: '2', icon: Clock, badge: statusTab !== 'ALL' ? '1' : null },
    { id: 'subjects' as FilterCategory, label: 'Môn học', shortcut: '3', icon: BookOpen, badge: subjectFilter !== 'ALL' ? '1' : null },
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
        className={`group relative flex h-10 w-[116px] shrink-0 items-center justify-between rounded-xl border px-3 text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs select-none ${activeFilterCount > 0
          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15 font-semibold'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        title="Mở bảng điều khiển bộ lọc đơn phúc khảo"
      >
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal
            className={`h-4 w-4 shrink-0 transition-transform duration-150 ${activeFilterCount > 0
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
              className="group/badge relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 hover:bg-rose-500 text-[12px] font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <span className="group-hover/badge:hidden">{activeFilterCount}</span>
              <X className="hidden h-3 w-3 group-hover/badge:block stroke-[3]" />
            </div>
          ) : (
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
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
            aria-label="Bảng bộ lọc đơn phúc khảo"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                    Bộ lọc phúc khảo điểm
                  </h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Lọc theo trạng thái thẩm định & môn thi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    title="Xóa tất cả bộ lọc đang áp dụng"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại ({activeFilterCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Thân bảng: Bố cục 2 Cột */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Cột Trái */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer border ${isActive
                        ? 'border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>

                      {cat.badge ? (
                        <span className="h-4 min-w-[16px] rounded-full bg-blue-600 px-1 text-[12px] font-semibold text-white flex items-center justify-center">
                          {cat.badge}
                        </span>
                      ) : (
                        <span className={`text-[12px] font-normal ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                          {cat.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 px-2">
                  <div className="text-[12px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <span>Phím:</span>
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-[12px] text-slate-600 dark:text-slate-400">1-3</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý bộ lọc nhanh:
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        onStatusTabChange('PENDING');
                        onSubjectFilterChange('ALL');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusTab === 'PENDING'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'PENDING' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đơn chờ thẩm định
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                          Đơn phúc khảo cần giảng viên xử lý
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${statusTab === 'PENDING'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                          {counts.pending}
                        </span>
                        {statusTab === 'PENDING' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onStatusTabChange('APPROVED_REGRADE');
                        onSubjectFilterChange('ALL');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusTab === 'APPROVED_REGRADE'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'APPROVED_REGRADE' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đã duyệt & Đổi điểm
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                          Đơn đã được chấp thuận cập nhật điểm
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${statusTab === 'APPROVED_REGRADE'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                          {counts.approved}
                        </span>
                        {statusTab === 'APPROVED_REGRADE' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onStatusTabChange('REJECTED');
                        onSubjectFilterChange('ALL');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusTab === 'REJECTED'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'REJECTED' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đơn bị từ chối
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                          Đơn không đủ điều kiện thay đổi điểm
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${statusTab === 'REJECTED'
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                          {counts.rejected}
                        </span>
                        {statusTab === 'REJECTED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: TRẠNG THÁI ── */}
                {activeCategory === 'status' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onStatusTabChange('ALL')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${statusTab === 'ALL'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'ALL' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả trạng thái
                        </div>
                        <div className={`text-[12px] truncate ${statusTab === 'ALL' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Toàn bộ đơn khiếu nại & phúc khảo
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${
                          statusTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {counts.all}
                        </span>
                        {statusTab === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStatusTabChange('PENDING')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${statusTab === 'PENDING'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'PENDING' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Chờ thẩm định
                        </div>
                        <div className={`text-[12px] truncate ${statusTab === 'PENDING' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Đơn mới gửi cần giảng viên xử lý
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${
                          statusTab === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {counts.pending}
                        </span>
                        {statusTab === 'PENDING' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStatusTabChange('APPROVED_REGRADE')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${statusTab === 'APPROVED_REGRADE'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'APPROVED_REGRADE' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đã duyệt & Đổi điểm
                        </div>
                        <div className={`text-[12px] truncate ${statusTab === 'APPROVED_REGRADE' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Đơn đã được chấp thuận cập nhật điểm
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${
                          statusTab === 'APPROVED_REGRADE' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {counts.approved}
                        </span>
                        {statusTab === 'APPROVED_REGRADE' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStatusTabChange('REJECTED')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${statusTab === 'REJECTED'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusTab === 'REJECTED' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Bị từ chối
                        </div>
                        <div className={`text-[12px] truncate ${statusTab === 'REJECTED' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Đơn không đủ điều kiện thay đổi điểm
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${
                          statusTab === 'REJECTED' ? 'bg-blue-600 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {counts.rejected}
                        </span>
                        {statusTab === 'REJECTED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 3: MÔN HỌC ── */}
                {activeCategory === 'subjects' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onSubjectFilterChange('ALL')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${subjectFilter === 'ALL'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${subjectFilter === 'ALL' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả môn học
                        </div>
                        <div className={`text-[12px] truncate ${subjectFilter === 'ALL' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Mọi môn thi có đơn phúc khảo
                        </div>
                      </div>
                      {subjectFilter === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {subjectsList.map(([id, name]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSubjectFilterChange(String(id))}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${subjectFilter === String(id)
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold ${subjectFilter === String(id) ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {name}
                          </div>
                          <div className={`text-[12px] truncate ${subjectFilter === String(id) ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                            Lọc các đơn phúc khảo thuộc môn này
                          </div>
                        </div>
                        {subjectFilter === String(id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
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
                  <>Đang áp dụng <strong className="font-semibold text-blue-600 dark:text-blue-400">{activeFilterCount}</strong> tiêu chí lọc</>
                ) : (
                  'Toàn bộ đơn phúc khảo'
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
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
