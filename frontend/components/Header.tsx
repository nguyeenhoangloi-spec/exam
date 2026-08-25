'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  User as UserIcon,
  Settings,
  Inbox,
  Search,
  CheckCheck,
  Headphones,
  Sun,
  Moon,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';
import { DynamicImage } from './ui/DynamicImage';
import api from '../lib/api';
import { ConfirmModal } from './ConfirmModal';
import { SearchModal } from './SearchModal';
import { NotificationDetailModal } from './notifications/NotificationDetailModal';

interface HeaderProps {
  user: User | null;
  title?: string;
  collapsed: boolean;
  onToggleSidebar?: () => void;
  onMenuClick?: () => void;
}

type OpenPanel = 'notifications' | 'account' | null;

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  href?: string;
}

function getSmartMonogram(name?: string): string {
  if (!name) return 'U';
  const clean = name.replace(/^(TS\.|ThS\.|PGS\.|GS\.|ThS|TS|PGS|GS|Thầy|Cô|SV\.|SV)\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'U';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const firstChar = words[0][0];
  const lastChar = words[words.length - 1][0];
  return (firstChar + lastChar).toUpperCase();
}

export const Header: React.FC<HeaderProps> = ({
  user,
  collapsed,
  onMenuClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  useEffect(() => {
    const handleGlobalSearchKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalSearchKey);
    return () => window.removeEventListener('keydown', handleGlobalSearchKey);
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [detailNotification, setDetailNotification] = useState<NotificationItem | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const effectiveUnreadCount = Math.max(
    0,
    notifications.filter((n) => !readNotificationIds.includes(n.id)).length
  );

  const handleMarkAllAsRead = async () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
      await api.patch('/notifications/read-all').catch(() => { });
    } catch { }
  };

  const markAsRead = async (item: NotificationItem) => {
    if (!readNotificationIds.includes(item.id)) {
      const updated = [...readNotificationIds, item.id];
      setReadNotificationIds(updated);
      try {
        localStorage.setItem('read_notifications', JSON.stringify(updated));
        if (!isNaN(Number(item.id))) {
          await api.patch(`/notifications/${item.id}/read`).catch(() => { });
        }
      } catch { }
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    await markAsRead(item);
    setOpenPanel(null);
    setDetailNotification(item);
  };

  const handleNavigateDirect = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(item);
    setOpenPanel(null);
    if (item.href) {
      router.push(item.href);
    }
  };

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const avatarUrl = user?.avatarUrl || user?.teacher?.avatarUrl || user?.student?.avatarUrl;
  const roleCode = user?.role || 'ADMIN';
  const displayRoleLabel =
    roleCode === 'ADMIN' ? 'Quản trị viên' : roleCode === 'TEACHER' ? 'Giảng viên' : 'Sinh viên';

  /* ── Load real notifications based on user role ── */
  useEffect(() => {
    if (!user?.role) {
      setNotifications([]);
      return;
    }

    let isMounted = true;

    const fetchRealNotifications = async () => {
      try {
        const notifList: NotificationItem[] = [];

        // 1. Fetch persistent DB notifications from backend
        try {
          const dbNotifRes = await api.get('/notifications?limit=15');
          const dbItems: any[] = dbNotifRes.data?.items || [];
          for (const d of dbItems) {
            notifList.push({
              id: String(d.id),
              title: d.title,
              desc: d.message,
              href: d.link || (user.role === 'STUDENT' ? '/student/exam-schedule' : user.role === 'TEACHER' ? '/teacher/assignments' : '/exam-schedules'),
            });
            if (d.isRead && !readNotificationIds.includes(String(d.id))) {
              setReadNotificationIds((prev) => [...prev, String(d.id)]);
            }
          }
        } catch {
          // Fallback if db table empty
        }

        // 2. Fetch role-specific action notices
        if (user.role === 'ADMIN') {
          const res = await api.get('/questions/statistics').catch(() => null);
          const pending = res?.data?.pendingCount || 0;
          if (pending > 0) {
            notifList.push({
              id: 'pending-questions',
              title: 'Cần duyệt câu hỏi mới',
              desc: `Có ${pending} câu hỏi đang chờ duyệt trong ngân hàng.`,
              href: '/question-bank?status=PENDING',
            });
          }
        } else if (user.role === 'TEACHER') {
          const res = await api.get('/teachers/my-assignments').catch(() => null);
          const assignments: any[] = res?.data || [];
          const unconfirmed = assignments.filter((a: { status: string }) => a.status !== 'CONFIRMED');
          if (unconfirmed.length > 0) {
            notifList.push({
              id: 'unconfirmed-assignments',
              title: 'Ca coi thi chờ xác nhận',
              desc: `Thầy/Cô có ${unconfirmed.length} ca coi thi chưa xác nhận nhận ca.`,
              href: '/teacher/assignments',
            });
          }
        } else if (user.role === 'STUDENT') {
          if (notifList.length === 0) {
            const res = await api.get('/students/my-schedule').catch(() => null);
            const schedules: any[] = res?.data || [];
            if (schedules.length > 0) {
              notifList.push({
                id: 'student-schedule-1',
                title: 'Lịch thi cá nhân',
                desc: `Bạn có ${schedules.length} ca thi được sắp xếp trong học kỳ này.`,
                href: '/student/exam-schedule',
              });
            }
          }
        }

        if (isMounted) {
          setNotifications(notifList);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    void fetchRealNotifications();

    return () => {
      isMounted = false;
    };
  }, [user?.role, pathname]);

  useEffect(() => {
    setOpenPanel(null);
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const handleLogout = () => {
    void api.post('/auth/logout').finally(() => {
      removeAuth();
      router.replace('/login');
    });
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

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={Boolean(detailNotification)}
        onClose={() => setDetailNotification(null)}
        notification={detailNotification}
        onNavigate={(href) => router.push(href)}
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
                <div className="absolute right-0 top-[calc(100%+10px)] w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 text-type-body z-50 animate-in fade-in zoom-in-95 duration-150">
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
                    <div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800 -mx-4 px-4">
                        {notifications.map((item) => {
                          const isUnread = !readNotificationIds.includes(item.id);
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
                              className={`py-3 px-2 transition cursor-pointer space-y-1 group rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 ${isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body-sm group-hover:text-blue-600 transition flex items-center gap-2">
                                  {isUnread ? (
                                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                  )}
                                  <span>{item.title}</span>
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
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" strokeWidth={1.5} />
                                </div>
                              </div>
                              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal leading-relaxed pl-4 line-clamp-2">
                                {item.desc}
                              </p>
                              <div className="pl-4 pt-1 flex items-center gap-2">
                                <span className="text-type-helper font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                  Xem chi tiết
                                </span>
                              </div>
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
                className={`group flex items-center gap-2.5 rounded-xl py-1 px-2 text-left transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${openPanel === 'account'
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
                  className={`h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform duration-200 ${openPanel === 'account' ? 'rotate-180 text-blue-600' : ''
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
                    <Link
                      href="/profile"
                      onClick={() => setOpenPanel(null)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-type-body-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <UserIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <span>Hồ sơ cá nhân</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setOpenPanel(null)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-type-body-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <span>Cài đặt hệ thống</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
                    </Link>

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
    </>
  );
};
