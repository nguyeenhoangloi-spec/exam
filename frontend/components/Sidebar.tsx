'use client';

import React from 'react';
import Link from 'next/link';
import { DynamicImage } from './ui/DynamicImage';
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
  PanelLeftOpen,
  ChevronLeft,
  User as UserIcon,
  BookMarked,
  Settings,
  Lock,
  ChevronDown,
  ChevronRight,
  LogOut,
  Trash2,
  FileCheck,
  Award,
  DatabaseBackup,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Role, User } from '../types';
import { canAccessPath } from '../lib/access';
import { removeAuth } from '../lib/auth';
import api from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

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

  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [openSubMenus, setOpenSubMenus] = React.useState<Record<string, boolean>>({
    '/trash': true,
  });
  const footerRef = React.useRef<HTMLDivElement>(null);

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const avatarUrl = user?.avatarUrl || user?.teacher?.avatarUrl || user?.student?.avatarUrl;

  const toggleSubMenu = (parentHref: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [parentHref]: !prev[parentHref] }));
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    void api.post('/auth/logout').finally(() => {
      removeAuth();
      router.replace('/login');
    });
  };

  // Master Navigation Items
  const adminGroups: NavGroup[] = [
    {
      items: [{ name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      group: 'Tổ chức kỳ thi',
      items: [
        { name: 'Quản lý kỳ thi', href: '/exam-periods', icon: CalendarDays },
        { name: 'Quản lý lịch thi', href: '/exam-schedules', icon: CalendarCheck },
        { name: 'Quản lý phòng thi', href: '/exam-rooms', icon: Building2 },
        { name: 'Xếp phòng thi', href: '/exam-arrangement', icon: Users },
        { name: 'Phân công giám thị', href: '/exam-supervisors', icon: ShieldCheck },
      ],
    },
    {
      group: 'Ngân hàng & đề thi',
      items: [
        { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
        { name: 'Quản lý đề thi', href: '/exam-papers', icon: FileText },
      ],
    },
    {
      group: 'Chấm thi & kết quả',
      items: [
        { name: 'Chấm bài tự luận', href: '/teacher/essay-grading', icon: FileCheck },
        { name: 'Duyệt bài tự luận', href: '/admin/essay-review', icon: ShieldCheck },
        { name: 'Báo cáo điểm thi', href: '/exam-reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Danh mục',
      items: [
        { name: 'Quản lý khoa', href: '/departments', icon: Building2 },
        { name: 'Quản lý lớp học', href: '/classes', icon: School },
        { name: 'Quản lý môn học', href: '/subjects', icon: BookOpen },
        { name: 'Quản lý giảng viên', href: '/teachers', icon: GraduationCap },
        { name: 'Quản lý sinh viên', href: '/students', icon: Users },
      ],
    },
    {
      group: 'Hệ thống',
      items: [
        { name: 'Nhật ký hoạt động', href: '/admin/activity-logs', icon: Activity },
        { name: 'Sao lưu & Khôi phục', href: '/admin/backups', icon: DatabaseBackup },
        {
          name: 'Thùng rác hệ thống',
          href: '/trash',
          icon: Trash2,
          children: [
            { name: 'Lịch thi đã xóa', href: '/trash?type=schedules' },
            { name: 'Đề thi đã xóa', href: '/trash?type=papers' },
            { name: 'Ngân hàng câu hỏi', href: '/trash?type=questions' },
            { name: 'Người dùng & Sinh viên', href: '/trash?type=users' },
            { name: 'Môn học & Lớp học', href: '/trash?type=subjects' },
          ],
        },
      ],
    },
  ];

  const teacherGroups: NavGroup[] = [
    {
      group: 'Tổ chức kỳ thi',
      items: [
        { name: 'Lịch coi thi cá nhân', href: '/teacher/assignments', icon: ShieldCheck },
      ],
    },
    {
      group: 'Ngân hàng & đề thi',
      items: [
        { name: 'Ngân hàng câu hỏi', href: '/question-bank', icon: HelpCircle },
        { name: 'Quản lý đề thi', href: '/exam-papers', icon: FileText },
      ],
    },
    {
      group: 'Chấm thi & kết quả',
      items: [
        { name: 'Chấm bài Tự luận', href: '/teacher/essay-grading', icon: FileCheck },
        { name: 'Xử lý Phúc khảo', href: '/teacher/regrade', icon: FileCheck },
        { name: 'Báo cáo Điểm thi', href: '/exam-reports', icon: BarChart3 },
      ],
    },
  ];

  const studentGroups: NavGroup[] = [
    {
      group: 'Dành cho sinh viên',
      items: [
        { name: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: BookMarked },
        { name: 'Kết quả thi', href: '/student/results', icon: Award },
        { name: 'Khung đào tạo ngành', href: '/student/curriculum', icon: BookOpen },
      ],
    },
  ];

  const rawGroups = role === 'ADMIN' ? adminGroups : role === 'TEACHER' ? teacherGroups : studentGroups;

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'Tổ chức kỳ thi': true,
    'Ngân hàng & đề thi': true,
    'Chấm thi & kết quả': true,
    'Danh mục': true,
    'Hệ thống': true,
    'Dành cho sinh viên': true,
  });

  const toggleAccordionGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Filter items strictly by canAccessPath
  const filteredGroups = rawGroups
    .map((grp) => ({
      group: grp.group,
      items: grp.items.filter((item) => canAccessPath(role, item.href)),
    }))
    .filter((grp) => grp.items.length > 0);

  const isItemActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));
  const isSubItemActive = (href: string) => {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    return query ? new URLSearchParams(query).get('type') === searchParams.get('type') : true;
  };

  return (
    <aside
      className={`sidebar-aside fixed top-0 left-0 z-40 flex flex-col h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[252px]'
        } ${mobileOpen ? 'translate-x-0 w-[252px]' : '-translate-x-full md:translate-x-0'
        }`}
    >
      {/* Header Section with Toggle Button */}
      {collapsed ? (
        <div className="relative flex h-[68px] shrink-0 items-center justify-center border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onToggle}
            className="absolute left-1/2 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
            aria-label="Mở thanh bên"
            title="Mở thanh bên"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-1.5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="truncate text-[18px] leading-[26px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                EXAM SYSTEM
              </h1>
              <h2 className="truncate text-[12px] leading-[16px] font-medium tracking-[-0.015em] text-slate-500 dark:text-slate-400 mt-0.5">
                HỆ THỐNG QUẢN LÝ THI
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
            aria-label="Thu gọn thanh bên"
            title="Thu gọn thanh bên"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar" aria-label="Điều hướng chính">
        {filteredGroups.map((group, groupIdx) => {
          const groupName = group.group || `group_${groupIdx}`;
          const isExpanded = expandedGroups[groupName] ?? true;

          return (
            <div key={groupIdx} className="space-y-1">
              {group.group && (
                <button
                  type="button"
                  onClick={() => toggleAccordionGroup(groupName)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] font-semibold tracking-[0.03em] text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white transition cursor-pointer select-none ${collapsed ? 'h-0 opacity-0 overflow-hidden hidden' : 'h-auto opacity-100'
                    }`}
                >
                  <span className="truncate">{group.group}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
                  )}
                </button>
              )}

              {/* Group Items */}
              {(isExpanded || collapsed || !group.group) && (
                <div className="space-y-1 pl-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);
                    const hasChildren = item.children && item.children.length > 0;
                    const isSubOpen = openSubMenus[item.href] ?? true;

                    if (hasChildren) {
                      return (
                        <div key={item.href} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleSubMenu(item.href)}
                            className={`relative w-full flex items-center ${collapsed ? 'justify-start gap-0 pl-4 pr-0' : 'gap-3 pl-4 pr-3'} py-2.5 rounded-xl text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors`}
                          >
                            <Icon className="absolute left-1.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600 dark:text-slate-300" />
                            <span className={`ml-8 truncate flex-1 overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>{item.name}</span>
                            <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-300 transition-all duration-200 shrink-0 ${collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100'} ${isSubOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Sub items */}
                          {isSubOpen && !collapsed && (
                            <div className="pl-9 space-y-1">
                              {item.children?.map((sub) => {
                                const isSubActive = isSubItemActive(sub.href);
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={`block rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all ${isSubActive
                                      ? 'bg-primary-600 text-white shadow-md shadow-blue-500/20'
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                                      }`}
                                  >
                                    {sub.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        title={collapsed ? item.name : undefined}
                        className={`relative flex items-center ${collapsed ? 'justify-start gap-0 pl-4 pr-0' : 'gap-3 pl-4 pr-3'} py-2.5 rounded-xl text-[14px] font-semibold transition-colors group ${isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-semibold'
                          }`}
                      >
                        <Icon className={`absolute left-1.5 top-1/2 h-5 w-5 -translate-y-1/2 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
                        <span className={`ml-8 truncate overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile Card */}
      <div ref={footerRef} className="relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        <button
          type="button"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`group flex w-full items-center gap-3 px-2 py-2 rounded-xl transition-colors text-left cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 ${showUserMenu ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
        >
          {/* Avatar — luôn cố định, không dịch chuyển */}
          {avatarUrl ? (
            <DynamicImage src={avatarUrl} alt={displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-[15px]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Text — ẩn bằng overflow-hidden, không xóa khỏi DOM */}
          <div className={`min-w-0 flex-1 overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
            <p className="truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100 leading-snug whitespace-nowrap">{displayName}</p>
            <p className="truncate text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-snug whitespace-nowrap">
              {role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
            </p>
          </div>

          <ChevronRight className={`h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0 transition-all duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`} />
        </button>


        {/* Sidebar Popover Menu */}
        {showUserMenu && (
          <div
            className={`absolute bottom-full mb-2 w-56 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 ${collapsed ? 'left-14' : 'left-3'
              }`}
          >
            {/* Isometric tip */}
            <div className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-r border-b border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 z-10" />

            <div className="relative z-20 space-y-0.5">
              {/* Header profile info item */}
              <div className="flex items-center justify-between rounded-xl p-2 bg-slate-50/70 dark:bg-slate-800/50 mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold text-xs shadow-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                    <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                      {role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
              </div>

              {/* Items */}
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition" />
                <span>Hồ sơ cá nhân</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition" />
                <span>Cài đặt tài khoản</span>
              </Link>

              <Link
                href="/change-password"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <Lock className="h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition" />
                <span>Đổi mật khẩu</span>
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-rose-600 font-semibold hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Đăng xuất</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirm Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Đăng xuất khỏi hệ thống"
        message="Bạn có chắc chắn muốn đăng xuất phiên làm việc hiện tại không?"
        confirmText="Đăng xuất ngay"
        cancelText="Hủy"
        type="danger"
      />
    </aside>
  );
};
