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
} from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';
import api from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  user: User | null;
  title?: string;
  collapsed: boolean;
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
  onMenuClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const roleCode = user?.role || 'ADMIN';
  const displayRoleLabel =
    roleCode === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : roleCode === 'TEACHER' ? 'GIẢNG VIÊN' : 'SINH VIÊN';

  /* ── Load real notifications based on user role ── */
  useEffect(() => {
    if (!user?.role) {
      setNotifications([]);
      setUnreadCount(0);
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
              setUnreadCount(pending);
              setNotifications([
                {
                  id: 'pending-questions',
                  title: 'Cần duyệt câu hỏi mới',
                  desc: `Có ${pending} câu hỏi đang chờ duyệt trong ngân hàng.`,
                  href: '/question-bank?status=PENDING',
                },
              ]);
            } else {
              setUnreadCount(0);
              setNotifications([]);
            }
          }
        } else if (user.role === 'TEACHER') {
          const res = await api.get('/teachers/my-assignments');
          const assignments: any[] = res.data || [];
          const unconfirmed = assignments.filter((a) => a.status !== 'CONFIRMED');
          if (isMounted) {
            if (unconfirmed.length > 0) {
              setUnreadCount(unconfirmed.length);
              setNotifications([
                {
                  id: 'unconfirmed-assignments',
                  title: 'Ca coi thi chờ xác nhận',
                  desc: `Thầy/Cô có ${unconfirmed.length} ca coi thi chưa xác nhận nhận ca.`,
                  href: '/teacher/assignments',
                },
              ]);
            } else {
              setUnreadCount(0);
              setNotifications([]);
            }
          }
        } else if (user.role === 'STUDENT') {
          const res = await api.get('/students/my-schedule');
          const schedules: any[] = res.data || [];
          if (isMounted) {
            if (schedules.length > 0) {
              setUnreadCount(schedules.length);
              setNotifications([
                {
                  id: 'student-schedule',
                  title: 'Lịch thi cá nhân',
                  desc: `Bạn có ${schedules.length} ca thi được sắp xếp trong học kỳ này.`,
                  href: '/student/exam-schedule',
                },
              ]);
            } else {
              setUnreadCount(0);
              setNotifications([]);
            }
          }
        }
      } catch (e) {
        if (isMounted) {
          setUnreadCount(0);
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
    removeAuth();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full bg-white/95 backdrop-blur-md transition-all border-b border-slate-200/70 shadow-2xs">
      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản lý khảo thí?"
        type="warning"
        confirmText="Đăng xuất"
        cancelText="Hủy bỏ"
      />

      <div ref={containerRef} className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
        {/* Left Side: Navigation / Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden cursor-pointer"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400" aria-label="Breadcrumb">
            <span
              className="cursor-pointer transition hover:text-slate-800"
              onClick={() => {
                if (user?.role === 'TEACHER') router.push('/teacher/assignments');
                else if (user?.role === 'STUDENT') router.push('/student/exam-schedule');
                else router.push('/dashboard');
              }}
            >
              Trang chủ
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-extrabold text-slate-900">
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
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {openPanel === 'notifications' && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl shadow-slate-200/60 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <p className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thông báo hệ thống</span>
                  </p>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                      {unreadCount} chưa đọc
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      Đã cập nhật
                    </span>
                  )}
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.href) {
                            router.push(item.href);
                            setOpenPanel(null);
                          }
                        }}
                        className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 transition hover:bg-blue-100/70 cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-black text-slate-800 text-xs group-hover:text-blue-700 transition">
                            {item.title}
                          </p>
                          <ArrowRight className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition" />
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2 text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Không có thông báo mới</p>
                    <p className="text-[10.5px] text-slate-400">Bạn đã xem toàn bộ thông báo hệ thống.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-200/80" />

          {/* Header User Profile Trigger Button */}
          <div className="relative">
            <button
              type="button"
              aria-label="Mở menu tài khoản"
              aria-haspopup="menu"
              aria-expanded={openPanel === 'account'}
              aria-controls="user-account-dropdown"
              onClick={() => togglePanel('account')}
              className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-100/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {/* Avatar Circle */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#003896] font-black text-white shadow-2xs text-sm tracking-tight">
                {displayName.charAt(0).toUpperCase()}
              </div>

              {/* Name & Role text */}
              <div className="hidden sm:block text-left leading-none">
                <span className="block text-xs font-black text-slate-900">{displayName}</span>
                <span className="block text-[9.5px] font-extrabold text-[#0047BA] uppercase tracking-wider mt-1">
                  {displayRoleLabel}
                </span>
              </div>

              {/* Chevron Down Arrow */}
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  openPanel === 'account' ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Redesigned Account Dropdown Menu */}
            {openPanel === 'account' && (
              <div
                id="user-account-dropdown"
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-[calc(100%+10px)] w-[280px] sm:w-[300px] rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xl shadow-slate-200/60 text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Isometric Top Pointer Tip pointing up to Header trigger */}
                <div className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-l border-t border-slate-200/90 bg-white z-10" />

                <div className="relative z-20 space-y-1">
                  {/* Item 1: Hồ sơ cá nhân */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenPanel(null);
                      router.push('/profile');
                    }}
                    className="flex h-12 w-full items-center justify-between rounded-xl px-4 text-slate-700 font-bold hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        Hồ sơ cá nhân
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Item 2: Cài đặt tài khoản */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenPanel(null);
                      router.push('/settings');
                    }}
                    className="flex h-12 w-full items-center justify-between rounded-xl px-4 text-slate-700 font-bold hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        Cài đặt tài khoản
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Item 3: Đổi mật khẩu */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenPanel(null);
                      router.push('/change-password');
                    }}
                    className="flex h-12 w-full items-center justify-between rounded-xl px-4 text-slate-700 font-bold hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        Đổi mật khẩu
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-slate-100" />

                  {/* Item 4: Đăng xuất */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenPanel(null);
                      setShowLogoutConfirm(true);
                    }}
                    className="flex h-12 w-full items-center justify-between rounded-xl px-4 text-rose-600 font-bold hover:bg-rose-50/80 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5 text-rose-600 group-hover:scale-105 transition-transform" />
                      <span className="text-xs font-extrabold text-rose-600">Đăng xuất</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
