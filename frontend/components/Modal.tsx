import React from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { IdentifierBadge } from './ui/IdentifierBadge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  headerClassName?: string;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'gradient';
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
  headerClassName = '',
  icon,
  subtitle,
  badge,
  variant = 'default',
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const widthClass = sizeClasses[size] || sizeClasses.md;
  const isGradient = variant !== 'default';

  const defaultIcon = icon || <Sparkles className="h-5 w-5 text-white" />;
  const defaultBadge = badge || (typeof title === 'string' && (title.includes('Sửa') || title.includes('Chỉnh') || title.includes('Tạo') || title.includes('Thêm')) ? (title.includes('Sửa') || title.includes('Chỉnh') ? 'Cập nhật' : 'Tạo mới') : 'Hệ thống');
  const defaultSubtitle = subtitle || 'Quản lý thông tin trên hệ thống khảo thí';
  const isIdentifierSubtitle = typeof defaultSubtitle === 'string' && /(^|\s)(mã|mssv|id|code|snapshot)/i.test(defaultSubtitle);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[2px] animate-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Modal'}
        onMouseDown={(event) => event.stopPropagation()}
        className={`relative my-auto flex max-h-[calc(100vh-2rem)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/20 animate-modal-dialog will-change-transform ${className}`}
      >
        {isGradient ? (
          <div className={`bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 sm:p-6 text-white shrink-0 shadow-xs ${headerClassName}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                  {defaultIcon}
                </div>

                <div className="min-w-0 flex-1 pr-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-type-card leading-[26px] font-semibold text-white">
                      {title}
                    </h3>
                    {defaultBadge && (
                      <span className="ui-pill ui-pill-solid inline-flex items-center text-type-helper leading-[18px] font-medium bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/30 tracking-wide">
                        {defaultBadge}
                      </span>
                    )}
                  </div>
                  {defaultSubtitle && (
                    (() => {
                      const match = typeof defaultSubtitle === 'string' ? defaultSubtitle.match(/^(?:mã(?:\s+[a-zà-ỹ]+)*|id|code|snapshot)\s*:\s*(.+)$/i) : null;
                      const codeValue = match ? match[1].trim() : defaultSubtitle;
                      const isCode = isIdentifierSubtitle || Boolean(match);

                      return isCode ? (
                        <div><IdentifierBadge tone="inverse" title={typeof defaultSubtitle === 'string' ? defaultSubtitle : undefined}>{codeValue}</IdentifierBadge></div>
                      ) : (
                        <p className="text-type-helper leading-[18px] font-medium text-blue-100/90 line-clamp-1">
                          {defaultSubtitle}
                        </p>
                      );
                    })()
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${headerClassName}`}>
            <h3 className="text-type-card font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
