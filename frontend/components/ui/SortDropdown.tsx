'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
}

export interface SortDropdownProps {
  options: SortOption[];
  value?: string;
  onChange?: (value: string) => void;
  title?: string;
  className?: string;
  align?: 'left' | 'right' | 'auto';
}

export function SortDropdown({
  options,
  value,
  onChange,
  className = '',
  align = 'auto',
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 160);
    const estimatedHeight = Math.min(options.length * 36 + 20, 240);

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
      minWidth: `${minWidth}px`,
      maxWidth: '320px',
      zIndex: 99999,
    });
  }, [options.length, align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
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
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        className={`ui-pressable h-10 flex items-center gap-1.5 rounded-xl border px-3 text-type-body font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 ease-out shadow-2xs cursor-pointer select-none ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900 bg-white dark:bg-slate-900 dark:border-blue-500 dark:ring-blue-500/30 dark:text-slate-100'
            : 'border-slate-200/60 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
        }`}
      >
        <ArrowUpDown className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="truncate max-w-[160px]">{selectedOption?.label || 'Sắp xếp'}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {isOpen && mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            role="listbox"
            className="w-max rounded-2xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-popover-in will-change-transform"
          >
            <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-type-body leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-colors duration-150 cursor-pointer select-none text-left ${
                      isSelected
                        ? 'bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                    }`}
                  >
                    <span className="truncate pr-2">{option.label}</span>
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
