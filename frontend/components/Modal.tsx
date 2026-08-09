import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',   // 384px - compact popups
  md: 'max-w-md',   // 448px - small forms (change password, etc.)
  lg: 'max-w-lg',   // 512px - standard forms (subjects, departments, rooms)
  xl: 'max-w-xl',   // 576px - medium forms (schedules, classes)
  '2xl': 'max-w-2xl', // 672px - large multi-column forms
  '3xl': 'max-w-3xl', // 768px - extra wide wizards
  '4xl': 'max-w-4xl', // 896px - previews
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'xl',
  className = '',
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const widthClass = sizeClasses[size] || sizeClasses.md;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={`relative my-auto flex max-h-[calc(100vh-2rem)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/20 transform transition-all ${className}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
          <h3 className="text-[20px] font-semibold text-[#0F172A] dark:text-slate-100 tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
