import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, LogOut } from 'lucide-react';
import { Button } from './ui';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: React.ReactNode;
  type?: 'danger' | 'success' | 'warning' | 'info';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  requireReason = false,
  reasonPlaceholder = 'Nhập lý do (tối thiểu 3 ký tự)...',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmVariant,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = () => {
    if (requireReason) {
      if (!reason.trim() || reason.trim().length < 3) {
        setReasonError('Vui lòng nhập lý do tối thiểu 3 ký tự.');
        return;
      }
    }
    onConfirm(reason);
  };

  const getIconConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <LogOut className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />,
          iconShell: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60',
          btnVariant: 'danger' as const,
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />,
          iconShell: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60',
          btnVariant: confirmVariant || ('success' as const),
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />,
          iconShell: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60',
          btnVariant: confirmVariant || ('warning' as const),
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />,
          iconShell: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/60',
          btnVariant: 'primary' as const,
        };
    }
  };

  const iconConfig = getIconConfig();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center p-3 overflow-y-auto overscroll-contain bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop sm:p-4">
      <div className="relative w-full max-w-sm max-h-[calc(100dvh-1.5rem)] my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-apple-modal border border-slate-200/90 dark:border-slate-700 animate-modal-dialog will-change-transform sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-3 sm:px-5 sm:py-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${iconConfig.iconShell}`}>
              {iconConfig.icon}
            </div>
            <h3 className="text-type-body-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="shrink-0 rounded-xl p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 space-y-3 bg-white dark:bg-slate-900">
          <div className="text-type-helper sm:text-type-body-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{message}</div>

          {requireReason && (
            <div className="space-y-1.5 pt-0.5">
              <label className="block text-type-body font-medium text-slate-800 dark:text-slate-200">
                Lý do thực hiện <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                placeholder={reasonPlaceholder}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-2.5 text-type-body font-medium focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition placeholder:text-slate-400"
              />
              {reasonError && <p className="text-type-helper leading-[18px] font-semibold text-rose-600">{reasonError}</p>}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-2.5 sm:px-5 sm:py-3">
          {Boolean(cancelText) && (
            <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={iconConfig.btnVariant}
            size="md"
            onClick={handleConfirm}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
