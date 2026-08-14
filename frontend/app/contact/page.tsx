'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import api from '../../lib/api';

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

export const dynamic = 'force-dynamic';

export default function ContactSupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('art-1');
  const [isDark, setIsDark] = useState(false);

  // Modals
  const [isAllArticlesModalOpen, setIsAllArticlesModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  // Contact Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'OTHER'>('STUDENT');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Xin chào! Bạn cần trợ giúp gì về hệ thống quản lý khảo thí hôm nay?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
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
        tags: ['Lịch thi', 'Số báo danh', 'Phòng thi'],
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
          '2. Vào mục "Báo cáo Điểm thi" ➔ Chọn môn học cần phúc khảo ➔ Bấm nút "Nộp đơn phúc khảo".',
          '3. Nhập lý do phúc khảo và tải lên ảnh chụp minh chứng (nếu có).',
          '4. Hội đồng Khảo thí sẽ chấm lại bài thi và cập nhật điểm mới lên hệ thống. Lịch sử thay đổi điểm được lưu minh bạch.',
        ],
      },
      {
        id: 'art-4',
        category: 'TEACHER',
        categoryLabel: 'Giảng viên',
        title: 'Hướng dẫn tạo & duyệt Ngân hàng câu hỏi trắc nghiệm / tự luận',
        summary: 'Cấu trúc ma trận đề thi theo 4 mức độ Bloom: Nhớ, Hiểu, Vận dụng, Phân tích và quy trình duyệt câu hỏi.',
        readTime: '5 phút đọc',
        tags: ['Ngân hàng câu hỏi', 'Duyệt đề', 'Bloom'],
        updatedAt: '06/08/2026',
        content: [
          '1. Giảng viên truy cập menu "Ngân hàng câu hỏi" ➔ Chọn "Tạo câu hỏi mới" hoặc "Nhập từ Excel/Word".',
          '2. Phân loại chuẩn xác mức độ nhận thức Bloom (Nhớ, Hiểu, Vận dụng, Phân tích) và môn học tương ứng.',
          '3. Sau khi tạo xong, chuyển trạng thái câu hỏi sang "Chờ duyệt".',
          '4. Trưởng bộ môn sẽ thẩm định và phê duyệt để đưa câu hỏi vào Ngân hàng chính thức phục vụ phát hành đề thi.',
        ],
      },
      {
        id: 'art-5',
        category: 'RULES',
        categoryLabel: 'Quy chế thi',
        title: 'Quy chế An toàn An ninh phòng thi trực tuyến & Giám sát AI Proctored',
        summary: 'Các quy định bắt buộc về bật Webcam, Fullscreen, cấm chuyển tab và phạt điểm vi phạm an ninh.',
        readTime: '4 phút đọc',
        tags: ['Quy chế thi', 'Chống gian lận', 'Webcam'],
        updatedAt: '03/08/2026',
        content: [
          '1. Bắt buộc bật toàn màn hình (Fullscreen) và cho phép truy cập Camera/Microphone trong suốt quá trình làm bài.',
          '2. Cấm tuyệt đối chuyển tab trình duyệt, mở tài liệu phụ hoặc sử dụng phần mềm điều khiển từ xa (TeamViewer, UltraViewer).',
          '3. Mỗi hành vi chuyển tab hoặc rời màn hình thi sẽ bị hệ thống AI ghi nhận và cảnh cáo tự động.',
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

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      let botReply =
        'Cảm ơn bạn đã liên hệ! Bộ phận hỗ trợ kỹ thuật Trung tâm Khảo thí đã ghi nhận câu hỏi. Bạn cũng có thể gọi Hotline 1800-EXAM-HELP để được hỗ trợ trực tiếp.';
      if (userText.toLowerCase().includes('mật khẩu') || userText.toLowerCase().includes('quen')) {
        botReply =
          'Để khôi phục mật khẩu, bạn vui lòng truy cập trang Quên mật khẩu hoặc liên hệ Quản trị viên hệ thống qua email support@exam.edu.vn.';
      } else if (userText.toLowerCase().includes('lịch thi') || userText.toLowerCase().includes('phòng thi')) {
        botReply =
          'Lịch thi và thông tin phòng thi được cập nhật realtime trong mục "Lịch thi cá nhân" khi bạn đăng nhập tài khoản sinh viên.';
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 600);
  };

  return (
    <div
      className={`min-h-screen w-full relative overflow-y-auto [scrollbar-gutter:stable] font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#FAFCFF] text-slate-900'
      }`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Background Decorative Vector Waves & Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div
          className="absolute inset-0 w-full h-[600px] opacity-35 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#3B82F6 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)',
          }}
        />
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-blue-200/50 dark:bg-blue-900/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-[700px] h-[700px] bg-sky-100/60 dark:bg-indigo-950/20 rounded-full blur-[150px]" />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex py-3.5 max-w-[1380px] items-center justify-between px-6 sm:px-10">
          <Link href="/login" className="flex items-center gap-3.5 group cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[20px] font-black tracking-tight text-slate-900 dark:text-white leading-none block">
                EXAMSYS
              </span>
              <span className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mt-0.5 block">
                TRUNG TÂM HỖ TRỢ KHẢO THÍ
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Creative Login Action Button with Guaranteed Padding */}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-[13.5px] font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Đăng nhập</span>
              <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/20 text-white transition-transform duration-200 group-hover:translate-x-0.5">
                <LogIn className="h-3.5 w-3.5" />
              </div>
            </button>

            <button
              type="button"
              onClick={toggleDark}
              aria-label="Chuyển chủ đề sáng/tối"
              title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition-colors duration-200 cursor-pointer shadow-2xs"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10 py-10 space-y-12 w-full">
        {/* Search Hero Section */}
        <section className="text-center space-y-5 max-w-3xl mx-auto pt-2">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
            Chúng tôi có thể giúp gì <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-sky-300">
              cho kỳ thi của bạn?
            </span>
          </h1>
          <p className="text-[15px] sm:text-[16px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
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
                className="w-full h-14 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 py-3 pl-12 pr-12 text-[15px] font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition shadow-sm backdrop-blur-sm"
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
              <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xl space-y-2 text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="flex items-center justify-between px-2 text-[12px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
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
                            <span className="shrink-0 text-[11.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                              {art.categoryLabel}
                            </span>
                            <h4 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition truncate">
                              {art.title}
                            </h4>
                          </div>
                          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{art.summary}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Không tìm thấy bài viết phù hợp với "{searchQuery}"
                    </div>
                  )}
                </div>

                {/* Hot Tags */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center gap-1.5 flex-wrap px-1">
                  <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">Từ khóa hot:</span>
                  {popularSearchTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={() => setSearchQuery(tag)}
                      className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[12px] font-semibold px-2.5 py-1 transition cursor-pointer"
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
          <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-2xs space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold transition-transform duration-200 group-hover:scale-105">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Tổng đài hỗ trợ 24/7</h3>
              <p className="text-[14px] text-blue-600 dark:text-blue-400 font-bold mt-1">1800-EXAM-HELP</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Miễn phí cước gọi từ mọi mạng viễn thông</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-2xs space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold transition-transform duration-200 group-hover:scale-105">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Email Tiếp nhận Sự cố</h3>
              <p className="text-[14px] text-blue-600 dark:text-blue-400 font-bold mt-1">support@exam.edu.vn</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Thời gian phản hồi trung bình: dưới 15 phút</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-2xs space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold transition-transform duration-200 group-hover:scale-105">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Văn phòng Khảo thí</h3>
              <p className="text-[14px] text-slate-800 dark:text-slate-200 font-bold mt-1">Tòa nhà A1 - Trung tâm Khảo thí</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">07:30 - 17:00 (Thứ 2 đến Thứ 6)</p>
            </div>
          </div>
        </section>

        {/* FAQs List Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
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
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
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
                  <div key={faq.id} className="transition">
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <HelpCircle className="h-5 w-5 text-blue-600 shrink-0" />
                        <span className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100">
                          {faq.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline-block text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                          {faq.categoryLabel}
                        </span>
                        <ChevronRight
                          className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-90 text-blue-600' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-3 text-[13.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{faq.summary}</p>
                        <div className="space-y-2 pl-3.5 border-l-2 border-blue-500">
                          {faq.content.map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {faq.readTime}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedArticle(faq)}
                            className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem toàn bộ hướng dẫn</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                Không tìm thấy bài viết phù hợp với "{searchQuery}".
              </div>
            )}
          </div>
        </section>

        {/* Submit Support Ticket Form Section */}
        <section className="rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-lg shadow-blue-500/5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Headphones className="h-6 w-6 text-blue-600" />
              <span>Gửi yêu cầu hỗ trợ trực tiếp đến Quản trị viên</span>
            </h2>
            <p className="text-[13.5px] text-slate-500 dark:text-slate-400 font-normal">
              Điền thông tin sự cố hoặc câu hỏi của bạn. Đội ngũ Kỹ thuật Trung tâm Khảo thí sẽ phản hồi qua email trong thời gian sớm nhất.
            </p>
          </div>

          <form onSubmit={handleSendSupportForm} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                  Họ và tên người gửi
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className={`w-full h-[44px] rounded-2xl border px-4 text-[14px] outline-none transition ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                      : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyenvana@exam.edu.vn"
                  className={`w-full h-[44px] rounded-2xl border px-4 text-[14px] outline-none transition ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                      : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                  Vai trò hệ thống
                </label>
                <FilterSelect
                  containerClassName="w-full"
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className={`w-full h-[44px] rounded-2xl border px-4 text-[14px] outline-none transition cursor-pointer ${
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
              <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                Nội dung cần hỗ trợ chi tiết
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả cụ thể sự cố bạn gặp phải (ví dụ: Không đăng nhập được, thiếu môn thi trong lịch thi, lỗi nộp bài...)"
                className={`w-full rounded-2xl border p-4 text-[14px] outline-none transition ${
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
                className="h-[46px] px-7 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
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

      {/* MODAL: Đọc bài viết chi tiết */}
      <Modal
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Chi tiết bài viết'}
      >
        {selectedArticle && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md">
                {selectedArticle.categoryLabel}
              </span>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedArticle.readTime}</span>
                <span>Cập nhật: {selectedArticle.updatedAt}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 p-4 text-xs font-semibold text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900 leading-relaxed">
              {selectedArticle.summary}
            </div>

            <div className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Nội dung chi tiết hướng dẫn:</h5>
              <div className="space-y-2.5 pl-2 border-l-2 border-blue-500">
                {selectedArticle.content.map((paragraph, idx) => (
                  <p key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
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
            onClick={() => setIsChatOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-blue-100 dark:ring-blue-950"
            title="Chat hỗ trợ tự động"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </button>
        ) : (
          <div className="w-80 sm:w-96 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in fade-in zoom-in-95 duration-150">
            {/* Widget Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-[14px] font-bold leading-tight">Hỗ trợ Khảo thí Nhanh</h4>
                  <p className="text-[11px] text-blue-200 font-medium flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Trực tuyến 24/7
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] font-medium leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập câu hỏi cần hỗ trợ..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Page Bottom Footer ── */}
      <footer className="mt-auto relative z-10 w-full py-6 shrink-0 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200/60 dark:border-slate-800/60">
        <p className="flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300 text-[12.5px]">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
