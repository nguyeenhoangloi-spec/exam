'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, CheckSquare, Square } from 'lucide-react';

interface ScopeOption {
  id: number;
  name?: string;
  code?: string;
  subjectCode?: string;
  subjectName?: string;
}

interface ScopeTagPickerProps {
  label: string;
  typeIcon?: React.ElementType<{ className?: string }>;
  options: ScopeOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function ScopeTagPicker({
  label,
  typeIcon: TypeIcon,
  options,
  selectedIds,
  onChange,
  disabled = false,
}: ScopeTagPickerProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((item) => {
      const code = (item.code || item.subjectCode || '').toLowerCase();
      const name = (item.name || item.subjectName || '').toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [options, search]);

  const handleToggle = (id: number) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(options.map((opt) => opt.id));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const isAllSelected = options.length > 0 && selectedIds.length === options.length;

  return (
    <div className="space-y-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-3.5 flex flex-col h-full">
      {/* Header: Label + Select All / Clear Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {TypeIcon && <TypeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
          <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 truncate">
            {label}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-type-helper font-semibold">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || isAllSelected}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline disabled:opacity-40 cursor-pointer"
          >
            Chọn tất cả
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || selectedIds.length === 0}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 hover:underline disabled:opacity-40 cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Search Input with Embedded Badge Counter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={`Tìm ${label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-20 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="min-h-0 min-w-0 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <span className="ui-pill rounded-full inline-flex items-center px-1.5 py-0.5 text-type-helper font-medium tabular-nums bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 whitespace-nowrap">
            {selectedIds.length}/{options.length}
          </span>
        </div>
      </div>

      {/* Clean Checklist Options List */}
      <div className="h-60 overflow-y-auto space-y-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 custom-scrollbar flex-1">
        {filteredOptions.length === 0 ? (
          <p className="py-12 text-center text-type-helper text-slate-400 font-normal">
            Không tìm thấy mục phù hợp.
          </p>
        ) : (
          filteredOptions.map((item) => {
            const isChecked = selectedIds.includes(item.id);
            const code = item.code || item.subjectCode;
            const name = item.name || item.subjectName || code || '';
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-type-body-sm transition cursor-pointer select-none ${
                  isChecked
                    ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {isChecked ? (
                    <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  {code && (
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-type-helper shrink-0">
                      [{code}]
                    </span>
                  )}
                  <span className="truncate">{name}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
