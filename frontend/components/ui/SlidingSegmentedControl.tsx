'use client';

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';

export interface SlidingSegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface SlidingSegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: SlidingSegmentedOption<T>[];
  className?: string;
  size?: 'sm' | 'md';
}

export function SlidingSegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  className = '',
  size = 'md',
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
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;

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

  const heightClass = size === 'sm' ? 'h-8 text-type-helper' : 'h-10 text-type-helper';
  const paddingClass = size === 'sm' ? 'px-2.5 py-1' : 'px-3.5 py-1.5';
  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1 border border-slate-200/60 dark:border-slate-700/60 select-none shadow-2xs ${heightClass} ${className}`}
    >
      {/* Sliding Background Indicator Pill */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 shadow-xs shadow-slate-900/5 dark:shadow-black/20 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[transform,width]"
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: isReady ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease' : 'none',
        }}
      />

      {/* Segmented Option Buttons */}
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
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors duration-200 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${paddingClass} ${
              isActive
                ? 'text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            {Icon && (
              <Icon
                className={`${iconSizeClass} transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            )}
            <span className="whitespace-nowrap">{option.label}</span>

            {typeof option.count === 'number' && (
              <span
                className={`ui-pill ml-1 px-1.5 py-0.5 rounded-full text-type-helper font-medium tabular-nums border transition-colors duration-200 ${
                  isActive
                    ? 'ui-pill-solid bg-blue-600 text-white border-blue-600'
                    : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
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
