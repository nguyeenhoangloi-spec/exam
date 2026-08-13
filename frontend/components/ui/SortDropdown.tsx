'use client';

import React, { useState, useRef, useEffect } from 'react';
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
}

export function SortDropdown({
  options,
  value,
  onChange,
  title = 'Sắp xếp theo',
  className = '',
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-[15px] font-medium text-slate-700 dark:text-slate-200 transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs cursor-pointer active:scale-95"
      >
        <ArrowUpDown className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="truncate max-w-[160px]">{selectedOption?.label || 'Sắp xếp'}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-30 mt-1.5 w-52 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 mb-1">
            {title}
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    <span>{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
