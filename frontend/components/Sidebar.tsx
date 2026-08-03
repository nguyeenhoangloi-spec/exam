'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  DoorOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  collapsed: boolean;
  onToggle: () => void;
  isToggling: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  collapsed,
  onToggle,
  isToggling,
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role || 'STUDENT';

  const adminNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Khoa', href: '/departments', icon: Building2 },
    { name: 'Quản lý Lớp học', href: '/classes', icon: School },
    { name: 'Quản lý Sinh viên', href: '/students', icon: Users },
    { name: 'Quản lý Giảng viên', href: '/teachers', icon: GraduationCap },
    { name: 'Quản lý Môn học', href: '/subjects', icon: BookOpen },
    { name: 'Quản lý Phòng thi', href: '/exam-rooms', icon: DoorOpen },
    { name: 'Quản lý Kỳ thi', href: '/exam-periods', icon: Calendar },
    { name: 'Quản lý Lịch thi', href: '/exam-schedules', icon: Clock },
    { name: 'Xếp phòng thi', href: '/exam-arrangement', icon: Layers },
    { name: 'Phân công Giám thị', href: '/exam-supervisors', icon: UserCheck },
    { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
    { name: 'Tạo đề thi', href: '/exam-papers', icon: FileText },
  ];
  const teacherNav = [
    { name: 'Lịch coi thi cá nhân', href: '/teacher/assignments', icon: ShieldCheck },
    { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
    { name: 'Tạo đề thi', href: '/exam-papers', icon: FileText },
  ];
  const studentNav = [{ name: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: BookMarked }];
  const navItems = role === 'ADMIN' ? adminNav : role === 'TEACHER' ? teacherNav : studentNav;
  const isItemActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  return (
    <aside
      className={`sidebar-aside fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-visible border-r border-slate-800 bg-slate-900 text-slate-100 shadow-xl ${
        isToggling ? 'transition-[width,transform] duration-300 ease-in-out' : ''
      } ${collapsed ? 'w-[260px] md:w-[72px]' : 'w-[260px]'} ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      {/* Header Section with Integrated Toggle Button */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center">
          {/* Logo EX or Toggle Button in Collapsed Mode */}
          {collapsed ? (
            <button
              type="button"
              aria-label="Mở rộng thanh bên"
              onClick={onToggle}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              title="Mở rộng thanh bên"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 font-bold text-white shadow-lg">
              EX
            </div>
          )}

          {/* Title Text */}
          <div
            className={`sidebar-text-node ml-3 min-w-0 flex-1 overflow-hidden ${
              isToggling ? 'transition-all duration-300 ease-in-out' : ''
            } ${collapsed ? 'opacity-0 max-w-0 pointer-events-none md:hidden' : 'opacity-100 max-w-[150px]'}`}
          >
            <h1 className="truncate text-base font-bold tracking-wide text-white">KHẢO THÍ SV</h1>
            <p className="truncate text-xs text-slate-400">Hệ thống quản lý</p>
          </div>
        </div>

        {/* Integrated Header Panel Button (Visible when expanded) */}
        {!collapsed && (
          <button
            type="button"
            aria-label="Thu gọn thanh bên"
            onClick={onToggle}
            className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/40 text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95"
            title="Thu gọn thanh bên"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-4 py-4" aria-label="Điều hướng chính">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                title={collapsed ? item.name : undefined}
                onClick={onMobileClose}
                className={`group relative flex h-11 items-center rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {/* Fixed Icon Box at X = 16px */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                </div>
                {/* Text Label - Fades & Clips Smoothly */}
                <span
                  className={`sidebar-text-node ml-1 truncate whitespace-nowrap ${
                    isToggling ? 'transition-all duration-300 ease-in-out' : ''
                  } ${collapsed ? 'opacity-0 max-w-0 overflow-hidden md:hidden' : 'opacity-100 max-w-[170px]'}`}
                >
                  {item.name}
                </span>
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+12px)] z-[60] hidden whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block"
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer User Info */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-950/50 p-4">
        <div className="flex items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-sky-400">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
          </div>
          <div
            className={`sidebar-text-node ml-1 min-w-0 flex-1 overflow-hidden ${
              isToggling ? 'transition-all duration-300 ease-in-out' : ''
            } ${collapsed ? 'opacity-0 max-w-0 pointer-events-none md:hidden' : 'opacity-100 max-w-[170px]'}`}
          >
            <p className="truncate text-sm font-medium text-white">{user?.username}</p>
            <span className="mt-0.5 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
