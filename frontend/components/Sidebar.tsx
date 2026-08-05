'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  DoorOpen,
  Clock,
  UserCheck,
  HelpCircle,
  FileText,
  Layers,
  BarChart3,
  Users,
  School,
  Building2,
  BookOpen,
  ChevronLeft,
  User as UserIcon,
  ShieldCheck,
  BookMarked,
  LucideIcon,
} from 'lucide-react';
import { User } from '../types';
import { canAccessPath } from '../lib/access';

interface SidebarProps {
  user: User | null;
  collapsed: boolean;
  onToggle: () => void;
  isToggling: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  group: string;
  items: NavItem[];
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
  const role = user?.role || 'ADMIN';

  // Define All Valid Route Groups based strictly on access.ts
  const adminGroups: NavGroup[] = [
    {
      group: '',
      items: [
        { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'QUẢN LÝ KHẢO THÍ',
      items: [
        { name: 'Quản lý Kỳ thi', href: '/exam-periods', icon: Calendar },
        { name: 'Quản lý Lịch thi', href: '/exam-schedules', icon: Clock },
        { name: 'Quản lý Phòng thi', href: '/exam-rooms', icon: DoorOpen },
        { name: 'Xếp phòng thi', href: '/exam-arrangement', icon: Layers },
        { name: 'Phân công Giám thị', href: '/exam-supervisors', icon: UserCheck },
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
      className={`sidebar-aside fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-800 bg-[#0B1426] text-slate-300 shadow-2xl transition-all duration-300 ${
        collapsed ? 'w-[260px] md:w-[76px]' : 'w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Header Section */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-4 bg-[#080E1C]">
        <div className="flex items-center gap-3">
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

        {/* Toggle Button */}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Thu gọn thanh bên"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar" aria-label="Điều hướng chính">
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.group && !collapsed && (
              <h3 className="px-3 text-[10px] font-black tracking-wider text-slate-500 uppercase">
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
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
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

      {/* Footer User Profile Section */}
      <div className="shrink-0 border-t border-slate-800/80 p-3 bg-[#080E1C]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white font-bold border border-slate-700">
              <UserIcon className="h-4 w-4 text-blue-400" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate text-xs font-black text-white">
                  {user?.username || 'Admin'}
                </span>
                <span className="block truncate text-[10px] font-medium text-slate-400">
                  {role === 'ADMIN' ? 'Quản trị hệ thống' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                </span>
              </div>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-7 w-7 mx-auto items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Mở rộng thanh bên"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
