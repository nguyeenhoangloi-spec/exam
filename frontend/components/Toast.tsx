import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const onCloseRef = useRef(onClose);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const triggerClose = useCallback(() => {
    setIsVisible(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, 200);
  }, []);

  useEffect(() => {
    setMounted(true);
    const rAf = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => {
      cancelAnimationFrame(rAf);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      triggerClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [message, type, isPaused, triggerClose]);

  if (!mounted) return null;

  const glowShadow =
    type === 'success'
      ? 'shadow-[0_12px_36px_-6px_rgba(16,185,129,0.38),0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-white/20'
      : 'shadow-[0_12px_36px_-6px_rgba(239,68,68,0.38),0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-white/20';

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed bottom-5 right-5 z-[110] flex max-w-[calc(100vw-2.5rem)] sm:max-w-lg items-start sm:items-center gap-3 rounded-2xl px-4 py-3 pb-3.5 text-white shadow-xl select-none transition-all duration-200 ease-out overflow-hidden ${
        isVisible
          ? 'translate-x-0 translate-y-0 opacity-100 scale-100'
          : 'translate-x-4 translate-y-2 opacity-0 scale-95 pointer-events-none'
      } ${type === 'success' ? 'bg-success-500' : 'bg-danger-500'} ${glowShadow}`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-white animate-scale" />
      ) : (
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-white animate-scale" />
      )}
      <span className="text-type-body-sm font-semibold leading-5 flex-1 text-white drop-shadow-xs pr-1">{message}</span>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerClose();
        }}
        className="ml-1 rounded-xl p-1 hover:bg-white/20 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 shrink-0 cursor-pointer text-white transition-transform"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Subtle 4-Second Countdown Progress Bar */}
      <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden bg-white/25 pointer-events-none">
        <div
          className="h-full bg-white/85 rounded-full"
          style={{
            animation: 'toast-progress 4000ms linear forwards',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>,
    document.body
  );
};
