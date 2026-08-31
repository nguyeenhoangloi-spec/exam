'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IdentifierBadge } from './IdentifierBadge';

export interface DetailDrawerTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
}

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  showAvatar?: boolean;
  avatarText?: string;
  avatarIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  tabs?: DetailDrawerTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  footer?: React.ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  ariaLabel?: string;
}

/**
 * Rút gọn monogram chuẩn học thuật từ chuỗi tiêu đề
 */
function getSmartMonogram(titleNode: React.ReactNode, fallback = 'CT'): string {
  if (typeof titleNode !== 'string' || !titleNode.trim()) return fallback;
  const clean = titleNode.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const first = words[0][0];
    const last = words[words.length - 1][0];
    return (first + last).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * DetailDrawer - Component Drawer trượt bên phải dùng chung chuẩn mực toàn hệ thống
 * - Tự động đệm và đóng băng (freeze) nội dung trong suốt 300ms trượt ra, chống đổi chữ/nhảy layout
 * - Hoạt ảnh 60 FPS mượt mà cubic-bezier(0.16, 1, 0.3, 1) + will-change-transform
 * - Hỗ trợ Header, Subtitle, Badges, Tabs liền mạch, Footer cố định, phím ESC và SSR Portal
 */
export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  showAvatar = true,
  avatarText,
  avatarIcon,
  headerActions,
  headerExtra,
  tabs,
  activeTab,
  onTabChange,
  footer,
  maxWidth = 'md',
  children,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  ariaLabel = 'Thông tin chi tiết',
}: DetailDrawerProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Bộ đệm (caching) dữ liệu khi mở để giữ nguyên 100% nội dung khi đóng
  const [cachedProps, setCachedProps] = useState({
    title,
    subtitle,
    badge,
    showAvatar,
    avatarText,
    avatarIcon,
    headerActions,
    headerExtra,
    tabs,
    activeTab,
    footer,
    children,
    maxWidth,
  });

  useEffect(() => {
    if (isOpen) {
      setCachedProps({
        title,
        subtitle,
        badge,
        showAvatar,
        avatarText,
        avatarIcon,
        headerActions,
        headerExtra,
        tabs,
        activeTab,
        footer,
        children,
        maxWidth,
      });
      setShouldRender(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    isOpen,
    title,
    subtitle,
    badge,
    showAvatar,
    avatarText,
    avatarIcon,
    headerActions,
    headerExtra,
    tabs,
    activeTab,
    footer,
    children,
    maxWidth,
  ]);

  // Phím ESC để đóng mượt mà
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sử dụng dữ liệu hiện tại khi đang mở, dùng dữ liệu đã đệm khi đang trượt đóng
  const active = isOpen
    ? {
        title,
        subtitle,
        badge,
        showAvatar,
        avatarText,
        avatarIcon,
        headerActions,
        headerExtra,
        tabs,
        activeTab,
        footer,
        children,
        maxWidth,
      }
    : cachedProps;

  // Xử lý độ rộng
  const widthClass = useMemo(() => {
    switch (active.maxWidth) {
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      default:
        return active.maxWidth?.startsWith('max-w-') ? active.maxWidth : `max-w-[${active.maxWidth}]`;
    }
  }, [active.maxWidth]);

  if (!shouldRender || typeof document === 'undefined') return null;

  const shortAvatar = getSmartMonogram(active.title, active.avatarText || 'CT');
  const isIdentifierSubtitle =
    typeof active.subtitle === 'string' && /(^|\s)(mã|id|code|snapshot)/i.test(active.subtitle);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={`fixed inset-0 z-[100] overflow-hidden ${className}`}
    >
      {/* Backdrop mờ nền */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={`w-screen ${widthClass} bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/60 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`relative bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 p-5 shrink-0 ${headerClassName}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Avatar Monogram hoặc Icon */}
                {active.showAvatar !== false && (active.avatarIcon || active.avatarText !== undefined) && (
                  active.avatarIcon ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/25 border border-blue-400/30">
                      {active.avatarIcon}
                    </div>
                  ) : active.avatarText ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-type-body shadow-sm shadow-blue-500/25 border border-blue-400/30">
                      {shortAvatar}
                    </div>
                  ) : null
                )}

                <div className="min-w-0 flex-1">
                  {typeof active.title === 'string' ? (
                    <h2
                      className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white break-words"
                      title={active.title}
                    >
                      {active.title}
                    </h2>
                  ) : (
                    active.title
                  )}

                  {/* Badges & Subtitle */}
                  {(active.badge || active.subtitle) && (
                    <div className="mt-2 flex items-center gap-2 min-w-0 flex-nowrap overflow-hidden">
                      {active.badge && (
                        <div className="shrink-0 flex items-center">{active.badge}</div>
                      )}

                      {active.subtitle && (
                        <div className="min-w-0 flex-1 shrink truncate flex items-center">
                          {typeof active.subtitle === 'string' &&
                          (/(^|\s)(mã|id|code|snapshot)\s*:\s*/i.test(active.subtitle) ||
                            isIdentifierSubtitle) ? (
                            <IdentifierBadge tone="neutral" title={active.subtitle} className="max-w-full">
                              {active.subtitle.replace(/^(?:mã(?:\s+[a-zà-ỹ]+)*|id|code|snapshot)\s*:\s*/i, '').trim()}
                            </IdentifierBadge>
                          ) : typeof active.subtitle === 'string' ? (
                            <p className="text-type-body-sm font-medium text-slate-600 dark:text-slate-300 tabular-nums truncate">
                              {active.subtitle}
                            </p>
                          ) : (
                            active.subtitle
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Nút Đóng */}
              <div className="flex items-center gap-1.5 shrink-0">
                {active.headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Đóng chi tiết"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {active.headerExtra && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                {active.headerExtra}
              </div>
            )}
          </div>

          {/* Navigation Tabs (nếu có) */}
          {active.tabs && active.tabs.length > 0 && (
            <div className="px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {active.tabs.map((tab) => {
                const isActive = (active.activeTab || active.tabs![0].id) === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex items-center gap-2 py-3 px-3 border-b-2 text-type-body-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`ui-pill ui-pill-solid rounded-full px-2 py-0.5 text-type-helper font-medium tabular-nums ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Body Content */}
          <div
            className={`flex-1 overflow-y-auto p-5 space-y-6 bg-white dark:bg-slate-900 custom-scrollbar ${bodyClassName}`}
          >
            {active.children}
          </div>

          {/* Footer (nếu có) */}
          {active.footer && (
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 px-5 py-3.5 shrink-0">
              {active.footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
