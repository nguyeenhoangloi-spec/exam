'use client';

import React, { useState } from 'react';
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
  ShieldAlert,
  Send,
  CheckCircle2,
  MessageSquare,
  X,
  FileText,
  UserCheck,
  GraduationCap,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Toast } from '../../components/Toast';
import api from '../../lib/api';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function ContactSupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

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
      text: 'Xin chào! Bạn cần trợ giúp gì về Hệ thống Quản lý Khảo thí hôm nay?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'STUDENT',
      question: 'Tôi phải làm gì nếu bị mất kết nối internet khi đang làm bài thi online?',
      answer:
        'Hệ thống tự động lưu trạng thái làm bài (Auto-save) sau mỗi 5 giây. Nếu gián đoạn mạng, bạn không bị mất dữ liệu. Hãy nhanh chóng kết nối lại internet hoặc liên hệ Cán bộ coi thi / Hotline 1800-EXAM-HELP để được cấp lại thời gian làm bài bù.',
    },
    {
      id: 'faq-2',
      category: 'STUDENT',
      question: 'Xem lịch thi cá nhân và số báo danh ở đâu trên hệ thống?',
      answer:
        'Bạn đăng nhập tài khoản Sinh viên và truy cập mục "Lịch thi cá nhân". Tại đây hiển thị đầy đủ ca thi, môn thi, số báo danh, phòng thi và thời gian thi chi tiết.',
    },
    {
      id: 'faq-3',
      category: 'TEACHER',
      question: 'Cách Giảng viên tạo và duyệt Ngân hàng câu hỏi theo chuẩn Bloom?',
      answer:
        'Giảng viên vào mục "Ngân hàng câu hỏi", chọn "Thêm câu hỏi mới" hoặc dùng công cụ "Nhập từ file Excel/Word". Câu hỏi sau khi tạo sẽ được gửi lên Trưởng bộ môn duyệt trước khi đưa vào ngân hàng đề thi.',
    },
    {
      id: 'faq-4',
      category: 'ADMIN',
      question: 'Cách xử lý khi tài khoản bị khóa hoặc quên thông tin đăng nhập?',
      answer:
        'Bạn có thể sử dụng chức năng "Quên mật khẩu" ở màn hình đăng nhập hoặc gửi yêu cầu hỗ trợ trực tiếp bên dưới. Quản trị viên hệ thống sẽ kiểm tra và cấp lại mật khẩu trong vòng 15 phút.',
    },
    {
      id: 'faq-5',
      category: 'STUDENT',
      question: 'Quy trình nộp đơn phúc khảo và xem kết quả chấm thi?',
      answer:
        'Sinh viên vào mục "Kết quả & Báo cáo", chọn môn thi cần phúc khảo và nhấn "Gửi yêu cầu phúc khảo". Kết quả sẽ được Phòng Khảo thí cập nhật và thông báo trên hệ thống.',
    },
  ];

  const filteredFaqs = faqs.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
        message: res?.data?.message || 'Yêu cầu hỗ trợ đã được gửi thành công! Quản trị viên sẽ phản hồi qua email trong thời gian sớm nhất.',
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
        botReply = 'Để khôi phục mật khẩu, bạn vui lòng truy cập trang Quên mật khẩu hoặc liên hệ Quản trị viên hệ thống qua email support@exam.edu.vn.';
      } else if (userText.toLowerCase().includes('lịch thi') || userText.toLowerCase().includes('phòng thi')) {
        botReply = 'Lịch thi và thông tin phòng thi được cập nhật realtime trong mục "Lịch thi cá nhân" khi bạn đăng nhập tài khoản sinh viên.';
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* OpenAI Help Center Style Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo & System Name */}
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-md group-hover:scale-105 transition">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                EXAM SUPPORT CENTER
              </span>
              <span className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-tight">
                Trung tâm Hỗ trợ Khảo thí
              </span>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              <span>Tiếng Việt</span>
            </div>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
        {/* Search Hero Section matching OpenAI Help Center */}
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-300 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Hệ thống giải đáp sự cố thi tự động 24/7</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Chúng tôi có thể giúp gì cho bạn?
          </h1>

          {/* Big Search Bar */}
          <div className="relative max-w-2xl mx-auto shadow-xl shadow-blue-950/5 rounded-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm hướng dẫn, quy chế thi, câu hỏi thường gặp..."
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition"
            />
          </div>

          {/* Breadcrumb path indicator */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push('/login')}>
              Trang chủ
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-slate-900 dark:text-slate-100">Trung tâm Hỗ trợ</span>
          </div>
        </div>

        {/* Featured Big Category Box matching OpenAI ChatGPT Help Center Card */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-2xl shadow-lg">
            <GraduationCap className="h-8 w-8 text-blue-400" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Hệ thống Quản lý Khảo thí
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              Tổng hợp toàn bộ tài liệu hướng dẫn, quy chế phòng thi, xử lý sự cố kỹ thuật và liên hệ Quản trị viên dành cho Sinh viên & Giảng viên.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 text-xs font-bold transition shrink-0 cursor-pointer"
          >
            <span>Tất cả bài viết</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Support Direct Contacts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Tổng đài Hỗ trợ 24/7</h3>
            <p className="text-xs text-slate-500 font-semibold">1800-EXAM-HELP (1800-3926-4357)</p>
            <p className="text-[11px] text-slate-400">Miễn phí cước gọi từ mọi mạng điện thoại</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Email Tiếp nhận Sự cố</h3>
            <p className="text-xs text-slate-500 font-semibold">support@exam.edu.vn</p>
            <p className="text-[11px] text-slate-400">Thời gian phản hồi trung bình: 15 phút</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Văn phòng Khảo thí</h3>
            <p className="text-xs text-slate-500 font-semibold">Tầng 3, Tòa nhà A1 - Trung tâm Khảo thí</p>
            <p className="text-[11px] text-slate-400">Giờ làm việc: 07:30 - 17:00 (Thứ 2 - Thứ 6)</p>
          </div>
        </div>

        {/* FAQs List Matching OpenAI Expandable List items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Câu hỏi thường gặp (FAQs)
            </h2>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'STUDENT', label: 'Sinh viên' },
                { id: 'TEACHER', label: 'Giảng viên' },
                { id: 'ADMIN', label: 'Quản trị viên' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveCategory(pill.id)}
                  className={`rounded-full px-3 py-1 text-xs font-extrabold transition cursor-pointer ${activeCategory === pill.id
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
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {faq.question}
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90 text-blue-600' : ''
                          }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                Không tìm thấy bài viết hoặc hướng dẫn phù hợp với từ khóa "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Submit Support Ticket Form Section */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Headphones className="h-5 w-5 text-blue-600" />
              <span>Gửi yêu cầu hỗ trợ trực tiếp đến Quản trị viên</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Điền thông tin sự cố hoặc thắc mắc của bạn bên dưới. Đội ngũ Kỹ thuật Trung tâm Khảo thí sẽ phản hồi qua email trong thời gian nhanh nhất.
            </p>
          </div>

          <form onSubmit={handleSendSupportForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  Họ và tên người gửi
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyenvana@exam.edu.vn"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  Vai trò hệ thống
                </label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="TEACHER">Giảng viên</option>
                  <option value="OTHER">Cán bộ / Khác</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                Nội dung cần hỗ trợ chi tiết
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả cụ thể sự cố bạn gặp phải (ví dụ: Không đăng nhập được, thiếu môn thi trong lịch thi, lỗi nộp bài...)"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-black shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu hỗ trợ'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Floating Support Chat Widget matching OpenAI Help Center Bottom Right Button */}
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-xs font-black">Hỗ trợ Khảo thí Nhanh</h4>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed ${msg.sender === 'user'
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
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập câu hỏi hỗ trợ..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
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
