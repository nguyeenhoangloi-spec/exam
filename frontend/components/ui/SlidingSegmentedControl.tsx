'use client';

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';

export interface SlidingSegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ElementType<{ className?: string }>;
  count?: number;
}

interface SlidingSegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: SlidingSegmentedOption<T>[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'dock';
  pillShape?: 'rounded' | 'pill';
  fullWidth?: boolean;
}

export function SlidingSegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  className = '',
  size = 'md',
  variant = 'default',
  pillShape = 'pill',
  fullWidth = false,
}: SlidingSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const updateIndicator = React.useCallback(() => {
    const activeIndex = options.findIndex((opt) => opt.value === value);
    const activeBtn = buttonRefs.current[activeIndex];
    const container = containerRef.current;

    if (activeBtn && container) {
      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;

      setIndicatorStyle({
        left,
        width,
        opacity: 1,
      });
      setIsReady(true);
    }
  }, [value, options]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Kích thước chuẩn Design System 2026
  const heightClass =
    size === 'sm' ? 'h-9 text-type-body-sm' : size === 'lg' ? 'h-12 text-type-body' : 'h-10.5 text-type-body';
  const paddingClass =
    size === 'sm' ? 'px-3 py-1.5' : size === 'lg' ? 'px-4.5 py-2' : 'px-3.5 sm:px-4 py-1.5';
  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const isDock = variant === 'dock';
  const isPrimary = variant === 'primary';
  const isPill = pillShape === 'pill';

  // Khi viên trượt là rounded-full (viên thuốc), khung ngoài cũng là rounded-full để 2 đầu bo cong đồng tâm tuyệt đối
  const shapeContainerClass = isPill ? 'rounded-full' : 'rounded-2xl';
  const shapePillClass = isPill ? 'rounded-full' : 'rounded-xl';

  const containerBgClass = isDock
    ? 'bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] ring-1 ring-white/80 dark:ring-white/10'
    : 'bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70';

  const containerWidthClass = fullWidth ? 'w-full flex' : 'inline-flex w-fit max-w-full';

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative items-center gap-1 ${shapeContainerClass} ${containerBgClass} ${containerWidthClass} p-1 select-none ${heightClass} ${className}`}
    >
      {/* Sliding Background Indicator Pill - Nổi 3D nhẹ trên rãnh xám */}
      <div
        className={`absolute top-1 bottom-1 left-0 ${shapePillClass} pointer-events-none transition-all will-change-[transform,width] ${
          isPrimary
            ? 'bg-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.4)] ring-1 ring-white/20'
            : isDock
            ? 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-xs'
            : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/90 shadow-sm'
        }`}
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: isReady
            ? 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), width 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease'
            : 'none',
        }}
      />

      {/* Segmented Option Buttons (Padding gọn gàng, ôm sát theo từng mục hoặc chia đều khi fullWidth) */}
      {options.map((option, index) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex items-center justify-center gap-2 ${shapePillClass} ${
              fullWidth ? 'flex-1 min-w-0' : 'flex-initial shrink-0'
            } transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-[0.98] ${paddingClass} ${
              isActive
                ? isPrimary
                  ? 'text-white font-semibold'
                  : 'text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] font-medium'
            }`}
          >
            {Icon && (
              <Icon
                className={`${iconSizeClass} shrink-0 transition-transform duration-200 ${
                  isActive
                    ? isPrimary
                      ? 'scale-105 stroke-[2] text-white'
                      : 'scale-105 stroke-[2] text-blue-600 dark:text-blue-400'
                    : 'opacity-70 stroke-[1.8]'
                }`}
              />
            )}
            <span className="whitespace-nowrap tracking-tight">
              {option.label}
            </span>

            {typeof option.count === 'number' && (
              <span
                className={`ui-pill rounded-full ml-0.5 px-2 py-0.5 text-type-helper font-medium tabular-nums transition-colors duration-200 ${
                  isActive
                    ? isPrimary
                      ? 'ui-pill-solid bg-white/20 text-white'
                      : 'ui-pill-solid bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {option.count.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
