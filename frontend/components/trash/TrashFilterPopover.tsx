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
  CalendarCheck,
  FileText,
  HelpCircle,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Layers,
  AlertTriangle,
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
      id: 'categories' as FilterCategory,
      label: 'Loại đối tượng',
      icon: Layers,
      shortcut: '2',
      badge: activeCategory !== 'schedules' ? 1 : undefined,
    },
    {
      id: 'expiry' as FilterCategory,
      label: 'Hạn lưu trữ',
      icon: Clock,
      shortcut: '3',
      badge: expiryFilter ? 1 : undefined,
    },
  ];

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
        title="Bộ lọc thùng rác"
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

      {/* ── Bảng Popover 2 Cột Đồng Bộ Chuẩn Question Bank ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc thùng rác hệ thống"
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
                    Bộ lọc thùng rác
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Lọc dữ liệu đã xóa theo phân loại & thời hạn
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
                  const isActive = currCategoryTab === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCurrCategoryTab(cat.id)}
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
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-type-helper text-slate-600 dark:text-slate-400">1-3</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {currCategoryTab === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-type-helper font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý nhóm đã xóa phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        onActiveCategoryChange('schedules');
                        onExpiryFilterChange?.('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${activeCategory === 'schedules' && !expiryFilter
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Lịch thi đã xóa
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Các ca thi và phân công phòng thi
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${activeCategory === 'schedules' && !expiryFilter
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {stats.schedules}
                        </span>
                        {activeCategory === 'schedules' && !expiryFilter && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onActiveCategoryChange('questions');
                        onExpiryFilterChange?.('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${activeCategory === 'questions' && !expiryFilter
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Câu hỏi đã xóa
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Ngân hàng câu hỏi trong thùng rác
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${activeCategory === 'questions' && !expiryFilter
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {stats.questions}
                        </span>
                        {activeCategory === 'questions' && !expiryFilter && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onExpiryFilterChange?.('expiring_soon');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${expiryFilter === 'expiring_soon'
                          ? 'border-rose-600 dark:border-rose-500 ring-1 ring-rose-600/20 dark:ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Sắp hết hạn lưu trữ (≤ 7 ngày)
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Sắp bị xóa vĩnh viễn khỏi CSDL
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {expiryFilter === 'expiring_soon' && <Check className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: LOẠI ĐỐI TƯỢNG ── */}
                {currCategoryTab === 'categories' && (
                  <div className="space-y-1.5">
                    {[
                      { key: 'schedules', label: 'Lịch thi', desc: 'Ca thi & phân công phòng thi', count: stats.schedules },
                      { key: 'papers', label: 'Đề thi', desc: 'Bộ đề & ma trận đề', count: stats.papers },
                      { key: 'questions', label: 'Ngân hàng câu hỏi', desc: 'Câu hỏi các môn học', count: stats.questions },
                      { key: 'users', label: 'Tài khoản / Sinh viên', desc: 'Hồ sơ người dùng & sinh viên', count: stats.users || 0 },
                      { key: 'subjects', label: 'Môn học', desc: 'Danh mục học phần đào tạo', count: stats.subjects || 0 },
                      { key: 'classes', label: 'Lớp học', desc: 'Lớp sinh viên & niên khóa', count: stats.classes || 0 },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onActiveCategoryChange(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all duration-150 cursor-pointer border ${activeCategory === item.key
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                            {item.label}
                          </div>
                          <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                            {item.desc}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${activeCategory === item.key
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                              : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                            }`}>
                            {item.count}
                          </span>
                          {activeCategory === item.key && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── TAB 3: HẠN LƯU TRỮ ── */}
                {currCategoryTab === 'expiry' && (
                  <div className="space-y-1.5">
                    {[
                      { key: '', label: 'Tất cả thời hạn', desc: 'Mọi bản ghi trong thùng rác' },
                      { key: 'expiring_soon', label: 'Sắp hết hạn (≤ 7 ngày)', desc: 'Cần khôi phục gấp trước khi tự hủy' },
                      { key: 'safe', label: 'Còn hạn an toàn (> 7 ngày)', desc: 'Bản ghi mới xóa trong vòng 23 ngày' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onExpiryFilterChange?.(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all duration-150 cursor-pointer border ${expiryFilter === item.key
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                            {item.label}
                          </div>
                          <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                            {item.desc}
                          </div>
                        </div>
                        {expiryFilter === item.key && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
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
                      {stats.total > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {stats.total} mục ({Math.round((totalFilteredCount / Math.max(1, stats.total)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && stats.total > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, stats.total)) * 100))}%` }}
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
