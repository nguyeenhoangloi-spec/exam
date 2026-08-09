import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
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
  type = 'danger',
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
          icon: <AlertTriangle className="h-4.5 w-4.5 text-red-600" />,
          bg: 'bg-red-50 border-red-200',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />,
          bg: 'bg-green-50 border-green-200',
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/15 transition-all border border-slate-200/90 dark:border-slate-700">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${iconConfig.bg} shadow-2xs shrink-0`}>
              {iconConfig.icon}
            </div>
            <h3 className="text-[20px] font-semibold text-[#0F172A] dark:text-slate-100 tracking-tight leading-none">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-3">
          <p className="text-[15px] text-[#64748B] dark:text-slate-300 font-normal leading-relaxed">{message}</p>

          {requireReason && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[15px] font-medium text-[#334155] dark:text-slate-200">Lý do thực hiện:</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                placeholder={reasonPlaceholder}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 p-2.5 text-[15px] font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {reasonError && <p className="text-[13px] font-medium text-[#DC2626]">{reasonError}</p>}
            </div>
          )}
        </div>

        {/* Footer Actions: Cancel (Left / Secondary White) - Confirm (Right / Primary or Danger/Warning) */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-6 py-4">
          {Boolean(cancelText) && (
            <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'info' ? 'primary' : 'warning'}
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
