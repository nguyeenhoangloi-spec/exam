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
  CheckCheck,
  Layers,
  Activity,
  LogIn,
  FileCheck,
  HardDrive,
} from 'lucide-react';

interface ActivityLogFilterPopoverProps {
  entityFilter: string;
  onEntityFilterChange: (val: string) => void;
  actionFilter?: string;
  onActionFilterChange?: (val: string) => void;
  entityTypes: string[];
  logs?: any[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'entities' | 'actions';

export function ActivityLogFilterPopover({
  entityFilter,
  onEntityFilterChange,
  actionFilter = '',
  onActionFilterChange,
  entityTypes = [],
  logs = [],
  totalFilteredCount,
  onResetAll,
}: ActivityLogFilterPopoverProps) {
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
    const total = logs.length;
    const loginCount = logs.filter((l) => l.action === 'LOGIN').length;
    const gradeAppealCount = logs.filter((l) => l.entityType === 'GradeAppeal').length;
    const backupCount = logs.filter((l) => l.entityType === 'BackupJob' || l.entityType === 'BackupRestoreRequest').length;

    const entityCounts: Record<string, number> = {};
    entityTypes.forEach((et) => {
      entityCounts[et] = logs.filter((l) => l.entityType === et).length;
    });

    const actionCounts: Record<string, number> = {
      CREATE: logs.filter((l) => l.action === 'CREATE').length,
      UPDATE: logs.filter((l) => l.action === 'UPDATE').length,
      DELETE: logs.filter((l) => l.action === 'DELETE').length,
      LOGIN: loginCount,
      APPROVE: logs.filter((l) => l.action === 'APPROVE').length,
    };

    return { total, loginCount, gradeAppealCount, backupCount, entityCounts, actionCounts };
  }, [logs, entityTypes]);

  const activeFilterCount = [
    Boolean(entityFilter),
    Boolean(actionFilter),
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
      else if (e.key === '2') setActiveCategory('entities');
      else if (e.key === '3') setActiveCategory('actions');
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
      id: 'entities' as FilterCategory,
      label: 'Thực thể',
      icon: Layers,
      shortcut: '2',
      badge: entityFilter ? 1 : undefined,
    },
    {
      id: 'actions' as FilterCategory,
      label: 'Loại thao tác',
      icon: Activity,
      shortcut: '3',
      badge: actionFilter ? 1 : undefined,
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
        title="Bộ lọc nhật ký hoạt động"
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
            aria-label="Bảng bộ lọc nhật ký hoạt động hệ thống"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20 shrink-0">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Bộ lọc nhật ký hoạt động
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Tùy chỉnh tiêu chí tra cứu nhật ký hệ thống
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="inline-flex items-center gap-1.5 text-type-helper font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Xóa tất cả bộ lọc đang áp dụng"
                  >
                    <RotateCcw className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">Đặt lại ({activeFilterCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
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
                      Gợi ý nhóm nhật ký:
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        onActionFilterChange?.('LOGIN');
                        onEntityFilterChange('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${actionFilter === 'LOGIN' && !entityFilter
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${actionFilter === 'LOGIN' && !entityFilter ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Nhật ký đăng nhập
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Theo dõi lượt đăng nhập hệ thống của người dùng
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${actionFilter === 'LOGIN' && !entityFilter
                          ? 'ui-pill-solid bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {counts.loginCount}
                        </span>
                        {actionFilter === 'LOGIN' && !entityFilter && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onEntityFilterChange('GradeAppeal');
                        onActionFilterChange?.('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${entityFilter === 'GradeAppeal'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${entityFilter === 'GradeAppeal' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Nhật ký phúc khảo điểm
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Lịch sử thẩm định và thay đổi điểm thi
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${entityFilter === 'GradeAppeal'
                          ? 'ui-pill-solid bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {counts.gradeAppealCount}
                        </span>
                        {entityFilter === 'GradeAppeal' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onEntityFilterChange('BackupJob');
                        onActionFilterChange?.('');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${entityFilter === 'BackupJob'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${entityFilter === 'BackupJob' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Sao lưu & Khôi phục CSDL
                        </div>
                        <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                          Nhật ký backup, snapshot và restore
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${entityFilter === 'BackupJob'
                          ? 'ui-pill-solid bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {counts.backupCount}
                        </span>
                        {entityFilter === 'BackupJob' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: THỰC THỂ ── */}
                {activeCategory === 'entities' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onEntityFilterChange('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${entityFilter === ''
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-type-helper font-semibold ${entityFilter === '' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả các thực thể
                        </div>
                        <div className={`text-type-helper truncate ${entityFilter === '' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Toàn bộ danh mục hoạt động
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${entityFilter === ''
                          ? 'ui-pill-solid bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                          {counts.total}
                        </span>
                        {entityFilter === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    {entityTypes.map((et) => (
                      <button
                        key={et}
                        type="button"
                        onClick={() => onEntityFilterChange(et)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${entityFilter === et
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-type-helper font-semibold ${entityFilter === et ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {et}
                          </div>
                          <div className={`text-type-helper truncate ${entityFilter === et ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            Thực thể dữ liệu {et}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${entityFilter === et
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                            }`}>
                            {counts.entityCounts[et] || 0}
                          </span>
                          {entityFilter === et && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── TAB 3: LOẠI THAO TÁC ── */}
                {activeCategory === 'actions' && (
                  <div className="space-y-1.5">
                    {[
                      { key: '', label: 'Tất cả thao tác', desc: 'Mọi phân loại hoạt động', count: counts.total },
                      { key: 'CREATE', label: 'Tạo mới', desc: 'Thêm bản ghi mới vào CSDL', count: counts.actionCounts['CREATE'] || 0 },
                      { key: 'UPDATE', label: 'Cập nhật', desc: 'Thay đổi thông tin dữ liệu', count: counts.actionCounts['UPDATE'] || 0 },
                      { key: 'DELETE', label: 'Xóa dữ liệu', desc: 'Xóa bản ghi khỏi hệ thống', count: counts.actionCounts['DELETE'] || 0 },
                      { key: 'LOGIN', label: 'Đăng nhập', desc: 'Lượt xác thực tài khoản', count: counts.actionCounts['LOGIN'] || 0 },
                      { key: 'APPROVE', label: 'Phê duyệt', desc: 'Duyệt bài thi hoặc phục hồi', count: counts.actionCounts['APPROVE'] || 0 },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onActionFilterChange?.(item.key)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${actionFilter === item.key
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-type-helper font-semibold ${actionFilter === item.key ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.label}
                          </div>
                          <div className={`text-type-helper truncate ${actionFilter === item.key ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.desc}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${actionFilter === item.key
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                            }`}>
                            {item.count}
                          </span>
                          {actionFilter === item.key && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-1">
                <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {logs.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {logs.length} nhật ký ({Math.round((totalFilteredCount / Math.max(1, logs.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && logs.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, logs.length)) * 100))}%` }}
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
