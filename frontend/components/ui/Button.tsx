'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'danger-outline' | 'success' | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  shimmer?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'group overflow-hidden bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border border-transparent shadow-xs shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
  soft:
    'bg-blue-100 text-blue-700 hover:bg-blue-200/90 active:bg-blue-300/80 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-800/60 dark:active:bg-blue-800/80 border border-transparent focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
  secondary:
    'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-slate-400/20 focus-visible:outline-none font-semibold cursor-pointer rounded-xl shadow-2xs',
  outline:
    'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-slate-400/20 focus-visible:outline-none font-semibold cursor-pointer rounded-xl shadow-2xs',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:active:bg-slate-700 border border-transparent focus-visible:ring-2 focus-visible:ring-slate-400/20 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-red-800 border border-transparent shadow-2xs focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
  'danger-outline':
    'bg-white text-danger-600 hover:bg-danger-50 active:bg-rose-100 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:active:bg-rose-950/50 dark:border-rose-800/70 border border-rose-200 hover:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-400/20 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
  success:
    'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 border border-transparent shadow-2xs focus-visible:ring-2 focus-visible:ring-green-500/30 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
  warning:
    'bg-warning-600 text-white hover:bg-warning-700 active:bg-amber-800 border border-transparent shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:outline-none font-semibold cursor-pointer rounded-xl',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-8 min-h-0 px-2.5 text-type-body font-semibold rounded-xl gap-1.5',
  sm: 'h-9 min-h-0 px-3 text-type-body font-semibold rounded-xl gap-1.5',
  md: 'h-10 min-h-0 px-3.5 text-type-body font-semibold rounded-xl gap-2',
  lg: 'h-11 min-h-0 px-[18px] text-type-body font-semibold rounded-xl gap-2',
  icon: 'h-9 min-h-0 w-9 p-0 rounded-xl justify-center items-center shrink-0',
  'icon-lg': 'h-10 min-h-0 w-10 p-0 rounded-xl justify-center items-center shrink-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      icon,
      shimmer = true,
      className = '',
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isBtnDisabled = disabled || isLoading;
    const effectiveLeftIcon = leftIcon || icon;
    const shouldShowShimmer = shimmer && variant === 'primary' && !isBtnDisabled;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isBtnDisabled}
        aria-busy={isLoading || undefined}
        aria-disabled={isBtnDisabled || undefined}
        className={`relative ui-pressable inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 ease-out active:scale-[0.96] active:translate-y-0 cursor-pointer select-none disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {/* Shimmer / Glass light sweep effect on hover for Primary CTA Buttons */}
        {shouldShowShimmer && (
          <span className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out pointer-events-none" />
        )}

        {/* Spinner overlay — absolute, does NOT affect button width */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-current" />
          </span>
        )}

        {/* Content — invisible when loading but keeps button size stable */}
        <span className={`inline-flex items-center justify-center gap-2 whitespace-nowrap ${isLoading ? 'invisible' : ''}`}>
          {effectiveLeftIcon && <span className="shrink-0 flex items-center">{effectiveLeftIcon}</span>}
          {children && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>}
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';
