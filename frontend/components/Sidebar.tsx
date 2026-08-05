'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Building2,
  Users,
  ShieldCheck,
  HelpCircle,
  FileText,
  BarChart3,
  School,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  User as UserIcon,
  BookMarked,
  LucideIcon,
} from 'lucide-react';
import { Role, User } from '../types';
import { canAccessPath } from '../lib/access';

interface SidebarProps {
  user: User | null;
  collapsed: boolean;
  onToggle: () => void;
  isToggling?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  group?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const role: Role = user?.role || 'ADMIN';

  // Master Navigation Items
  const adminGroups: NavGroup[] = [
    {
      items: [{ name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      group: 'QUẢN LÝ KHẢO THÍ',
      items: [
        { name: 'Quản lý Kỳ thi', href: '/exam-periods', icon: CalendarDays },
        { name: 'Quản lý Lịch thi', href: '/exam-schedules', icon: CalendarCheck },
        { name: 'Quản lý Phòng thi', href: '/exam-rooms', icon: Building2 },
        { name: 'Xếp phòng thi', href: '/exam-arrangement', icon: Users },
        { name: 'Phân công Giám thị', href: '/exam-supervisors', icon: ShieldCheck },
      ],
    },
    {
      group: 'NGÂN HÀNG & ĐỀ THI',
      items: [
        { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
        { name: 'Quản lý Đề thi', href: '/exam-papers', icon: FileText },
        { name: 'Báo cáo Điểm thi', href: '/exam-reports', icon: BarChart3 },
      ],
    },
    {
      group: 'DANH MỤC HỆ THỐNG',
      items: [
        { name: 'Quản lý Khoa', href: '/departments', icon: Building2 },
        { name: 'Quản lý Lớp học', href: '/classes', icon: School },
        { name: 'Quản lý Môn học', href: '/subjects', icon: BookOpen },
        { name: 'Quản lý Giảng viên', href: '/teachers', icon: GraduationCap },
        { name: 'Quản lý Sinh viên', href: '/students', icon: Users },
      ],
    },
  ];

  const teacherGroups: NavGroup[] = [
    {
      group: 'NGHIỆP VỤ GIẢNG VIÊN',
      items: [
        { name: 'Lịch coi thi cá nhân', href: '/teacher/assignments', icon: ShieldCheck },
        { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
        { name: 'Quản lý Đề thi', href: '/exam-papers', icon: FileText },
        { name: 'Báo cáo Điểm thi', href: '/exam-reports', icon: BarChart3 },
      ],
    },
  ];

  const studentGroups: NavGroup[] = [
    {
      group: 'DÀNH CHO SINH VIÊN',
      items: [
        { name: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: BookMarked },
        { name: 'Khung đào tạo ngành', href: '/student/curriculum', icon: BookOpen },
      ],
    },
  ];

  const rawGroups = role === 'ADMIN' ? adminGroups : role === 'TEACHER' ? teacherGroups : studentGroups;

  // Filter items strictly by canAccessPath
  const filteredGroups = rawGroups
    .map((grp) => ({
      group: grp.group,
      items: grp.items.filter((item) => canAccessPath(role, item.href)),
    }))
    .filter((grp) => grp.items.length > 0);

  const isItemActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  return (
    <aside
      className={`sidebar-aside fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r border-[#1E293B]/70 bg-[#0B1739] text-slate-300 shadow-2xl transition-all duration-300 ${
        collapsed ? 'w-[260px] md:w-[76px]' : 'w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Header Section with Toggle Button ALWAYS at top */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1E293B]/70 px-3.5 bg-[#0B1739]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="truncate text-xs font-black tracking-wider text-white uppercase leading-tight">
                EXAM SYSTEM
              </h1>
              <h2 className="truncate text-[10px] font-bold tracking-tight text-blue-400 uppercase leading-tight mt-0.5">
                HỆ THỐNG QUẢN LÝ THI
              </h2>
            </div>
          )}
        </div>

        {/* Toggle Button ALWAYS AT THE TOP HEADER */}
        <button
          type="button"
          onClick={onToggle}
          className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition cursor-pointer"
          title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar" aria-label="Điều hướng chính">
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.group && !collapsed && (
              <h3 className="px-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                {group.group}
              </h3>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onClick={onMobileClose}
                  title={collapsed ? item.name : undefined}
                  className={`group relative flex h-10 items-center rounded-xl px-3 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${collapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />

                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer User Profile Section matching User Screenshot */}
      <div className="shrink-0 border-t border-[#1E293B]/70 p-3 bg-[#0B1739]">
        <div className={`flex items-center justify-between gap-2.5 rounded-2xl bg-[#081845] p-2.5 border border-blue-900/40 shadow-2xs ${collapsed ? 'justify-center p-2' : ''}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* White Circle Avatar with Blue Letter 'A' */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 font-black text-sm shadow-sm">
              {(user?.username || 'Admin').charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate text-xs font-black text-white leading-tight">
                  {user?.username || 'Admin'}
                </span>
                <span className="block truncate text-[11px] font-semibold text-slate-300 leading-tight mt-0.5">
                  {role === 'ADMIN' ? 'Quản trị hệ thống' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <ChevronLeft className="h-3.5 w-3.5 -rotate-90 shrink-0 text-slate-300" />
          )}
        </div>
      </div>
    </aside>
  );
};
