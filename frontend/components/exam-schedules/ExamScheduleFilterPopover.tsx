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
  Layers,
  Sparkles,
  Clock,
  Zap,
  CalendarDays,
  GraduationCap,
  DoorOpen,
  Bookmark,
} from 'lucide-react';
import { ExamPeriod, ExamRoom } from '../../types';
import { ExamScheduleItemExtended, computeScheduleStatus } from './ExamScheduleTable';

export interface ExamScheduleFilterValues {
  search: string;
  examPeriodId: string;
  shift: string;
  roomId: string;
  examDate: string;
  status: string;
  semester: string;
  schoolYear: string;
  supervisorId: string;
}

interface ExamScheduleFilterPopoverProps {
  filters: ExamScheduleFilterValues;
  onChange: (next: ExamScheduleFilterValues) => void;
  periods: ExamPeriod[];
  rooms: ExamRoom[];
  schedules?: ExamScheduleItemExtended[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type ScheduleFilterCategory = 'presets' | 'period' | 'status' | 'room' | 'shift';

export function ExamScheduleFilterPopover({
  filters,
  onChange,
  periods = [],
  rooms = [],
  schedules = [],
  totalFilteredCount,
  onResetAll,
}: ExamScheduleFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ScheduleFilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính toán số lượng khớp thực tế cho từng tiêu chí
  const optionCounts = useMemo(() => {
    const total = schedules.length;
    const ongoing = schedules.filter((s) => computeScheduleStatus(s) === 'ONGOING').length;
    const upcoming = schedules.filter((s) => computeScheduleStatus(s) === 'UPCOMING').length;
    const completed = schedules.filter((s) => computeScheduleStatus(s) === 'COMPLETED').length;
    const cancelled = schedules.filter((s) => computeScheduleStatus(s) === 'CANCELLED').length;

    // Period counts
    const periodCounts: Record<string, number> = {};
    periods.forEach((p) => {
      periodCounts[String(p.id)] = schedules.filter((s) => String(s.examPeriodId) === String(p.id)).length;
    });

    // Room counts
    const roomCounts: Record<string, number> = {};
    rooms.forEach((r) => {
      const rName = r.roomCode || r.code || r.name;
      roomCounts[String(r.id)] = schedules.filter((s) => {
        return (
          s.examScheduleRooms?.some((room: any) => String(room.examRoomId || room.roomId || room.id) === String(r.id)) ||
          Boolean(s.roomName && (s.roomName.includes(rName) || (r.name && s.roomName.includes(r.name))))
        );
      }).length;
    });

    return { total, ongoing, upcoming, completed, cancelled, periodCounts, roomCounts };
  }, [schedules, periods, rooms]);

  // Đếm số lượng bộ lọc đang hoạt động (không tính search)
  const activeFilterCount = [
    Boolean(filters.examPeriodId),
    Boolean(filters.status),
    Boolean(filters.roomId),
    Boolean(filters.shift),
    Boolean(filters.semester),
    Boolean(filters.schoolYear),
  ].filter(Boolean).length;

  // ── Thuật toán Định vị Chống Xén Màn Hình Chuẩn Mực ──
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
      else if (e.key === '2') setActiveCategory('period');
      else if (e.key === '3') setActiveCategory('status');
      else if (e.key === '4') setActiveCategory('room');
      else if (e.key === '5') setActiveCategory('shift');
    };

    const handleResize = () => {
      updatePosition();
    };

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
    {
      id: 'presets' as ScheduleFilterCategory,
      label: 'Lọc nhanh',
      shortcut: '1',
      icon: Zap,
      badge: null,
    },
    {
      id: 'period' as ScheduleFilterCategory,
      label: 'Kỳ thi',
      shortcut: '2',
      icon: Bookmark,
      badge: filters.examPeriodId ? '1' : null,
    },
    {
      id: 'status' as ScheduleFilterCategory,
      label: 'Trạng thái',
      shortcut: '3',
      icon: Clock,
      badge: filters.status ? '1' : null,
    },
    {
      id: 'room' as ScheduleFilterCategory,
      label: 'Phòng thi',
      shortcut: '4',
      icon: DoorOpen,
      badge: filters.roomId ? '1' : null,
    },
    {
      id: 'shift' as ScheduleFilterCategory,
      label: 'Ca thi',
      shortcut: '5',
      icon: Layers,
      badge: filters.shift ? '1' : null,
    },
  ];

  const statusList = [
    { value: '', label: 'Tất cả trạng thái', desc: 'Hiển thị mọi lịch thi trong hệ thống', count: optionCounts.total },
    { value: 'ONGOING', label: 'Đang diễn ra', desc: 'Ca thi đang trong thời gian tổ chức', count: optionCounts.ongoing },
    { value: 'UPCOMING', label: 'Sắp diễn ra', desc: 'Chuẩn bị tổ chức theo kế hoạch', count: optionCounts.upcoming },
    { value: 'COMPLETED', label: 'Đã diễn ra', desc: 'Lịch thi đã hoàn tất thành công', count: optionCounts.completed },
    { value: 'CANCELLED', label: 'Đã hủy', desc: 'Các ca thi đã bị hủy bỏ', count: optionCounts.cancelled },
  ];

