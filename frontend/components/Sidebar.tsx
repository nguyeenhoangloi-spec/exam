'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  PanelLeft,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Trash2,
  FileCheck,
  Award,
  DatabaseBackup,
  Activity,
  Headphones,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

interface NavSubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavSubItem[];
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const role: Role = user?.role || 'ADMIN';

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    '/trash': true,
  });

  const toggleSubMenu = (parentHref: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [parentHref]: !prev[parentHref] }));
  };

  // 1. ADMIN Navigation Groups
  const adminGroups: NavGroup[] = useMemo(
    () => [
      {
        items: [
          { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        group: 'Tổ chức thi',
        items: [
          { name: 'Kỳ thi', href: '/exam-periods', icon: CalendarDays },
          { name: 'Lịch thi', href: '/exam-schedules', icon: CalendarCheck },
          { name: 'Phòng thi', href: '/exam-rooms', icon: Building2 },
          { name: 'Xếp phòng thi', href: '/exam-arrangement', icon: Users },
          { name: 'Phân công coi thi', href: '/exam-supervisors', icon: ShieldCheck },
        ],
      },
      {
        group: 'Ngân hàng & Đề thi',
        items: [
          { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
          { name: 'Đề thi', href: '/exam-papers', icon: FileText },
        ],
      },
      {
        group: 'Chấm thi & Kết quả',
        items: [
          { name: 'Duyệt bài tự luận', href: '/admin/essay-review', icon: FileCheck },
          { name: 'Xử lý phúc khảo', href: '/admin/grade-appeals', icon: Award },
          { name: 'Báo cáo thống kê', href: '/exam-reports', icon: BarChart3 },
        ],
      },
      {
        group: 'Danh mục',
        items: [
          { name: 'Khoa đào tạo', href: '/departments', icon: School },
          { name: 'Môn học', href: '/subjects', icon: BookOpen },
          { name: 'Lớp sinh viên', href: '/classes', icon: GraduationCap },
          { name: 'Sinh viên', href: '/students', icon: Users },
          { name: 'Giảng viên', href: '/teachers', icon: ShieldCheck },
        ],
      },
      {
        group: 'Hệ thống',
        items: [
          { name: 'Nhật ký hệ thống', href: '/admin/activity-logs', icon: Activity },
          { name: 'Sao lưu dữ liệu', href: '/admin/backups', icon: DatabaseBackup },
          {
            name: 'Thùng rác',
            href: '/trash',
            icon: Trash2,
            children: [
              { name: 'Câu hỏi đã xóa', href: '/trash?type=questions' },
              { name: 'Kỳ thi đã xóa', href: '/trash?type=periods' },
              { name: 'Lịch thi đã xóa', href: '/trash?type=schedules' },
              { name: 'Đề thi đã xóa', href: '/trash?type=papers' },
            ],
          },
        ],
      },
    ],
    []
  );

  // 2. TEACHER Navigation Groups
  const teacherGroups: NavGroup[] = useMemo(
    () => [
      {
        group: 'Công tác coi thi & chấm thi',
        items: [
          { name: 'Lịch coi thi', href: '/teacher/assignments', icon: CalendarCheck },
          { name: 'Chấm thi tự luận', href: '/teacher/essay-grading', icon: FileCheck },
          { name: 'Thẩm định phúc khảo', href: '/teacher/regrade', icon: Award },
        ],
      },
      {
        group: 'Tài liệu chuyên môn',
        items: [
          { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
          { name: 'Kho đề thi', href: '/exam-papers', icon: FileText },
        ],
      },
    ],
    []
  );

  // 3. STUDENT Navigation Groups
  const studentGroups: NavGroup[] = useMemo(
    () => [
      {
        group: 'Khảo thí sinh viên',
        items: [
          { name: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: CalendarDays },
          { name: 'Kết quả bài thi', href: '/student/results', icon: Award },
          { name: 'Chương trình đào tạo', href: '/student/curriculum', icon: BookOpen },
        ],
      },
    ],
    []
  );

  const rawGroups = role === 'ADMIN' ? adminGroups : role === 'TEACHER' ? teacherGroups : studentGroups;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Tổ chức thi': true,
    'Ngân hàng & Đề thi': true,
    'Chấm thi & Kết quả': true,
    'Danh mục': true,
    'Hệ thống': true,
    'Công tác coi thi & chấm thi': true,
    'Tài liệu chuyên môn': true,
    'Khảo thí sinh viên': true,
  });

  const toggleAccordionGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Filter items strictly by canAccessPath
  const filteredGroups = useMemo(
    () =>
      rawGroups
        .map((grp) => ({
          group: grp.group,
          items: grp.items.filter((item) => canAccessPath(role, item.href)),
        }))
        .filter((grp) => grp.items.length > 0),
    [rawGroups, role]
  );

  const isItemActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));
  const isSubItemActive = (href: string) => {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    return query ? new URLSearchParams(query).get('type') === searchParams.get('type') : true;
  };

  return (
    <aside
      className={`sidebar-aside fixed top-0 left-0 z-40 flex flex-col h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-r border-slate-200/40 dark:border-slate-800/60 transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] select-none overflow-hidden will-change-[width,transform] ${
        collapsed ? 'w-[72px]' : 'w-[252px]'
      } ${mobileOpen ? 'translate-x-0 w-[252px]' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* ── 1. Header Section: Brand Logo & Toggle ── */}
      <div className="relative flex h-16 w-full shrink-0 items-center px-4 bg-transparent">
        {/* Fixed Left Logo & Brand Title */}
        <Link
          href="/dashboard"
          onClick={(e) => {
            if (collapsed) {
              e.preventDefault();
              onToggle();
            }
          }}
          className="flex items-center min-w-0 cursor-pointer group outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          title={collapsed ? 'Nhấn để mở rộng thanh bên' : 'Exam System - Hệ thống khảo thí'}
        >
          {/* Logo Box: 40px với Icon 24px sắc nét, cố định vị trí tuyệt đối */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition-transform group-hover:scale-105">
            <GraduationCap className="h-6 w-6" />
          </div>

          {/* Text: Co giãn và mờ dần êm ái, không giật DOM */}
          <div
            className={`min-w-0 ml-3 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[140px] opacity-100 translate-x-0'
            }`}
          >
            <h1 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              Exam System
            </h1>
            <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              Hệ thống khảo thí
            </p>
          </div>
        </Link>

        {/* Nút Toggle thu gọn: Cố định tuyệt đối góc phải, chỉ Fade-in tại chỗ sau 150ms lúc mở */}
        <button
          type="button"
          onClick={onToggle}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-[opacity,transform] active:scale-95 cursor-pointer ${
            collapsed
              ? 'opacity-0 scale-75 pointer-events-none duration-100 delay-0'
              : 'opacity-100 scale-100 duration-200 delay-150'
          }`}
          aria-label="Thu gọn thanh bên"
          title="Thu gọn thanh bên"
          tabIndex={collapsed ? -1 : 0}
        >
          <PanelLeft className="h-5.5 w-5.5" />
        </button>
      </div>

      {/* ── 2. Navigation Groups List ── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3 pb-8 space-y-3.5 no-scrollbar w-full"
        aria-label="Điều hướng chính"
      >
        {filteredGroups.map((group, groupIdx) => {
          const groupName = group.group || `group_${groupIdx}`;
          const isExpanded = expandedGroups[groupName] ?? true;

          return (
            <div key={groupName} className="space-y-1 w-full">
              {/* Accordion Group Header */}
              {group.group && (
                <div
                  className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                    collapsed ? 'max-h-0 opacity-0 my-0 py-0 pointer-events-none' : 'max-h-10 opacity-100 pt-1.5 pb-0.5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordionGroup(groupName)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer select-none whitespace-nowrap"
                  >
                    <span className="truncate">{group.group}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                </div>
              )}

              {/* Group Items — Co giãn trượt mở 60FPS bằng CSS Grid */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isExpanded || collapsed || !group.group
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden space-y-1 w-full">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);
                    const hasChildren = item.children && item.children.length > 0;
                    const isSubOpen = openSubMenus[item.href] ?? true;

                    // Items with Submenu
                    if (hasChildren) {
                      return (
                        <div key={item.href} className="space-y-1 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              if (!collapsed) toggleSubMenu(item.href);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-2 rounded-xl text-sm transition-colors duration-150 cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                            }`}
                            title={collapsed ? item.name : undefined}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                                  isActive
                                    ? 'text-white'
                                    : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                                }`}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <span
                                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                  collapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[150px] opacity-100 translate-x-0'
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                            <div
                              className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden shrink-0 ${
                                collapsed ? 'max-w-0 opacity-0' : 'max-w-6 opacity-100'
                              }`}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isActive ? 'text-white' : 'text-slate-400'
                                } ${isSubOpen ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </button>

                          {/* Submenu Children Links — Co giãn trượt êm 60 FPS */}
                          <div
                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              !collapsed && isSubOpen
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                            }`}
                          >
                            <div className="overflow-hidden pl-9 space-y-1 pt-1">
                              {item.children?.map((sub) => {
                                const isSubActive = isSubItemActive(sub.href);
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      isSubActive
                                        ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    }`}
                                  >
                                    <span className="truncate">{sub.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Normal Navigation Items
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center justify-between px-2 py-2 rounded-xl text-sm transition-colors duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                        }`}
                        title={collapsed ? item.name : undefined}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <span
                            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              collapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[150px] opacity-100 translate-x-0'
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── 3. Chân Sidebar Cố định Liền mạch — Chiều cao 28px thoáng đãng & cân đối ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-7 flex items-center justify-center bg-white dark:bg-slate-900 select-none pb-1 pointer-events-none">
        {/* Dải gradient mờ êm 12px */}
        <div className="pointer-events-none absolute -top-3 left-0 right-0 h-3 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />

        <span
          className={`block text-[12px] font-normal text-slate-400/80 dark:text-slate-500/70 tracking-tight px-2 whitespace-nowrap leading-none transition-opacity duration-300 ${
            collapsed ? 'opacity-0' : 'opacity-100'
          }`}
        >
          © 2026 Exam Management System
        </span>
      </div>
    </aside>
  );
};
