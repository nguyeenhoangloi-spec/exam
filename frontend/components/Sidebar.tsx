'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  DoorOpen,
  UserCheck,
  HelpCircle,
  FileText,
  BookMarked,
  ShieldCheck,
  Layers,
  Building2,
  School,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
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

  const studentNav = [
    { name: 'Lịch thi cá nhân', href: '/student/exam-schedule', icon: BookMarked },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'TEACHER' ? teacherNav : studentNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
          EX
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-wide">KHẢO THÍ SV</h1>
          <p className="text-xs text-slate-400">Hệ thống quản lý</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs text-sky-400">
            {user?.username?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 font-bold tracking-wider uppercase">
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
