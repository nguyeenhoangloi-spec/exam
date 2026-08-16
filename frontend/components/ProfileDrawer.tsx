'use client';

import React from 'react';
import { X } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';
import { Button } from './ui/Button';
import { IdentifierBadge } from './ui/IdentifierBadge';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  avatarText?: string;
  badge?: { label: string; className?: string; status?: string };
  details: { label: string; value: React.ReactNode; icon?: React.ElementType }[];
  extraSections?: { title: string; content: React.ReactNode }[];
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  avatarText = 'SV',
  badge,
  details,
  extraSections,
}) => {
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Phím ESC để đóng mượt mà
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const shortAvatar = avatarText ? avatarText.trim().slice(0, 3).toUpperCase() : 'KT';
  const isIdentifierSubtitle = typeof subtitle === 'string' && /(^|\s)(mã|id|code|snapshot)/i.test(subtitle);

  return (
    <div role="dialog" aria-modal="true" aria-label="Thông tin chi tiết" className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop mờ nền với hiệu ứng Fade-in / Fade-out */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={`w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/90 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header — Tương phản cao, Phân cấp chuẩn mực học thuật */}
          <div className="relative bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/90 dark:border-slate-800 p-6 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Avatar / Icon Badge thương hiệu */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-base shadow-sm shadow-blue-500/25 border border-blue-400/30">
                  {shortAvatar}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-semibold leading-snug text-slate-900 dark:text-white break-words" title={title}>
                    {title}
                  </h2>

                  {/* Badges & Status */}
                  {badge && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {badge.status ? (
                        <StatusBadge status={badge.status} customLabel={badge.label} />
                      ) : (
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[12px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 ${badge.className || ''}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subtitle */}
                  {subtitle && (
                    <div className="mt-1.5">
                      {isIdentifierSubtitle ? (
                        <IdentifierBadge tone="neutral" title={subtitle}>{subtitle}</IdentifierBadge>
                      ) : (
                        <p className="text-[14px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Nút Đóng */}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Đóng chi tiết"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body — Liền mạch, Typography Đậm đà Sắc nét (Black-Forward Palette) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
            <div>
              {/* Tiêu đề mục có thanh nhấn xanh thương hiệu */}
              <div className="flex items-center gap-2 mb-3">
                <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  Thông tin chi tiết
                </h3>
              </div>

              {/* Danh sách thông tin dạng đường kẻ liền mạch */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {details.map((item, idx) => {
                  const Icon = item.icon;
                  const isIdentifier = /(^|\s)(mã|id|code|snapshot)/i.test(item.label);

                  return (
                    <div
                      key={idx}
                      className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group"
                    >
                      {/* Cột Trái: Icon + Label rõ nét */}
                      <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-[14px] font-semibold shrink-0">
                        {Icon && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <span>{item.label}</span>
                      </span>

                      {/* Cột Phải: Giá trị đậm nét, chuẩn 15px */}
                      <span className="font-semibold text-slate-900 dark:text-white text-right text-[15px] leading-snug break-words max-w-[62%]">
                        {typeof item.value === 'string' && item.label.toLowerCase().includes('trạng thái') ? (
                          <StatusBadge status={item.value} />
                        ) : isIdentifier && typeof item.value === 'string' ? (
                          <IdentifierBadge tone="neutral" title={item.value}>
                            {item.value}
                          </IdentifierBadge>
                        ) : (
                          item.value || '---'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extra Custom Sections — Liền mạch, Typography chuẩn */}
            {extraSections && extraSections.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {extraSections.map((sec, i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-1 rounded-full bg-blue-600 shrink-0" />
                      <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                        {sec.title}
                      </h3>
                    </div>
                    <div className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                      {sec.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer — Cố định ở đáy, Nút 40px chuẩn design token */}
          <div className="border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-end shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
