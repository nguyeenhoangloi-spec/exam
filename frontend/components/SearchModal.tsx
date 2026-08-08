'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
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
  User as UserIcon,
  Settings,
  Lock,
  BookMarked,
  LucideIcon,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import { User } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface SearchItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  category: string;
}

const ALL_SEARCH_ITEMS: SearchItem[] = [
  // Admin & System
  {
    id: 'dashboard',
    title: 'Tổng quan hệ thống',
    desc: 'Bảng điều khiển chỉ số & thống kê khảo thí',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
    category: 'Tổng quan',
  },
  {
    id: 'exam-periods',
    title: 'Quản lý Kỳ thi',
    desc: 'Tạo và quản lý các đợt thi học kỳ, thi phụ',
    href: '/exam-periods',
    icon: CalendarDays,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-schedules',
    title: 'Quản lý Lịch thi',
    desc: 'Lên lịch ca thi, môn thi và thời gian thi',
    href: '/exam-schedules',
    icon: CalendarCheck,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-rooms',
    title: 'Quản lý Phòng thi',
    desc: 'Danh sách phòng thi, sức chứa & thiết bị',
    href: '/exam-rooms',
    icon: Building2,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-arrangement',
    title: 'Xếp phòng thi tự động',
    desc: 'Phân sinh viên vào phòng thi tự động',
    href: '/exam-arrangement',
    icon: Users,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-supervisors',
    title: 'Phân công Giám thị',
    desc: 'Phân công cán bộ coi thi theo ca thi',
    href: '/exam-supervisors',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'question-bank',
    title: 'Ngân hàng câu hỏi',
    desc: 'Quản lý câu hỏi trắc nghiệm & tự luận',
    href: '/question-bank',
    icon: HelpCircle,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Ngân hàng & Đề thi',
  },
  {
    id: 'exam-papers',
    title: 'Quản lý Đề thi',
    desc: 'Soạn thảo, tạo đề ngẫu nhiên & phê duyệt đề',
    href: '/exam-papers',
    icon: FileText,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Ngân hàng & Đề thi',
  },
  {
    id: 'exam-reports',
    title: 'Báo cáo Điểm thi',
    desc: 'Thống kê kết quả, xuất báo cáo điểm thi',
    href: '/exam-reports',
    icon: BarChart3,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Báo cáo & Thống kê',
  },
  {
    id: 'departments',
    title: 'Quản lý Khoa',
    desc: 'Danh mục Khoa / Viện đào tạo',
    href: '/departments',
    icon: Building2,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'classes',
    title: 'Quản lý Lớp học',
    desc: 'Danh sách lớp hành chính & niên khóa',
    href: '/classes',
    icon: School,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'subjects',
    title: 'Quản lý Môn học',
    desc: 'Danh mục môn học, số tín chỉ',
    href: '/subjects',
    icon: BookOpen,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'teachers',
    title: 'Quản lý Giảng viên',
    desc: 'Danh sách cán bộ & giảng viên',
    href: '/teachers',
    icon: GraduationCap,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'students',
    title: 'Quản lý Sinh viên',
    desc: 'Danh sách sinh viên toàn trường',
    href: '/students',
    icon: Users,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },

  // Teacher Specific
  {
    id: 'teacher-assignments',
    title: 'Lịch coi thi cá nhân',
    desc: 'Xem ca thi và nhiệm vụ giám thị được phân công',
    href: '/teacher/assignments',
    icon: ShieldCheck,
    roles: ['TEACHER'],
    category: 'Giảng viên',
  },

  // Student Specific
  {
    id: 'student-exam-schedule',
    title: 'Lịch thi cá nhân',
    desc: 'Xem lịch thi, phòng thi và làm bài trực tuyến',
    href: '/student/exam-schedule',
    icon: BookMarked,
    roles: ['STUDENT'],
    category: 'Sinh viên',
  },
  {
    id: 'student-curriculum',
    title: 'Khung đào tạo ngành',
    desc: 'Chương trình đào tạo và lộ trình học tập',
    href: '/student/curriculum',
    icon: BookOpen,
    roles: ['STUDENT'],
    category: 'Sinh viên',
  },

  // Personal Account
  {
    id: 'profile',
    title: 'Hồ sơ cá nhân',
    desc: 'Cập nhật thông tin cá nhân & ảnh đại diện',
    href: '/profile',
    icon: UserIcon,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    category: 'Tài khoản',
  },
  {
    id: 'settings',
    title: 'Cài đặt hệ thống',
    desc: 'Cấu hình giao diện & tùy chọn tài khoản',
    href: '/settings',
    icon: Settings,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    category: 'Tài khoản',
  },
  {
    id: 'change-password',
    title: 'Đổi mật khẩu',
    desc: 'Bảo mật tài khoản & cập nhật mật khẩu mới',
    href: '/change-password',
    icon: Lock,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    category: 'Tài khoản',
  },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, user }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const userRole = user?.role || 'ADMIN';

  // Filter allowed items for current user role
  const allowedItems = ALL_SEARCH_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  // Search filter
  const filteredItems = query.trim()
    ? allowedItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allowedItems;

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Card matching User Screenshot */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Header Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-4.5 h-4.5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm trang, chức năng..."
            autoFocus
            className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1 text-xs">
          {!query && (
            <p className="px-3 py-1.5 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Đoạn chat & điều hướng gần đây</span>
            </p>
          )}

          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition text-left cursor-pointer group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0" />
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                Không tìm thấy kết quả phù hợp
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Thử tìm với từ khóa như &quot;kỳ thi&quot;, &quot;phòng thi&quot;, &quot;sinh viên&quot;...
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Bấm để truy cập nhanh trang</span>
          <span className="font-medium">Nhấn <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border rounded text-[10px]">ESC</kbd> để thoát</span>
        </div>
      </div>
    </div>
  );
};
