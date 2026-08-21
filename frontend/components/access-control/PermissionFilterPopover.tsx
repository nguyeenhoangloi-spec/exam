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
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Mở bộ lọc quyền"
        className={`relative inline-flex h-7 w-7 items-center justify-center rounded-xl transition-colors cursor-pointer ${
          isOpen || activeFilterCount > 0
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`}
        title="Lọc nhóm chức năng & mức độ bảo mật"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <span className="ui-pill ui-pill-solid absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-type-helper font-medium text-white shadow-xs">
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
            className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  Bộ lọc quyền
                </span>
                {activeFilterCount > 0 && (
                  <span className="ui-pill rounded-full bg-blue-100 px-2 py-0.5 text-type-helper font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {activeFilterCount} đang bật
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-type-helper font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Đặt lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Popover Body */}
            <div className="max-h-[360px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                      ? 'border-amber-400 bg-amber-50/80 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        onlySensitive
                          ? 'bg-amber-200/80 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <LockKeyhole className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-type-body font-semibold">Chỉ quyền nhạy cảm</div>
                      <div className="text-type-helper text-slate-400 font-normal">
                        Các quyền can thiệp hệ thống, duyệt đề, điểm thi
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ui-pill rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-type-helper font-medium text-slate-600 dark:text-slate-300">
                      {sensitiveCount}
                    </span>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        onlySensitive
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {onlySensitive && <Check className="h-3 w-3 stroke-[3]" />}
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
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                      moduleFilter === 'ALL'
                        ? 'bg-blue-50 text-blue-900 font-semibold dark:bg-blue-950/60 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <span className="text-type-body">Tất cả nhóm</span>
                    </div>
                    <span className="ui-pill rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-type-helper font-medium text-slate-500">
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
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-semibold dark:bg-blue-950/60 dark:text-blue-200'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                          <span className="text-type-body">{m}</span>
                        </div>
                        <span className="ui-pill rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-type-helper font-medium text-slate-500">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Popover Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-type-helper text-slate-500 dark:text-slate-400">
                Hiển thị <strong className="text-slate-900 dark:text-white font-semibold">{totalFilteredCount}</strong> / {totalCount} quyền
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-type-body-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
