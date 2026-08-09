'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
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
    'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] border border-transparent shadow-2xs focus:ring-2 focus:ring-blue-500/30 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
  secondary:
    'bg-white text-slate-700 hover:bg-[#F8FAFC] active:bg-slate-100 border border-[#E2E8F0] hover:border-[#CBD5E1] focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
  outline:
    'bg-white text-slate-700 hover:bg-[#F8FAFC] active:bg-slate-100 border border-[#E2E8F0] hover:border-[#CBD5E1] focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
  ghost:
    'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155] active:bg-slate-200 border border-transparent focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
  danger:
    'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-red-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-red-500/30 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
  success:
    'bg-[#16A34A] text-white hover:bg-green-700 active:bg-green-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-green-500/30 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
  warning:
    'bg-[#D97706] text-white hover:bg-amber-700 active:bg-amber-800 border border-transparent shadow-2xs focus:ring-2 focus:ring-amber-500/30 focus:outline-none font-semibold cursor-pointer transition-all duration-150',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[12px] font-medium rounded-lg gap-1.5',
  sm: 'h-8 px-2.5 text-xs font-medium rounded-lg gap-1.5', // 32px height, 10px px, 13px text, 8px radius
  md: 'h-[38px] px-3.5 text-sm font-medium rounded-lg gap-2', // 38px height, 14px px, 14px text, 8px radius
  lg: 'h-[42px] px-4.5 text-sm font-semibold rounded-lg gap-2', // 42px height, 18px px, 14px text, 8px radius
  icon: 'h-8 w-8 p-0 rounded-lg justify-center items-center shrink-0', // 32x32px, 8px radius
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
        className={`inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 ease-in-out cursor-pointer select-none disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
