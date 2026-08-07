import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[110] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border border-white/20 px-4 py-3 text-white shadow-xl transition-all transform slide-in-from-bottom duration-300"
      style={{ backgroundColor: type === 'success' ? '#10B981' : '#EF4444' }}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-semibold leading-5">{message}</span>
      <button type="button" aria-label="Đóng thông báo" onClick={onClose} className="ml-2 rounded-lg p-1 hover:bg-white/15 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
