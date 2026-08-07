'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

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
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-blue-500/25',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 focus:ring-2 focus:ring-slate-400/20',
  outline:
    'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 focus:ring-2 focus:ring-blue-500/20',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-transparent focus:ring-2 focus:ring-slate-400/20',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-red-500/25',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-emerald-500/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] font-semibold rounded-[8px] gap-1',
  sm: 'h-8 px-3 text-xs font-semibold rounded-[10px] gap-1.5',
  md: 'h-10 px-4 text-xs font-semibold rounded-[10px] gap-2',
  lg: 'h-11 px-5 text-sm font-semibold rounded-[10px] gap-2',
  icon: 'h-10 w-10 p-0 rounded-[10px] justify-center items-center',
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
        className={`inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 ease-in-out cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-current" />
        ) : (
          <>
            {effectiveLeftIcon && <span className="shrink-0">{effectiveLeftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
