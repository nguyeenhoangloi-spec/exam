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
          icon: <LogOut className="h-4.5 w-4.5 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200',
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200',
        };
      case 'info':
        return {
          icon: <Info className="h-4.5 w-4.5 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200',
        };
      default:
        return {
          icon: <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200',
        };
    }
  };

  const iconConfig = getIconConfig();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/15 transition-all border border-slate-200/90 dark:border-slate-700">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconConfig.bg} shadow-2xs shrink-0`}>
              {iconConfig.icon}
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{message}</p>

          {requireReason && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">Lý do thực hiện:</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                placeholder={reasonPlaceholder}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 p-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
              {reasonError && <p className="text-xs font-bold text-rose-600">{reasonError}</p>}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-b-2xl">
          {Boolean(cancelText) && (
            <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'info' ? 'primary' : 'secondary'}
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
