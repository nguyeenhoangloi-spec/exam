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
  Database,
  CheckCircle2,
  Clock,
  HardDrive,
  FileCode,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface BackupFilterPopoverProps {
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  jobs?: any[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'types' | 'statuses';

export function BackupFilterPopover({
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  jobs = [],
  totalFilteredCount,
  onResetAll,
}: BackupFilterPopoverProps) {
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
    const total = jobs.length;
    const succeeded = jobs.filter((j) => j.status === 'SUCCEEDED').length;
    const running = jobs.filter((j) => ['RUNNING', 'VERIFYING', 'QUEUED'].includes(j.status)).length;
    const failed = jobs.filter((j) => ['FAILED', 'VERIFY_FAILED'].includes(j.status)).length;

    const full = jobs.filter((j) => j.type === 'FULL').length;
    const db = jobs.filter((j) => j.type === 'DATABASE').length;
    const uploads = jobs.filter((j) => j.type === 'UPLOADS').length;
    const safety = jobs.filter((j) => j.type === 'SAFETY').length;

    return { total, succeeded, running, failed, full, db, uploads, safety };
  }, [jobs]);

  const activeFilterCount = [
    Boolean(filterType),
    Boolean(filterStatus),
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
      else if (e.key === '2') setActiveCategory('types');
      else if (e.key === '3') setActiveCategory('statuses');
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
      id: 'types' as FilterCategory,
      label: 'Loại sao lưu',
      icon: HardDrive,
      shortcut: '2',
      badge: filterType ? 1 : undefined,
    },
    {
      id: 'statuses' as FilterCategory,
      label: 'Trạng thái',
      icon: CheckCircle2,
      shortcut: '3',
      badge: filterStatus ? 1 : undefined,
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
        title="Bộ lọc sao lưu & khôi phục"
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
            aria-label="Bảng bộ lọc sao lưu hệ thống"
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
                    Bộ lọc sao lưu & khôi phục
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    Lọc danh sách theo loại snapshot & trạng thái
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
                        onFilterTypeChange('');
                        onFilterStatusChange('SUCCEEDED');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filterStatus === 'SUCCEEDED' && !filterType
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Bản sao lưu thành công
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Đã xác minh toàn vẹn SHA-256
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === 'SUCCEEDED' && !filterType
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.succeeded}
                        </span>
                        {filterStatus === 'SUCCEEDED' && !filterType && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFilterTypeChange('FULL');
                        onFilterStatusChange('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filterType === 'FULL'
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Bản sao lưu toàn phần (FULL)
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Bao gồm cả CSDL và file đính kèm
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === 'FULL'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.full}
                        </span>
                        {filterType === 'FULL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFilterTypeChange('SAFETY');
                        onFilterStatusChange('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${filterType === 'SAFETY'
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                          Snapshot an toàn (SAFETY)
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Tạo tự động trước khi restore
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === 'SAFETY'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                          }`}>
                          {counts.safety}
                        </span>
                        {filterType === 'SAFETY' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: LOẠI SAO LƯU ── */}
                {activeCategory === 'types' && (
                  <div className="space-y-1.5">
                    {[
                      { key: '', label: 'Tất cả loại sao lưu', desc: 'Mọi định dạng snapshot', count: counts.total },
                      { key: 'FULL', label: 'Toàn phần (FULL)', desc: 'CSDL và file uploads', count: counts.full },
                      { key: 'DATABASE', label: 'Chỉ CSDL (DATABASE)', desc: 'Dump PostgreSQL schema & data', count: counts.db },
                      { key: 'UPLOADS', label: 'Chỉ tệp đính kèm (UPLOADS)', desc: 'Tài liệu, đề thi và ảnh', count: counts.uploads },
                      { key: 'SAFETY', label: 'Bảo vệ an toàn (SAFETY)', desc: 'Snapshot phòng ngừa rủi ro', count: counts.safety },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onFilterTypeChange(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all duration-150 cursor-pointer border ${filterType === item.key
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
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterType === item.key
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                              : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                            }`}>
                            {item.count}
                          </span>
                          {filterType === item.key && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── TAB 3: TRẠNG THÁI ── */}
                {activeCategory === 'statuses' && (
                  <div className="space-y-1.5">
                    {[
                      { key: '', label: 'Tất cả trạng thái', desc: 'Mọi bản ghi sao lưu', count: counts.total },
                      { key: 'SUCCEEDED', label: 'Thành công', desc: 'Đã hoàn thành và kiểm tra dữ liệu', count: counts.succeeded },
                      { key: 'RUNNING', label: 'Đang thực hiện', desc: 'Đang sao lưu hoặc đóng gói dữ liệu', count: counts.running },
                      { key: 'FAILED', label: 'Thất bại', desc: 'Lỗi tiến trình sao lưu', count: counts.failed },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onFilterStatusChange(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all duration-150 cursor-pointer border ${filterStatus === item.key
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
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filterStatus === item.key
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                              : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                            }`}>
                            {item.count}
                          </span>
                          {filterStatus === item.key && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
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
                      {jobs.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {jobs.length} bản ghi ({Math.round((totalFilteredCount / Math.max(1, jobs.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && jobs.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, jobs.length)) * 100))}%` }}
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
