'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';

export const controlClassName =
  'w-full h-10 rounded-[10px] border border-slate-200/90 bg-white px-3.5 text-[15px] text-[#0F172A] font-normal transition duration-150 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', containerClassName = '', id, type = 'text', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-[15px] font-medium text-[#334155]">
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#1F2937] pointer-events-none shrink-0 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`w-full h-10 rounded-[10px] border bg-white px-3.5 text-[15px] text-[#0F172A] placeholder:text-[#1F2937] font-normal transition duration-150 focus:outline-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20'
                : 'border-slate-200/90 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300'
            } ${className}`}
            {...props}
          />

          {rightIcon && <div className="absolute right-3.5 text-[#1F2937] shrink-0 flex items-center justify-center">{rightIcon}</div>}
        </div>

        {error ? (
          <p className="text-[13px] font-medium text-[#DC2626] pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[13px] font-normal text-[#64748B] pl-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export function SearchInput({ className = '', ...props }: Omit<InputProps, 'leftIcon'>) {
  return <Input leftIcon={<Search className="h-4 w-4" />} placeholder="Tìm kiếm..." className={className} {...props} />;
}

export function PasswordInput({ className = '', ...props }: Omit<InputProps, 'type' | 'rightIcon'>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-[#1F2937] hover:text-[#0F172A] cursor-pointer p-1"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      className={className}
      {...props}
    />
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, containerClassName = '', className = '', children, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="block text-[15px] font-medium text-[#334155]">
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={`w-full h-10 rounded-[10px] border bg-white px-3.5 text-[15px] text-[#0F172A] font-normal transition duration-150 focus:outline-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200/90 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error ? (
          <p className="text-[13px] font-medium text-[#DC2626] pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[13px] font-normal text-[#64748B] pl-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, containerClassName = '', className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={textareaId} className="block text-[15px] font-medium text-[#334155]">
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-[10px] border bg-white p-3.5 text-[15px] text-[#0F172A] placeholder:text-[#1F2937] font-normal transition duration-150 focus:outline-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200/90 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300'
          } ${className}`}
          {...props}
        />

        {error ? (
          <p className="text-[13px] font-medium text-[#DC2626] pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[13px] font-normal text-[#64748B] pl-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
