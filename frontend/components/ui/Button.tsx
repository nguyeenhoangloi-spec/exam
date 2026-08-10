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
    'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] border border-transparent shadow-2xs focus:ring-2 focus:ring-blue-500/30 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  secondary:
    'bg-white text-[#334155] hover:bg-[#F8FAFC] active:bg-slate-100 border border-[#E2E8F0] hover:border-[#CBD5E1] focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  outline:
    'bg-white text-[#334155] hover:bg-[#F8FAFC] active:bg-slate-100 border border-[#E2E8F0] hover:border-[#CBD5E1] focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  ghost:
    'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155] active:bg-slate-200 border border-transparent focus:ring-2 focus:ring-slate-400/20 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  danger:
    'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border border-transparent shadow-2xs focus:ring-2 focus:ring-red-500/30 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  'danger-outline':
    'bg-white text-[#DC2626] hover:bg-[#FEF2F2] active:bg-rose-100 border border-rose-200 hover:border-rose-300 focus:ring-2 focus:ring-rose-400/20 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  success:
    'bg-[#16A34A] text-white hover:bg-[#15803D] active:bg-[#166534] border border-transparent shadow-2xs focus:ring-2 focus:ring-green-500/30 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
  warning:
    'bg-[#D97706] text-white hover:bg-[#B45309] active:bg-[#92400E] border border-transparent shadow-2xs focus:ring-2 focus:ring-amber-500/30 focus:outline-none font-medium cursor-pointer transition-all duration-150 rounded-lg',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[13px] font-medium rounded-lg gap-1.5',
  sm: 'h-8 px-[10px] text-[13px] font-medium rounded-lg gap-1.5',
  md: 'h-[38px] px-3.5 text-sm font-medium rounded-lg gap-2',
  lg: 'h-[42px] px-[18px] text-[15px] font-medium rounded-lg gap-2',
  icon: 'h-8 w-8 p-0 rounded-md justify-center items-center shrink-0',
  'icon-lg': 'h-[34px] w-[34px] p-0 rounded-lg justify-center items-center shrink-0',
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
