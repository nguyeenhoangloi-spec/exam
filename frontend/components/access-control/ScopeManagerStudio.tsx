'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  GraduationCap,
  BookOpen,
  Search,
  X,
  CheckCircle2,
  Circle,
  Filter,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

export interface ScopeOption {
  id: number;
  name: string;
  code?: string;
  subjectCode?: string;
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
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
}

export function ScopeManagerStudio({
  departments,
  classes,
  subjects,
  draftScopes,
  onScopesChange,
  onSave,
  saving = false,
  disabled = false,
}: ScopeManagerStudioProps) {
  const [activeScopeType, setActiveScopeType] = useState<ScopeType>('DEPARTMENT');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL');

  // Lấy danh sách options tương ứng với tab đang chọn
  const currentOptions = useMemo(() => {
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

  // Danh sách ID đang được chọn của ScopeType hiện tại
  const selectedIds = useMemo(() => {
    return draftScopes
      .filter((s) => s.type === activeScopeType)
      .map((s) => s.resourceId);
  }, [draftScopes, activeScopeType]);

  // Bộ lọc tìm kiếm và trạng thái chọn
  const filteredOptions = useMemo(() => {
    let list = currentOptions;

    // Lọc theo từ khóa tìm kiếm
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((item) => {
        const code = (item.code || item.subjectCode || '').toLowerCase();
        const name = item.name.toLowerCase();
        return code.includes(q) || name.includes(q);
      });
    }

    // Lọc theo chế độ chọn (Tất cả / Đã chọn / Chưa chọn)
    if (filterMode === 'SELECTED') {
      list = list.filter((item) => selectedIds.includes(item.id));
    } else if (filterMode === 'UNSELECTED') {
      list = list.filter((item) => !selectedIds.includes(item.id));
    }

    return list;
  }, [currentOptions, search, filterMode, selectedIds]);

  // Thao tác bật/tắt 1 item
  const handleToggle = (id: number) => {
    if (disabled || saving) return;
    if (selectedIds.includes(id)) {
      onScopesChange(
        draftScopes.filter((s) => !(s.type === activeScopeType && s.resourceId === id))
      );
    } else {
      onScopesChange([...draftScopes, { type: activeScopeType, resourceId: id }]);
    }
  };

  // Chọn tất cả theo ScopeType hiện tại
  const handleSelectAll = () => {
    if (disabled || saving) return;
    const existingOther = draftScopes.filter((s) => s.type !== activeScopeType);
    const newItems = currentOptions.map((opt) => ({
      type: activeScopeType,
      resourceId: opt.id,
    }));
    onScopesChange([...existingOther, ...newItems]);
  };

  // Bỏ chọn tất cả theo ScopeType hiện tại
  const handleClearAll = () => {
    if (disabled || saving) return;
    onScopesChange(draftScopes.filter((s) => s.type !== activeScopeType));
  };

  // Đếm số lượng đã chọn theo từng loại
  const deptCount = draftScopes.filter((s) => s.type === 'DEPARTMENT').length;
  const classCount = draftScopes.filter((s) => s.type === 'CLASS').length;
  const subjectCount = draftScopes.filter((s) => s.type === 'SUBJECT').length;

  const scopeTabs: Array<{
    type: ScopeType;
    label: string;
    icon: React.ElementType;
    count: number;
    total: number;
    unit: string;
  }> = [
      {
        type: 'DEPARTMENT',
        label: 'Khoa / Viện đào tạo',
        icon: Building2,
        count: deptCount,
        total: departments.length,
        unit: 'khoa',
      },
      {
        type: 'CLASS',
        label: 'Lớp sinh viên',
        icon: GraduationCap,
        count: classCount,
        total: classes.length,
        unit: 'lớp',
      },
      {
        type: 'SUBJECT',
        label: 'Học phần & Môn học',
        icon: BookOpen,
        count: subjectCount,
        total: subjects.length,
        unit: 'môn',
      },
    ];

  return (
    <div className="space-y-3.5">
      {/* ── 1. Scope Type Switcher Pills (3 Phân hệ Khoa - Lớp - Môn đều độ dài) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scopeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScopeType === tab.type;
          const isFull = tab.total > 0 && tab.count === tab.total;
          const hasAny = tab.count > 0;

          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => {
                setActiveScopeType(tab.type);
                setSearch('');
                setFilterMode('ALL');
              }}
              className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left h-18 ${isActive
                  ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500/80 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-type-body font-semibold truncate ${isActive
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-slate-800 dark:text-slate-200'
                      }`}
                  >
                    {tab.label}
                  </div>
                  <div className="text-type-helper text-slate-400 font-normal mt-0.5">
                    {`Đã gán ${tab.count} / ${tab.total} ${tab.unit}`}
                  </div>
                </div>
              </div>

              <span
                className={`ui-pill rounded-full px-2.5 py-1 text-type-helper font-medium tabular-nums shrink-0 border ${isFull
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : hasAny
                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
              >
                {tab.count} / {tab.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 2. Interactive Control Bar (Toolbar tìm kiếm & Thao tác nhanh) ── */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Tìm kiếm theo tên hoặc mã định danh...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons & Filters */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Filter Mode Switcher */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700/60">
              {[
                { key: 'ALL', label: 'Tất cả', count: currentOptions.length },
                { key: 'SELECTED', label: 'Đã chọn', count: selectedIds.length },
                { key: 'UNSELECTED', label: 'Chưa chọn', count: currentOptions.length - selectedIds.length },
              ].map((item) => {
                const isActive = filterMode === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilterMode(item.key as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-type-helper font-semibold transition cursor-pointer select-none outline-none focus:outline-none ${isActive
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`ui-pill rounded-full px-1.5 py-0.2 text-type-helper font-medium tabular-nums ${isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                          : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <button
              type="button"
              onClick={handleSelectAll}
              disabled={disabled || selectedIds.length === currentOptions.length}
              className="h-9 px-3 text-type-body-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Chọn tất cả</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={disabled || selectedIds.length === 0}
              className="h-9 px-3 text-type-body-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Bỏ chọn</span>
            </button>
          </div>
        </div>

        {/* ── 3. Interactive Resource Cards Grid (Lưới thẻ trực quan đều độ dài) ── */}
        <div className="h-[430px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Filter className="h-6 w-6" />
              </div>
              <p className="text-type-body font-medium text-slate-500 dark:text-slate-400">
                Không tìm thấy mục nào phù hợp với bộ lọc hiện tại.
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-type-body-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Xóa từ khóa tìm kiếm
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredOptions.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const code = item.code || item.subjectCode;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggle(item.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none h-14 ${isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800/80 shadow-xs shadow-blue-500/10'
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="shrink-0 transition-transform group-hover:scale-110 duration-200">
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 fill-blue-50 dark:fill-blue-950" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        {code && (
                          <span
                            className={`ui-pill rounded-full inline-block px-1.5 py-0.2 text-type-helper font-medium tabular-nums ${isSelected
                                ? 'bg-blue-200/80 text-blue-900 dark:bg-blue-900/80 dark:text-blue-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                          >
                            {code}
                          </span>
                        )}
                        <p
                          className={`text-type-body truncate font-semibold leading-tight ${isSelected
                              ? 'text-blue-950 dark:text-blue-100'
                              : 'text-slate-800 dark:text-slate-200'
                            }`}
                          title={item.name}
                        >
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-type-helper font-medium shrink-0 ${isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'
                        }`}
                    >
                      {isSelected ? 'Đã gán' : 'Chọn'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
