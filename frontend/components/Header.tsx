'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpenText,
  Building2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { Role, User } from '../types';
import { canAccessPath, workspaceRoutes } from '../lib/access';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
  user: User | null;
  title?: string;
  collapsed: boolean;
  onMenuClick?: () => void;
}

interface NavigationCommand {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  keywords?: string;
}

type OpenPanel = 'quick-actions' | 'notifications' | 'account' | null;

const navigationCommands: NavigationCommand[] = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN'], keywords: 'tổng quan thống kê' },
  { label: 'Quản lý Khoa', href: '/departments', icon: Building2, roles: ['ADMIN'], keywords: 'khoa phòng ban' },
  { label: 'Quản lý Lớp học', href: '/classes', icon: GraduationCap, roles: ['ADMIN'], keywords: 'lớp sinh viên' },
  { label: 'Quản lý Sinh viên', href: '/students', icon: UsersRound, roles: ['ADMIN'], keywords: 'học viên' },
  { label: 'Quản lý Giảng viên', href: '/teachers', icon: UserRound, roles: ['ADMIN'], keywords: 'giáo viên' },
  { label: 'Quản lý Môn học', href: '/subjects', icon: BookOpenText, roles: ['ADMIN'], keywords: 'môn chương' },
  { label: 'Quản lý Phòng thi', href: '/exam-rooms', icon: Building2, roles: ['ADMIN'], keywords: 'phòng địa điểm' },
  { label: 'Quản lý Kỳ thi', href: '/exam-periods', icon: CalendarDays, roles: ['ADMIN'], keywords: 'học kỳ đợt thi' },
  { label: 'Quản lý Lịch thi', href: '/exam-schedules', icon: CalendarDays, roles: ['ADMIN'], keywords: 'lịch môn thi' },
  { label: 'Xếp phòng thi', href: '/exam-arrangement', icon: ClipboardList, roles: ['ADMIN'], keywords: 'xếp phòng sinh viên' },
  { label: 'Phân công Giám thị', href: '/exam-supervisors', icon: ShieldCheck, roles: ['ADMIN'], keywords: 'giám thị coi thi' },
  { label: 'Ngân hàng câu hỏi', href: '/question-bank', icon: BookOpenText, roles: ['ADMIN', 'TEACHER'], keywords: 'câu hỏi duyệt import ai' },
  { label: 'Tạo đề thi', href: '/exam-papers', icon: FilePlus2, roles: ['ADMIN', 'TEACHER'], keywords: 'đề ngẫu nhiên' },
  { label: 'Báo cáo tổng quan', href: '/reports', icon: ClipboardList, roles: ['ADMIN'], keywords: 'báo cáo thống kê' },
  { label: 'Lịch phân công', href: '/teacher/assignments', icon: CalendarDays, roles: ['TEACHER'], keywords: 'giảng viên coi thi' },
  { label: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: CalendarDays, roles: ['STUDENT'], keywords: 'sinh viên lịch cá nhân' },
];

const roleLabels: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

