'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline' | 'success' | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-blue-500/30 focus:outline-none font-semibold cursor-pointer rounded-xl',
  secondary:
    'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:hover:border-slate-600 focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-semibold cursor-pointer rounded-xl shadow-2xs',
  outline:
    'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:hover:border-slate-600 focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-semibold cursor-pointer rounded-xl shadow-2xs',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:active:bg-slate-700 border border-transparent focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-semibold cursor-pointer rounded-xl',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-red-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-red-500/30 focus:outline-none font-semibold cursor-pointer rounded-xl',
  'danger-outline':
    'bg-white text-danger-600 hover:bg-danger-50 active:bg-rose-100 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:active:bg-rose-950/50 dark:border-rose-800/70 border border-rose-200 hover:border-rose-300 focus:ring-2 focus:ring-rose-400/20 focus:outline-none font-semibold cursor-pointer rounded-xl',
  success:
    'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 border border-transparent shadow-2xs focus:ring-2 focus:ring-green-500/30 focus:outline-none font-semibold cursor-pointer rounded-xl',
  warning:
    'bg-warning-600 text-white hover:bg-warning-700 active:bg-amber-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-amber-500/30 focus:outline-none font-semibold cursor-pointer rounded-xl',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-8 px-2.5 text-[15px] font-semibold rounded-xl gap-1.5',
  sm: 'h-9 px-3 text-[15px] font-semibold rounded-xl gap-1.5',
  md: 'h-10 px-3.5 text-[15px] font-semibold rounded-xl gap-2',
  lg: 'h-10 px-[18px] text-[15px] font-semibold rounded-xl gap-2',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center items-center shrink-0',
  'icon-lg': 'h-10 w-10 p-0 rounded-xl justify-center items-center shrink-0',
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

    return (
      <button
        ref={ref}
        type={type}
        disabled={isBtnDisabled}
        aria-busy={isLoading || undefined}
        className={`ui-pressable inline-flex items-center justify-center font-sans tracking-tight transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 ease-out cursor-pointer select-none disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-current mr-1.5" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {effectiveLeftIcon && <span className="shrink-0">{effectiveLeftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
