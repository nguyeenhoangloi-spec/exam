'use client';
/* eslint-disable react/no-unescaped-entities */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  LogIn,
  ChevronRight,
  Headphones,
  Mail,
  Phone,
  Building2,
  HelpCircle,
  BookOpen,
  Send,
  MessageSquare,
  X,
  FileText,
  GraduationCap,
  Sparkles,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Toast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/Button';
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

export default function ContactSupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

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

  // Knowledge Base Articles
  const articles = useMemo<ArticleItem[]>(() => [
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
  ], []);

  // Quick Suggestion Tags
  const popularSearchTags = [
    'Quên mật khẩu',
    'Rớt mạng 1800',
    'Xem số báo danh',
    'Ngân hàng câu hỏi',
    'Nộp phúc khảo',
    'Quy chế phòng thi',
  ];

  // Filtered Articles & Suggestions based on search
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-md group-hover:scale-105 transition">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
                EXAM SUPPORT CENTER
              </span>
              <span className="block text-[12px] font-semibold text-blue-600 dark:text-blue-400 leading-tight">
                Trung tâm Hỗ trợ Khảo thí
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-[6px] text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              <span>Tiếng Việt</span>
            </div>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
        {/* Search Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-[6px] text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Hệ thống giải đáp sự cố thi tự động 24/7</span>
          </div>

          <h1 className="text-[28px] leading-[36px] font-semibold tracking-tight text-slate-900 dark:text-white">
            Chúng tôi có thể giúp gì cho bạn?
          </h1>

          {/* Big Search Bar with Autocomplete Suggestions */}
          <div className="relative max-w-2xl mx-auto shadow-xl shadow-blue-950/5 rounded-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm hướng dẫn, quy chế thi, câu hỏi thường gặp..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-4 pl-12 pr-10 text-[15px] font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Search Suggestions Dropdown */}
            {(isSearchFocused || searchQuery.trim().length > 0) && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xl space-y-2 text-left animate-in fade-in zoom-in-95 duration-150">
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
                        className="p-2.5 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 rounded-xl transition cursor-pointer flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                              {art.categoryLabel}
                            </span>
                            <h4 className="text-[14px] leading-5 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition truncate">
                              {art.title}
                            </h4>
                          </div>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{art.summary}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Không tìm thấy gợi ý phù hợp với "{searchQuery}"
                    </div>
                  )}
                </div>

                {/* Tag Pills */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1.5 flex-wrap px-1">
                  <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">Từ khóa hot:</span>
                  {popularSearchTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={() => setSearchQuery(tag)}
                      className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[12px] font-semibold px-2 py-1 transition cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Breadcrumb path indicator */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push('/login')}>
              Trang chủ
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Trung tâm Hỗ trợ</span>
          </div>
        </div>

        {/* Featured Big Category Box matching OpenAI ChatGPT Help Center Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-semibold text-xl shadow-lg">
            <GraduationCap className="h-8 w-8 text-blue-400" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Hệ thống quản lý khảo thí
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              Tổng hợp toàn bộ tài liệu hướng dẫn, quy chế phòng thi, xử lý sự cố kỹ thuật và liên hệ Quản trị viên dành cho Sinh viên & Giảng viên.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsAllArticlesModalOpen(true)}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Tất cả bài viết
          </Button>
        </div>

        {/* Support Direct Contacts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tổng đài hỗ trợ 24/7</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">1800-EXAM-HELP (1800-3926-4357)</p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500">Miễn phí cước gọi từ mọi mạng điện thoại</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Email Tiếp nhận Sự cố</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">support@exam.edu.vn</p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500">Thời gian phản hồi trung bình: 15 phút</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Văn phòng Khảo thí</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tầng 3, Tòa nhà A1 - Trung tâm Khảo thí</p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500">Giờ làm việc: 07:30 - 17:00 (Thứ 2 - Thứ 6)</p>
          </div>
        </div>

        {/* FAQs List Matching OpenAI Expandable List items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Câu hỏi & Hướng dẫn thường gặp (FAQs)
            </h2>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
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
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                    activeCategory === pill.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className="transition">
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {faq.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                          {faq.categoryLabel}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-90 text-blue-600' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{faq.summary}</p>
                        <div className="space-y-1.5 pl-3 border-l-2 border-blue-500">
                          {faq.content.map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                        <div className="pt-2 flex items-center justify-between text-[12px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {faq.readTime}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedArticle(faq)}
                            className="font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem chi tiết bài viết</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                Không tìm thấy bài viết hoặc hướng dẫn phù hợp với từ khóa "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Submit Support Ticket Form Section */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Headphones className="h-5 w-5 text-blue-600" />
              <span>Gửi yêu cầu hỗ trợ trực tiếp đến Quản trị viên</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Điền thông tin sự cố hoặc thắc mắc của bạn bên dưới. Đội ngũ Kỹ thuật Trung tâm Khảo thí sẽ phản hồi qua email trong thời gian nhanh nhất.
            </p>
          </div>

          <form onSubmit={handleSendSupportForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[15px] font-medium text-slate-800 dark:text-slate-200">
                  Họ và tên người gửi
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[15px] font-medium text-slate-800 dark:text-slate-200">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyenvana@exam.edu.vn"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[15px] font-medium text-slate-800 dark:text-slate-200">
                  Vai trò hệ thống
                </label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="TEACHER">Giảng viên</option>
                  <option value="OTHER">Cán bộ / Khác</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[15px] font-medium text-slate-800 dark:text-slate-200">
                Nội dung cần hỗ trợ chi tiết
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả cụ thể sự cố bạn gặp phải (ví dụ: Không đăng nhập được, thiếu môn thi trong lịch thi, lỗi nộp bài...)"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={sending}
                isLoading={sending}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Gửi yêu cầu hỗ trợ
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* MODAL 1: Tất cả bài viết & Hướng dẫn hệ thống */}
      <Modal
        isOpen={isAllArticlesModalOpen}
        onClose={() => setIsAllArticlesModalOpen(false)}
        title="Danh mục tất cả bài viết & hướng dẫn quản lý khảo thí"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Danh sách {articles.length} bài viết hướng dẫn sử dụng và quy chế phòng thi chính thức.
            </p>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {articles.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  setIsAllArticlesModalOpen(false);
                  setSelectedArticle(art);
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-700 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                    {art.categoryLabel}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {art.readTime}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition">
                  {art.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">{art.summary}</p>
                <div className="pt-1 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Đọc bài viết
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Đọc bài viết chi tiết */}
      <Modal
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Chi tiết bài viết'}
      >
        {selectedArticle && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {selectedArticle.categoryLabel}
              </span>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedArticle.readTime}</span>
                <span>Cập nhật: {selectedArticle.updatedAt}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50/70 p-4 text-xs font-semibold text-blue-900 border border-blue-100 leading-relaxed">
              {selectedArticle.summary}
            </div>

            <div className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Nội dung chi tiết hướng dẫn:</h5>
              <div className="space-y-2.5 pl-2 border-l-2 border-blue-500">
                {selectedArticle.content.map((paragraph, idx) => (
                  <p key={idx} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Thẻ liên quan:</span>
              {selectedArticle.tags.map((t) => (
                <span key={t} className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
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
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 hover:bg-black text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer border border-slate-700"
            title="Chat hỗ trợ tự động"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </button>
        ) : (
          <div className="w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[450px] animate-in fade-in zoom-in-95 duration-150">
            {/* Widget Header */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-[14px] leading-5 font-semibold">Hỗ trợ Khảo thí Nhanh</h4>
                  <p className="text-[12px] text-blue-300 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Trực tuyến
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
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
                placeholder="Nhập câu hỏi hỗ trợ..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
