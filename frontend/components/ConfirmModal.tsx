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
          icon: <LogOut className="h-5 w-5 text-white" />,
          gradient: 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-700',
          badge: 'Nguy hiểm',
          btnVariant: 'danger' as const,
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          gradient: 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700',
          badge: 'Thành công',
          btnVariant: 'success' as const,
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-white" />,
          gradient: 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800',
          badge: 'Thông báo',
          btnVariant: 'primary' as const,
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-white" />,
          gradient: 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700',
          badge: 'Cảnh báo',
          btnVariant: 'warning' as const,
        };
    }
  };

  const iconConfig = getIconConfig();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/20 transition-all border border-slate-200/90 dark:border-slate-700">
        {/* Full-Bleed Vivid Gradient Header */}
        <div className={`${iconConfig.gradient} p-4 sm:p-5 text-white shrink-0 shadow-xs`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                {iconConfig.icon}
              </div>
              <div className="min-w-0 flex-1 pr-1 space-y-0.5 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold leading-snug text-white">
                    {title}
                  </h3>
                  <span className="inline-flex items-center text-[12px] leading-[18px] font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/30 tracking-wide">
                    {iconConfig.badge}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="shrink-0 rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
              title="Đóng"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-3.5 bg-white dark:bg-slate-900">
          <p className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{message}</p>

          {requireReason && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[15px] leading-6 font-semibold text-slate-700 dark:text-slate-200">Lý do thực hiện <span className="text-rose-500">*</span></label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                placeholder={reasonPlaceholder}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-[15px] leading-6 font-medium focus:border-blue-600 focus:bg-white focus:outline-none transition placeholder:text-slate-400"
              />
              {reasonError && <p className="text-[13px] leading-[18px] font-bold text-rose-600">{reasonError}</p>}
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
