'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  CheckCircle2,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';
import api from '../lib/api';

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

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const roleCode = user?.role || 'ADMIN';

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
    <header className="sticky top-0 z-30 flex h-12 w-full bg-[#F8FAFC]/90 backdrop-blur-md transition-all border-b border-slate-200/60">
      <div ref={containerRef} className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
        {/* Left Side: Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={onMenuClick}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>

          <nav className="flex items-center gap-1 text-[11px] font-semibold text-slate-400" aria-label="Breadcrumb">
            <span
              className="cursor-pointer transition hover:text-slate-700"
              onClick={() => {
                if (user?.role === 'TEACHER') router.push('/teacher/assignments');
                else if (user?.role === 'STUDENT') router.push('/student/exam-schedule');
                else router.push('/dashboard');
              }}
            >
              Trang chủ
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">
              {title === 'Hệ thống Quản lý Khảo thí' ? 'Tổng quan' : title}
            </span>
          </nav>
        </div>

        {/* Right Side: Notification bell & Profile pill */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              aria-label="Xem thông báo"
              aria-expanded={openPanel === 'notifications'}
              onClick={() => togglePanel('notifications')}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-2xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {openPanel === 'notifications' && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl text-xs z-50">
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

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              aria-label="Mở menu tài khoản"
              aria-expanded={openPanel === 'account'}
              onClick={() => togglePanel('account')}
              className="flex items-center gap-2 rounded-xl p-1 text-left transition hover:bg-slate-100/60 cursor-pointer"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black text-white shadow-2xs text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <span className="block text-xs font-black text-slate-900">{displayName}</span>
                <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{roleCode}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {openPanel === 'account' && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 z-50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
