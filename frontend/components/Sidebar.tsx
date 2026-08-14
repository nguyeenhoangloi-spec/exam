'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Headphones,
  Sun,
  Moon,
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

  // State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    '/trash': true,
  });
  const footerRef = useRef<HTMLDivElement>(null);

  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Admin';
  const avatarUrl = user?.avatarUrl || user?.teacher?.avatarUrl || user?.student?.avatarUrl;

  // Detect Theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const toggleSubMenu = (parentHref: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [parentHref]: !prev[parentHref] }));
  };

  useEffect(() => {
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
  const adminGroups: NavGroup[] = useMemo(
    () => [
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
    ],
    []
  );

  const teacherGroups: NavGroup[] = useMemo(
    () => [
      {
        group: 'Tổ chức kỳ thi',
        items: [{ name: 'Lịch coi thi cá nhân', href: '/teacher/assignments', icon: ShieldCheck }],
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
    ],
    []
  );

  const studentGroups: NavGroup[] = useMemo(
    () => [
      {
        group: 'Dành cho sinh viên',
        items: [
          { name: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: BookMarked },
          { name: 'Kết quả thi', href: '/student/results', icon: Award },
          { name: 'Khung đào tạo ngành', href: '/student/curriculum', icon: BookOpen },
        ],
      },
    ],
    []
  );

  const rawGroups = role === 'ADMIN' ? adminGroups : role === 'TEACHER' ? teacherGroups : studentGroups;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
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
      className={`sidebar-aside fixed top-0 left-0 z-40 flex flex-col h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-r border-slate-200/70 dark:border-slate-700/70 transition-all duration-300 ease-in-out select-none overflow-hidden ${collapsed ? 'w-[72px]' : 'w-[252px]'
        } ${mobileOpen ? 'translate-x-0 w-[252px]' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* ── 1. Header Section: Brand Logo & Toggle (w-full bg-transparent, không bao giờ tràn màn phủ trắng) ── */}
      <div className="relative flex h-16 w-full shrink-0 items-center justify-between px-4 bg-transparent">
        {/* Fixed Left Logo & Brand Title */}
        <Link
          href="/dashboard"
          onClick={(e) => {
            if (collapsed) {
              e.preventDefault();
              onToggle();
            }
          }}
          className="flex items-center min-w-0 cursor-pointer group"
          title={collapsed ? 'Nhấn để mở rộng thanh bên' : 'Exam System - Hệ thống khảo thí'}
        >
          {/* Logo Box: 40px với Icon 24px sắc nét, cố định vị trí tuyệt đối */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition-transform group-hover:scale-105">
            <GraduationCap className="h-6 w-6" />
          </div>

          {/* Text: Xuất hiện êm ái sau 150ms khi thanh bên mở rộng */}
          <div
            className={`min-w-0 ml-3 transition-opacity ${collapsed ? 'opacity-0 pointer-events-none hidden duration-100 delay-0' : 'opacity-100 duration-200 delay-150'
              }`}
          >
            <h1 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100 leading-tight tracking-tight whitespace-nowrap">
              Exam System
            </h1>
            <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">
              Hệ thống khảo thí
            </p>
          </div>
        </Link>

        {/* Nút Toggle: Ẩn trong 150ms đầu lúc mở rộng, chỉ hiện mờ dần (Fade-in) tại góc phải khi thanh bên đã mở, không bao giờ bị thấy chạy từ Logo */}
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity active:scale-95 cursor-pointer ${collapsed
            ? 'opacity-0 pointer-events-none duration-100 delay-0'
            : 'opacity-100 duration-200 delay-150'
            }`}
          aria-label="Thu gọn thanh bên"
          title="Thu gọn thanh bên"
          tabIndex={collapsed ? -1 : 0}
        >
          <PanelLeft className="h-5.5 w-5.5" />
        </button>
      </div>

      {/* ── 2. Navigation Groups List ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 no-scrollbar w-full" aria-label="Điều hướng chính">
        {filteredGroups.map((group, groupIdx) => {
          const groupName = group.group || `group_${groupIdx}`;
          const isExpanded = expandedGroups[groupName] ?? true;

          return (
            <div key={groupIdx} className="space-y-1 w-full">
              {group.group && (
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-10 opacity-100 mb-1'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordionGroup(groupName)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer select-none"
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

              {/* Group Items */}
              {(isExpanded || collapsed || !group.group) && (
                <div className="space-y-1 w-full">
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
                            className={`w-full flex items-center justify-between px-2 py-2 rounded-xl text-sm transition-colors duration-150 cursor-pointer ${isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Icon luôn đứng yên 100% tại tọa độ 36px, không bao giờ di chuyển */}
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${isActive
                                  ? 'text-white'
                                  : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                                  }`}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              {!collapsed && <span className="truncate">{item.name}</span>}
                            </div>
                            {!collapsed && (
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'
                                  } ${isSubOpen ? 'rotate-180' : ''}`}
                              />
                            )}
                          </button>

                          {/* Expanded Sub items với transition mượt mà */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubOpen && !collapsed
                              ? 'max-h-96 opacity-100 pt-0.5'
                              : 'max-h-0 opacity-0 pointer-events-none'
                              }`}
                          >
                            <div className="pl-11 pr-2 space-y-1">
                              {item.children?.map((sub) => {
                                const isSubActive = isSubItemActive(sub.href);
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={onMobileClose}
                                    className={`block rounded-lg px-2.5 py-1.5 text-[13px] transition-all ${isSubActive
                                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-normal'
                                      }`}
                                  >
                                    {sub.name}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Standard Menu Item
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        title={collapsed ? item.name : undefined}
                        className={`group w-full flex items-center px-2 py-2 rounded-xl text-sm transition-colors duration-150 ${isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Icon luôn đứng yên 100% tại tọa độ 36px, không bao giờ di chuyển */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${isActive
                              ? 'text-white'
                              : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                              }`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          {!collapsed && <span className="truncate">{item.name}</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── 3. Khối Profile & Trạng Thái Hệ Thống Tinh Tế ở Bottom ── */}
      <div ref={footerRef} className="relative border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shrink-0 w-full">
        <button
          type="button"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`group flex w-full items-center gap-3 px-2 py-2 rounded-xl transition-colors text-left cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 ${showUserMenu ? 'bg-slate-100 dark:bg-slate-800' : ''
            }`}
        >
          {/* Avatar — luôn cố định tuyệt đối tại cùng trục tâm */}
          <div className="relative shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <DynamicImage
                src={avatarUrl}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 font-semibold text-white text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Text — ẩn khi thu gọn */}
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-tight whitespace-nowrap">
                {displayName}
              </p>
              <p className="truncate text-[12px] font-normal text-primary-600 dark:text-blue-400 leading-tight whitespace-nowrap">
                {role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
              </p>
            </div>
          )}

          {!collapsed && (
            <ChevronRight
              className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${showUserMenu ? 'rotate-90 text-blue-600' : ''
                }`}
            />
          )}
        </button>

        {/* User Popover Menu */}
        {showUserMenu && (
          <div
            className={`absolute bottom-full mb-2 w-56 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl ${collapsed ? 'left-14' : 'left-2'
              }`}
          >
            {/* Header profile info */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-1 border border-slate-100 dark:border-slate-700/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-medium text-xs shadow-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-100">{displayName}</p>
                <p className="truncate text-[12px] text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đang trực tuyến
                </p>
              </div>
            </div>

            {/* Menu Actions */}
            <div className="space-y-0.5">
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 font-normal hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <UserIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                <span className="text-[13px] font-normal">Hồ sơ cá nhân</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 font-normal hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <Settings className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                <span className="text-[13px] font-normal">Cài đặt hệ thống</span>
              </Link>

              <Link
                href="/contact"
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 font-normal hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                <Headphones className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                <span className="text-[13px] font-normal">Trung tâm hỗ trợ</span>
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 font-normal hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                )}
                <span className="text-[13px] font-normal">Chủ đề giao diện</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] text-rose-600 font-normal hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-600" />
                <span className="text-[13px] font-normal">Đăng xuất</span>
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
