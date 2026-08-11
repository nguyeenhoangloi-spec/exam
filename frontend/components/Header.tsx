'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  title = 'Hệ thống Quản lý Khảo thí',
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalSearchKey);
    return () => window.removeEventListener('keydown', handleGlobalSearchKey);
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const unreadItems = notifications.filter((n) => !readNotificationIds.includes(n.id));
  const effectiveUnreadCount = unreadItems.length;

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readNotificationIds.includes(item.id)) {
      setReadNotificationIds((prev) => [...prev, item.id]);
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
          const unconfirmed = assignments.filter((a) => a.status !== 'CONFIRMED');
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

      <header
        className={`app-header-fixed fixed top-0 left-0 right-0 z-30 flex h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all border-b border-slate-200/70 dark:border-slate-700/70 shadow-2xs ${collapsed ? 'md:left-[72px]' : 'md:left-[252px]'
          }`}
      >
        <div ref={containerRef} className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
          {/* Left Side: Navigation / Search / Sidebar Toggle / Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-2.5">
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
            <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1" aria-label="Breadcrumb">
              <button
                type="button"
                className="cursor-pointer text-slate-400/80 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                onClick={() => {
                  if (user?.role === 'TEACHER') router.push('/teacher/assignments');
                  else if (user?.role === 'STUDENT') router.push('/student/exam-schedule');
                  else router.push('/dashboard');
                }}
              >
                Trang chủ
              </button>
              <span className="text-slate-700 dark:text-slate-600">/</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                {title === 'Hệ thống Quản lý Khảo thí' ? 'Tổng quan' : title}
              </span>
            </nav>
          </div>

          {/* Right Side: Notification bell & User Profile trigger */}
          <div className="flex items-center gap-3.5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="Xem thông báo"
                aria-expanded={openPanel === 'notifications'}
                onClick={() => togglePanel('notifications')}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#475569] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Bell className="h-5 w-5" />
                {effectiveUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white shadow-xs leading-none">
                    {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {openPanel === 'notifications' && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 text-[15px] z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                    <p className="font-semibold text-[#0F172A] dark:text-slate-100 text-[15px] flex items-center gap-1.5">
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
                              className={`py-3 px-2 transition cursor-pointer space-y-1 group rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 ${isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <p className="font-semibold text-[#0F172A] dark:text-slate-100 text-[14px] group-hover:text-blue-600 transition flex items-center gap-2">
                                  {isUnread ? (
                                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                  )}
                                  <span>{item.title}</span>
                                </p>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                              </div>
                              <p className="text-[13px] text-[#64748B] dark:text-slate-400 font-normal leading-relaxed pl-4">
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
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500">Bạn đã xem toàn bộ thông báo hệ thống.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-[#E2E8F0] dark:bg-slate-700" />

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
                    className="h-9 w-9 shrink-0 rounded-full object-cover border border-[#E2E8F0]"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] font-bold text-white text-xs tracking-tight">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name & Role text */}
                <div className="hidden sm:block text-left leading-tight">
                  <span className="block text-[13px] font-bold text-[#0F172A] dark:text-slate-100">{displayName}</span>
                  <span className="block text-[11px] font-semibold text-[#2563EB]">
                    {displayRoleLabel}
                  </span>
                </div>

                {/* Chevron Arrow */}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${openPanel === 'account' ? 'rotate-180 text-[#2563EB]' : ''
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
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                    >
                      <UserIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
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
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                    >
                      <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
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
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                    >
                      <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        Đổi mật khẩu
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                    {/* Item 4: Đăng xuất */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenPanel(null);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-rose-600 font-bold hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="h-4 w-4 text-rose-600 group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-bold text-rose-600">Đăng xuất</span>
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
