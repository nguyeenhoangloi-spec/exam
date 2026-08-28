'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, Check, RotateCcw } from 'lucide-react';

export interface UserRoleFilterPopoverProps {
  userRoleFilter: string;
  onUserRoleFilterChange: (role: string) => void;
  users: Array<{ id: number; role: string }>;
  totalCount: number;
  filteredCount: number;
  onResetAll: () => void;
}

export function UserRoleFilterPopover({
  userRoleFilter,
  onUserRoleFilterChange,
  users,
  totalCount,
  filteredCount,
  onResetAll,
}: UserRoleFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = userRoleFilter !== 'ALL';

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    const popoverWidth = 230;
    const top = rect.bottom + 6;
    const availableMaxHeight = Math.min(350, Math.max(180, vh - top - margin));

    let left = rect.right - popoverWidth;
    if (left < margin) {
      left = margin;
    }
    if (left + popoverWidth > vw - margin) {
      left = Math.max(margin, vw - popoverWidth - margin);
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxHeight: `${availableMaxHeight}px`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
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

  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const studentCount = users.filter((u) => u.role === 'STUDENT').length;

  const roleOptions = [
    { key: 'ALL', label: 'Tất cả vai trò', count: totalCount },
    { key: 'TEACHER', label: 'Giảng viên', count: teacherCount },
    { key: 'ADMIN', label: 'Quản trị viên', count: adminCount },
    { key: 'STUDENT', label: 'Sinh viên', count: studentCount },
  ];

  return (
    <div className="relative inline-flex items-center">
      {/* Nút icon SlidersHorizontal thanh lịch, không viền nhúng trong Search Bar */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors cursor-pointer select-none ${
          isActive
            ? 'text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Lọc theo vai trò"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />

        {isActive && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* Popover Menu nhỏ gọn, phẳng, vừa vặn với Sidebar */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Lọc theo vai trò"
            className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100 p-1.5 overflow-hidden"
          >
            {/* Header nhỏ gọn */}
            <div className="flex items-center justify-between px-2.5 py-1.5 text-type-helper text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800 mb-1">
              <span>Lọc theo vai trò</span>
              {isActive && (
                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-type-helper text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Đặt lại
                </button>
              )}
            </div>

            {/* Danh sách 4 vai trò phẳng, thanh lịch, nền trung tính không màu mè */}
            <div className="space-y-0.5">
              {roleOptions.map((opt) => {
                const isSelected = userRoleFilter === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onUserRoleFilterChange(opt.key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-type-helper transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 stroke-[2.5]" />
                      ) : (
                        <div className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <span
                      className={`tabular-nums text-type-helper shrink-0 ml-2 ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-400 font-normal'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
