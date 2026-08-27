'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Activity,
  User as UserIcon,
  Calendar,
  KeyRound,
  Layers,
  RotateCw,
  CheckCheck,
} from 'lucide-react';

export interface AccessHistoryFilterState {
  actionCategory: string; // 'ALL' | 'OVERRIDE' | 'SCOPE' | 'RESET'
  actor: string; // 'ALL' | username
  timeframe: string; // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
}

interface AccessHistoryFilterPopoverProps {
  filters: AccessHistoryFilterState;
  onFilterChange: (filters: AccessHistoryFilterState) => void;
  historyItems: Array<{
    id: number;
    action?: string;
    description?: string;
    actor?: { username: string } | null;
    createdAt: string;
  }>;
  totalFilteredCount: number;
  totalCount: number;
  onResetAll: () => void;
}

type FilterTab = 'actions' | 'actors' | 'timeframe';

export function AccessHistoryFilterPopover({
  filters,
  onFilterChange,
  historyItems = [],
  totalFilteredCount,
  totalCount,
  onResetAll,
}: AccessHistoryFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('actions');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute available actors & action breakdown counts
  const { actorsList, actionCounts, timeframeCounts } = useMemo(() => {
    const actorSet = new Set<string>();
    let overrideCount = 0;
    let scopeCount = 0;
    let resetCount = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    historyItems.forEach((item) => {
      const username = item.actor?.username || 'Hệ thống';
      actorSet.add(username);

      const desc = (item.description || '').toLowerCase();
      const action = (item.action || '').toUpperCase();

      if (action.includes('OVERRIDE') || desc.includes('quyền riêng')) {
        overrideCount++;
      } else if (action.includes('SCOPE') || desc.includes('phạm vi')) {
        scopeCount++;
      } else if (action.includes('RESET') || desc.includes('khôi phục') || desc.includes('mặc định')) {
        resetCount++;
      }

      const itemTime = new Date(item.createdAt).getTime();
      if (itemTime >= startOfToday) todayCount++;
      if (itemTime >= sevenDaysAgo) weekCount++;
      if (itemTime >= thirtyDaysAgo) monthCount++;
    });

    const actorsList = Array.from(actorSet).map((actorName) => ({
      name: actorName,
      count: historyItems.filter((i) => (i.actor?.username || 'Hệ thống') === actorName).length,
    }));

    return {
      actorsList,
      actionCounts: {
        ALL: historyItems.length,
        OVERRIDE: overrideCount,
        SCOPE: scopeCount,
        RESET: resetCount,
      },
      timeframeCounts: {
        ALL: historyItems.length,
        TODAY: todayCount,
        WEEK: weekCount,
        MONTH: monthCount,
      },
    };
  }, [historyItems]);

  const activeFilterCount =
    (filters.actionCategory !== 'ALL' ? 1 : 0) +
    (filters.actor !== 'ALL' ? 1 : 0) +
    (filters.timeframe !== 'ALL' ? 1 : 0);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(480, vw - margin * 2);
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
      else if (e.key === '1') setActiveTab('actions');
      else if (e.key === '2') setActiveTab('actors');
      else if (e.key === '3') setActiveTab('timeframe');
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

  const categories = [
    {
      id: 'actions' as FilterTab,
      label: 'Loại thao tác',
      icon: Activity,
      shortcut: '1',
      badge: filters.actionCategory !== 'ALL' ? 1 : undefined,
    },
    {
      id: 'actors' as FilterTab,
      label: 'Người thực hiện',
      icon: UserIcon,
      shortcut: '2',
      badge: filters.actor !== 'ALL' ? 1 : undefined,
    },
    {
      id: 'timeframe' as FilterTab,
      label: 'Thời gian',
      icon: Calendar,
      shortcut: '3',
      badge: filters.timeframe !== 'ALL' ? 1 : undefined,
    },
  ];

  return (
    <div className="relative inline-flex items-center">
      {/* Trigger button embedded on search bar */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors cursor-pointer select-none ${isOpen || activeFilterCount > 0
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
            : 'text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
          }`}
        title="Bộ lọc nhật ký phân quyền"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />

        {activeFilterCount > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onResetAll();
            }}
            title="Nhấn để xóa nhanh toàn bộ lọc (1-Click Reset)"
            className="table-badge absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-type-helper font-semibold text-white hover:bg-rose-500 transition-colors shadow-2xs"
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Popover Menu Portal */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc nhật ký phân quyền"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20 shrink-0">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Bộ lọc nhật ký phân quyền
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Tùy chỉnh tiêu chí tra cứu lịch sử thao tác
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="inline-flex items-center gap-1.5 text-type-helper font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Xóa tất cả bộ lọc đang áp dụng"
                  >
                    <RotateCcw className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">Đặt lại ({activeFilterCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2-Column Body */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Left Column (Category Tabs) */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeTab === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveTab(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-type-helper font-medium transition-all duration-150 cursor-pointer border ${isActive
                          ? 'border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp
                          className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                            }`}
                        />
                        <span className="truncate">{cat.label}</span>
                      </div>

                      {cat.badge ? (
                        <span className="h-4 min-w-[16px] rounded-full bg-blue-600 px-1 text-type-helper font-semibold text-white flex items-center justify-center">
                          {cat.badge}
                        </span>
                      ) : (
                        <span
                          className={`text-type-helper font-normal ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-slate-300 dark:text-slate-600'
                            }`}
                        >
                          {cat.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Column (Options Content) */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* TAB 1: ACTION CATEGORY */}
                {activeTab === 'actions' && (
                  <div className="space-y-1.5">
                    {[
                      {
                        key: 'ALL',
                        label: 'Tất cả thao tác',
                        desc: 'Mọi thay đổi phân quyền & phạm vi',
                        count: actionCounts.ALL,
                        icon: Activity,
                      },
                      {
                        key: 'OVERRIDE',
                        label: 'Quyền riêng tài khoản',
                        desc: 'Cấp hoặc từ chối quyền riêng cá nhân',
                        count: actionCounts.OVERRIDE,
                        icon: KeyRound,
                      },
                      {
                        key: 'SCOPE',
                        label: 'Phạm vi truy cập',
                        desc: 'Gán Khoa, Lớp hoặc Môn học quản lý',
                        count: actionCounts.SCOPE,
                        icon: Layers,
                      },
                      {
                        key: 'RESET',
                        label: 'Khôi phục mặc định',
                        desc: 'Đưa quyền về mặc định theo vai trò',
                        count: actionCounts.RESET,
                        icon: RotateCw,
                      },
                    ].map((item) => {
                      const isSelected = filters.actionCategory === item.key;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => onFilterChange({ ...filters, actionCategory: item.key })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              <span
                                className={`text-type-helper font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                                  }`}
                              >
                                {item.label}
                              </span>
                            </div>
                            <div
                              className={`text-type-helper truncate pl-5.5 mt-0.5 ${isSelected ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                              {item.desc}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected ? 'ui-pill-solid bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                              {item.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TAB 2: ACTORS */}
                {activeTab === 'actors' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterChange({ ...filters, actor: 'ALL' })}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${filters.actor === 'ALL'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div
                          className={`text-type-helper font-semibold ${filters.actor === 'ALL' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                            }`}
                        >
                          Tất cả người thực hiện
                        </div>
                        <div
                          className={`text-type-helper truncate ${filters.actor === 'ALL' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          Mọi quản trị viên & tiến trình hệ thống
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${filters.actor === 'ALL' ? 'ui-pill-solid bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                          {historyItems.length}
                        </span>
                        {filters.actor === 'ALL' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                    </button>

                    {actorsList.map((actor) => {
                      const isSelected = filters.actor === actor.name;
                      return (
                        <button
                          key={actor.name}
                          type="button"
                          onClick={() => onFilterChange({ ...filters, actor: actor.name })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div
                              className={`text-type-helper font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                                }`}
                            >
                              {actor.name}
                            </div>
                            <div
                              className={`text-type-helper truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                              Tài khoản quản trị viên
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected ? 'ui-pill-solid bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                              {actor.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TAB 3: TIMEFRAME */}
                {activeTab === 'timeframe' && (
                  <div className="space-y-1.5">
                    {[
                      { key: 'ALL', label: 'Toàn bộ thời gian', desc: 'Tất cả lịch sử đã ghi nhận', count: timeframeCounts.ALL },
                      { key: 'TODAY', label: 'Hôm nay', desc: 'Các thay đổi trong ngày hôm nay', count: timeframeCounts.TODAY },
                      { key: 'WEEK', label: '7 ngày gần đây', desc: 'Các thay đổi trong tuần qua', count: timeframeCounts.WEEK },
                      { key: 'MONTH', label: '30 ngày gần đây', desc: 'Các thay đổi trong tháng qua', count: timeframeCounts.MONTH },
                    ].map((tf) => {
                      const isSelected = filters.timeframe === tf.key;
                      return (
                        <button
                          key={tf.key}
                          type="button"
                          onClick={() => onFilterChange({ ...filters, timeframe: tf.key })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div
                              className={`text-type-helper font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                                }`}
                            >
                              {tf.label}
                            </div>
                            <div
                              className={`text-type-helper truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                              {tf.desc}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`ui-pill rounded-full px-1.5 py-0.5 text-type-helper font-medium ${isSelected ? 'ui-pill-solid bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                              {tf.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-1">
                <div className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
                  Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                  {totalCount > 0 && (
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      {' '}
                      / {totalCount} nhật ký ({Math.round((totalFilteredCount / Math.max(1, totalCount)) * 100)}%)
                    </span>
                  )}
                </div>
                {totalCount > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, totalCount)) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-type-helper font-semibold transition-all duration-150 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Xem kết quả</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
