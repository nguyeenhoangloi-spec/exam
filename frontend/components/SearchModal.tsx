'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
  ArrowRight,
  Sparkles,
  Database,
  History,
  CheckSquare,
  FileCheck2,
  Video,
  PenTool,
  Award,
  Trash2,
  Flame,
  CornerDownLeft,
} from 'lucide-react';
import { User, Role } from '../types';

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
  roles?: Role[];
  category: string;
  badge?: string;
}

const ALL_SEARCH_ITEMS: SearchItem[] = [
  // ── 1. Tổng quan & Dashboard ──
  {
    id: 'dashboard',
    title: 'Tổng quan hệ thống',
    desc: 'Bảng điều khiển chỉ số KPI, thống kê đợt thi & lịch thi',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
    category: 'Tổng quan',
    badge: 'Chính',
  },

  // ── 2. Nghiệp vụ Khảo thí ──
  {
    id: 'exam-periods',
    title: 'Quản lý kỳ thi',
    desc: 'Tạo, quản lý đợt thi học kỳ, thi phụ & tiến độ',
    href: '/exam-periods',
    icon: CalendarDays,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-schedules',
    title: 'Quản lý lịch thi',
    desc: 'Lên lịch ca thi, phân môn thi và thời gian thi',
    href: '/exam-schedules',
    icon: CalendarCheck,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-rooms',
    title: 'Quản lý phòng thi',
    desc: 'Thiết lập danh sách phòng thi, sức chứa & trang thiết bị',
    href: '/exam-rooms',
    icon: Building2,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },
  {
    id: 'exam-arrangement',
    title: 'Xếp phòng thi tự động',
    desc: 'Thuật toán phân bổ sinh viên vào phòng thi & cấp SBD',
    href: '/exam-arrangement',
    icon: Users,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
    badge: 'Tự động',
  },
  {
    id: 'exam-supervisors',
    title: 'Phân công giám thị',
    desc: 'Điều động cán bộ coi thi, phòng thi và kiểm tra trùng ca',
    href: '/exam-supervisors',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    category: 'Nghiệp vụ Khảo thí',
  },

  // ── 3. Ngân hàng câu hỏi & Đề thi ──
  {
    id: 'question-bank',
    title: 'Ngân hàng câu hỏi',
    desc: 'Quản lý câu hỏi trắc nghiệm & tự luận theo ma trận kiến thức',
    href: '/question-bank',
    icon: HelpCircle,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Ngân hàng & Đề thi',
  },
  {
    id: 'exam-papers',
    title: 'Quản lý đề thi',
    desc: 'Soạn thảo, xáo trộn đề, tạo đề thi ngẫu nhiên & duyệt đề',
    href: '/exam-papers',
    icon: FileText,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Ngân hàng & Đề thi',
  },
  {
    id: 'teacher-essay-grading',
    title: 'Chấm thi tự luận',
    desc: 'Chấm bài thi tự luận trực tuyến của sinh viên theo barem',
    href: '/teacher/essay-grading',
    icon: PenTool,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Ngân hàng & Đề thi',
  },
  {
    id: 'admin-essay-review',
    title: 'Duyệt chấm thi tự luận',
    desc: 'Kiểm tra và duyệt kết quả chấm bài thi tự luận',
    href: '/admin/essay-review',
    icon: FileCheck2,
    roles: ['ADMIN'],
    category: 'Ngân hàng & Đề thi',
  },


  {
    id: 'exam-reports',
    title: 'Báo cáo điểm thi',
    desc: 'Thống kê kết quả thi, phân tích phổ điểm & xuất bảng điểm',
    href: '/exam-reports',
    icon: BarChart3,
    roles: ['ADMIN', 'TEACHER'],
    category: 'Giám sát & Báo cáo',
  },
  {
    id: 'reports',
    title: 'Thống kê & Báo cáo nâng cao',
    desc: 'Tổng hợp số liệu toàn trường, năng suất & tỷ lệ đạt',
    href: '/reports',
    icon: BarChart3,
    roles: ['ADMIN'],
    category: 'Giám sát & Báo cáo',
  },
  {
    id: 'admin-grade-appeals',
    title: 'Xử lý phúc khảo điểm',
    desc: 'Quản lý đơn xin phúc khảo điểm thi của sinh viên',
    href: '/admin/grade-appeals',
    icon: CheckSquare,
    roles: ['ADMIN'],
    category: 'Giám sát & Báo cáo',
  },

  // ── 5. Danh mục Hệ thống ──
  {
    id: 'departments',
    title: 'Quản lý khoa / viện',
    desc: 'Danh mục Khoa, Viện đào tạo và bộ môn',
    href: '/departments',
    icon: Building2,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'classes',
    title: 'Quản lý lớp học',
    desc: 'Danh sách lớp sinh viên, niên khóa & cố vấn học tập',
    href: '/classes',
    icon: School,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'subjects',
    title: 'Quản lý môn học',
    desc: 'Danh mục học phần, mã môn học và số tín chỉ',
    href: '/subjects',
    icon: BookOpen,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'teachers',
    title: 'Quản lý giảng viên',
    desc: 'Danh sách cán bộ coi thi, giảng viên giảng dạy',
    href: '/teachers',
    icon: GraduationCap,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },
  {
    id: 'students',
    title: 'Quản lý sinh viên',
    desc: 'Hồ sơ sinh viên toàn trường, tra cứu MSSV',
    href: '/students',
    icon: Users,
    roles: ['ADMIN'],
    category: 'Danh mục hệ thống',
  },

  // ── 6. Quản trị & Bảo mật ──
  {
    id: 'admin-backups',
    title: 'Sao lưu & Phục hồi dữ liệu',
    desc: 'Tạo bản sao lưu định kỳ, xuất dữ liệu an toàn',
    href: '/admin/backups',
    icon: Database,
    roles: ['ADMIN'],
    category: 'Quản trị & Bảo mật',
  },
  {
    id: 'admin-activity-logs',
    title: 'Nhật ký hoạt động (Audit Logs)',
    desc: 'Lịch sử thao tác của người dùng trên toàn hệ thống',
    href: '/admin/activity-logs',
    icon: History,
    roles: ['ADMIN'],
    category: 'Quản trị & Bảo mật',
  },
  {
    id: 'trash',
    title: 'Thùng rác hệ thống',
    desc: 'Khôi phục hoặc dọn dẹp các bản ghi đã xóa tạm thời',
    href: '/trash',
    icon: Trash2,
    roles: ['ADMIN'],
    category: 'Quản trị & Bảo mật',
  },

  // ── 7. Giảng viên ──
  {
    id: 'teacher-assignments',
    title: 'Lịch coi thi cá nhân',
    desc: 'Xem danh sách ca thi, phòng thi và vị trí giám thị được phân công',
    href: '/teacher/assignments',
    icon: ShieldCheck,
    roles: ['TEACHER'],
    category: 'Giảng viên',
    badge: 'Cá nhân',
  },
  {
    id: 'teacher-regrade',
    title: 'Chấm phúc khảo bài thi',
    desc: 'Xử lý các bài thi được yêu cầu phúc khảo',
    href: '/teacher/regrade',
    icon: CheckSquare,
    roles: ['TEACHER'],
    category: 'Giảng viên',
  },

  // ── 8. Sinh viên ──
  {
    id: 'student-exam-schedule',
    title: 'Lịch thi cá nhân',
    desc: 'Tra cứu ngày thi, giờ thi, số báo danh, phòng thi và vào thi',
    href: '/student/exam-schedule',
    icon: BookMarked,
    roles: ['STUDENT'],
    category: 'Sinh viên',
    badge: 'Lịch thi',
  },
  {
    id: 'student-practice',
    title: 'Luyện thi thử trắc nghiệm',
    desc: 'Làm bài thi thử để ôn luyện kiến thức trước kỳ thi',
    href: '/student/practice',
    icon: Flame,
    roles: ['STUDENT'],
    category: 'Sinh viên',
    badge: 'Ôn luyện',
  },
  {
    id: 'student-results',
    title: 'Kết quả thi & Bảng điểm',
    desc: 'Xem điểm số bài thi, lịch sử thi và gửi đơn phúc khảo',
    href: '/student/results',
    icon: Award,
    roles: ['STUDENT'],
    category: 'Sinh viên',
  },
  {
    id: 'student-curriculum',
    title: 'Khung chương trình đào tạo',
    desc: 'Xem lộ trình học tập, danh sách môn bắt buộc & tự chọn',
    href: '/student/curriculum',
    icon: BookOpen,
    roles: ['STUDENT'],
    category: 'Sinh viên',
  },

  // ── 9. Tài khoản cá nhân ──
  {
    id: 'profile',
    title: 'Hồ sơ cá nhân',
    desc: 'Xem và cập nhật thông tin cá nhân, ảnh đại diện',
    href: '/profile',
    icon: UserIcon,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
    category: 'Tài khoản',
  },
  {
    id: 'settings',
    title: 'Cài đặt hệ thống',
    desc: 'Tùy chỉnh giao diện, chế độ sáng/tối và thông báo',
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const userRole = (user?.role || 'ADMIN') as Role;

  // Filter allowed items strictly by user role
  const allowedItems = useMemo(() => {
    return ALL_SEARCH_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole));
  }, [userRole]);

  // Search filter
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allowedItems;
    return allowedItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allowedItems, query]);

  // Reset search and selection on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation: Arrow Up, Arrow Down, Enter, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].href);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose, handleSelect]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh chức năng"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Container: Raycast / Linear Pro Design */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* ── 1. Search Header Bar (Xám không nền, không viền xanh) ── */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 gap-3 bg-transparent">
          <Search className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh chức năng, lịch thi, phòng thi, môn học..."
            style={{
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
              background: 'transparent',
            }}
            className="no-focus-outline w-full text-[15px] font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-0 ring-0 outline-none focus:ring-0 focus:outline-none focus:border-0 shadow-none p-0 !outline-none !shadow-none !border-none !ring-0"
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* ── 2. Results / Recommendations List ── */}
        <div ref={listRef} className="p-3 max-h-[420px] overflow-y-auto space-y-1 text-[14.5px] no-scrollbar">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-active={isSelected}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(item.href)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 text-slate-900 dark:text-white shadow-2xs'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {/* Icon Box */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Title & Desc */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold text-[14.5px] truncate transition-colors ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[12px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                      {item.desc}
                    </p>
                  </div>

                  {/* Category Tag & Action Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[12px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </span>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-100/80 dark:bg-blue-900/50">
                        <span>Mở</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="font-semibold text-slate-900 dark:text-slate-200 text-[15px]">
                Không tìm thấy chức năng phù hợp
              </p>
              <p className="text-[13px] text-slate-500 mt-1 font-normal">
                Thử tìm với các từ khóa như &quot;kỳ thi&quot;, &quot;lịch thi&quot;, &quot;phòng thi&quot;, &quot;sinh viên&quot;...
              </p>
            </div>
          )}
        </div>

        {/* ── 3. Footer Navigation Hints Bar ── */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12.5px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[12px] font-semibold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[12px] font-semibold">↓</kbd>
              <span className="text-slate-500 font-medium">Điều hướng</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[12px] font-semibold">↵</kbd>
              <span className="text-slate-500 font-medium">Chọn</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[12px]">
              Nhấn <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[12px] font-semibold">ESC</kbd> để đóng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