export const Header: React.FC<HeaderProps> = ({
  user,
  title = 'Hệ thống Quản lý Khảo thí',
  collapsed,
  onMenuClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const role = user?.role;
  const displayName = user?.teacher?.fullName || user?.student?.fullName || user?.username || 'Tài khoản';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const availableCommands = useMemo(
    () => (role ? navigationCommands.filter((command) => command.roles.includes(role) && canAccessPath(role, command.href)) : []),
    [role],
  );

  const filteredCommands = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    if (!normalizedSearch) return availableCommands.slice(0, 6);

    return availableCommands
      .filter((command) =>
        `${command.label} ${command.keywords || ''}`.toLocaleLowerCase('vi').includes(normalizedSearch),
      )
      .slice(0, 6);
  }, [availableCommands, search]);

  const quickActions = useMemo(() => {
    if (role === 'ADMIN') {
      return [
        { label: 'Tạo kỳ thi', href: '/exam-periods?action=create', icon: CalendarPlus },
        { label: 'Tạo lịch thi', href: '/exam-schedules?action=create', icon: CalendarDays },
        { label: 'Tạo câu hỏi', href: '/question-bank?action=create', icon: BookOpenText },
        { label: 'Tạo đề thi', href: '/exam-papers', icon: FilePlus2 },
      ];
    }

    if (role === 'TEACHER') {
      return [
        { label: 'Tạo câu hỏi', href: '/question-bank?action=create', icon: BookOpenText },
        { label: 'Tạo đề thi', href: '/exam-papers', icon: FilePlus2 },
      ];
    }

    return [];
  }, [role]);

  useEffect(() => {
    setOpenPanel(null);
    setSearchOpen(false);
    setSearch('');
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpenPanel(null);
        setSearchOpen(true);
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === 'Escape') {
        setOpenPanel(null);
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateTo = (href: string) => {
    setOpenPanel(null);
    setSearchOpen(false);
    setSearch('');
    router.push(href);
  };

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    setSearchOpen(false);
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const handleLogout = () => {
    removeAuth();
    router.replace('/login');
    router.refresh();
  };

  return (
    <header
      className={`fixed right-0 top-0 z-40 h-[72px] border-b border-slate-200/90 bg-white/95 shadow-[0_1px_3px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 ${
        collapsed ? 'left-0 md:left-[76px]' : 'left-0 md:left-[260px]'
      }`}
    >
      <div ref={containerRef} className="mx-auto flex h-full w-full items-center gap-3 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-[360px]">
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="hidden truncate text-xs font-medium text-slate-500 sm:block">
              Trang chủ / {title}
            </p>
          </div>
        </div>

        <div className="relative hidden min-w-0 flex-1 justify-center lg:flex">
          <div
            className={`relative w-full max-w-[480px] rounded-xl border bg-slate-50/80 transition ${
              searchOpen ? 'border-sky-500 bg-white ring-4 ring-sky-100/60' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
                setOpenPanel(null);
              }}
              onFocus={() => {
                setSearchOpen(true);
                setOpenPanel(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filteredCommands[0]) {
                  navigateTo(filteredCommands[0].href);
                }
              }}
              aria-label="Tìm kiếm sinh viên, kỳ thi, phòng thi..."
              placeholder="Tìm kiếm sinh viên, kỳ thi, phòng thi..."
              className="h-10 w-full rounded-xl bg-transparent pl-10 pr-16 text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
            />
            {search ? (
              <button
                type="button"
                aria-label="Xóa nội dung tìm kiếm"
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                Ctrl K
              </kbd>
            )}

            {searchOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <p className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {search.trim() ? 'Kết quả phù hợp' : 'Truy cập nhanh'}
                </p>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.href}
                        type="button"
                        onClick={() => navigateTo(command.href)}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{command.label}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-5 text-center text-sm text-slate-500">Không tìm thấy chức năng phù hợp.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {quickActions.length > 0 && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                aria-label="Mở tác vụ nhanh"
                aria-expanded={openPanel === 'quick-actions'}
                onClick={() => togglePanel('quick-actions')}
                className="flex h-10 items-center gap-2 rounded-xl bg-sky-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xl:inline">Tạo mới</span>
              </button>

              {openPanel === 'quick-actions' && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <p className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tác vụ nhanh</p>
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.href}
                        type="button"
                        onClick={() => navigateTo(action.href)}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Icon className="h-4 w-4 text-sky-600" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              aria-label="Xem thông báo"
              aria-expanded={openPanel === 'notifications'}
              onClick={() => togglePanel('notifications')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>

            {openPanel === 'notifications' && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[min(320px,calc(100vw-32px))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-800">Thông báo</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Mới nhất</span>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-5 text-center">
                  <Bell className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600">Chưa có thông báo mới</p>
                  <p className="mt-1 text-xs text-slate-400">Các cập nhật quan trọng sẽ hiển thị tại đây.</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="Mở menu tài khoản"
              aria-expanded={openPanel === 'account'}
              onClick={() => togglePanel('account')}
              className="flex h-11 items-center gap-2 rounded-xl p-1.5 pr-2 text-left transition hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-bold text-white shadow-sm">
                {initials || 'U'}
              </span>
              <span className="hidden min-w-0 max-w-32 lg:block">
                <span className="block truncate text-sm font-semibold leading-4 text-slate-700">{displayName}</span>
                <span className="mt-0.5 block truncate text-[11px] leading-4 text-slate-400">
                  {role ? roleLabels[role] : 'Đang tải...'}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
            </button>

            {openPanel === 'account' && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email || 'Chưa có email'}</p>
                  {role && (
                    <span className="mt-2 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                      {roleLabels[role]}
                    </span>
                  )}
                </div>
                {role && (
                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => navigateTo(workspaceRoutes[role])}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-500" />
                      Trang làm việc
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPanel(null);
                        setIsChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <KeyRound className="h-4 w-4 text-[#1e66f5]" />
                      Đổi mật khẩu
                    </button>
                  </div>
                )}
                <div className="border-t border-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </header>
  );
};
