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
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ProctorFilterPopoverProps {
  statusFilter: string;
  onStatusFilterChange: (val: any) => void;
  riskFilter: string;
  onRiskFilterChange: (val: any) => void;
  students?: any[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'status' | 'risk';

export function ProctorFilterPopover({
  statusFilter,
  onStatusFilterChange,
  riskFilter,
  onRiskFilterChange,
  students = [],
  totalFilteredCount,
  onResetAll,
}: ProctorFilterPopoverProps) {
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
    let all = students.length;
    let inProgress = 0;
    let flagged = 0;
    let submitted = 0;
    let disconnected = 0;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;

    students.forEach((s: any) => {
      const att = s.attempt;
      if (att?.status === 'IN_PROGRESS') inProgress++;
      if (att?.isFlagged) flagged++;
      if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(att?.status)) submitted++;
      if (att?.status === 'DISCONNECTED') disconnected++;

      const risk = att?.riskScore || 0;
      if (risk >= 40) highRisk++;
      else if (risk >= 15) mediumRisk++;
      else lowRisk++;
    });

    return { all, inProgress, flagged, submitted, disconnected, highRisk, mediumRisk, lowRisk };
  }, [students]);

  const activeFilterCount = [
    statusFilter !== 'ALL',
    riskFilter !== 'ALL',
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
      else if (e.key === '2') setActiveCategory('status');
      else if (e.key === '3') setActiveCategory('risk');
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const categories = [
    { id: 'presets' as FilterCategory, label: 'Lọc nhanh', icon: Zap, shortcut: '1' },
    {
      id: 'status' as FilterCategory,
      label: 'Trạng thái',
      icon: Layers,
      shortcut: '2',
      badge: statusFilter !== 'ALL' ? 1 : undefined,
    },
    {
      id: 'risk' as FilterCategory,
      label: 'Mức rủi ro',
      icon: ShieldAlert,
      shortcut: '3',
      badge: riskFilter !== 'ALL' ? 1 : undefined,
    },
  ];

  return (
    <div className="relative inline-block">
      {/* ── Nút kích hoạt Bộ lọc chuẩn w-[116px] ── */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-10 w-[116px] shrink-0 items-center justify-between rounded-xl border px-3 text-type-helper font-medium transition-all duration-150 cursor-pointer shadow-2xs select-none ${activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15 font-semibold'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300/90 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        title="Mở bảng điều khiển bộ lọc giám thị"
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
              className="group/badge relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 hover:bg-rose-500 text-type-helper font-semibold text-white shadow-2xs transition-colors cursor-pointer"
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

      {/* ── Bảng Popover 2 Cột Đồng Bộ Chuẩn Question Bank ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc giám thị phòng thi"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Bộ lọc giám thị
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí tra cứu thí sinh trong ca thi
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
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-type-helper font-medium transition-all duration-150 cursor-pointer border ${isActive
                          ? 'border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
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
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-type-helper text-slate-600 dark:text-slate-400">1-3</kbd>
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
                      onClick={() => {
                        onStatusFilterChange('ALL');
                        onRiskFilterChange('ALL');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'ALL' && riskFilter === 'ALL'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${statusFilter === 'ALL' && riskFilter === 'ALL' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả thí sinh
                        </div>
                        <div className={`text-type-helper truncate ${statusFilter === 'ALL' && riskFilter === 'ALL' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Toàn bộ danh sách phòng thi
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${statusFilter === 'ALL' && riskFilter === 'ALL'
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {counts.all}
                        </span>
                        {statusFilter === 'ALL' && riskFilter === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStatusFilterChange('FLAGGED')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'FLAGGED'
                          ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50/30 dark:hover:bg-rose-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${statusFilter === 'FLAGGED' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Có cảnh báo vi phạm
                        </div>
                        <div className={`text-type-helper truncate ${statusFilter === 'FLAGGED' ? 'text-rose-600/80 dark:text-rose-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Gian lận / Đổi tab / Thoát toàn màn hình
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${statusFilter === 'FLAGGED'
                            ? 'ui-pill-solid bg-rose-600 text-white'
                            : 'bg-rose-100 text-rose-600 dark:text-rose-300'
                          }`}>
                          {counts.flagged}
                        </span>
                        {statusFilter === 'FLAGGED' && <Check className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStatusFilterChange('DISCONNECTED')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'DISCONNECTED'
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${statusFilter === 'DISCONNECTED' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Mất kết nối mạng
                        </div>
                        <div className={`text-type-helper truncate ${statusFilter === 'DISCONNECTED' ? 'text-amber-600/80 dark:text-amber-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Mất tín hiệu heartbeat quá 30s
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${statusFilter === 'DISCONNECTED'
                            ? 'ui-pill-solid bg-amber-600 text-white'
                            : 'bg-amber-100 text-amber-600 dark:text-amber-300'
                          }`}>
                          {counts.disconnected}
                        </span>
                        {statusFilter === 'DISCONNECTED' && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRiskFilterChange('HIGH')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${riskFilter === 'HIGH'
                          ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50/30 dark:hover:bg-rose-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${riskFilter === 'HIGH' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Rủi ro cao (≥ 40đ)
                        </div>
                        <div className={`text-type-helper truncate ${riskFilter === 'HIGH' ? 'text-rose-600/80 dark:text-rose-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Cần giám thị theo dõi trực tiếp
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${riskFilter === 'HIGH'
                            ? 'ui-pill-solid bg-rose-600 text-white'
                            : 'bg-rose-100 text-rose-600 dark:text-rose-300'
                          }`}>
                          {counts.highRisk}
                        </span>
                        {riskFilter === 'HIGH' && <Check className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: TRẠNG THÁI (STATUS) ── */}
                {activeCategory === 'status' && (
                  <div className="space-y-1.5">
                    <p className="text-type-helper font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Trạng thái phiên thi:
                    </p>
                    {[
                      { key: 'ALL', label: 'Tất cả trạng thái', desc: 'Toàn bộ thí sinh', count: counts.all },
                      { key: 'IN_PROGRESS', label: 'Đang làm bài', desc: 'Thí sinh đang kết nối và làm bài', count: counts.inProgress },
                      { key: 'FLAGGED', label: 'Có cảnh báo vi phạm', desc: 'Phát hiện sự cố bất thường', count: counts.flagged },
                      { key: 'SUBMITTED', label: 'Đã nộp bài', desc: 'Đã hoàn tất nộp bài thi', count: counts.submitted },
                      { key: 'DISCONNECTED', label: 'Mất kết nối', desc: 'Mất tín hiệu heartbeat', count: counts.disconnected },
                    ].map((st) => {
                      const isSel = statusFilter === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => onStatusFilterChange(st.key)}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${isSel
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-type-helper font-semibold ${isSel ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                              {st.label}
                            </div>
                            <div className={`text-type-helper truncate ${isSel ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                              {st.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSel
                                ? 'ui-pill-solid bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                              }`}>
                              {st.count}
                            </span>
                            {isSel && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 3: MỨC ĐỘ RỦI RO (RISK) ── */}
                {activeCategory === 'risk' && (
                  <div className="space-y-1.5">
                    <p className="text-type-helper font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Mức độ rủi ro gian lận:
                    </p>
                    {[
                      { key: 'ALL', label: 'Tất cả mức độ rủi ro', desc: 'Mọi thí sinh trong phòng', count: counts.all },
                      { key: 'HIGH', label: 'Rủi ro cao (≥ 40đ)', desc: 'Nhiều cảnh báo đổi tab / thoát fullscreen', count: counts.highRisk },
                      { key: 'MEDIUM', label: 'Rủi ro trung bình (15 - 39đ)', desc: 'Có phát hiện nghi vấn mức độ vừa', count: counts.mediumRisk },
                      { key: 'LOW', label: 'Rủi ro thấp (< 15đ)', desc: 'Làm bài bình thường', count: counts.lowRisk },
                    ].map((r) => {
                      const isSel = riskFilter === r.key;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => onRiskFilterChange(r.key)}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${isSel
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-type-helper font-semibold ${isSel ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                              {r.label}
                            </div>
                            <div className={`text-type-helper truncate ${isSel ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                              {r.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSel
                                ? 'ui-pill-solid bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                              }`}>
                              {r.count}
                            </span>
                            {isSel && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
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
                <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {students.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {students.length} thí sinh ({Math.round((totalFilteredCount / Math.max(1, students.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && students.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, students.length)) * 100))}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-type-helper font-semibold transition-all duration-150 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
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
