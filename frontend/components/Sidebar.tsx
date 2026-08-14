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
  Search,
  Command,
  Headphones,
  Sun,
  Moon,
  X,
  Sparkles,
  ArrowRight,
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredFlyoutItem, setHoveredFlyoutItem] = useState<NavItem | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number } | null>(null);
  const [isDark, setIsDark] = useState(false);

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    '/trash': true,
  });
  const footerRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcut for Command Palette: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setHoveredFlyoutItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when command palette opens
  useEffect(() => {
    if (showCommandPalette) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchFilter('');
    }
  }, [showCommandPalette]);

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

  // Flatten all items for Command Palette search
  const allNavItems = useMemo(() => {
    const list: Array<{ name: string; href: string; group?: string; icon: LucideIcon }> = [];
    filteredGroups.forEach((grp) => {
      grp.items.forEach((item) => {
        list.push({ name: item.name, href: item.href, group: grp.group, icon: item.icon });
        if (item.children) {
          item.children.forEach((child) => {
            list.push({ name: `${item.name} ➔ ${child.name}`, href: child.href, group: grp.group, icon: item.icon });
          });
        }
      });
    });
    return list;
  }, [filteredGroups]);

  const searchResults = useMemo(() => {
    if (!searchFilter.trim()) return allNavItems.slice(0, 8);
    const q = searchFilter.toLowerCase().trim();
    return allNavItems.filter((i) => i.name.toLowerCase().includes(q) || (i.group && i.group.toLowerCase().includes(q)));
  }, [allNavItems, searchFilter]);

  const isItemActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));
  const isSubItemActive = (href: string) => {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    return query ? new URLSearchParams(query).get('type') === searchParams.get('type') : true;
  };

  return (
    <>
      <aside
        className={`sidebar-aside fixed top-0 left-0 z-40 flex flex-col h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-300 ease-in-out select-none ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* ── 1. Header Section: Brand Logo & Toggle ── */}
        {collapsed ? (
          <div className="relative flex h-[68px] shrink-0 items-center justify-center border-b border-slate-100 dark:border-slate-800/80 px-3 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
              aria-label="Mở rộng thanh bên"
              title="Mở rộng thanh bên"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 bg-white dark:bg-slate-900">
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0 group cursor-pointer">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-50 dark:ring-blue-950 transition-transform group-hover:scale-105">
                <GraduationCap className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 className="truncate text-[17px] font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                  EXAMSYS
                </h1>
                <p className="truncate text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mt-1">
                  HỆ THỐNG KHẢO THÍ
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 cursor-pointer"
              aria-label="Thu gọn thanh bên"
              title="Thu gọn thanh bên"
            >
              <PanelLeft className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        {/* ── 2. Quick Search & Command Palette Bar (Feature 1) ── */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              className="flex h-10 w-full items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer shadow-2xs"
              title="Tìm kiếm nhanh (Ctrl+K)"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              className="group flex w-full h-10 items-center justify-between px-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:bg-blue-50/50 hover:border-blue-200 dark:hover:border-blue-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 text-xs font-medium truncate">
                <Search className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="truncate">Tìm nhanh tính năng...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 shadow-2xs">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          )}
        </div>

        {/* ── 3. Navigation Groups List ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar" aria-label="Điều hướng chính">
          {filteredGroups.map((group, groupIdx) => {
            const groupName = group.group || `group_${groupIdx}`;
            const isExpanded = expandedGroups[groupName] ?? true;

            return (
              <div key={groupIdx} className="space-y-1">
                {group.group && !collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleAccordionGroup(groupName)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer select-none"
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
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(item.href);
                      const hasChildren = item.children && item.children.length > 0;
                      const isSubOpen = openSubMenus[item.href] ?? true;

                      // Items with Submenu
                      if (hasChildren) {
                        return (
                          <div
                            key={item.href}
                            className="relative space-y-1"
                            onMouseEnter={(e) => {
                              if (collapsed) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setFlyoutPosition({ top: rect.top });
                                setHoveredFlyoutItem(item);
                              }
                            }}
                            onMouseLeave={() => {
                              if (collapsed) setHoveredFlyoutItem(null);
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (!collapsed) toggleSubMenu(item.href);
                              }}
                              className={`w-full flex items-center ${
                                collapsed ? 'justify-center px-0' : 'justify-between px-3'
                              } py-2.5 rounded-2xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                    isActive
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                                  }`}
                                >
                                  <Icon className="h-4.5 w-4.5" />
                                </div>
                                {!collapsed && <span className="truncate">{item.name}</span>}
                              </div>
                              {!collapsed && (
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                                    isSubOpen ? 'rotate-180 text-blue-600' : ''
                                  }`}
                                />
                              )}
                            </button>

                            {/* Expanded Sub items */}
                            {isSubOpen && !collapsed && (
                              <div className="pl-11 pr-2 space-y-1 pt-0.5">
                                {item.children?.map((sub) => {
                                  const isSubActive = isSubItemActive(sub.href);
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      onClick={onMobileClose}
                                      className={`block rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-all ${
                                        isSubActive
                                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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

                      // Standard Menu Item
                      return (
                        <div
                          key={item.href}
                          className="relative"
                          onMouseEnter={(e) => {
                            if (collapsed) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setFlyoutPosition({ top: rect.top });
                              setHoveredFlyoutItem(item);
                            }
                          }}
                          onMouseLeave={() => {
                            if (collapsed) setHoveredFlyoutItem(null);
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={onMobileClose}
                            className={`group flex items-center ${
                              collapsed ? 'justify-center px-0' : 'px-3'
                            } py-2.5 rounded-2xl text-[13.5px] font-semibold transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              {!collapsed && <span className="truncate">{item.name}</span>}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── 4. Floating Flyout Menu on Collapsed Mode (Feature 4) ── */}
        {collapsed && hoveredFlyoutItem && flyoutPosition && (
          <div
            ref={flyoutRef}
            style={{ top: Math.max(10, Math.min(flyoutPosition.top, window.innerHeight - 220)) }}
            className="fixed left-[76px] z-50 w-60 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={() => setHoveredFlyoutItem(hoveredFlyoutItem)}
            onMouseLeave={() => setHoveredFlyoutItem(null)}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
              <span>{hoveredFlyoutItem.name}</span>
            </div>
            {hoveredFlyoutItem.children && hoveredFlyoutItem.children.length > 0 ? (
              <div className="pt-1.5 space-y-0.5">
                {hoveredFlyoutItem.children.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => {
                      setHoveredFlyoutItem(null);
                      if (onMobileClose) onMobileClose();
                    }}
                    className={`block rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isSubItemActive(sub.href)
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="pt-1">
                <Link
                  href={hoveredFlyoutItem.href}
                  onClick={() => {
                    setHoveredFlyoutItem(null);
                    if (onMobileClose) onMobileClose();
                  }}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                >
                  <span>Truy cập trang này</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── 5. User Profile Card & Quick Actions (Feature 5) ── */}
        <div ref={footerRef} className="relative border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`group flex w-full items-center gap-3 p-1.5 rounded-2xl transition-all text-left cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 ${
              showUserMenu ? 'bg-slate-100 dark:bg-slate-800' : ''
            }`}
          >
            {/* Avatar with Active Green Pulse Dot */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <DynamicImage src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-2xl object-cover ring-2 ring-blue-500/20" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online Indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </div>

            {/* Name and Role Info */}
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-[13.5px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10.5px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/60">
                    {role === 'ADMIN' ? 'Quản trị viên' : role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                  </span>
                </div>
              </div>
            )}

            {!collapsed && (
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  showUserMenu ? 'rotate-90 text-blue-600' : ''
                }`}
              />
            )}
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div
              className={`absolute bottom-full mb-2 w-64 rounded-3xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 shadow-2xl shadow-slate-300/40 dark:shadow-black/70 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl ${
                collapsed ? 'left-14' : 'left-3'
              }`}
            >
              {/* Header profile info */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 mb-1.5 border border-slate-100 dark:border-slate-700/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="truncate text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Đang hoạt động
                  </p>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
                >
                  <UserIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                  <span>Hồ sơ cá nhân</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
                >
                  <Settings className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                  <span>Cài đặt hệ thống</span>
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
                >
                  <Headphones className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
                  <span>Trung tâm hỗ trợ</span>
                </Link>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
                    <span>Chủ đề giao diện</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                    {isDark ? 'Tối' : 'Sáng'}
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 font-semibold hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Đăng xuất tài khoản</span>
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

      {/* ── 6. Command Palette Modal (Ctrl+K / Cmd+K Search) ── */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <Search className="h-5 w-5 text-blue-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Nhập tên tính năng, lịch thi, môn học..."
                className="w-full text-[15px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCommandPalette(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {searchFilter ? 'Kết quả tìm kiếm' : 'Tính năng đề xuất'}
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((res) => {
                  const ResIcon = res.icon;
                  return (
                    <button
                      key={res.href}
                      type="button"
                      onClick={() => {
                        setShowCommandPalette(false);
                        router.push(res.href);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 transition cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ResIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                            {res.name}
                          </p>
                          {res.group && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{res.group}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  Không tìm thấy tính năng nào phù hợp với "{searchFilter}".
                </div>
              )}
            </div>

            {/* Footer Shortcut Guide */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Điều hướng nhanh trong hệ thống</span>
              <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px] font-bold">ESC để đóng</kbd>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
