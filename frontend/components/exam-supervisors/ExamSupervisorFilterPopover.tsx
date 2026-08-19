'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  ShieldCheck,
  Award,
  Zap,
  Filter,
  CheckCheck,
  GraduationCap,
  Users,
} from 'lucide-react';

interface ExamSupervisorFilterPopoverProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  roleFilter?: string;
  onRoleChange?: (val: string) => void;
  degreeFilter?: string;
  onDegreeChange?: (val: string) => void;
  supervisors?: any[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'role' | 'status' | 'degree';

export function ExamSupervisorFilterPopover({
  statusFilter,
  onStatusChange,
  roleFilter = '',
  onRoleChange,
  degreeFilter = '',
  onDegreeChange,
  supervisors = [],
  totalFilteredCount,
  onResetAll,
}: ExamSupervisorFilterPopoverProps) {
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
    const total = supervisors.length;
    const sup1Count = supervisors.filter((s) => s.role === 'SUPERVISOR_1').length;
    const sup2Count = supervisors.filter((s) => s.role === 'SUPERVISOR_2').length;

    const statusCounts: Record<string, number> = {
      CONFIRMED: supervisors.filter((s) => s.status === 'CONFIRMED').length,
      PENDING: supervisors.filter((s) => s.status === 'PENDING').length,
      CHANGE_REQUESTED: supervisors.filter((s) => s.status === 'CHANGE_REQUESTED').length,
      COMPLETED: supervisors.filter((s) => s.status === 'COMPLETED').length,
      ABSENT: supervisors.filter((s) => s.status === 'ABSENT').length,
      REJECTED: supervisors.filter((s) => s.status === 'REJECTED').length,
    };

    return { total, sup1Count, sup2Count, statusCounts };
  }, [supervisors]);

  const activeFilterCount = [
    statusFilter && statusFilter !== 'ALL',
    Boolean(roleFilter),
    Boolean(degreeFilter),
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
      else if (e.key === '2') setActiveCategory('role');
      else if (e.key === '3') setActiveCategory('status');
      else if (e.key === '4') setActiveCategory('degree');
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
    { id: 'role' as FilterCategory, label: 'Vai trò', shortcut: '2', icon: ShieldCheck, badge: roleFilter ? '1' : null },
    { id: 'status' as FilterCategory, label: 'Trạng thái', shortcut: '3', icon: Award, badge: statusFilter && statusFilter !== 'ALL' ? '1' : null },
    { id: 'degree' as FilterCategory, label: 'Học vị', shortcut: '4', icon: GraduationCap, badge: degreeFilter ? '1' : null },
  ];

  const statusList = [
    { value: 'ALL', label: 'Tất cả trạng thái', desc: 'Mọi cán bộ phân công', count: optionCounts.total },
    { value: 'CONFIRMED', label: 'Đã xác nhận', desc: 'Giảng viên đã xác nhận ca thi', count: optionCounts.statusCounts['CONFIRMED'] || 0 },
    { value: 'PENDING', label: 'Chờ phản hồi', desc: 'Chờ giảng viên phản hồi', count: optionCounts.statusCounts['PENDING'] || 0 },
    { value: 'CHANGE_REQUESTED', label: 'Xin đổi ca', desc: 'Giảng viên có đơn xin đổi ca', count: optionCounts.statusCounts['CHANGE_REQUESTED'] || 0 },
    { value: 'COMPLETED', label: 'Hoàn thành', desc: 'Đã hoàn thành nhiệm vụ coi thi', count: optionCounts.statusCounts['COMPLETED'] || 0 },
    { value: 'ABSENT', label: 'Vắng mặt', desc: 'Ghi nhận vắng mặt ca thi', count: optionCounts.statusCounts['ABSENT'] || 0 },
    { value: 'REJECTED', label: 'Đã từ chối', desc: 'Yêu cầu đổi ca bị từ chối', count: optionCounts.statusCounts['REJECTED'] || 0 },
  ];

  const roleList = [
    { value: '', label: 'Tất cả vai trò', desc: 'Cả Giám thị 1 và Giám thị 2', count: optionCounts.total },
    { value: 'SUPERVISOR_1', label: 'Giám thị 1 (Chính)', desc: 'Cán bộ coi thi số 1 phụ trách chính', count: optionCounts.sup1Count },
    { value: 'SUPERVISOR_2', label: 'Giám thị 2 (Phụ)', desc: 'Cán bộ coi thi số 2 hỗ trợ', count: optionCounts.sup2Count },
  ];

  const degreeList = [
    { value: '', label: 'Tất cả học vị', desc: 'Mọi cấp bậc giảng viên' },
    { value: 'GS.TS', label: 'Giáo sư - GS.TS', desc: 'Học hàm Giáo sư' },
    { value: 'PGS.TS', label: 'Phó Giáo sư - PGS.TS', desc: 'Học hàm Phó Giáo sư' },
    { value: 'TS', label: 'Tiến sĩ - TS', desc: 'Học vị Tiến sĩ' },
    { value: 'ThS', label: 'Thạc sĩ - ThS', desc: 'Học vị Thạc sĩ' },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'SUPERVISOR_1') {
      onRoleChange?.('SUPERVISOR_1');
      onStatusChange('ALL');
      onDegreeChange?.('');
    } else if (presetType === 'CONFIRMED') {
      onStatusChange('CONFIRMED');
      onRoleChange?.('');
      onDegreeChange?.('');
    } else if (presetType === 'CHANGE_REQUESTED') {
      onStatusChange('CHANGE_REQUESTED');
      onRoleChange?.('');
      onDegreeChange?.('');
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

      {/* ── Bảng Popover 2 Cột Đồng Bộ & Chuẩn Mực ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc giám thị coi thi"
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
                    Tùy chỉnh tiêu chí tra cứu phân công coi thi
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
                      onClick={() => applyPreset('SUPERVISOR_1')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${roleFilter === 'SUPERVISOR_1'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${roleFilter === 'SUPERVISOR_1' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Giám thị 1 (Chính)
                        </div>
                        <div className={`text-type-helper truncate ${roleFilter === 'SUPERVISOR_1' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Cán bộ phụ trách quản lý phòng thi chính
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${roleFilter === 'SUPERVISOR_1'
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.sup1Count}
                        </span>
                        {roleFilter === 'SUPERVISOR_1' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('CONFIRMED')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'CONFIRMED'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${statusFilter === 'CONFIRMED' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đã xác nhận ca thi
                        </div>
                        <div className={`text-type-helper truncate ${statusFilter === 'CONFIRMED' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Giảng viên đã đồng ý nhận nhiệm vụ
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${statusFilter === 'CONFIRMED'
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.statusCounts['CONFIRMED'] || 0}
                        </span>
                        {statusFilter === 'CONFIRMED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('CHANGE_REQUESTED')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${statusFilter === 'CHANGE_REQUESTED'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${statusFilter === 'CHANGE_REQUESTED' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Yêu cầu xin đổi ca
                        </div>
                        <div className={`text-type-helper truncate ${statusFilter === 'CHANGE_REQUESTED' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Cán bộ gửi đơn xin đổi ca thi cần xử lý
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${statusFilter === 'CHANGE_REQUESTED'
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.statusCounts['CHANGE_REQUESTED'] || 0}
                        </span>
                        {statusFilter === 'CHANGE_REQUESTED' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: VAI TRÒ ── */}
                {activeCategory === 'role' && (
                  <div className="space-y-1.5">
                    {roleList.map((item) => {
                      const isSelected = roleFilter === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onRoleChange?.(item.value)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-type-helper font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-type-helper truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected
                                ? 'ui-pill-solid bg-blue-600 text-white'
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
                            <div className={`text-type-helper font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-type-helper truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected
                                ? 'ui-pill-solid bg-blue-600 text-white'
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

                {/* ── TAB 4: HỌC VỊ ── */}
                {activeCategory === 'degree' && (
                  <div className="space-y-1.5">
                    {degreeList.map((item) => {
                      const isSelected = degreeFilter === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onDegreeChange?.(item.value)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-type-helper font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-type-helper truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
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

            {/* 3. Footer tinh gọn & thanh lịch theo sắc xanh hệ thống */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-1">
                <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {supervisors.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {supervisors.length} giám thị ({Math.round((totalFilteredCount / Math.max(1, supervisors.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && supervisors.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, supervisors.length)) * 100))}%` }}
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