  const shiftList = [
    { value: '', label: 'Tất cả ca thi', desc: 'Mọi khung giờ ca thi trong ngày' },
    { value: 'CA_1', label: 'Ca 1 - Sáng', desc: 'Khung giờ: 07:00 – 09:00' },
    { value: 'CA_2', label: 'Ca 2 - Sáng', desc: 'Khung giờ: 09:30 – 11:30' },
    { value: 'CA_3', label: 'Ca 3 - Chiều', desc: 'Khung giờ: 13:00 – 15:00' },
    { value: 'CA_4', label: 'Ca 4 - Chiều', desc: 'Khung giờ: 15:30 – 17:30' },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'ONGOING_NOW') {
      onChange({ ...filters, status: 'ONGOING' });
    } else if (presetType === 'UPCOMING_SOON') {
      onChange({ ...filters, status: 'UPCOMING' });
    } else if (presetType === 'LATEST_PERIOD') {
      if (periods[0]?.id) {
        onChange({ ...filters, examPeriodId: String(periods[0].id) });
      }
    }
  };

  const getButtonActiveLabel = () => {
    if (activeFilterCount === 0) return null;
    const parts: string[] = [];
    if (filters.status) {
      if (filters.status === 'ONGOING') parts.push('Đang thi');
      else if (filters.status === 'UPCOMING') parts.push('Sắp thi');
      else if (filters.status === 'COMPLETED') parts.push('Đã xong');
    }
    if (filters.examPeriodId) {
      const p = periods.find((x) => String(x.id) === filters.examPeriodId);
      if (p) parts.push(p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name);
    }
    if (filters.roomId) {
      const r = rooms.find((x) => String(x.id) === filters.roomId);
      if (r) parts.push(r.roomCode || r.code || r.name);
    }
    return parts.slice(0, 2).join(', ');
  };

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
        title="Bộ lọc lịch thi"
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

      {/* ── Bảng Popover 2 Cột Đồng Bộ & Chuẩn Mực Tuyệt Đối ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc lịch thi"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-modal animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Bộ lọc lịch thi
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí hiển thị đồng bộ
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
                  className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Thân bảng: Bố cục 2 Cột Đồng Bộ Tuyệt Đối Cho Tất Cả Các Tab */}
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
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-type-helper text-slate-600 dark:text-slate-400">1-5</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải (Chi tiết các tùy chọn thiết kế đồng bộ 100%) */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-type-helper font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý bộ lọc phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => applyPreset('ONGOING_NOW')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filters.status === 'ONGOING'
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Ca thi đang diễn ra
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Các phòng thi đang mở hôm nay
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.status === 'ONGOING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.ongoing}
                        </span>
                        {filters.status === 'ONGOING' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('UPCOMING_SOON')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filters.status === 'UPCOMING'
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Lịch thi sắp tới
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Chuẩn bị tổ chức theo kế hoạch
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.status === 'UPCOMING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.upcoming}
                        </span>
                        {filters.status === 'UPCOMING' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {periods.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyPreset('LATEST_PERIOD')}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filters.examPeriodId === String(periods[0].id)
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {periods[0].name}
                          </div>
                          <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                            Kỳ thi hiện hành mới nhất
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.examPeriodId === String(periods[0].id)
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                              : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                            }`}>
                            {optionCounts.periodCounts[String(periods[0].id)] || optionCounts.total}
                          </span>
                          {filters.examPeriodId === String(periods[0].id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* ── TAB 2: KỲ THI (PERIOD) ── */}
                {activeCategory === 'period' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onChange({ ...filters, examPeriodId: '' })}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filters.examPeriodId === ''
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả kỳ thi
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Mọi đợt thi trong hệ thống
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.examPeriodId === ''
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {optionCounts.total}
                        </span>
                        {filters.examPeriodId === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {periods.map((p) => {
                      const isSelected = filters.examPeriodId === String(p.id);
                      const count = optionCounts.periodCounts[String(p.id)] ?? 0;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onChange({ ...filters, examPeriodId: String(p.id) })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {p.name}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              {p.semester} – {p.schoolYear}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                                : 'bg-slate-100 text-slate-500 dark:text-slate-400'
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

                {/* ── TAB 3: TRẠNG THÁI (STATUS) ── */}
                {activeCategory === 'status' && (
                  <div className="space-y-1.5">
                    {statusList.map((item) => {
                      const isSelected = filters.status === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onChange({ ...filters, status: item.value })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                              {item.label}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                                : 'bg-slate-100 text-slate-500 dark:text-slate-400'
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

                {/* ── TAB 4: PHÒNG THI (ROOM) ── */}
                {activeCategory === 'room' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onChange({ ...filters, roomId: '' })}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filters.roomId === ''
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả phòng thi
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Mọi phòng thi được cấu hình
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.roomId === ''
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {optionCounts.total}
                        </span>
                        {filters.roomId === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {rooms.map((r) => {
                      const isSelected = filters.roomId === String(r.id);
                      const count = optionCounts.roomCounts[String(r.id)] ?? 0;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onChange({ ...filters, roomId: String(r.id) })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                              {r.roomCode || r.code || r.name}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              Sức chứa: {r.capacity || 40} chỗ
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                                : 'bg-slate-100 text-slate-500 dark:text-slate-400'
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

                {/* ── TAB 5: CA THI (SHIFT) ── */}
                {activeCategory === 'shift' && (
                  <div className="space-y-1.5">
                    {shiftList.map((item) => {
                      const isSelected = filters.shift === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onChange({ ...filters, shift: item.value })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                              {item.label}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer tinh gọn & thanh lịch */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-0.5">
                <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {schedules.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {schedules.length} lịch thi ({Math.round((totalFilteredCount / Math.max(1, schedules.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && schedules.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, schedules.length)) * 100))}%` }}
                    />
                  </div>
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
