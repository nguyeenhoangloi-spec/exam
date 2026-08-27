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
  BookOpen,
  Zap,
  Users,
  Award,
} from 'lucide-react';
import { Subject, Department } from '../../types';

interface SubjectFilterPopoverProps {
  selectedDeptId: string;
  onDeptChange: (val: string) => void;
  filterCredits: string;
  onCreditsChange: (val: string) => void;
  filterHasStudents: string;
  onHasStudentsChange: (val: string) => void;
  departments: Department[];
  subjects?: Subject[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'department' | 'credits' | 'students';

export function SubjectFilterPopover({
  selectedDeptId,
  onDeptChange,
  filterCredits,
  onCreditsChange,
  filterHasStudents,
  onHasStudentsChange,
  departments,
  subjects = [],
  totalFilteredCount,
  onResetAll,
}: SubjectFilterPopoverProps) {
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
    const total = subjects.length;
    const deptCounts: Record<string, number> = {};
    departments.forEach((d) => {
      deptCounts[String(d.id)] = subjects.filter((s) => String(s.departmentId) === String(d.id)).length;
    });

    const creditCounts: Record<string, number> = {
      '1': subjects.filter((s) => s.credits === 1).length,
      '2': subjects.filter((s) => s.credits === 2).length,
      '3': subjects.filter((s) => s.credits === 3).length,
      '4': subjects.filter((s) => s.credits === 4).length,
      '5': subjects.filter((s) => (s.credits || 0) >= 5).length,
    };

    const hasStudentsCount = subjects.filter((s: any) => (s._count?.studentSubjects || 0) > 0).length;
    const noStudentsCount = subjects.filter((s: any) => (s._count?.studentSubjects || 0) === 0).length;

    return { total, deptCounts, creditCounts, hasStudentsCount, noStudentsCount };
  }, [subjects, departments]);

  const activeFilterCount = [
    Boolean(selectedDeptId),
    Boolean(filterCredits),
    Boolean(filterHasStudents),
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
      else if (e.key === '3') setActiveCategory('credits');
      else if (e.key === '4') setActiveCategory('students');
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
    { id: 'credits' as FilterCategory, label: 'Số tín chỉ', shortcut: '3', icon: Award, badge: filterCredits ? '1' : null },
    { id: 'students' as FilterCategory, label: 'Sinh viên', shortcut: '4', icon: Users, badge: filterHasStudents ? '1' : null },
  ];

  const creditList = [
    { value: '', label: 'Tất cả số tín chỉ', desc: 'Mọi định mức tín chỉ', count: optionCounts.total },
    { value: '3', label: '3 Tín chỉ', desc: 'Môn học lý thuyết tiêu chuẩn', count: optionCounts.creditCounts['3'] || 0 },
    { value: '2', label: '2 Tín chỉ', desc: 'Môn bổ trợ hoặc thực hành', count: optionCounts.creditCounts['2'] || 0 },
    { value: '4', label: '4 Tín chỉ', desc: 'Môn chuyên ngành tích hợp đồ án', count: optionCounts.creditCounts['4'] || 0 },
    { value: '1', label: '1 Tín chỉ', desc: 'Học phần kỹ năng / giáo dục', count: optionCounts.creditCounts['1'] || 0 },
  ];

  const studentFilterList = [
    { value: '', label: 'Tất cả trạng thái', desc: 'Mọi môn học', count: optionCounts.total },
    { value: 'yes', label: 'Đã có SV đăng ký', desc: 'Có sinh viên trong danh sách lớp', count: optionCounts.hasStudentsCount },
    { value: 'no', label: 'Chưa có SV đăng ký', desc: 'Chưa có dữ liệu sinh viên', count: optionCounts.noStudentsCount },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'CREDIT_3') {
      onCreditsChange('3');
      onDeptChange('');
      onHasStudentsChange('');
    } else if (presetType === 'HAS_STUDENTS') {
      onHasStudentsChange('yes');
      onDeptChange('');
      onCreditsChange('');
    } else if (presetType === 'FIRST_DEPT') {
      if (departments[0]) {
        onDeptChange(String(departments[0].id));
      }
    }
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
        title="Bộ lọc môn học"
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

      {/* ── Bảng Popover 2 Cột Đồng Bộ & Chuẩn Mực ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc môn học"
            className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Bộ lọc môn học
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí hiển thị môn học
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
                      onClick={() => applyPreset('CREDIT_3')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filterCredits === '3'
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Môn học 3 Tín chỉ
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Học phần lý thuyết tiêu chuẩn của trường
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterCredits === '3'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.creditCounts['3'] || 0}
                        </span>
                        {filterCredits === '3' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('HAS_STUDENTS')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filterHasStudents === 'yes'
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Đã có sinh viên đăng ký
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Các môn đã có danh sách lớp học phần
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterHasStudents === 'yes'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.hasStudentsCount}
                        </span>
                        {filterHasStudents === 'yes' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {departments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyPreset('FIRST_DEPT')}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedDeptId === String(departments[0].id)
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {departments[0].name}
                          </div>
                          <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                            Khoa / Viện {departments[0].name}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${selectedDeptId === String(departments[0].id)
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                              : 'bg-slate-100 text-slate-600 dark:text-slate-300'
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
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả khoa / bộ môn
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Mọi môn học thuộc toàn trường
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${selectedDeptId === ''
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
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
                              ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                              : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                              {d.name}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              Mã khoa: {d.code || `KHOA${d.id}`}
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

                {/* ── TAB 3: SỐ TÍN CHỈ ── */}
                {activeCategory === 'credits' && (
                  <div className="space-y-1.5">
                    {creditList.map((item) => {
                      const isSelected = filterCredits === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onCreditsChange(item.value)}
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

                {/* ── TAB 4: SINH VIÊN ── */}
                {activeCategory === 'students' && (
                  <div className="space-y-1.5">
                    {studentFilterList.map((item) => {
                      const isSelected = filterHasStudents === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onHasStudentsChange(item.value)}
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
              </div>
            </div>

            {/* 3. Footer tinh gọn & thanh lịch */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-0.5">
                <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {subjects.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {subjects.length} môn học ({Math.round((totalFilteredCount / Math.max(1, subjects.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && subjects.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, subjects.length)) * 100))}%` }}
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
