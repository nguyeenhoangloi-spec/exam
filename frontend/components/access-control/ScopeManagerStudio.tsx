'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl';

export interface ScopeOption {
  id: number;
  name?: string;
  code?: string;
  subjectCode?: string;
  subjectName?: string;
}

export type ScopeType = 'DEPARTMENT' | 'CLASS' | 'SUBJECT';

export interface ScopeItem {
  type: ScopeType;
  resourceId: number;
}

interface ScopeManagerStudioProps {
  departments: ScopeOption[];
  classes: ScopeOption[];
  subjects: ScopeOption[];
  draftScopes: ScopeItem[];
  onScopesChange: (newScopes: ScopeItem[]) => void;
  onSave?: () => void;
  saving?: boolean;
  disabled?: boolean;
}

export function ScopeManagerStudio({
  departments,
  classes,
  subjects,
  draftScopes,
  onScopesChange,
  disabled = false,
}: ScopeManagerStudioProps) {
  const [activeScopeType, setActiveScopeType] = useState<ScopeType>('DEPARTMENT');
  const [search, setSearch] = useState('');

  // Lấy danh sách options theo loại đang active
  const currentOptions: ScopeOption[] = useMemo(() => {
    switch (activeScopeType) {
      case 'DEPARTMENT':
        return departments;
      case 'CLASS':
        return classes;
      case 'SUBJECT':
        return subjects;
      default:
        return [];
    }
  }, [activeScopeType, departments, classes, subjects]);

  // Lọc theo từ khóa tìm kiếm
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return currentOptions;
    const q = search.toLowerCase();
    return currentOptions.filter((item) => {
      const code = (item.code || item.subjectCode || '').toLowerCase();
      const name = (item.name || item.subjectName || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [currentOptions, search]);

  // Tập hợp ID đã được gán theo activeScopeType
  const selectedIds = useMemo(() => {
    return draftScopes
      .filter((s) => s.type === activeScopeType)
      .map((s) => s.resourceId);
  }, [draftScopes, activeScopeType]);

  const isAllSelected = currentOptions.length > 0 && selectedIds.length === currentOptions.length;

  const handleToggle = (id: number) => {
    if (disabled) return;
    const exists = selectedIds.includes(id);
    let next: ScopeItem[];
    if (exists) {
      next = draftScopes.filter((s) => !(s.type === activeScopeType && s.resourceId === id));
    } else {
      next = [...draftScopes, { type: activeScopeType, resourceId: id }];
    }
    onScopesChange(next);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const otherScopes = draftScopes.filter((s) => s.type !== activeScopeType);
    const newScopes = currentOptions.map((opt) => ({
      type: activeScopeType,
      resourceId: opt.id,
    }));
    onScopesChange([...otherScopes, ...newScopes]);
  };

  const handleClearAll = () => {
    if (disabled) return;
    const otherScopes = draftScopes.filter((s) => s.type !== activeScopeType);
    onScopesChange(otherScopes);
  };

  const scopeTabs: Array<{
    type: ScopeType;
    label: string;
    count: number;
    total: number;
  }> = [
      {
        type: 'DEPARTMENT',
        label: 'Khoa / Viện',
        count: draftScopes.filter((s) => s.type === 'DEPARTMENT').length,
        total: departments.length,
      },
      {
        type: 'CLASS',
        label: 'Lớp sinh hoạt',
        count: draftScopes.filter((s) => s.type === 'CLASS').length,
        total: classes.length,
      },
      {
        type: 'SUBJECT',
        label: 'Học phần & Môn',
        count: draftScopes.filter((s) => s.type === 'SUBJECT').length,
        total: subjects.length,
      },
    ];

  return (
    <div className="space-y-3.5">
      {/* ── 1. Toolbar phẳng: Tab phân hệ + Tìm kiếm + Chọn tất cả ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        {/* Phân hệ danh mục: Chuẩn Apple HIG & Linear SaaS với Rãnh xám nhạt + Viên trượt trắng tinh khiết */}
        <SlidingSegmentedControl<ScopeType>
          value={activeScopeType}
          onChange={(val) => {
            setActiveScopeType(val);
            setSearch('');
          }}
          size="sm"
          pillShape="pill"
          equalWidth
          className="shrink-0"
          options={scopeTabs.map((tab) => ({
            value: tab.type,
            label: tab.label,
            count: tab.count,
          }))}
        />

        {/* Cụm công cụ tìm kiếm & Chọn tất cả */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-48 sm:w-60 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-8 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-0 min-w-0 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Nút Chọn tất cả phẳng hoàn toàn trong suốt - Cố định kích thước 100% chống xô lệch */}
          <button
            type="button"
            onClick={isAllSelected ? handleClearAll : handleSelectAll}
            disabled={disabled || currentOptions.length === 0}
            className="shrink-0 whitespace-nowrap h-9 px-1 w-[110px] bg-transparent text-type-body-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-2 select-none"
            title={isAllSelected ? 'Bỏ chọn toàn bộ' : 'Chọn toàn bộ'}
          >
            <div
              className={`flex h-[18px] w-[18px] min-w-[18px] min-h-[18px] shrink-0 items-center justify-center rounded-md border transition ${isAllSelected
                ? 'border-blue-600 bg-blue-600 text-white'
                : selectedIds.length > 0
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                }`}
            >
              {isAllSelected ? (
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              ) : selectedIds.length > 0 ? (
                <div className="h-1.5 w-1.5 rounded-xs bg-white" />
              ) : null}
            </div>
            <span>Chọn tất cả</span>
          </button>
        </div>
      </div>

      {/* ── 2. Danh sách dạng Khung Card Lưới 3 Cột (ĐỒNG BỘ 100% VỚI TAB QUYỀN HIỆU LỰC) ── */}
      {filteredOptions.length === 0 ? (
        <div className="py-12 text-center text-type-helper text-slate-400 font-normal">
          Không tìm thấy mục nào phù hợp với từ khóa tìm kiếm.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto p-1 custom-scrollbar">
          {filteredOptions.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const code = item.code || item.subjectCode;
            const name = item.name || item.subjectName || code || '';

            return (
              <div
                key={item.id}
                onClick={() => !disabled && handleToggle(item.id)}
                className={`rounded-xl border p-3.5 text-type-body min-h-[48px] flex items-center justify-between gap-3 shadow-2xs transition-all duration-150 cursor-pointer select-none ${isSelected
                  ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-xs ring-1 ring-slate-400/20 dark:ring-slate-600/30'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={name}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {code && (
                    <span className="tabular-nums text-type-helper font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      [{code}]
                    </span>
                  )}
                  <span className="truncate font-semibold text-slate-900 dark:text-white">
                    {name}
                  </span>
                </div>

                <div
                  className={`flex h-[18px] w-[18px] min-w-[18px] min-h-[18px] shrink-0 items-center justify-center rounded-md border transition-colors ${isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                    }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
