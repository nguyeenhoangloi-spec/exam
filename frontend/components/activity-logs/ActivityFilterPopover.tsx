'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Zap,
  Layers,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  GraduationCap,
  BookOpen,
  Cpu,
  LockKeyhole,
} from 'lucide-react';

interface ActivityFilterPopoverProps {
  activeTab: 'activity' | 'security';
  entityFilter: string;
  onEntityFilterChange: (val: string) => void;
  availableEntities: string[];
  getEntityLabel: (type?: string | null) => string;
  secCategory: string;
  onSecCategoryChange: (val: string) => void;
  secCategoryLabel: Record<string, string>;
  secOutcome: string;
  onSecOutcomeChange: (val: string) => void;
  secOutcomeLabel: Record<string, string>;
  onResetAll: () => void;
}

export function ActivityFilterPopover({
  activeTab,
  entityFilter,
  onEntityFilterChange,
  availableEntities,
  getEntityLabel,
  secCategory,
  onSecCategoryChange,
  secCategoryLabel,
  secOutcome,
  onSecOutcomeChange,
  secOutcomeLabel,
  onResetAll,
}: ActivityFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFilterCount =
    activeTab === 'activity'
      ? entityFilter ? 1 : 0
      : (secCategory ? 1 : 0) + (secOutcome ? 1 : 0);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(520, vw - margin * 2);
    const top = rect.bottom + 8;
    const availableMaxHeight = Math.min(480, Math.max(280, vh - top - margin));

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
      else if (e.key === '2') setActiveCategory(activeTab === 'activity' ? 'entities' : 'categories');
      else if (e.key === '3' && activeTab === 'security') setActiveCategory('outcomes');
    };

    const handleResize = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition, activeTab]);

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

  const categories = useMemo(() => {
    if (activeTab === 'activity') {
      return [
        { id: 'presets', label: 'Gợi ý nhanh', shortcut: '1', icon: Zap, badge: null },
        { id: 'entities', label: 'Thực thể', shortcut: '2', icon: Layers, badge: entityFilter ? '1' : null },
      ];
    } else {
      return [
        { id: 'presets', label: 'Gợi ý nhanh', shortcut: '1', icon: Zap, badge: null },
        { id: 'categories', label: 'Nhóm an ninh', shortcut: '2', icon: Shield, badge: secCategory ? '1' : null },
        { id: 'outcomes', label: 'Kết quả', shortcut: '3', icon: AlertCircle, badge: secOutcome ? '1' : null },
      ];
    }
  }, [activeTab, entityFilter, secCategory, secOutcome]);

  return (
    <div className="relative inline-flex items-center">
      {/* ── Nút kích hoạt SlidersHorizontal nhúng chuẩn trong Search Bar ── */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors cursor-pointer select-none ${isOpen || activeFilterCount > 0
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
          }`}
        title="Bộ lọc nâng cao"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />

        {activeFilterCount > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onResetAll();
            }}
            title="Nhấn để xóa nhanh toàn bộ lọc (1-Click Reset)"
            className="table-badge absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-type-helper font-semibold text-white hover:bg-rose-500 transition-colors shadow-2xs"
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* ── Bảng Popover 2 Cột Đồng Bộ Chuẩn Mực Hệ Thống ── */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc nhật ký"
            className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header Popover */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeTab === 'activity' ? 'Bộ lọc nhật ký thao tác' : 'Bộ lọc kiểm toán an ninh'}
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeTab === 'activity' ? 'Lọc theo đối tượng thực thể & chức năng' : 'Lọc theo nhóm kiểm toán & trạng thái an ninh'}
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

            {/* 2. Thân bảng: Bố cục 2 Cột */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Cột Trái: Danh mục */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-type-body-sm transition-all duration-150 cursor-pointer ${isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>

                      {cat.badge ? (
                        <span className="h-4 min-w-[16px] rounded-full bg-blue-600 px-1 text-type-helper font-semibold text-white flex items-center justify-center">
                          {cat.badge}
                        </span>
                      ) : (
                        <span className={`text-type-helper font-normal ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          {cat.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 px-2">
                  <div className="text-type-helper text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>Phím:</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 font-medium text-type-helper text-slate-700 dark:text-slate-300">
                      1-{categories.length}
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải: Lựa chọn chi tiết */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar text-type-body">
                {/* ── TAB 1: GỢI Ý NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                      Gợi ý bộ lọc nhanh:
                    </p>

                    {activeTab === 'activity' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onEntityFilterChange('');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${!entityFilter
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                              Tất cả nhật ký
                            </div>
                            <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                              Toàn bộ thao tác trên toàn hệ thống
                            </div>
                          </div>
                          {!entityFilter && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onEntityFilterChange('BACKUP');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${entityFilter === 'BACKUP'
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                              Sao lưu & Khôi phục
                            </div>
                            <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                              Snapshot cơ sở dữ liệu và bản sao an toàn
                            </div>
                          </div>
                          {entityFilter === 'BACKUP' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onEntityFilterChange('ACCESS_CONTROL');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${entityFilter === 'ACCESS_CONTROL'
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                              Phân quyền & Tài khoản
                            </div>
                            <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                              Thay đổi quyền hạn, vai trò và phạm vi
                            </div>
                          </div>
                          {entityFilter === 'ACCESS_CONTROL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onSecCategoryChange('');
                            onSecOutcomeChange('');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${!secCategory && !secOutcome
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                              Mọi sự kiện an ninh
                            </div>
                            <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                              Xem toàn bộ chuỗi sự kiện được ghi nhận
                            </div>
                          </div>
                          {!secCategory && !secOutcome && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSecCategoryChange('');
                            onSecOutcomeChange('DENIED');
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${secOutcome === 'DENIED'
                            ? 'border-rose-600 dark:border-rose-500 ring-1 ring-rose-600/20 dark:ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                              Cảnh báo bị từ chối truy cập
                            </div>
                            <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                              Các yêu cầu bị chặn do sai quyền hoặc phiên hết hạn
                            </div>
                          </div>
                          {secOutcome === 'DENIED' && <Check className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ── TAB 2: THỰC THỂ (ENTITIES) ── */}
                {activeCategory === 'entities' && (
                  <div className="space-y-1">
                    <p className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                      Chọn thực thể cần tra cứu:
                    </p>

                    <button
                      type="button"
                      onClick={() => onEntityFilterChange('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body-sm font-medium transition cursor-pointer text-left border ${!entityFilter
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span>Tất cả thực thể</span>
                      {!entityFilter && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {availableEntities.map((ent) => {
                      const isSelected = entityFilter === ent;
                      return (
                        <button
                          key={ent}
                          type="button"
                          onClick={() => onEntityFilterChange(ent)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body-sm font-medium transition cursor-pointer text-left border ${isSelected
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <span className="truncate">{getEntityLabel(ent)}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 2 (SECURITY): NHÓM KIỂM TOÁN ── */}
                {activeCategory === 'categories' && (
                  <div className="space-y-1">
                    <p className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                      Chọn nhóm an ninh:
                    </p>

                    <button
                      type="button"
                      onClick={() => onSecCategoryChange('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body-sm font-medium transition cursor-pointer text-left border ${!secCategory
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span>Tất cả nhóm an ninh</span>
                      {!secCategory && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {Object.entries(secCategoryLabel).map(([key, label]) => {
                      const isSelected = secCategory === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onSecCategoryChange(key)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body-sm font-medium transition cursor-pointer text-left border ${isSelected
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <span className="truncate">{label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 3 (SECURITY): KẾT QUẢ ── */}
                {activeCategory === 'outcomes' && (
                  <div className="space-y-1">
                    <p className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                      Chọn kết quả thẩm định:
                    </p>

                    <button
                      type="button"
                      onClick={() => onSecOutcomeChange('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body-sm font-medium transition cursor-pointer text-left border ${!secOutcome
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span>Mọi kết quả</span>
                      {!secOutcome && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {Object.entries(secOutcomeLabel).map(([key, label]) => {
                      const isSelected = secOutcome === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onSecOutcomeChange(key)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body-sm font-medium transition cursor-pointer text-left border ${isSelected
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <span>{label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer Popover tinh gọn & thanh lịch */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-type-helper text-slate-500 dark:text-slate-400">
                {activeFilterCount > 0 ? (
                  <>Đang áp dụng <strong className="font-semibold text-blue-600 dark:text-blue-400">{activeFilterCount}</strong> bộ lọc</>
                ) : (
                  'Chưa áp dụng bộ lọc nào'
                )}
              </span>
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
