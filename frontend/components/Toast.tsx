import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[110] flex max-w-[calc(100vw-2.5rem)] sm:max-w-lg items-start sm:items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-xl transition-all transform slide-in-from-bottom duration-300 select-none"
      style={{ backgroundColor: type === 'success' ? '#10B981' : '#EF4444' }}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-white" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-white" />}
      <span className="text-sm font-semibold leading-5 flex-1 text-white drop-shadow-xs">{message}</span>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="ml-2 rounded-lg p-1 hover:bg-white/15 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 shrink-0 cursor-pointer text-white"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>,
    document.body
  );
};

