'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  BookOpen,
  Zap,
  Layers,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { Subject, Question } from '../../types';
import { QuestionBankFilterValues } from './QuestionBankFiltersCard';

interface QuestionBankFilterPopoverProps {
  filters: QuestionBankFilterValues;
  onChange: (next: QuestionBankFilterValues) => void;
  subjects: Subject[];
  questions?: Question[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'subject' | 'difficulty' | 'type' | 'bloom';

export function QuestionBankFilterPopover({
  filters,
  onChange,
  subjects,
  questions = [],
  totalFilteredCount,
  onResetAll,
}: QuestionBankFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setFilter = (key: keyof QuestionBankFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  // Tính toán số lượng thực tế
  const optionCounts = useMemo(() => {
    const total = questions.length;
    const subjectCounts: Record<string, number> = {};
    subjects.forEach((s) => {
      subjectCounts[String(s.id)] = questions.filter((q) => String(q.subjectId) === String(s.id)).length;
    });

    const diffCounts: Record<string, number> = {
      EASY: questions.filter((q) => q.difficulty === 'EASY').length,
      MEDIUM: questions.filter((q) => q.difficulty === 'MEDIUM').length,
      HARD: questions.filter((q) => q.difficulty === 'HARD').length,
    };

    const typeCounts: Record<string, number> = {
      SINGLE_CHOICE: questions.filter((q) => q.type === 'SINGLE_CHOICE').length,
      MULTIPLE_CHOICE: questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length,
      TRUE_FALSE: questions.filter((q) => q.type === 'TRUE_FALSE').length,
      FILL_BLANK: questions.filter((q) => q.type === 'FILL_BLANK').length,
      ESSAY: questions.filter((q) => q.type === 'ESSAY').length,
    };

    return { total, subjectCounts, diffCounts, typeCounts };
  }, [questions, subjects]);

  const activeFilterCount = [
    Boolean(filters.subjectId),
    Boolean(filters.difficulty),
    Boolean(filters.type),
    Boolean(filters.bloomLevel),
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
      else if (e.key === '2') setActiveCategory('subject');
      else if (e.key === '3') setActiveCategory('difficulty');
      else if (e.key === '4') setActiveCategory('type');
      else if (e.key === '5') setActiveCategory('bloom');
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
    { id: 'subject' as FilterCategory, label: 'Môn học', shortcut: '2', icon: BookOpen, badge: filters.subjectId ? '1' : null },
    { id: 'difficulty' as FilterCategory, label: 'Độ khó', shortcut: '3', icon: Layers, badge: filters.difficulty ? '1' : null },
    { id: 'type' as FilterCategory, label: 'Loại câu', shortcut: '4', icon: HelpCircle, badge: filters.type ? '1' : null },
    { id: 'bloom' as FilterCategory, label: 'Mức Bloom', shortcut: '5', icon: Brain, badge: filters.bloomLevel ? '1' : null },
  ];

  const difficultyList = [
    { value: '', label: 'Tất cả độ khó', desc: 'Mọi mức độ câu hỏi', count: optionCounts.total },
    { value: 'EASY', label: 'Dễ (Easy)', desc: 'Mức độ nhận biết / cơ bản', count: optionCounts.diffCounts['EASY'] || 0 },
    { value: 'MEDIUM', label: 'Trung bình (Medium)', desc: 'Mức độ thông hiểu / áp dụng', count: optionCounts.diffCounts['MEDIUM'] || 0 },
    { value: 'HARD', label: 'Khó (Hard)', desc: 'Mức độ phân tích / nâng cao', count: optionCounts.diffCounts['HARD'] || 0 },
  ];

  const typeList = [
    { value: '', label: 'Tất cả loại câu', desc: 'Mọi định dạng câu hỏi', count: optionCounts.total },
    { value: 'SINGLE_CHOICE', label: 'Trắc nghiệm', desc: 'Câu hỏi trắc nghiệm khách quan', count: (optionCounts.typeCounts['SINGLE_CHOICE'] || 0) + (optionCounts.typeCounts['MULTIPLE_CHOICE'] || 0) },
    { value: 'ESSAY', label: 'Tự luận', desc: 'Câu hỏi trình bày tự luận', count: optionCounts.typeCounts['ESSAY'] || 0 },
    { value: 'FILL_BLANK', label: 'Điền khuyết', desc: 'Câu hỏi điền vào chỗ trống', count: optionCounts.typeCounts['FILL_BLANK'] || 0 },
  ];

  const bloomList = [
    { value: '', label: 'Tất cả mức Bloom', desc: 'Mọi cấp độ tư duy' },
    { value: 'REMEMBER', label: 'Nhận biết (Remember)', desc: 'Tái hiện kiến thức' },
    { value: 'UNDERSTAND', label: 'Thông hiểu (Understand)', desc: 'Hiểu bản chất kiến thức' },
    { value: 'APPLY', label: 'Vận dụng (Apply)', desc: 'Áp dụng vào thực tế' },
    { value: 'ANALYZE', label: 'Phân tích (Analyze)', desc: 'Phân tích tổng hợp nâng cao' },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'SINGLE_CHOICE') {
      setFilter('type', 'SINGLE_CHOICE');
      setFilter('difficulty', '');
    } else if (presetType === 'EASY') {
      setFilter('difficulty', 'EASY');
      setFilter('type', '');
    } else if (presetType === 'FIRST_SUBJECT') {
      if (subjects[0]) {
        setFilter('subjectId', String(subjects[0].id));
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
        title="Bộ lọc câu hỏi"
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
            aria-label="Bảng bộ lọc ngân hàng câu hỏi"
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
                    Bộ lọc câu hỏi
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí tra cứu ngân hàng đề thi
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
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-type-helper text-slate-600 dark:text-slate-400">1-5</kbd>
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
                      onClick={() => applyPreset('SINGLE_CHOICE')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filters.type === 'SINGLE_CHOICE'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Trắc nghiệm 1 đáp án
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Câu hỏi trắc nghiệm khách quan chuẩn
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.type === 'SINGLE_CHOICE'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.typeCounts['SINGLE_CHOICE'] || 0}
                        </span>
                        {filters.type === 'SINGLE_CHOICE' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('EASY')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filters.difficulty === 'EASY'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Mức độ Dễ (Easy)
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Câu hỏi kiểm tra nhận biết nền tảng
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.difficulty === 'EASY'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {optionCounts.diffCounts['EASY'] || 0}
                        </span>
                        {filters.difficulty === 'EASY' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {subjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyPreset('FIRST_SUBJECT')}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filters.subjectId === String(subjects[0].id)
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 truncate">
                            Môn {subjects[0].subjectName}
                          </div>
                          <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                            Mã môn: {subjects[0].subjectCode}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.subjectId === String(subjects[0].id)
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                            }`}>
                            {optionCounts.subjectCounts[String(subjects[0].id)] || 0}
                          </span>
                          {filters.subjectId === String(subjects[0].id) && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* ── TAB 2: MÔN HỌC ── */}
                {activeCategory === 'subject' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter('subjectId', '')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filters.subjectId === ''
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Tất cả các môn
                        </div>
                        <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                          Toàn bộ danh mục môn thi
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.subjectId === ''
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                          : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {optionCounts.total}
                        </span>
                        {filters.subjectId === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {subjects.map((s) => {
                      const isSelected = filters.subjectId === String(s.id);
                      const count = optionCounts.subjectCounts[String(s.id)] ?? 0;

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFilter('subjectId', String(s.id))}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                              {s.subjectName}
                            </div>
                            <div className="text-type-helper truncate text-slate-500 dark:text-slate-400">
                              Mã môn: {s.subjectCode}
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

                {/* ── TAB 3: ĐỘ KHÓ ── */}
                {activeCategory === 'difficulty' && (
                  <div className="space-y-1.5">
                    {difficultyList.map((item) => {
                      const isSelected = filters.difficulty === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFilter('difficulty', item.value)}
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

                {/* ── TAB 4: LOẠI CÂU HỎI ── */}
                {activeCategory === 'type' && (
                  <div className="space-y-1.5">
                    {typeList.map((item) => {
                      const isSelected = filters.type === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFilter('type', item.value)}
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

                {/* ── TAB 5: MỨC ĐỘ BLOOM ── */}
                {activeCategory === 'bloom' && (
                  <div className="space-y-1.5">
                    {bloomList.map((item) => {
                      const isSelected = filters.bloomLevel === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFilter('bloomLevel', item.value)}
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

                          {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
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
                      {questions.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {questions.length} câu hỏi ({Math.round((totalFilteredCount / Math.max(1, questions.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && questions.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, questions.length)) * 100))}%` }}
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
