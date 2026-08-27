'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  LockKeyhole,
  LayoutGrid,
  Shield,
  BarChart3,
  FileCheck2,
  BookOpen,
  Cpu,
  GraduationCap,
  Building2,
} from 'lucide-react';

interface PermissionFilterPopoverProps {
  moduleFilter: string;
  onModuleFilterChange: (val: string) => void;
  onlySensitive: boolean;
  onOnlySensitiveChange: (val: boolean) => void;
  availableModules: string[];
  permissions: Array<{ module: string; sensitive: boolean }>;
  totalFilteredCount: number;
  totalCount: number;
  onResetAll: () => void;
}

const getModuleIcon = (moduleName: string) => {
  switch (moduleName) {
    case 'Báo cáo':
      return BarChart3;
    case 'Chấm thi':
      return FileCheck2;
    case 'Ngân hàng đề':
      return BookOpen;
    case 'Quản trị hệ thống':
      return Cpu;
    case 'Sinh viên':
      return GraduationCap;
    case 'Tổ chức thi':
      return Building2;
    default:
      return Shield;
  }
};

export function PermissionFilterPopover({
  moduleFilter,
  onModuleFilterChange,
  onlySensitive,
  onOnlySensitiveChange,
  availableModules,
  permissions,
  totalFilteredCount,
  totalCount,
  onResetAll,
}: PermissionFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensitiveCount = permissions.filter((p) => p.sensitive).length;

  const activeFilterCount = (moduleFilter !== 'ALL' ? 1 : 0) + (onlySensitive ? 1 : 0);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(460, vw - margin * 2);
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

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleResize = () => updatePosition();

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors cursor-pointer select-none ${
          isOpen || activeFilterCount > 0
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
        }`}
        title="Lọc nhóm chức năng & mức độ bảo mật"
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

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  Bộ lọc quyền
                </span>
                {activeFilterCount > 0 && (
                  <span className="ui-pill inline-flex items-center rounded-full border border-blue-300 dark:border-blue-700 bg-transparent px-2 py-0.5 text-type-helper font-medium text-blue-700 dark:text-blue-400 select-none">
                    {activeFilterCount} đang bật
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-type-helper font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Đặt lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Popover Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Section 1: Security Level */}
              <div className="space-y-2">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                  Mức độ bảo mật
                </label>
                <button
                  type="button"
                  onClick={() => onOnlySensitiveChange(!onlySensitive)}
                  className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                    onlySensitive
                      ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                      : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        onlySensitive
                          ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <LockKeyhole className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                        Chỉ quyền nhạy cảm
                      </div>
                      <div className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                        Các quyền can thiệp hệ thống, duyệt đề, điểm thi
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`ui-pill rounded-full px-2 py-0.5 text-type-helper font-medium tabular-nums ${
                      onlySensitive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                        : 'border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300'
                    }`}>
                      {sensitiveCount}
                    </span>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition shadow-2xs ${
                        onlySensitive
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      {onlySensitive && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              </div>

              {/* Section 2: Module Group */}
              <div className="space-y-2">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                  Nhóm chức năng ({availableModules.length})
                </label>
                <div className="space-y-1">
                  {/* All option */}
                  <button
                    type="button"
                    onClick={() => onModuleFilterChange('ALL')}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition cursor-pointer border ${
                      moduleFilter === 'ALL'
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutGrid className={`h-4 w-4 ${moduleFilter === 'ALL' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className={`text-type-body ${moduleFilter === 'ALL' ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>Tất cả nhóm</span>
                    </div>
                    <span className={`ui-pill rounded-full px-2 py-0.5 text-type-helper font-medium tabular-nums ${
                      moduleFilter === 'ALL'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                        : 'border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300'
                    }`}>
                      {totalCount}
                    </span>
                  </button>

                  {/* Each module */}
                  {availableModules.map((m) => {
                    const Icon = getModuleIcon(m);
                    const count = permissions.filter((p) => p.module === m).length;
                    const isSelected = moduleFilter === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onModuleFilterChange(m)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition cursor-pointer border ${
                          isSelected
                            ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20 dark:ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                            : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span className={`text-type-body ${isSelected ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>{m}</span>
                        </div>
                        <span className={`ui-pill rounded-full px-2 py-0.5 text-type-helper font-medium tabular-nums ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold'
                            : 'border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
