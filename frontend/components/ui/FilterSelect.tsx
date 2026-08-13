'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md';
  variant?: 'outline' | 'ghost';
  containerClassName?: string;
  options?: FilterSelectOption[];
  placeholder?: string;
}

export function FilterSelect({
  leftIcon,
  size = 'md',
  variant = 'outline',
  containerClassName = '',
  className = '',
  children,
  options: customOptions,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract options from children if customOptions is not provided
  const parsedOptions = useMemo(() => {
    if (customOptions && customOptions.length > 0) {
      return customOptions;
    }
    const extracted: FilterSelectOption[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && (child.type === 'option' || (child.type as any)?.displayName === 'option')) {
        const childProps = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
        const val = childProps.value !== undefined ? String(childProps.value) : String(childProps.children || '');
        const lbl = String(childProps.children || val);
        extracted.push({
          value: val,
          label: lbl,
          disabled: childProps.disabled,
        });
      }
    });
    return extracted;
  }, [children, customOptions]);

  const currentValueStr = value !== undefined && value !== null ? String(value) : '';
  const selectedOption = parsedOptions.find((opt) => opt.value === currentValueStr) || parsedOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optVal: string) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      const syntheticEvent = {
        target: { value: optVal, name: props.name },
        currentTarget: { value: optVal, name: props.name },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  const sizeClasses =
    size === 'sm'
      ? `h-9 text-[15px] font-medium ${leftIcon ? 'pl-8 pr-7' : 'px-3 pr-7'}`
      : `h-9 text-[15px] font-medium ${leftIcon ? 'pl-9 pr-8' : 'px-3.5 pr-8'}`;

  const variantClasses =
    variant === 'ghost'
      ? 'border-none bg-transparent text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none shadow-none'
      : 'border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs';

  return (
    <div className={`relative inline-flex items-center ${containerClassName}`} ref={containerRef}>
      {leftIcon && (
        <div className="pointer-events-none absolute left-3 text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-center z-10">
          {leftIcon}
        </div>
      )}

      {/* Trigger Button replacing native select UI */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 appearance-none rounded-xl outline-none transition-all cursor-pointer leading-none text-left select-none ${variantClasses} ${sizeClasses} ${className} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'
        }`}
      >
        <span className="truncate pr-2">{selectedOption?.label || placeholder || 'Chọn...'}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Custom Popover Dropdown Menu */}
      {isOpen && parsedOptions.length > 0 && (
        <div className="absolute left-0 top-full z-[100] mt-1.5 min-w-[200px] w-max max-w-[340px] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {parsedOptions.map((opt) => {
              const isSelected = opt.value === currentValueStr;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt.value)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-[14px] leading-5 transition cursor-pointer select-none text-left ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
