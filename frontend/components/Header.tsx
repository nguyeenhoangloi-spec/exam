'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
} from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  title?: string;
  collapsed: boolean;
  onMenuClick?: () => void;
}

type OpenPanel = 'notifications' | 'account' | null;

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

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const roleCode = user?.role || 'ADMIN';

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
    <header className="sticky top-0 z-30 flex h-12 w-full bg-[#F8FAFC]/90 backdrop-blur-md transition-all">
      <div ref={containerRef} className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
        {/* Left Side: Breadcrumb line matching Screenshot */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={onMenuClick}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <nav className="flex items-center gap-1 text-[11px] font-semibold text-slate-400" aria-label="Breadcrumb">
            <span
              className="cursor-pointer transition hover:text-slate-700"
              onClick={() => router.push('/dashboard')}
            >
              Trang chủ
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">
              {title === 'Hệ thống Quản lý Khảo thí' ? 'Tổng quan' : title}
            </span>
          </nav>
        </div>

        {/* Right Side: Notification bell & Profile pill matching Screenshot */}
        <div className="flex items-center gap-3">
          {/* Notification Bell with red badge 5 */}
          <div className="relative">
            <button
              type="button"
              aria-label="Xem thông báo"
              aria-expanded={openPanel === 'notifications'}
              onClick={() => togglePanel('notifications')}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-2xs">
                5
              </span>
            </button>

            {openPanel === 'notifications' && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-xs">Thông báo</p>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">5 mới</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <p className="font-bold text-slate-800">Cần duyệt câu hỏi mới</p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">12 câu hỏi đang chờ duyệt trong ngân hàng.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill matching Screenshot */}
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
              <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 transition"
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
