import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, LogOut } from 'lucide-react';
import { Button } from './ui';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  requireReason = false,
  reasonPlaceholder = 'Nhập lý do (tối thiểu 3 ký tự)...',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
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
          icon: <LogOut className="h-5 w-5 text-rose-600" />,
          iconShell: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60',
          badge: 'Nguy hiểm',
          btnVariant: 'danger' as const,
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
          iconShell: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60',
          badge: 'Thành công',
          btnVariant: 'success' as const,
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-blue-600" />,
          iconShell: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/60',
          badge: 'Thông báo',
          btnVariant: 'primary' as const,
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          iconShell: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60',
          badge: 'Cảnh báo',
          btnVariant: 'warning' as const,
        };
    }
  };

  const iconConfig = getIconConfig();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/20 transition-[opacity,transform] duration-150 ease-out border border-slate-200/90 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-4 sm:p-5 shrink-0">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${iconConfig.iconShell}`}>
                {iconConfig.icon}
              </div>
              <div className="min-w-0 flex-1 pr-1 space-y-0.5 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black leading-snug text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                  <span className="inline-flex items-center text-[12px] leading-[18px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 tracking-wide">
                    {iconConfig.badge}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Đóng"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-3.5 bg-white dark:bg-slate-900">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{message}</p>

          {requireReason && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[15px] leading-6 font-medium text-slate-700 dark:text-slate-200">Lý do thực hiện <span className="text-rose-500">*</span></label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                placeholder={reasonPlaceholder}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-[15px] leading-6 font-medium focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition placeholder:text-slate-400"
              />
              {reasonError && <p className="text-xs leading-[18px] font-bold text-rose-600">{reasonError}</p>}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-3.5">
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
