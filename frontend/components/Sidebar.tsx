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
  type LucideIcon,
} from 'lucide-react';
import { Role, User } from '../types';
import { canAccessPath } from '../lib/access';
import { removeAuth } from '../lib/auth';
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
  const router = useRouter();
  const role: Role = user?.role || 'ADMIN';

  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [openSubMenus, setOpenSubMenus] = React.useState<Record<string, boolean>>({
    '/trash': true, // Mặc định cho phép mục thùng rác mở ra khi truy cập
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
    removeAuth();
    router.replace('/login');
  };

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
        { name: 'Chấm bài Tự luận', href: '/teacher/essay-grading', icon: FileCheck },
        { name: 'Duyệt bài Tự luận', href: '/admin/essay-review', icon: ShieldCheck },
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
      group: 'NGHIỆP VỤ GIẢNG VIÊN',
      items: [
        { name: 'Lịch coi thi cá nhân', href: '/teacher/assignments', icon: ShieldCheck },
        { name: 'Chấm bài Tự luận', href: '/teacher/essay-grading', icon: FileCheck },
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

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'QUẢN LÝ KHẢO THÍ': true,
    'NGÂN HÀNG & ĐỀ THI': true,
    'DANH MỤC HỆ THỐNG': true,
    'NGHIỆP VỤ GIẢNG VIÊN': true,
    'DÀNH CHO SINH VIÊN': true,
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

  return (
    <aside
      className={`sidebar-aside fixed top-0 left-0 z-40 flex flex-col h-screen bg-[#0f1b33] text-slate-100 border-r border-slate-800 shadow-2xl transition-all duration-200 ease-in-out ${
        collapsed ? 'w-[76px]' : 'w-64'
      } ${
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Header Section with Toggle Button */}
      {collapsed ? (
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-800 px-3 bg-slate-900/40">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 transition active:scale-95 cursor-pointer border border-white/15 shadow-xs"
            aria-label="Mở thanh bên"
            title="Mở thanh bên"
          >
            <PanelLeftOpen className="h-5 w-5 text-sky-200" />
          </button>
        </div>
      ) : (
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4 bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="truncate text-xs font-black tracking-wider text-white uppercase leading-tight">
                EXAM SYSTEM
              </h1>
              <h2 className="truncate text-[10px] font-extrabold tracking-tight text-sky-300 uppercase leading-tight mt-0.5">
                HỆ THỐNG QUẢN LÝ THI
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition active:scale-95 cursor-pointer border border-white/15"
            aria-label="Thu gọn thanh bên"
            title="Thu gọn thanh bên"
          >
            <PanelLeft className="h-4 w-4 text-slate-200" />
          </button>
        </div>
      )}

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3 no-scrollbar" aria-label="Điều hướng chính">
        {filteredGroups.map((group, groupIdx) => {
          const groupName = group.group || `group_${groupIdx}`;
          const isExpanded = expandedGroups[groupName] ?? true;

          return (
            <div key={groupIdx} className="space-y-1">
              {group.group && (
                <button
                  type="button"
                  onClick={() => toggleAccordionGroup(groupName)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[10.5px] font-extrabold tracking-wider text-slate-400 uppercase hover:text-slate-200 transition cursor-pointer select-none ${
                    collapsed ? 'h-0 opacity-0 overflow-hidden hidden' : 'h-auto opacity-100'
                  }`}
                >
                  <span className="truncate">{group.group}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                </button>
              )}

              {/* Group Items */}
              {(isExpanded || collapsed || !group.group) && (
                <div className={`space-y-1 ${group.group && !collapsed ? 'pl-1.5' : ''}`}>
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
                            className={`group relative flex w-full h-10 items-center justify-between rounded-xl px-3 text-xs font-bold transition-all duration-200 overflow-hidden cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md font-black border border-blue-500'
                                : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-sky-300/90 group-hover:text-white'}`} />
                              <span className={`whitespace-nowrap transition-all duration-200 truncate ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                                {item.name}
                              </span>
                            </div>

                            {!collapsed && (
                              isSubOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )
                            )}
                          </button>

                          {/* Sub Items */}
                          {isSubOpen && !collapsed && (
                            <div className="pl-7 space-y-1 border-l border-slate-700/60 ml-4 py-1">
                              {item.children?.map((sub) => {
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={onMobileClose}
                                    className="block py-1.5 px-3 rounded-lg text-[11.5px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
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
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(item.href)}
                        onClick={onMobileClose}
                        title={collapsed ? item.name : undefined}
                        className={`group relative flex h-10 items-center justify-start rounded-[10px] px-3 text-xs font-bold transition-all duration-150 overflow-hidden ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md font-black border border-blue-500'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />

                        <span
                          className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${
                            collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 ml-3'
                          }`}
                        >
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

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

      {/* Footer User Profile Section matching User Screenshots */}
      <div ref={footerRef} className="relative shrink-0 border-t border-blue-900/40 p-3 bg-black/20">
        <button
          type="button"
          onClick={() => setShowUserMenu((prev) => !prev)}
          aria-expanded={showUserMenu}
          className={`w-full flex items-center justify-between gap-2.5 rounded-2xl bg-white/5 hover:bg-white/10 p-2.5 border border-white/10 shadow-md backdrop-blur-md transition cursor-pointer text-left ${
            collapsed ? 'justify-center p-2' : ''
          }`}
          title={collapsed ? displayName : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Circle Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm border border-sky-400/40"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-sm shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate text-xs font-black text-white leading-tight">
                  {displayName}
                </span>
                <span className="block truncate text-[11px] font-semibold text-sky-200 leading-tight mt-0.5">
                  {role === 'ADMIN' ? 'Quản trị hệ thống' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-sky-200 transition-transform duration-200 ${
                showUserMenu ? 'rotate-180 text-white' : ''
              }`}
            />
          )}
        </button>

        {/* Popover User Menu Card (Positioned ABOVE trigger matching Screenshot 3 or SIDEWAYS when collapsed) */}
        {showUserMenu && (
          <div
            className={`absolute ${
              collapsed
                ? 'left-[calc(100%+12px)] bottom-1 w-64'
                : 'bottom-[calc(100%+10px)] left-3 right-3 w-auto'
            } rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xl z-[9999] text-xs animate-in fade-in zoom-in-95 duration-150`}
          >
            {/* Little pointer triangle arrow pointing to trigger card */}
            <div
              className={`absolute ${
                collapsed
                  ? '-left-1.5 bottom-4 h-3 w-3 rotate-45 border-l border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                  : '-bottom-1.5 left-8 h-3 w-3 rotate-45 border-r border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            />

            {/* Top User Info Header Item */}
            <div
              onClick={() => {
                router.push('/profile');
                setShowUserMenu(false);
              }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-9 w-9 shrink-0 rounded-full object-cover shadow-xs border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white font-black text-xs shadow-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate group-hover:text-blue-600 transition">
                    {displayName}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition shrink-0" />
            </div>

            {/* Divider */}
            <div className="my-1.5 border-b border-slate-100 dark:border-slate-800" />

            {/* Menu Items */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  router.push('/profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition" />
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Hồ sơ cá nhân</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/settings');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition" />
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Cài đặt tài khoản</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/change-password');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition" />
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Đổi mật khẩu</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
              </button>
            </div>

            {/* Divider */}
            <div className="my-1.5 border-b border-slate-100 dark:border-slate-800" />

            {/* Logout Item in Red */}
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-xs text-rose-600">Đăng xuất</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
