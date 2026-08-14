'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

export interface ColumnOption {
  key: string;
  label: string;
}

interface ColumnToggleDropdownProps {
  columns: ColumnOption[];
  visibleColumns: Record<string, boolean>;
  onToggle: (key: string) => void;
  title?: string;
  align?: 'left' | 'right' | 'auto';
  className?: string;
}

export function ColumnToggleDropdown({
  columns,
  visibleColumns,
  onToggle,
  title = 'Hiển thị cột',
  align = 'auto',
  className = '',
}: ColumnToggleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const minWidth = 224; // w-56
    const estimatedHeight = Math.min(columns.length * 38 + 48, 290);

    // Check vertical space (open up if near bottom)
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight + 10 && rect.top > estimatedHeight;
    const top = openUpward ? Math.max(10, rect.top - estimatedHeight - 6) : rect.bottom + 6;

    // Check horizontal alignment
    let left = rect.left;
    if (align === 'right') {
      left = Math.max(16, rect.right - minWidth);
    } else if (align === 'auto') {
      if (rect.left + minWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.right - minWidth);
      }
    }

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: '224px',
      zIndex: 9999,
    });
  }, [align, columns.length]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen(!isOpen)}
        className={`ui-pressable h-10 flex items-center gap-1.5 rounded-xl border px-3 text-[15px] font-medium transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 ease-out shadow-2xs cursor-pointer select-none ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900 bg-white dark:bg-slate-900 dark:border-blue-500 dark:ring-blue-500/30 dark:text-slate-100'
            : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="truncate">Chọn cột</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="w-56 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 space-y-2"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{title}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">Click để ẩn/hiện</span>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {columns.map((col) => {
                const isVisible = visibleColumns[col.key] !== false;
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => onToggle(col.key)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left font-medium transition-colors duration-150 cursor-pointer select-none text-[15px] ${
                      isVisible
                        ? 'text-slate-900 dark:text-slate-100 font-semibold bg-transparent'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate pr-2">{col.label}</span>
                    {isVisible && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />}
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
