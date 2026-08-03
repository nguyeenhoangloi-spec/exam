'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  School,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
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
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-visible border-r border-slate-800 bg-slate-900 text-slate-100 shadow-xl transition-[width,transform] duration-300 ease-in-out ${
        collapsed ? 'w-[260px] md:w-[76px]' : 'w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      <div className={`flex h-20 shrink-0 items-center border-b border-slate-800 ${collapsed ? 'gap-3 px-5 md:justify-center md:px-3' : 'gap-3 px-5'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 font-bold text-white shadow-lg">EX</div>
        {(!collapsed || mobileOpen) && <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}><h1 className="truncate text-base font-bold tracking-wide text-white">KHẢO THÍ SV</h1><p className="truncate text-xs text-slate-400">Hệ thống quản lý</p></div>}
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-4 md:px-3' : 'px-4'}`} aria-label="Điều hướng chính">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.name : undefined} onClick={onMobileClose} className={`group relative flex h-11 items-center rounded-xl text-sm font-medium transition-colors ${collapsed ? 'gap-3 px-3 md:justify-center md:px-0' : 'gap-3 px-3'} ${isActive ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {(!collapsed || mobileOpen) && <span className={`truncate whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>{item.name}</span>}
                {collapsed && <span role="tooltip" className="pointer-events-none absolute left-[calc(100%+12px)] z-[60] hidden whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={`shrink-0 border-t border-slate-800 bg-slate-950/50 ${collapsed ? 'p-4 md:p-3' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'gap-3 px-2 md:justify-center md:px-0' : 'gap-3 px-2'}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-sky-400">{user?.username?.substring(0, 2).toUpperCase() || 'US'}</div>
          {(!collapsed || mobileOpen) && <div className={`min-w-0 overflow-hidden ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-sm font-medium text-white">{user?.username}</p><span className="mt-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">{role}</span></div>}
        </div>
      </div>

      <button type="button" aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} onClick={() => setCollapsed((value) => !value)} className="absolute -right-4 top-8 z-[60] hidden h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg transition-colors hover:bg-sky-600 md:flex">
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};
