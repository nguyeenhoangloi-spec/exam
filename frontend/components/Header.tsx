'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  CheckCheck,
  Inbox,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  User as UserIcon,
  Headphones,
  ArrowUpRight,
} from 'lucide-react';
import { removeAuth, getAuthUser } from '../lib/auth';
import { User } from '../types';
import { DynamicImage } from './ui/DynamicImage';
import { ConfirmModal } from './ConfirmModal';
import { SearchModal } from './SearchModal';
import { AccountSettingsModal, AccountSettingsTab } from './AccountSettingsModal';

export interface NotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'system' | 'exam';
  href?: string;
}

export interface HeaderProps {
  user?: User;
  title?: string;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  onMenuClick?: () => void;
}

const NOTIF_STORAGE_KEY = 'read_notifications_v1';

export const Header: React.FC<HeaderProps> = ({
  user: initialUser,
  collapsed = false,
  onMenuClick,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<'notifications' | 'account' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);
  const [expandedNotifIds, setExpandedNotifIds] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [accountModalTab, setAccountModalTab] = useState<AccountSettingsTab | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync user from local storage
  const syncUserFromStorage = useCallback(() => {
    const authUser = getAuthUser();
    setUser(authUser);
  }, []);

  useEffect(() => {
    syncUserFromStorage();
    const handleAuthChange = () => syncUserFromStorage();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [syncUserFromStorage]);

  // Global listener to trigger opening the Unified Account Modal
  useEffect(() => {
    const handleOpenAccountSettings = (e: any) => {
      const tab = e?.detail?.tab || 'profile';
      setAccountModalTab(tab);
    };
    window.addEventListener('open-account-settings', handleOpenAccountSettings);
    return () => window.removeEventListener('open-account-settings', handleOpenAccountSettings);
  }, []);

  // Theme Sync
  useEffect(() => {
    const isDarkMode =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Close dropdown on click outside or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load read notifications
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) {
        setReadNotificationIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Dynamic notifications based on role
  useEffect(() => {
    if (!user) return;
    const items: NotificationItem[] = [];

    if (user.role === 'ADMIN') {
      items.push({
        id: 101,
        title: 'Hệ thống sẵn sàng',
        desc: 'Hệ thống Quản lý Khảo thí đang vận hành ổn định.',
        time: 'Vừa xong',
        type: 'info',
        href: '/dashboard',
      });
      items.push({
        id: 102,
        title: 'Nhật ký bảo mật',
        desc: 'Đã hoàn tất rà soát bảo mật định kỳ toàn hệ thống.',
        time: '10 phút trước',
        type: 'system',
        href: '/admin/security-audit',
      });
    } else if (user.role === 'TEACHER') {
      items.push({
        id: 201,
        title: 'Lịch coi thi được phân công',
        desc: 'Bạn có ca coi thi mới cần xác nhận trong tuần này.',
        time: '15 phút trước',
        type: 'exam',
        href: '/teacher/assignments',
      });
    } else {
      items.push({
        id: 301,
        title: 'Lịch thi học kỳ mới',
        desc: 'Lịch thi chính thức đã được công bố. Vui lòng kiểm tra phòng thi.',
        time: '30 phút trước',
        type: 'exam',
        href: '/student/exam-schedule',
      });
    }

    setNotifications(items);
  }, [user]);

  const effectiveUnreadCount = useMemo(() => {
    return notifications.filter((n) => !readNotificationIds.includes(n.id)).length;
  }, [notifications, readNotificationIds]);

  const togglePanel = (panel: 'notifications' | 'account') => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readNotificationIds.includes(item.id)) {
      const updated = [...readNotificationIds, item.id];
      setReadNotificationIds(updated);
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    if (item.href) {
      setOpenPanel(null);
      router.push(item.href);
    }
  };

  const handleNavigateDirect = (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readNotificationIds.includes(item.id)) {
      const updated = [...readNotificationIds, item.id];
      setReadNotificationIds(updated);
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    if (item.href) {
      setOpenPanel(null);
      router.push(item.href);
    }
  };

  const toggleExpandNotif = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotifIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleLogout = () => {
    removeAuth();
    setShowLogoutConfirm(false);
    window.location.href = '/login';
  };

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Người dùng';
  const displayRoleLabel =
    user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên';
  const avatarUrl = user?.avatarUrl || user?.teacher?.avatarUrl || user?.student?.avatarUrl;

  const getSmartMonogram = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Đăng xuất khỏi hệ thống?"
        message="Bạn có chắc chắn muốn đăng xuất phiên làm việc hiện tại không?"
        type="danger"
        confirmText="Đăng xuất"
        cancelText="Hủy bỏ"
      />

      {/* Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        user={user}
      />

      <header
        style={{ left: collapsed ? '72px' : '252px' }}
        className="app-header-fixed fixed top-0 right-0 z-30 flex h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-[left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[left]"
      >
        <div ref={containerRef} className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
          {/* Left Side: Mobile Menu Button & Minimalist Search Icon Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Mobile Menu Button */}
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              onClick={onMenuClick}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 md:hidden cursor-pointer shadow-2xs"
            >
              <Menu className="h-4.5 w-4.5" strokeWidth={1.5} />
            </button>

            {/* Quick Spotlight Search Icon Button (Ultra-minimalist) */}
            <button
              type="button"
              aria-label="Tìm kiếm nhanh hệ thống (Ctrl+K)"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer"
              title="Tìm kiếm nhanh (Ctrl + K)"
            >
              <Search className="h-4.5 w-4.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Right Side: Quick Theme Switcher, Notification Bell & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Dark/Light Theme Switcher */}
            <button
              type="button"
              aria-label="Chuyển chế độ sáng tối"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer"
              title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" strokeWidth={1.5} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.5} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="Xem thông báo"
                aria-expanded={openPanel === 'notifications'}
                onClick={() => togglePanel('notifications')}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Bell className="h-4.5 w-4.5" strokeWidth={1.5} />
                {effectiveUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-rose-600 text-type-badge font-semibold text-white shadow-xs">
                    {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {openPanel === 'notifications' && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[min(24rem,calc(100vw-1rem))] sm:w-[24rem] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 text-type-body z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                      <span>Thông báo hệ thống</span>
                    </p>
                    {effectiveUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="inline-flex items-center gap-1 text-type-helper font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>Đọc tất cả</span>
                      </button>
                    )}
                  </div>

                  {notifications.length > 0 ? (
                    <div className="max-h-[28rem] overflow-y-auto ui-scrollbar -mr-1 pr-1">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800 -mx-4 px-4">
                        {notifications.map((item) => {
                          const isUnread = !readNotificationIds.includes(item.id);
                          const isLong = (item.desc || '').length > 90 || (item.desc || '').includes('\n');
                          const isExpanded = expandedNotifIds.includes(item.id);

                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleNotificationClick(item)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleNotificationClick(item);
                                }
                              }}
                              className={`py-3 px-2 transition cursor-pointer space-y-1.5 group rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body-sm group-hover:text-blue-600 transition flex items-center gap-2">
                                  {isUnread ? (
                                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Chưa đọc" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" title="Đã đọc" />
                                  )}
                                  <span className="break-words">{item.title}</span>
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                  {item.href && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleNavigateDirect(item, e)}
                                      className="p-1 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                                      title="Mở trang liên quan"
                                    >
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Notification Description */}
                              {isLong ? (
                                <>
                                  <p
                                    className={`text-type-helper text-slate-600 dark:text-slate-300 font-normal leading-relaxed pl-4 break-words ${
                                      isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'
                                    }`}
                                  >
                                    {item.desc}
                                  </p>
                                  <div className="pl-4 pt-0.5 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleExpandNotif(item.id, e)}
                                      className="inline-flex items-center gap-1 text-type-helper font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition cursor-pointer"
                                    >
                                      <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                                      )}
                                    </button>

                                    {isExpanded && item.href && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleNavigateDirect(item, e)}
                                        className="inline-flex items-center gap-1 text-type-helper font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 transition cursor-pointer"
                                      >
                                        <span>Đi đến trang</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <p className="text-type-helper text-slate-600 dark:text-slate-300 font-normal leading-relaxed pl-4 break-words">
                                  {item.desc}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2 text-slate-400 dark:text-slate-500">
                      <Inbox className="w-8 h-8 mx-auto text-slate-700 dark:bg-slate-600" strokeWidth={1.5} />
                      <p className="text-type-helper font-semibold text-slate-600 dark:text-slate-300">Không có thông báo mới</p>
                      <p className="text-type-helper text-slate-400 dark:text-slate-500">Bạn đã xem toàn bộ thông báo hệ thống.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Header User Profile Trigger Button */}
            <div className="relative">
              <button
                type="button"
                aria-label="Mở menu tài khoản"
                aria-haspopup="menu"
                aria-expanded={openPanel === 'account'}
                aria-controls="user-account-dropdown"
                onClick={() => togglePanel('account')}
                className={`group flex items-center gap-2.5 rounded-xl py-1 px-2 text-left transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  openPanel === 'account'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <DynamicImage
                      src={avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-blue-500/20"
                    />
                  ) : (
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-type-helper sm:text-type-body-sm tracking-tight shadow-xs">
                      {getSmartMonogram(displayName)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>

                {/* Name & Role text */}
                <div className="hidden sm:block text-left leading-tight">
                  <span className="block truncate max-w-[130px] text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {displayName}
                  </span>
                  <span className="block text-type-badge font-medium text-blue-600 dark:text-blue-400">
                    {displayRoleLabel}
                  </span>
                </div>

                {/* Chevron Arrow */}
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform duration-200 ${
                    openPanel === 'account' ? 'rotate-180 text-blue-600' : ''
                  }`}
                  strokeWidth={1.5}
                />
              </button>

              {/* Clean Minimalist User Account Dropdown (White + Blue EDU) */}
              {openPanel === 'account' && (
                <div
                  id="user-account-dropdown"
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-[calc(100%+8px)] w-[min(16rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] origin-top-right rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl shadow-slate-950/15 dark:shadow-slate-950/70 text-type-helper z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 ease-out"
                >
                  {/* Subtle Top Pointer Tip */}
                  <div className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-l border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-10" />

                  {/* Account Header: Clean Profile Identity with Soft Secondary Email */}
                  <div className="group/email relative px-2.5 py-2 mb-1 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {displayName}
                    </p>
                    <div className="relative mt-0.5">
                      <p
                        className="text-type-helper font-normal text-slate-500 dark:text-slate-400 truncate cursor-default select-text"
                        title={user?.email || ''}
                      >
                        {user?.email || (user?.username ? `@${user.username}` : displayRoleLabel)}
                      </p>

                      {/* Instant Floating Hover Tooltip (Full Email View on Hover) */}
                      {user?.email && (
                        <div className="absolute left-0 top-[calc(100%+4px)] z-50 hidden group-hover/email:block max-w-[280px] rounded-xl bg-slate-900/95 dark:bg-slate-800/95 border border-slate-700/80 px-2.5 py-1.5 text-type-helper font-medium text-white shadow-xl backdrop-blur-xs break-all animate-in fade-in-0 zoom-in-95 duration-150 pointer-events-none">
                          <span className="select-all">{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="relative z-20 space-y-0.5">
                    {/* Hồ sơ & Cài đặt (Unified Popup Trigger) */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPanel(null);
                        setAccountModalTab('profile');
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-type-body-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <UserIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <span>Hồ sơ & Cài đặt</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
                    </button>

                    {/* Trung tâm hỗ trợ */}
                    <Link
                      href="/contact"
                      onClick={() => setOpenPanel(null)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-type-body-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Headphones className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <span>Trung tâm hỗ trợ</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="relative z-20 my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* Logout Action */}
                  <div className="relative z-20">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenPanel(null);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-type-body-sm text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <span>Đăng xuất</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Unified Account & Settings Modal */}
      <AccountSettingsModal
        isOpen={!!accountModalTab}
        onClose={() => setAccountModalTab(null)}
        initialTab={accountModalTab || 'profile'}
      />
    </>
  );
};
