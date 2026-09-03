'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  LogIn,
  ChevronRight,
  Headphones,
  Mail,
  Phone,
  Building2,
  HelpCircle,
  Send,
  MessageSquare,
  X,
  FileText,
  GraduationCap,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Bot,
} from 'lucide-react';
import { Toast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { isDarkModeActive, toggleTheme } from '../../lib/theme';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { User } from '../../types';

interface ArticleItem {
  id: string;
  category: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'RULES';
  categoryLabel: string;
  title: string;
  summary: string;
  content: string[];
  readTime: string;
  tags: string[];
  updatedAt: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  sources?: Array<{ id: string; title: string }>;
  shouldEscalate?: boolean;
  userQuestion?: string;
}

export const dynamic = 'force-dynamic';

export default function ContactSupportPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('art-1');
  const [isDark, setIsDark] = useState(false);

  // Modals
  const [isAllArticlesModalOpen, setIsAllArticlesModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [showSupportDrawer, setShowSupportDrawer] = useState(false);

  // Contact Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'OTHER'>('STUDENT');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Xin chào! Bạn cần trợ giúp gì về hệ thống quản lý khảo thí hôm nay?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const chatSuggestions = ['Quên mật khẩu', 'Không vào được ca thi', 'Cách xem lịch thi'];

  useEffect(() => {
    if (!isChatOpen) return;
    const frame = requestAnimationFrame(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [isChatOpen, chatMessages, chatSending]);

  useEffect(() => {
    setCurrentUser(getAuthUser());
    const handleAuthChange = () => {
      setCurrentUser(getAuthUser());
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const dashboardRoute = useMemo(() => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'ADMIN') return '/dashboard';
    if (currentUser.role === 'TEACHER') return '/teacher/assignments';
    return '/student/exam-schedule';
  }, [currentUser]);

  const currentDisplayName = useMemo(() => {
    if (!currentUser) return '';
    return currentUser.teacher?.fullName || currentUser.student?.fullName || currentUser.username || 'User';
  }, [currentUser]);

  useEffect(() => {
    setIsDark(isDarkModeActive());
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail?.isDark ?? isDarkModeActive());
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const toggleDark = useCallback(() => {
    const next = toggleTheme();
    setIsDark(next === 'dark');
  }, []);

  // Knowledge Base Articles
  const articles = useMemo<ArticleItem[]>(
    () => [
      {
        id: 'art-1',
        category: 'STUDENT',
        categoryLabel: 'Sinh viên',
        title: 'Xử lý sự cố mất kết nối internet khi đang làm bài thi trực tuyến',
        summary: 'Hệ thống hỗ trợ cơ chế lưu tự động (Auto-save) sau mỗi 5 giây. Hướng dẫn các bước xử lý khi mạng bị rớt.',
        readTime: '3 phút đọc',
        tags: ['Rớt mạng', 'Lưu bài thi', 'Sự cố trực tuyến'],
        updatedAt: '06/08/2026',
        content: [
          '1. Đừng quá lo lắng: Hệ thống tích hợp tính năng Auto-save lưu câu trả lời của bạn lên máy chủ liên tục sau mỗi 5 giây.',
          '2. Không tắt trình duyệt: Giữ nguyên tab làm bài thi và kiểm tra lại dây mạng hoặc kết nối Wi-Fi.',
          '3. Tự động kết nối lại: Khi internet có hiệu lực trở lại, hệ thống sẽ tự động đồng bộ câu trả lời mà bạn vừa chọn.',
          '4. Trường hợp gián đoạn quá 5 phút: Hãy giơ tay báo cho Cán bộ coi thi tại phòng hoặc gọi ngay Hotline khẩn cấp 1800-EXAM-HELP để được kỹ thuật viên lập biên bản và cấp bổ sung thời gian thi.',
        ],
      },
      {
        id: 'art-2',
        category: 'STUDENT',
        categoryLabel: 'Sinh viên',
        title: 'Hướng dẫn tra cứu Lịch thi cá nhân, Số báo danh và Phòng thi',
        summary: 'Cách xem lịch thi chính thức, ca thi, sơ đồ phòng thi và mã tra cứu kết quả dành cho Sinh viên.',
        readTime: '2 phút đọc',
        tags: ['Lịch thi', 'Số báo danh', ' Phòng thi'],
        updatedAt: '05/08/2026',
        content: [
          '1. Đăng nhập vào hệ thống quản lý khảo thí bằng tài khoản sinh viên do nhà trường cấp.',
          '2. Trên menu bên trái, chọn mục "Quản lý lịch thi" ➔ "Lịch thi cá nhân".',
          '3. Tại đây hiển thị đầy đủ danh sách các môn thi trong kỳ, Ca thi, Giờ bắt đầu, Số báo danh và Phòng thi chi tiết.',
          '4. Bạn có thể bấm nút "Xuất file lịch thi" hoặc "In báo cáo" để lưu lịch thi về điện thoại/máy tính.',
        ],
      },
      {
        id: 'art-3',
        category: 'STUDENT',
        categoryLabel: 'Sinh viên',
        title: 'Quy trình gửi đơn Phúc khảo bài thi & Xem lịch sử cập nhật điểm',
        summary: 'Thời hạn đăng ký phúc khảo, mức phí và các bước theo dõi tiến độ xử lý đơn phúc khảo trực tuyến.',
        readTime: '4 phút đọc',
        tags: ['Phúc khảo', 'Điểm thi', 'Khiếu nại'],
        updatedAt: '04/08/2026',
        content: [
          '1. Đơn phúc khảo được mở trong vòng 07 ngày kể từ khi công bố điểm thi môn học.',
          '2. Vào mục "Thống kê kỳ thi" ➔ Chọn môn học cần phúc khảo ➔ Bấm nút "Nộp đơn phúc khảo".',
          '4. Vi phạm quá 5 lần sẽ bị hệ thống tự động khóa bài thi (Auto-submit) và đánh dấu nghi vấn gian lận.',
        ],
      },
      {
        id: 'art-6',
        category: 'ADMIN',
        categoryLabel: 'Quản trị viên',
        title: 'Khôi phục mật khẩu tài khoản & Cấp quyền truy cập hệ thống',
        summary: 'Hướng dẫn Quản trị viên hỗ trợ người dùng reset mật khẩu và phân quyền Role (Admin, Teacher, Student).',
        readTime: '3 phút đọc',
        tags: ['Mật khẩu', 'Reset Account', 'Phân quyền'],
        updatedAt: '02/08/2026',
        content: [
          '1. Người dùng có thể tự khôi phục mật khẩu qua liên kết "Quên mật khẩu?" tại trang Đăng nhập.',
          '2. Trong trường hợp khẩn cấp, quản trị viên vào mục "Quản lý người dùng", chọn tài khoản và bấm "Reset mật khẩu".',
          '3. Mật khẩu tạm thời sẽ được tự động gửi về Email đăng ký của người dùng.',
        ],
      },
    ],
    []
  );

  // Quick Suggestion Tags
  const popularSearchTags = [
    'Quên mật khẩu',
    'Rớt mạng 1800',
    'Xem số báo danh',
    'Ngân hàng câu hỏi',
    'Nộp phúc khảo',
    'Quy chế phòng thi',
  ];

  // Filtered Articles based on search
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return articles.slice(0, 4);
    const query = searchQuery.toLowerCase().trim();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [articles, searchQuery]);

  const filteredFaqs = useMemo(() => {
    return articles.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, articles, searchQuery]);

  const handleSendSupportForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setToast({ message: 'Vui lòng điền đầy đủ thông tin trước khi gửi.', type: 'error' });
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/contact/send', {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        message: message.trim(),
      });
      setToast({
        message:
          res?.data?.message ||
          'Yêu cầu hỗ trợ đã được gửi thành công! Quản trị viên sẽ phản hồi qua email trong thời gian sớm nhất.',
        type: 'success',
      });
      setFullName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.';
      setToast({
        message: typeof msg === 'string' ? msg : 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.',
        type: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatSending(true);

    try {
      const response = await api.post('/support-chat/message', { message: userText });
      const data = response.data || {};
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: typeof data.answer === 'string' ? data.answer : 'Mình chưa thể xử lý câu hỏi này. Vui lòng gửi yêu cầu hỗ trợ để được kiểm tra.',
          sources: Array.isArray(data.sources) ? data.sources : [],
          shouldEscalate: Boolean(data.shouldEscalate),
          userQuestion: userText,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Kênh hỗ trợ tự động đang tạm thời bận. Bạn có thể gửi yêu cầu hỗ trợ trực tiếp để quản trị viên kiểm tra.',
          shouldEscalate: true,
          userQuestion: userText,
        },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const handleChatSuggestion = (suggestion: string) => {
    setChatInput(suggestion);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const handleEscalateChat = (question?: string) => {
    if (question) {
      setMessage((current) => current.trim() || `Nội dung cần hỗ trợ: ${question}`);
    }
    setIsChatOpen(false);
    requestAnimationFrame(() => {
      document.getElementById('support-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div
      className={`min-h-screen w-full relative overflow-y-auto [scrollbar-gutter:stable] font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[var(--ui-page)] text-slate-900'
      }`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Background Decorative Vector Waves & Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div
          className="absolute inset-0 w-full h-[600px] opacity-35 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(var(--ui-chart-primary-light) 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)',
          }}
        />
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-blue-200/50 dark:bg-blue-900/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-[700px] h-[700px] bg-sky-100/60 dark:bg-blue-950/20 rounded-full blur-[150px]" />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex py-3.5 max-w-[1380px] items-center justify-between px-6 sm:px-10">
          <Link href={dashboardRoute} className="flex items-center gap-3.5 group cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-type-section font-semibold tracking-tight text-slate-900 dark:text-white block">
                EXAMSYS
              </span>
              <span className="text-type-helper font-semibold tracking-wider text-blue-600 dark:text-blue-400  mt-0.5 block">
                TRUNG TÂM HỖ TRỢ KHẢO THÍ
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDark}
              aria-label="Chuyển chủ đề sáng/tối"
              title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="flex h-10 w-10 items-center justify-center text-slate-400 transition-colors duration-200 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 cursor-pointer"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>

            {currentUser ? (
              <Link
                href={dashboardRoute}
                title={`Quay lại không gian làm việc (${currentDisplayName})`}
                aria-label="Về trang chính"
                className="group flex h-10 w-10 items-center justify-center text-slate-400 transition-all duration-200 hover:scale-105 hover:text-slate-700 active:scale-95 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-4.5 w-4.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.9} />
              </Link>
            ) : (
              <Link
                href="/login"
                title="Đăng nhập"
                aria-label="Đăng nhập"
                className="group flex h-10 w-10 items-center justify-center text-slate-400 transition-all duration-200 hover:scale-105 hover:text-slate-700 active:scale-95 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <LogIn className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.9} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10 py-10 space-y-12 w-full">
        {/* Search Hero Section */}
        <section className="text-center space-y-5 max-w-3xl mx-auto pt-2">
          <h1 className="text-type-page font-semibold tracking-tight text-slate-900 dark:text-white">
            Chúng tôi có thể giúp gì <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-sky-300">
              cho kỳ thi của bạn?
            </span>
          </h1>
          <p className="text-type-body sm:text-type-body text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            Tra cứu hướng dẫn xử lý sự cố trực tuyến, quy chế thi học kỳ hoặc gửi phiếu hỗ trợ kỹ thuật đến Quản trị viên.
          </p>

          {/* Big Search Bar with Autocomplete Suggestions */}
          <div className="relative max-w-2xl mx-auto rounded-3xl pt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm quy chế thi, xử lý rớt mạng, phúc khảo..."
                className="w-full h-14 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 py-3 pl-12 pr-12 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition shadow-sm backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Search Suggestions Dropdown */}
            {(isSearchFocused || searchQuery.trim().length > 0) && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-apple-modal space-y-2 text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="flex items-center justify-between px-2 text-type-helper font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                  <span>{searchQuery.trim() ? 'Gợi ý bài viết phù hợp' : 'Tìm kiếm phổ biến nhất'}</span>
                  <span>{searchSuggestions.length} kết quả</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((art) => (
                      <div
                        key={art.id}
                        onMouseDown={() => setSelectedArticle(art)}
                        className="p-3 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 rounded-xl transition cursor-pointer flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-type-helper font-medium text-blue-600 dark:text-blue-400 px-2 py-0.5 ui-pill rounded-full">
                              {art.categoryLabel}
                            </span>
                            <h4 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition truncate">
                              {art.title}
                            </h4>
                          </div>
                          <p className="text-type-helper text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{art.summary}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-type-helper font-semibold text-slate-400 dark:text-slate-500">
                      Không tìm thấy bài viết phù hợp với &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>

                {/* Hot Tags */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center gap-1.5 flex-wrap px-1">
                  <span className="text-type-helper font-semibold text-slate-400 dark:text-slate-500 shrink-0">Từ khóa hot:</span>
                  {popularSearchTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={() => setSearchQuery(tag)}
                      className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-type-helper font-semibold px-2.5 py-1 transition cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3 Direct Support Contact Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-apple-card space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-apple-card-hover hover:border-blue-200 dark:hover:border-blue-800 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold transition-transform duration-200 group-hover:scale-105">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">Tổng đài hỗ trợ 24/7</h3>
              <p className="text-type-body-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">1800-EXAM-HELP</p>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">Miễn phí cước gọi từ mọi mạng viễn thông</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-apple-card space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-apple-card-hover hover:border-blue-200 dark:hover:border-blue-800 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold transition-transform duration-200 group-hover:scale-105">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">Email Tiếp nhận Sự cố</h3>
              <p className="text-type-body-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">support@exam.edu.vn</p>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">Thời gian phản hồi trung bình: dưới 15 phút</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-apple-card space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-apple-card-hover hover:border-blue-200 dark:hover:border-blue-800 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold transition-transform duration-200 group-hover:scale-105">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">Văn phòng Khảo thí</h3>
              <p className="text-type-body-sm text-slate-800 dark:text-slate-200 font-semibold mt-1">Tòa nhà A1 - Trung tâm Khảo thí</p>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">07:30 – 17:00 (Thứ 2 đến Thứ 6)</p>
            </div>
          </div>
        </section>

        {/* FAQs List Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-type-section sm:text-type-section font-semibold text-slate-900 dark:text-white tracking-tight">
              Câu hỏi & Hướng dẫn thường gặp (FAQs)
            </h2>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'STUDENT', label: 'Sinh viên' },
                { id: 'TEACHER', label: 'Giảng viên' },
                { id: 'RULES', label: 'Quy chế thi' },
                { id: 'ADMIN', label: 'Quản trị viên' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveCategory(pill.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-type-helper font-semibold transition cursor-pointer ${
                    activeCategory === pill.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 overflow-hidden shadow-sm">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className="transition-colors">
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className={`w-full flex items-center justify-between p-5 text-left transition-all duration-200 cursor-pointer ${
                        isExpanded
                          ? 'bg-blue-50/40 dark:bg-slate-800/60'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <HelpCircle
                          className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                            isExpanded ? 'text-blue-600' : 'text-blue-500'
                          }`}
                        />
                        <span
                          className={`text-type-body-sm font-semibold transition-colors duration-200 ${
                            isExpanded
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {faq.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline-block text-type-helper font-semibold text-slate-500 dark:text-slate-400">
                          {faq.categoryLabel}
                        </span>
                        <ChevronRight
                          className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ease-in-out shrink-0 ${
                            isExpanded ? 'rotate-90 text-blue-600' : 'rotate-0'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Smooth Animated Accordion Content */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6 pt-3 text-type-body-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/40 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 space-y-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body-sm">
                            {faq.summary}
                          </p>

                          <div className="space-y-2.5 pt-1">
                            {faq.content.map((paragraph, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <span className="flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-type-helper shadow-2xs mt-0.5">
                                  {i + 1}
                                </span>
                                <p className="text-type-body-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                                  {paragraph.replace(/^[0-9]+\.\s*/, '')}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 flex items-center justify-between text-type-helper text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-blue-500" /> {faq.readTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedArticle(faq)}
                              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Đọc bài viết đầy đủ</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-type-helper font-semibold text-slate-400">
                Không tìm thấy bài viết phù hợp với &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </section>

        {/* Submit Support Ticket Form Section */}
        <section className="rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-lg shadow-blue-500/5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-type-section sm:text-type-section font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Headphones className="h-6 w-6 text-blue-600" />
              <span>Gửi yêu cầu hỗ trợ trực tiếp đến Quản trị viên</span>
            </h2>
            <p className="text-type-body-sm text-slate-500 dark:text-slate-400 font-normal">
              Điền thông tin sự cố hoặc câu hỏi của bạn. Đội ngũ Kỹ thuật Trung tâm Khảo thí sẽ phản hồi qua email trong thời gian sớm nhất.
            </p>
          </div>

          <form id="support-request-form" onSubmit={handleSendSupportForm} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Họ và tên người gửi
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className={`w-full h-11 rounded-xl border px-4 text-type-body outline-none transition ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                      : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyenvana@exam.edu.vn"
                  className={`w-full h-11 rounded-xl border px-4 text-type-body outline-none transition ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                      : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Vai trò hệ thống
                </label>
                <FilterSelect
                  size="lg"
                  containerClassName="w-full"
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className={`w-full h-11 rounded-xl border px-4 text-type-body outline-none transition cursor-pointer ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                      : 'border-slate-200/90 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="TEACHER">Giảng viên</option>
                  <option value="OTHER">Cán bộ / Khác</option>
                </FilterSelect>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                Nội dung cần hỗ trợ chi tiết
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả cụ thể sự cố bạn gặp phải (ví dụ: Không đăng nhập được, thiếu môn thi trong lịch thi, lỗi nộp bài...)"
                className={`w-full rounded-xl border p-4 text-type-body outline-none transition ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                    : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending}
                className="h-11 px-7 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-type-body shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Gửi yêu cầu hỗ trợ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* MODAL: Đọc bài viết chi tiết (Sleek Modern Article Reader) */}
      <Modal
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Chi tiết bài viết'}
        icon={<FileText className="h-6 w-6 text-white" />}
      >
        {selectedArticle && (
          <div className="space-y-6 pt-1">
            {/* Article Meta Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-type-helper font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">
                {selectedArticle.categoryLabel}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  {selectedArticle.readTime}
                </span>
                <span>Cập nhật: {selectedArticle.updatedAt}</span>
              </div>
            </div>

            {/* Summary Lede */}
            <p className="text-type-body leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
              {selectedArticle.summary}
            </p>

            {/* Step-by-Step Modern List */}
            <div className="space-y-3.5 pt-1">
              <h5 className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                Các bước thực hiện:
              </h5>
              <div className="space-y-3">
                {selectedArticle.content.map((paragraph, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    {/* Perfect Circle Number */}
                    <span className="flex h-6 w-6 min-w-[24px] min-h-[24px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-type-helper font-semibold shadow-xs mt-0.5">
                      {idx + 1}
                    </span>
                    {/* Paragraph Content */}
                    <p className="text-type-body-sm text-slate-700 dark:text-slate-200 font-normal leading-relaxed">
                      {paragraph.replace(/^[0-9]+\.\s*/, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags & Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedArticle.tags.map((t) => (
                  <span
                    key={t}
                    className="ui-pill text-type-helper font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-2.5 py-1 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-type-helper font-semibold transition cursor-pointer"
              >
                Đóng bài viết
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Support Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            type="button"
            onClick={() => {
              setIsChatOpen(true);
              requestAnimationFrame(() => chatInputRef.current?.focus());
            }}
            aria-label="Mở chat hỗ trợ tự động"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-blue-100 dark:ring-blue-950"
            title="Chat hỗ trợ tự động"
          >
            <span className="absolute -inset-1 rounded-full border border-blue-400/50 animate-ping" aria-hidden="true" />
            <MessageSquare className="relative h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" aria-label="Trợ lý đang trực tuyến" />
          </button>
        ) : (
          <div className="w-[calc(100vw-2rem)] sm:w-96 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[min(560px,calc(100vh-6.5rem))] animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200">
            {/* Widget Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white font-semibold text-type-helper shadow-inner">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-type-body-sm font-semibold leading-tight">Trợ lý Hỗ trợ Khảo thí</h4>
                  <p className="text-type-helper text-blue-200 font-medium flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tra cứu hướng dẫn đã duyệt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition cursor-pointer p-1 rounded-xl hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-type-helper bg-slate-50/50 dark:bg-slate-950/50 scroll-smooth">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex animate-in fade-in slide-in-from-bottom-2 duration-200 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    {msg.sender === 'bot' && (
                      <div className="mb-1 flex items-center gap-1.5 text-type-helper font-medium text-slate-500 dark:text-slate-400">
                        <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        Trợ lý khảo thí
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-type-helper font-medium leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {msg.sources.map((source) => (
                          <button
                            key={source.id}
                            type="button"
                            onClick={() => setSelectedArticle(articles.find((article) => article.id === source.id) || null)}
                            className="max-w-full truncate rounded-xl border border-blue-200 bg-blue-50 px-2 py-1 text-left text-type-helper font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                            title={`Mở hướng dẫn: ${source.title}`}
                          >
                            {source.title}
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.sender === 'bot' && msg.shouldEscalate && (
                      <button
                        type="button"
                        onClick={() => handleEscalateChat(msg.userQuestion)}
                        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-2.5 text-type-helper font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        <Headphones className="h-3.5 w-3.5" />
                        Gửi yêu cầu hỗ trợ
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatMessages.length === 1 && !chatSending && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {chatSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleChatSuggestion(suggestion)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-2.5 py-1.5 text-type-helper font-medium text-blue-700 shadow-2xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {chatSending && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="rounded-2xl rounded-bl-none border border-slate-200 bg-white px-3.5 py-2.5 text-type-helper font-medium text-slate-600 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1" aria-label="Trợ lý đang trả lời">
                        {[0, 1, 2].map((dot) => (
                          <span key={dot} className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${dot * 140}ms` }} />
                        ))}
                      </span>
                      <span>Đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập câu hỏi cần hỗ trợ..."
                maxLength={500}
                disabled={chatSending}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-type-body outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:focus:bg-slate-800 dark:focus:ring-blue-950"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatSending}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Page Bottom Footer ── */}
      <footer className="mt-auto relative z-10 w-full py-6 shrink-0 text-center text-type-helper text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200/90 dark:border-slate-800/60">
        <p className="flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300 text-type-helper">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-type-helper text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
