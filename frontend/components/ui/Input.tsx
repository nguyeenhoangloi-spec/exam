'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { FilterSelect } from './FilterSelect';

export const controlClassName =
  'w-full h-10 rounded-xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-700 px-3.5 text-type-body text-slate-900 dark:text-slate-100 font-normal transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed';

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
          <label htmlFor={inputId} className="block text-type-body font-medium text-slate-700 dark:text-slate-200">
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-700 dark:text-slate-300 pointer-events-none shrink-0 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`w-full h-10 rounded-xl border bg-white dark:bg-slate-900 px-3.5 text-type-body text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 font-normal transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${leftIcon ? 'pl-10' : ''
              } ${rightIcon ? 'pr-10' : ''} ${error
                ? 'border-danger-600 focus:border-danger-600 focus:ring-2 focus:ring-red-500/20'
                : 'border-slate-200/90 dark:border-slate-700 focus:border-primary-600 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600'
              } ${className}`}
            {...props}
          />

          {rightIcon && <div className="absolute right-3.5 text-slate-700 dark:text-slate-300 shrink-0 flex items-center justify-center">{rightIcon}</div>}
        </div>

        {error ? (
          <p className="text-type-helper font-medium text-danger-600 pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 pl-0.5">{helperText}</p>
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
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((prev) => !prev)}
          className="ui-pressable text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer p-1"
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
  ({ label, error, helperText, containerClassName = '', className = '', children, options, id, size: htmlSize, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="block text-type-body font-medium text-slate-700 dark:text-slate-200">
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}

        <FilterSelect
          ref={ref}
          id={selectId}
          size="md"
          containerClassName="w-full"
          className={`w-full h-10 rounded-xl border bg-white dark:bg-slate-900 px-3.5 text-type-body text-slate-900 dark:text-slate-100 font-normal transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed cursor-pointer ${error
              ? 'border-danger-600 focus:border-danger-600 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200/90 dark:border-slate-700 focus:border-primary-600 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600'
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
        </FilterSelect>

        {error ? (
          <p className="text-type-helper font-medium text-danger-600 pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 pl-0.5">{helperText}</p>
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
          <label htmlFor={textareaId} className="block text-type-body font-medium text-slate-700 dark:text-slate-200">
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-xl border bg-white dark:bg-slate-900 p-3.5 text-type-body text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 font-normal transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${error
              ? 'border-danger-600 focus:border-danger-600 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200/90 dark:border-slate-700 focus:border-primary-600 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600'
            } ${className}`}
          {...props}
        />

        {error ? (
          <p className="text-type-helper font-medium text-danger-600 pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 pl-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
