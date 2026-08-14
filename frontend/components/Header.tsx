'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  User as UserIcon,
  Settings,
  Lock,
  Inbox,
  ArrowRight,
  Search,
  PanelLeft,
  PanelLeftOpen,
  CheckCheck,
  GraduationCap,
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
  title = 'Hệ thống quản lý khảo thí',
  collapsed,
  onToggleSidebar,
  onMenuClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalSearchKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readNotificationIds.includes(item.id)) {
      const updated = [...readNotificationIds, item.id];
      setReadNotificationIds(updated);
      try {
        localStorage.setItem('read_notifications', JSON.stringify(updated));
      } catch {}
    }
    setOpenPanel(null);
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRealNotifications = async () => {
      if (!user) return;
      try {
        if (user.role === 'ADMIN') {
          const res = await api.get('/admin/activity-logs?limit=5');
          const logs: any[] = res.data?.logs || [];
          if (isMounted) {
            if (logs.length > 0) {
              setNotifications(
                logs.map((log: any, idx: number) => ({
                  id: log.id || `log-${idx}`,
                  title: log.action || 'Hoạt động hệ thống',
                  desc: `${log.user?.fullName || log.user?.username || 'Hệ thống'}: ${log.details || 'Đã thực hiện thao tác'}`,
                  href: '/admin/activity-logs',
                }))
              );
            } else {
              setNotifications([]);
            }
          }
        } else if (user.role === 'TEACHER') {
          const res = await api.get('/teachers/my-assignments');
          const assignments: any[] = res.data || [];
          if (isMounted) {
            if (assignments.length > 0) {
              setNotifications([
                {
                  id: 'teacher-assignment-1',
                  title: 'Phân công coi thi mới',
                  desc: `Bạn có ${assignments.length} ca coi thi trong kỳ thi sắp tới.`,
                  href: '/teacher/assignments',
                },
                {
                  id: 'teacher-assignment-2',
                  title: 'Lưu ý chấm thi tự luận',
                  desc: 'Hạn nộp kết quả chấm tự luận theo đúng lịch khảo thí.',
                  href: '/teacher/essay-grading',
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
      } catch (e) {
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

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const avatarUrl = user?.avatarUrl || user?.teacher?.avatarUrl || user?.student?.avatarUrl;
  const displayRoleLabel = user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên';

  return (
    <>
      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản lý khảo thí?"
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

      {/* ── UNIFIED TOPBAR: Thanh Header Liền Khối Toàn Màn Hình (macOS Style) ── */}
      <header className="app-header-fixed fixed top-0 left-0 right-0 z-40 flex h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs select-none">
        <div ref={containerRef} className="flex h-full w-full items-center justify-between">
          {/* 1. Left Brand Block (Liền khối góc trái) */}
          <div
            className={`hidden md:flex h-full shrink-0 items-center justify-between border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ${
              collapsed ? 'w-[72px] px-3 justify-center' : 'w-[252px] px-4'
            }`}
          >
            {collapsed ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
                aria-label="Mở rộng thanh bên"
                title="Mở rộng thanh bên"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            ) : (
              <>
                <Link href="/dashboard" className="flex items-center gap-3 min-w-0 group cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-50 dark:ring-blue-950 transition-transform group-hover:scale-105">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h1 className="truncate text-[15.5px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                      Exam System
                    </h1>
                    <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Hệ thống khảo thí
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 cursor-pointer"
                  aria-label="Thu gọn thanh bên"
                  title="Thu gọn thanh bên"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* 2. Main Topbar Center & Right Area */}
          <div className="flex flex-1 h-full items-center justify-between px-4 md:px-6 min-w-0">
            {/* Left: Mobile Drawer Trigger / Quick Search / Breadcrumb */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                type="button"
                aria-label="Mở menu điều hướng"
                onClick={onMenuClick}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 md:hidden cursor-pointer shadow-2xs"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              {/* Quick Search Button */}
              <button
                type="button"
                aria-label="Tìm kiếm nhanh (Ctrl+K)"
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 transition shadow-2xs cursor-pointer"
                title="Tìm kiếm nhanh (Ctrl + K)"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 truncate" aria-label="Breadcrumb">
                <button
                  type="button"
                  className="cursor-pointer text-slate-400/80 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0"
                  onClick={() => {
                    if (user?.role === 'TEACHER') router.push('/teacher/assignments');
                    else if (user?.role === 'STUDENT') router.push('/student/exam-schedule');
                    else router.push('/dashboard');
                  }}
                >
                  Trang chủ
                </button>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title === 'Hệ thống quản lý khảo thí' ? 'Tổng quan' : title}
                </span>
              </nav>
            </div>

            {/* Right Side: Notification bell & User Profile trigger */}
            <div className="flex items-center gap-3.5 shrink-0">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Xem thông báo"
                  aria-expanded={openPanel === 'notifications'}
                  onClick={() => togglePanel('notifications')}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Bell className="h-5 w-5" />
                  {effectiveUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-rose-600 text-[12px] font-semibold text-white shadow-xs leading-none">
                      {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {openPanel === 'notifications' && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 text-[15px] z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span>Thông báo hệ thống</span>
                      </p>
                      {effectiveUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
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
                                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-[14px] group-hover:text-blue-600 transition flex items-center gap-2">
                                    {isUnread ? (
                                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                    )}
                                    <span>{item.title}</span>
                                  </p>
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                                </div>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed pl-4">
                                  {item.desc}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-2 text-slate-400 dark:text-slate-500">
                        <Inbox className="w-8 h-8 mx-auto text-slate-700 dark:bg-slate-600" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Không có thông báo mới</p>
                        <p className="text-[12px] text-slate-400 dark:text-slate-500">Bạn đã xem toàn bộ thông báo hệ thống.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vertical Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Header User Profile Trigger Button */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Mở menu tài khoản"
                  aria-haspopup="menu"
                  aria-expanded={openPanel === 'account'}
                  aria-controls="user-account-dropdown"
                  onClick={() => togglePanel('account')}
                  className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {/* Avatar Circle */}
                  {avatarUrl ? (
                    <DynamicImage
                      src={avatarUrl}
                      alt={displayName}
                      className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-semibold text-white text-xs tracking-tight">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name & Role text */}
                  <div className="hidden sm:block text-left leading-tight">
                    <span className="block text-[13px] font-semibold text-slate-900 dark:text-slate-100">{displayName}</span>
                    <span className="block text-[12px] font-medium text-primary-600">
                      {displayRoleLabel}
                    </span>
                  </div>

                  {/* Chevron Arrow */}
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      openPanel === 'account' ? 'rotate-180 text-primary-600' : ''
                    }`}
                  />
                </button>

                {/* Redesigned Account Dropdown Menu */}
                {openPanel === 'account' && (
                  <div
                    id="user-account-dropdown"
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 top-[calc(100%+10px)] w-[240px] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Isometric Top Pointer Tip pointing up to Header trigger */}
                    <div className="absolute -top-1.5 right-7 h-3 w-3 rotate-45 border-l border-t border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 z-10" />

                    <div className="relative z-20 space-y-0.5">
                      {/* Item 1: Hồ sơ cá nhân */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenPanel(null);
                          router.push('/profile');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                      >
                        <UserIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                          Hồ sơ cá nhân
                        </span>
                      </button>

                      {/* Item 2: Cài đặt tài khoản */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenPanel(null);
                          router.push('/settings');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                      >
                        <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                          Cài đặt tài khoản
                        </span>
                      </button>

                      {/* Item 3: Đổi mật khẩu */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenPanel(null);
                          router.push('/change-password');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                      >
                        <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                          Đổi mật khẩu
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      {/* Item 4: Đăng xuất */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenPanel(null);
                          setShowLogoutConfirm(true);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-rose-600 font-medium hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="h-4 w-4 text-rose-600" />
                          <span className="text-xs font-semibold text-rose-600">Đăng xuất</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
