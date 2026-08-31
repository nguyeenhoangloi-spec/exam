'use client';

import React, { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
  variant?: 'line' | 'segmented';
}

export function TabBar<T extends string = string>({
  tabs,
  active,
  onChange,
  className = '',
  variant = 'line',
}: TabBarProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const updateIndicator = useCallback(() => {
    const activeBtn = tabRefs.current.get(active);
    const container = containerRef.current;
    if (activeBtn && container) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
      setIsReady(true);
    }
  }, [active]);

  const scrollToTab = useCallback((key: T) => {
    const targetBtn = tabRefs.current.get(key);
    const container = containerRef.current;
    if (!targetBtn || !container) return;

    const buttonLeft = targetBtn.offsetLeft;
    const buttonWidth = targetBtn.offsetWidth;
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    const maxScrollLeft = scrollWidth - containerWidth;

    if (maxScrollLeft <= 0) return;

    // 1. Tính toán tâm điểm để đưa nút tab vào chính giữa khung nhìn
    const tabCenter = buttonLeft + buttonWidth / 2;
    const containerCenter = containerWidth / 2;
    const desiredScrollLeft = tabCenter - containerCenter;

    // 2. Tự động Clamp: Nút rìa trái dừng ở 0, nút rìa phải dừng ở max, nút giữa căn giữa hoàn hảo
    const targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, desiredScrollLeft));

    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth',
    });
  }, []);

  useLayoutEffect(() => {
    updateIndicator();
    scrollToTab(active);
  }, [updateIndicator, scrollToTab, active]);

  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  if (variant === 'segmented') {
    return (
      <div
        ref={containerRef}
        role="tablist"
        className={`relative flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-full overflow-x-auto no-scrollbar scroll-smooth w-full select-none border border-slate-200/90 dark:border-slate-700/70 ${className}`}
      >
        {/* Sliding Background Indicator Pill */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/60 shadow-[0_4px_14px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] pointer-events-none will-change-[transform,width]"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
            transition: isReady
              ? 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), width 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease'
              : 'none',
          }}
        />

        {/* Tab Buttons */}
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.key, el);
                else tabRefs.current.delete(tab.key);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                scrollToTab(tab.key);
                startTransition(() => {
                  onChange(tab.key);
                });
              }}
              className={`group relative z-10 flex items-center justify-center gap-1.5 flex-1 min-w-fit px-3 py-1.5 text-type-body-sm rounded-full focus-visible:outline-none motion-safe:transition-colors duration-200 ease-out cursor-pointer whitespace-nowrap shrink-0 select-none active:scale-[0.98] ${
                isActive
                  ? 'text-slate-950 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-medium'
              }`}
            >
              {tab.icon && (
                <span
                  className={`shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-slate-950 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {tab.icon}
                </span>
              )}
              <span className="shrink-0">{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ui-pill inline-flex items-center justify-center rounded-full px-2 py-0.5 text-type-helper font-medium tabular-nums shrink-0 transition-colors duration-200 ${
                    isActive
                      ? 'ui-pill-solid bg-blue-600 text-white shadow-2xs'
                      : 'text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80'
                  }`}
                >
                  {tab.count.toLocaleString('vi-VN')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative flex items-center gap-1 border-b border-slate-200/80 dark:border-slate-700 overflow-x-auto no-scrollbar scroll-smooth w-full pt-1 select-none ${className}`}
    >
      {/* Sliding Active Blue Bottom Bar */}
      <div
        className="absolute bottom-0 h-0.5 rounded-t-full bg-blue-600 pointer-events-none will-change-[transform,width]"
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: isReady
            ? 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), width 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease'
            : 'none',
        }}
      />

      {/* Line Tab Buttons */}
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.key, el);
              else tabRefs.current.delete(tab.key);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              scrollToTab(tab.key);
              startTransition(() => {
                onChange(tab.key);
              });
            }}
            className={`group relative z-10 flex items-center gap-1.5 px-3.5 py-2.5 text-type-body font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 motion-safe:transition-colors duration-200 ease-out cursor-pointer whitespace-nowrap shrink-0 select-none active:scale-[0.98] ${isActive
                ? 'text-primary-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
          >
            {tab.icon && (
              <span
                className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                {tab.icon}
              </span>
            )}
            <span className="shrink-0">{tab.label}</span>

            {typeof tab.count === 'number' && (
              <span
                className={`ui-pill rounded-full border px-2 py-0.5 text-type-helper font-medium transition-all duration-200 tabular-nums shrink-0 ${isActive
                    ? 'ui-pill-solid bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                  }`}
              >
                {tab.count.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
