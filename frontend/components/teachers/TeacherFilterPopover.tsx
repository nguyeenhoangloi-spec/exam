'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  Building2,
  GraduationCap,
  Zap,
  Filter,
  CheckCheck,
  Award,
} from 'lucide-react';
import { Teacher, Department } from '../../types';

interface TeacherFilterPopoverProps {
  selectedDeptId: string;
  onDeptChange: (val: string) => void;
  selectedDegree?: string;
  onDegreeChange?: (val: string) => void;
  selectedStatus?: string;
  onStatusChange?: (val: string) => void;
  departments: Department[];
  teachers?: Teacher[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'department' | 'degree' | 'status';

export function TeacherFilterPopover({
  selectedDeptId,
  onDeptChange,
  selectedDegree = '',
  onDegreeChange,
  selectedStatus = '',
  onStatusChange,
  departments,
  teachers = [],
  totalFilteredCount,
  onResetAll,
}: TeacherFilterPopoverProps) {
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
    const total = teachers.length;
    const deptCounts: Record<string, number> = {};
    departments.forEach((d) => {
      deptCounts[String(d.id)] = teachers.filter((t) => String(t.departmentId) === String(d.id)).length;
    });

    const degreeCounts: Record<string, number> = {
      'GS.TS': teachers.filter((t) => t.degree?.includes('GS')).length,
      'PGS.TS': teachers.filter((t) => t.degree?.includes('PGS')).length,
      'TS': teachers.filter((t) => t.degree === 'TS' || t.degree === 'Tiến sĩ').length,
      'ThS': teachers.filter((t) => t.degree === 'ThS' || t.degree === 'Thạc sĩ').length,
    };

    const withDeptCount = teachers.filter((t) => Boolean(t.departmentId)).length;
    const withoutDeptCount = teachers.filter((t) => !t.departmentId).length;

    return { total, deptCounts, degreeCounts, withDeptCount, withoutDeptCount };
  }, [teachers, departments]);

  const activeFilterCount = [
    Boolean(selectedDeptId),
    Boolean(selectedDegree),
    Boolean(selectedStatus),
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
      else if (e.key === '2') setActiveCategory('department');
      else if (e.key === '3') setActiveCategory('degree');
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
    { id: 'department' as FilterCategory, label: 'Khoa / Bộ môn', shortcut: '2', icon: Building2, badge: selectedDeptId ? '1' : null },
    { id: 'degree' as FilterCategory, label: 'Học vị / Học hàm', shortcut: '3', icon: GraduationCap, badge: selectedDegree ? '1' : null },
    { id: 'status' as FilterCategory, label: 'Thuộc Khoa', shortcut: '4', icon: Award, badge: selectedStatus ? '1' : null },
  ];

  const degreeList = [
    { value: '', label: 'Tất cả học vị', desc: 'Mọi trình độ giảng viên', count: optionCounts.total },
    { value: 'GS.TS', label: 'GS.TS (Giáo sư)', desc: 'Học hàm Giáo sư', count: optionCounts.degreeCounts['GS.TS'] || 0 },
    { value: 'PGS.TS', label: 'PGS.TS (Phó Giáo sư)', desc: 'Học hàm Phó Giáo sư', count: optionCounts.degreeCounts['PGS.TS'] || 0 },
    { value: 'TS', label: 'TS (Tiến sĩ)', desc: 'Học vị Tiến sĩ', count: optionCounts.degreeCounts['TS'] || 0 },
    { value: 'ThS', label: 'ThS (Thạc sĩ)', desc: 'Học vị Thạc sĩ', count: optionCounts.degreeCounts['ThS'] || 0 },
  ];

  const statusList = [
    { value: '', label: 'Tất cả trạng thái', desc: 'Mọi giảng viên', count: optionCounts.total },
    { value: 'has_dept', label: 'Đã thuộc Khoa', desc: 'Đã phân công trực thuộc Khoa', count: optionCounts.withDeptCount },
    { value: 'no_dept', label: 'Chưa phân Khoa', desc: 'Chưa gắn vào Khoa / Bộ môn', count: optionCounts.withoutDeptCount },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'DOCTOR') {
      onDegreeChange?.('TS');
      onDeptChange('');
      onStatusChange?.('');
    } else if (presetType === 'HAS_DEPT') {
      onStatusChange?.('has_dept');
      onDeptChange('');
      onDegreeChange?.('');
    } else if (presetType === 'FIRST_DEPT') {
      if (departments[0]) {
        onDeptChange(String(departments[0].id));
      }
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
        className={`group relative flex h-10 w-[116px] shrink-0 items-center justify-between rounded-xl border px-3 text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs select-none ${activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15 font-semibold'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300/90 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        title="Mở bảng điều khiển bộ lọc giảng viên"
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
            aria-label="Bảng bộ lọc giảng viên"
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
                    Bộ lọc giảng viên
                  </h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí tra cứu đội ngũ giảng viên
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
                    <p className="text-[12px] font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý bộ lọc phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => applyPreset('DOCTOR')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedDegree === 'TS'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedDegree === 'TS' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Học vị Tiến sĩ (TS)
                        </div>
                        <div className={`text-[12px] truncate ${selectedDegree === 'TS' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Danh sách giảng viên có trình độ Tiến sĩ
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedDegree === 'TS'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.degreeCounts['TS'] || 0}
                        </span>
                        {selectedDegree === 'TS' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('HAS_DEPT')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedStatus === 'has_dept'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedStatus === 'has_dept' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Đã thuộc Khoa
                        </div>
                        <div className={`text-[12px] truncate ${selectedStatus === 'has_dept' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Giảng viên đã phân công vào Khoa
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedStatus === 'has_dept'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.withDeptCount}
                        </span>
                        {selectedStatus === 'has_dept' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {departments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyPreset('FIRST_DEPT')}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedDeptId === String(departments[0].id)
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold truncate ${selectedDeptId === String(departments[0].id) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            Khoa {departments[0].name}
                          </div>
                          <div className={`text-[12px] truncate ${selectedDeptId === String(departments[0].id) ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            Mã khoa: {departments[0].code}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedDeptId === String(departments[0].id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                            {optionCounts.deptCounts[String(departments[0].id)] || 0}
                          </span>
                          {selectedDeptId === String(departments[0].id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* ── TAB 2: KHOA / BỘ MÔN ── */}
                {activeCategory === 'department' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onDeptChange('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${selectedDeptId === ''
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedDeptId === '' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả các Khoa
                        </div>
                        <div className={`text-[12px] truncate ${selectedDeptId === '' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Toàn bộ đơn vị đào tạo
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedDeptId === ''
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                          {optionCounts.total}
                        </span>
                        {selectedDeptId === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {departments.map((d) => {
                      const isSelected = selectedDeptId === String(d.id);
                      const count = optionCounts.deptCounts[String(d.id)] ?? 0;

                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onDeptChange(String(d.id))}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {d.name}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              Mã khoa: {d.code}
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

                {/* ── TAB 3: HỌC VỊ / HỌC HÀM ── */}
                {activeCategory === 'degree' && (
                  <div className="space-y-1.5">
                    {degreeList.map((item) => {
                      const isSelected = selectedDegree === item.value;
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

                {/* ── TAB 4: THUỘC KHOA ── */}
                {activeCategory === 'status' && (
                  <div className="space-y-1.5">
                    {statusList.map((item) => {
                      const isSelected = selectedStatus === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onStatusChange?.(item.value)}
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
                      {teachers.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {teachers.length} giảng viên ({Math.round((totalFilteredCount / Math.max(1, teachers.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && teachers.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, teachers.length)) * 100))}%` }}
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
