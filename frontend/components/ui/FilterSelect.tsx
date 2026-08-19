'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost';
  containerClassName?: string;
  options?: FilterSelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  align?: 'left' | 'right' | 'auto';
  menuMinWidth?: number;
  menuMaxWidth?: number | string;
  fitTriggerWidth?: boolean;
}

export const FilterSelect = React.forwardRef<HTMLSelectElement, FilterSelectProps>((
  {
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
    fullWidth = false,
    align = 'auto',
    menuMinWidth = 150,
    menuMaxWidth = '340px',
    fitTriggerWidth = false,
    ...props
  },
  ref
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        const rawChildren = childProps.children;
        let lbl = '';
        if (Array.isArray(rawChildren)) {
          lbl = rawChildren.map((c) => (c === null || c === undefined ? '' : String(c))).join('');
        } else {
          lbl = String(rawChildren !== undefined && rawChildren !== null ? rawChildren : val);
        }
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
  const selectedOption = parsedOptions.find((opt) => String(opt.value).trim() === currentValueStr.trim()) || parsedOptions[0];
  const activeValueStr = selectedOption ? String(selectedOption.value) : currentValueStr;

  // Smart Viewport Positioning calculation
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const computedMinWidth = fitTriggerWidth ? Math.max(rect.width, menuMinWidth) : menuMinWidth;
    const popoverWidth = menuRef.current ? menuRef.current.offsetWidth : computedMinWidth;
    const estimatedHeight = Math.min(parsedOptions.length * 36 + 20, 260);

    // Check vertical space (open up if near bottom)
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight + 10 && rect.top > estimatedHeight;
    const top = openUpward ? Math.max(10, rect.top - estimatedHeight - 6) : rect.bottom + 6;

    // Check horizontal alignment
    let left = rect.left;
    if (align === 'right') {
      left = Math.max(16, rect.right - popoverWidth);
    } else if (align === 'auto') {
      // If trigger is near right side of screen, align right edge of popover with trigger
      if (rect.right > window.innerWidth * 0.65 || rect.left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.right - popoverWidth);
      }
    }

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      minWidth: `${computedMinWidth}px`,
      maxWidth: typeof menuMaxWidth === 'number' ? `${menuMaxWidth}px` : menuMaxWidth,
      zIndex: 99999,
    });
  }, [parsedOptions.length, align, menuMinWidth, menuMaxWidth, fitTriggerWidth]);

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
        containerRef.current && !containerRef.current.contains(target) &&
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
      ? `h-10 text-type-body font-medium ${leftIcon ? 'pl-8 pr-3' : 'px-3'}`
      : size === 'lg'
        ? `h-11 text-type-body font-medium ${leftIcon ? 'pl-9 pr-3.5' : 'px-3.5'}`
        : `h-10 text-type-body font-medium ${leftIcon ? 'pl-9 pr-3.5' : 'px-3.5'}`;

  const variantClasses =
    variant === 'ghost'
      ? 'border-none bg-transparent text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-none'
      : 'border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs';

  const isFullWidth = fullWidth || Boolean(containerClassName && containerClassName.includes('w-full')) || Boolean(className && className.includes('w-full'));

  const containerWidthClass = isFullWidth
    ? (containerClassName || 'w-full')
    : (containerClassName || 'inline-flex w-auto max-w-full');

  return (
    <div className={`relative items-center ${containerWidthClass}`} ref={containerRef}>
      {leftIcon && (
        <div className="pointer-events-none absolute left-3 text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-center z-10">
          {leftIcon}
        </div>
      )}

      {/* Trigger Button replacing native select UI */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        data-ui-control="filter-select"
        data-ui-size={size}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`ui-pressable ${isFullWidth ? 'w-full' : 'w-auto max-w-full'} flex items-center justify-between gap-2 appearance-none rounded-xl outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 ease-out cursor-pointer text-left select-none ${variantClasses} ${sizeClasses} ${className} ${
          disabled ? 'text-placeholder cursor-not-allowed' : ''
        }`}
      >
        <span className="truncate pr-1">{selectedOption?.label || placeholder || 'Chọn...'}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Custom Popover Dropdown Menu with createPortal to document.body */}
      {isOpen && mounted && parsedOptions.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            role="listbox"
            className="w-max rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150"
          >
            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
              {parsedOptions.map((opt) => {
                const isSelected = String(opt.value) === activeValueStr;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-type-body leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-colors duration-150 cursor-pointer select-none text-left ${
                      isSelected
                        ? 'text-slate-900 dark:text-slate-100 font-semibold bg-transparent'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                    } ${opt.disabled ? 'text-placeholder cursor-not-allowed' : ''}`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
});

FilterSelect.displayName = 'FilterSelect';
