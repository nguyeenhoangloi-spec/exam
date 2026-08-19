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
} from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';
import { DynamicImage } from './ui/DynamicImage';
import api from '../lib/api';
import { ConfirmModal } from './ConfirmModal';
import { SearchModal } from './SearchModal';

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

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
    } catch { }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readNotificationIds.includes(item.id)) {
      const updated = [...readNotificationIds, item.id];
      setReadNotificationIds(updated);
      try {
        localStorage.setItem('read_notifications', JSON.stringify(updated));
      } catch { }
    }
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
        if (user.role === 'ADMIN') {
          const res = await api.get('/questions/statistics');
          const pending = res.data?.pendingCount || 0;
          if (isMounted) {
            if (pending > 0) {
              setNotifications([
                {
                  id: 'pending-questions',
                  title: 'Cần duyệt câu hỏi mới',
                  desc: `Có ${pending} câu hỏi đang chờ duyệt trong ngân hàng.`,
                  href: '/question-bank?status=PENDING',
                },
                {
                  id: 'exam-schedules-notice',
                  title: 'Quản lý lịch thi',
                  desc: 'Vui lòng kiểm tra xếp phòng và cán bộ coi thi.',
                  href: '/exam-schedules',
                },
              ]);
            } else {
              setNotifications([]);
            }
          }
        } else if (user.role === 'TEACHER') {
          const res = await api.get('/teachers/my-assignments');
          const assignments: any[] = res.data || [];
          const unconfirmed = assignments.filter((a: { status: string }) => a.status !== 'CONFIRMED');
          if (isMounted) {
            if (unconfirmed.length > 0) {
              setNotifications([
                {
                  id: 'unconfirmed-assignments',
                  title: 'Ca coi thi chờ xác nhận',
                  desc: `Thầy/Cô có ${unconfirmed.length} ca coi thi chưa xác nhận nhận ca.`,
                  href: '/teacher/assignments',
                },
                {
                  id: 'question-bank-notice',
                  title: 'Ngân hàng câu hỏi',
                  desc: 'Vui lòng kiểm tra và duyệt thêm câu hỏi mới.',
                  href: '/question-bank',
                },
              ]);
            } else {
              setNotifications([]);
            }
          }
        } else if (user.role === 'STUDENT') {
          const res = await api.get('/students/my-schedule');
          const schedules: any[] = res.data || [];
          if (isMounted) {
            if (schedules.length > 0) {
              setNotifications([
                {
                  id: 'student-schedule-1',
                  title: 'Lịch thi cá nhân',
                  desc: `Bạn có ${schedules.length} ca thi được sắp xếp trong học kỳ này.`,
                  href: '/student/exam-schedule',
                },
                {
                  id: 'student-schedule-2',
                  title: 'Quy chế phòng thi online',
                  desc: 'Kiểm tra thiết bị & mạng internet trước giờ thi 15 phút.',
                  href: '/student/exam-schedule',
                },
              ]);
            } else {
              setNotifications([]);
            }
          }
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
                <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 text-type-body z-50 animate-in fade-in zoom-in-95 duration-150">
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
                              className={`py-3 px-2 transition cursor-pointer space-y-1 group rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
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
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" strokeWidth={1.5} />
                              </div>
                              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal leading-relaxed pl-4">
                                {item.desc}
                              </p>
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
                      {displayName?.charAt(0) || 'U'}
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

              {/* Creative Modern User Account Dropdown */}
              {openPanel === 'account' && (
                <div
                  id="user-account-dropdown"
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-[calc(100%+8px)] w-72 origin-top-right rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl shadow-slate-950/15 dark:shadow-slate-950/70 text-type-helper z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 ease-out backdrop-blur-2xl"
                >
                  {/* Isometric Top Pointer Tip */}
                  <div className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-l border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-10" />

                  {/* Header: User Profile Card (Flat, Modern & Spacious) */}
                  <div className="relative z-20 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 mb-1.5 space-y-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {avatarUrl ? (
                          <DynamicImage
                            src={avatarUrl}
                            alt={displayName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/30"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-type-body shadow-xs">
                            {displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0 flex-1">
                        <p className="text-type-body font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                          {displayName}
                        </p>
                        <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate mt-0.5" title={user?.email || ''}>
                          {user?.email || (user?.username ? `@${user.username}` : 'Chưa cập nhật email')}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge & Live Online Status */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="ui-pill inline-flex items-center px-2 py-0.5 rounded-full text-type-helper font-medium text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                        {displayRoleLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-type-badge font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Trực tuyến
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links with Modern Icon Shells */}
                  <div className="relative z-20 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setOpenPanel(null)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-type-body-sm text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-150">
                          <UserIcon className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                        <span>Hồ sơ cá nhân</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setOpenPanel(null)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-type-body-sm text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-slate-700 group-hover:text-white transition-colors duration-150">
                          <Settings className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                        <span>Cài đặt hệ thống</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => setOpenPanel(null)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-type-body-sm text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-150">
                          <Headphones className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                        <span>Trung tâm hỗ trợ</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="relative z-20 my-1 border-t border-slate-100 dark:border-slate-800/80" />

                  {/* Sleek Theme Toggle Switch */}
                  <div className="relative z-20">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={toggleTheme}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-type-body-sm text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-150">
                          {isDark ? (
                            <Moon className="h-4 w-4" strokeWidth={1.5} />
                          ) : (
                            <Sun className="h-4 w-4" strokeWidth={1.5} />
                          )}
                        </div>
                        <span>Chế độ tối</span>
                      </div>
                      {/* Toggle Switch */}
                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                          isDark ? 'bg-blue-600 shadow-xs' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            isDark ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative z-20 my-1 border-t border-slate-100 dark:border-slate-800/80" />

                  {/* Logout Action (Soft Danger) */}
                  <div className="relative z-20">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenPanel(null);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-type-body-sm text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-150">
                          <LogOut className="h-4 w-4" strokeWidth={1.5} />
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
