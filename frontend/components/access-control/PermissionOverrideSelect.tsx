'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface PermissionItem {
  id?: string;
  code: string;
  name: string;
  module?: string;
  description?: string;
  [key: string]: any;
}

export interface PermissionOverrideSelectProps {
  value: string;
  onChange: (code: string) => void;
  permissions: PermissionItem[];
  rolePermissionCodes: Set<string>;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function PermissionOverrideSelect({
  value,
  onChange,
  permissions,
  rolePermissionCodes,
  disabled = false,
  className = '',
  placeholder = '-- Chọn quyền cần gán ngoại lệ --',
}: PermissionOverrideSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính năng Popover Tự động Định vị Thông minh & Chống Xén Màn hình (Smart Positioning & Anti-Clipping Popover)
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    // 1. Chiều rộng & Chống tràn ngang (Horizontal Anti-Clipping Viewport Clamp)
    const minWidth = 380;
    const menuWidth = Math.min(Math.max(rect.width, minWidth), vw - margin * 2);
    let left = rect.left;
    if (left + menuWidth > vw - margin) {
      left = Math.max(margin, vw - menuWidth - margin);
    }
    if (left < margin) left = margin;

    // 2. Không gian dọc & Tự động lật hướng (Vertical Smart Flip)
    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const estimatedHeight = 360;

    const shouldOpenUpward = spaceBelow < 260 && spaceAbove > spaceBelow;
    setPlacement(shouldOpenUpward ? 'top' : 'bottom');

    let top: number;
    let maxHeight: number;

    if (shouldOpenUpward) {
      maxHeight = Math.min(estimatedHeight, spaceAbove - 8);
      top = rect.top - maxHeight - 6;
    } else {
      maxHeight = Math.min(estimatedHeight, spaceBelow - 8);
      top = rect.bottom + 6;
    }

    setMenuStyle({
      position: 'fixed',
      top: `${Math.max(margin, top)}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      maxHeight: `${Math.max(160, maxHeight)}px`,
      maxWidth: `calc(100vw - ${margin * 2}px)`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    // Bắt sự kiện cuộn (capture phase) và thay đổi kích cỡ màn hình
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    // Đóng khi click ngoài hoặc nhấn phím Escape
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Focus ô tìm kiếm khi popover mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const selectedPermission = useMemo(
    () => permissions.find((p) => p.code === value),
    [permissions, value]
  );

  // Phân loại và lọc danh sách quyền theo từ khóa
  const { grantable, deniable } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = permissions.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.module && p.module.toLowerCase().includes(q))
      );
    });

    const grant: PermissionItem[] = [];
    const deny: PermissionItem[] = [];

    filtered.forEach((p) => {
      if (rolePermissionCodes.has(p.code)) {
        deny.push(p);
      } else {
        grant.push(p);
      }
    });

    return { grantable: grant, deniable: deny };
  }, [permissions, rolePermissionCodes, search]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      {/* Trigger Button Phẳng Cao Cấp & Tinh Gọn */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-left flex items-center justify-between gap-2 text-type-body font-normal text-slate-800 dark:text-slate-100 transition shadow-2xs cursor-pointer focus:outline-none focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedPermission ? (
            <div className="flex items-center gap-1.5 min-w-0 truncate text-slate-900 dark:text-slate-100">
              <span className="font-medium truncate">{selectedPermission.name}</span>
              <span className="text-type-helper text-slate-400 dark:text-slate-500 font-normal shrink-0 tabular-nums">
                ({selectedPermission.code})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Menu Dropdown Portal Chuẩn Phẳng, Tinh Gọn Như SortDropdown */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className={`rounded-2xl border border-slate-200/90 dark:border-slate-750 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-150 ${
              placement === 'top' ? 'origin-bottom' : 'origin-top'
            }`}
          >
            {/* Search Box */}
            <div className="p-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên, mã quyền..."
                  className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850/70 pl-9 pr-8 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Permissions */}
            <div className="overflow-y-auto flex-1 p-0.5 space-y-2 custom-scrollbar">
              {/* Group 1: Quyền mở rộng (Có thể cấp thêm) */}
              {grantable.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-3 pt-1.5 pb-1 text-type-helper font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span>Quyền mở rộng (cấp thêm)</span>
                    <span className="tabular-nums font-normal">{grantable.length}</span>
                  </div>
                  {grantable.map((p) => {
                    const isSelected = p.code === value;
                    return (
                      <div
                        key={p.code}
                        onClick={() => handleSelect(p.code)}
                        className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-type-body truncate">
                            {p.name}
                          </div>
                          <div className="text-type-helper text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5 tabular-nums">
                            {p.module ? `[${p.module}] ` : ''}{p.code}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group 2: Quyền hiện có theo vai trò (Có thể chặn) */}
              {deniable.length > 0 && (
                <div className="space-y-0.5 pt-1">
                  <div className="px-3 pt-1.5 pb-1 text-type-helper font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span>Quyền theo vai trò (chặn)</span>
                    <span className="tabular-nums font-normal">{deniable.length}</span>
                  </div>
                  {deniable.map((p) => {
                    const isSelected = p.code === value;
                    return (
                      <div
                        key={p.code}
                        onClick={() => handleSelect(p.code)}
                        className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-type-body truncate">
                            {p.name}
                          </div>
                          <div className="text-type-helper text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5 tabular-nums">
                            {p.module ? `[${p.module}] ` : ''}{p.code}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!grantable.length && !deniable.length && (
                <div className="py-6 text-center text-slate-400">
                  <p className="text-type-body font-medium">Không tìm thấy quyền phù hợp</p>
                  <p className="text-type-helper mt-0.5">Thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
