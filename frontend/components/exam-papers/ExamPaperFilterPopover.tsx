'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  FileText,
  Calendar,
  Zap,
  Filter,
  CheckCheck,
  Award,
  Layers,
} from 'lucide-react';
import { ExamPaper, ExamSchedule } from '../../types';

interface ExamPaperFilterPopoverProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  selectedScheduleId?: string;
  onScheduleChange?: (val: string) => void;
  selectedExamType?: string;
  onExamTypeChange?: (val: string) => void;
  papers?: ExamPaper[];
  schedules?: ExamSchedule[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'schedule' | 'status' | 'examType';

export function ExamPaperFilterPopover({
  statusFilter,
  onStatusChange,
  selectedScheduleId = '',
  onScheduleChange,
  selectedExamType = '',
  onExamTypeChange,
  papers = [],
  schedules = [],
  totalFilteredCount,
  onResetAll,
}: ExamPaperFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính toán số lượng thực tế
  const optionCounts = useMemo(() => {
    const total = papers.length;
    const publishedCount = papers.filter((p) => p.status === 'PUBLISHED').length;
    const draftCount = papers.filter((p) => p.status === 'DRAFT').length;
    const archivedCount = papers.filter((p) => p.status === 'ARCHIVED').length;

    const scheduleCounts: Record<string, number> = {};
    schedules.forEach((s) => {
      scheduleCounts[String(s.id)] = papers.filter((p) => String(p.examScheduleId || (p.examSchedule as any)?.id) === String(s.id)).length;
    });

    const tracNghiemCount = papers.filter((p) => (p as any).examType !== 'TU_LUAN' && (p.examSchedule as any)?.examType !== 'TU_LUAN').length;
    const tuLuanCount = papers.filter((p) => (p as any).examType === 'TU_LUAN' || (p.examSchedule as any)?.examType === 'TU_LUAN').length;

    return { total, publishedCount, draftCount, archivedCount, scheduleCounts, tracNghiemCount, tuLuanCount };
  }, [papers, schedules]);

  const activeFilterCount = [
    statusFilter && statusFilter !== 'ALL',
    Boolean(selectedScheduleId),
    Boolean(selectedExamType),
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
    const preferUpward = spaceBelow < 260 && spaceAbove > spaceBelow;

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
      else if (e.key === '2') setActiveCategory('schedule');
      else if (e.key === '3') setActiveCategory('status');
      else if (e.key === '4') setActiveCategory('examType');
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
    { id: 'schedule' as FilterCategory, label: 'Lịch thi', shortcut: '2', icon: Calendar, badge: selectedScheduleId ? '1' : null },
    { id: 'status' as FilterCategory, label: 'Trạng thái', shortcut: '3', icon: Award, badge: statusFilter && statusFilter !== 'ALL' ? '1' : null },
    { id: 'examType' as FilterCategory, label: 'Hình thức', shortcut: '4', icon: Layers, badge: selectedExamType ? '1' : null },
  ];

  const statusList = [
    { value: 'ALL', label: 'Tất cả trạng thái', desc: 'Mọi đề thi trong hệ thống', count: optionCounts.total },
    { value: 'PUBLISHED', label: 'Đã phát hành', desc: 'Đã niêm phong & sẵn sàng thi', count: optionCounts.publishedCount },
    { value: 'DRAFT', label: 'Bản nháp', desc: 'Đang soạn thảo / ma trận nháp', count: optionCounts.draftCount },
    { value: 'ARCHIVED', label: 'Lưu trữ', desc: 'Đã hoàn thành lưu trữ', count: optionCounts.archivedCount },
  ];

  const examTypeList = [
    { value: '', label: 'Tất cả hình thức', desc: 'Mọi định dạng đề thi', count: optionCounts.total },
    { value: 'TRAC_NGHIEM', label: 'Trắc nghiệm', desc: 'Đề thi trắc nghiệm khách quan', count: optionCounts.tracNghiemCount },
    { value: 'TU_LUAN', label: 'Tự luận', desc: 'Đề thi tự luận viết bài', count: optionCounts.tuLuanCount },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'PUBLISHED') {
      onStatusChange('PUBLISHED');
      onScheduleChange?.('');
      onExamTypeChange?.('');
    } else if (presetType === 'DRAFT') {
      onStatusChange('DRAFT');
      onScheduleChange?.('');
      onExamTypeChange?.('');
    } else if (presetType === 'TRAC_NGHIEM') {
      onExamTypeChange?.('TRAC_NGHIEM');
      onStatusChange('ALL');
    }
  };

  return (
    <div className="relative inline-block">
      {/* ── Nút kích hoạt Bộ lọc cố định chiều rộng 100% ── */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-10 w-[116px] shrink-0 items-center justify-between rounded-xl border px-3 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs select-none ${activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15 font-semibold'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        title="Mở bảng điều khiển bộ lọc đề thi"
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
            aria-label="Bảng bộ lọc đề thi"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                    Bộ lọc đề thi
                  </h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí tra cứu đề thi ngẫu nhiên
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
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-[12px] text-slate-600 dark:text-slate-400">1-4</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-semibold  tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý bộ lọc phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => applyPreset('PUBLISHED')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'PUBLISHED'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusFilter === 'PUBLISHED' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đề đã phát hành
                        </div>
                        <div className={`text-[12px] truncate ${statusFilter === 'PUBLISHED' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Đề thi chính thức đã niêm phong bảo mật
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${statusFilter === 'PUBLISHED'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.publishedCount}
                        </span>
                        {statusFilter === 'PUBLISHED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('DRAFT')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'DRAFT'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${statusFilter === 'DRAFT' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đề thi bản nháp
                        </div>
                        <div className={`text-[12px] truncate ${statusFilter === 'DRAFT' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Đang trong giai đoạn tạo ma trận đề
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${statusFilter === 'DRAFT'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.draftCount}
                        </span>
                        {statusFilter === 'DRAFT' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('TRAC_NGHIEM')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedExamType === 'TRAC_NGHIEM'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedExamType === 'TRAC_NGHIEM' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đề Trắc nghiệm
                        </div>
                        <div className={`text-[12px] truncate ${selectedExamType === 'TRAC_NGHIEM' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Đề thi trắc nghiệm khách quan
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedExamType === 'TRAC_NGHIEM'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.tracNghiemCount}
                        </span>
                        {selectedExamType === 'TRAC_NGHIEM' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: LỊCH THI ── */}
                {activeCategory === 'schedule' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onScheduleChange?.('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${selectedScheduleId === ''
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedScheduleId === '' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả các ca thi
                        </div>
                        <div className={`text-[12px] truncate ${selectedScheduleId === '' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Toàn bộ lịch thi các môn
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedScheduleId === ''
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                          {optionCounts.total}
                        </span>
                        {selectedScheduleId === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {schedules.map((s) => {
                      const isSelected = selectedScheduleId === String(s.id);
                      const count = optionCounts.scheduleCounts[String(s.id)] ?? 0;
                      const subName = (s as any).subjectName || (s.subject as any)?.subjectName || 'Môn thi';

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onScheduleChange?.(String(s.id))}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {subName}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : ''} • {s.startTime} - {s.endTime}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 3: TRẠNG THÁI ── */}
                {activeCategory === 'status' && (
                  <div className="space-y-1.5">
                    {statusList.map((item) => {
                      const isSelected = statusFilter === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onStatusChange(item.value)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {item.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 4: HÌNH THỨC ── */}
                {activeCategory === 'examType' && (
                  <div className="space-y-1.5">
                    {examTypeList.map((item) => {
                      const isSelected = selectedExamType === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onExamTypeChange?.(item.value)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {item.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer tinh gọn & thanh lịch theo sắc xanh hệ thống */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-1">
                <div className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {papers.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {papers.length} đề thi ({Math.round((totalFilteredCount / Math.max(1, papers.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && papers.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, papers.length)) * 100))}%` }}
                    />
                  </div>
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
