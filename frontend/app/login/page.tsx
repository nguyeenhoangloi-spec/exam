'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthToken, getAuthUser, setAuthToken } from '../../lib/auth';
import { Toast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  Headphones,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  MonitorCheck,
  Users,
  Award,
  Library,
  ScrollText,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Xử lý kết quả trả về từ Google OAuth Redirect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get('google_token');
      const googleUserStr = urlParams.get('google_user');
      const googleError = urlParams.get('google_error');

      if (googleError) {
        const decodedError = decodeURIComponent(googleError);
        setError(decodedError);
        setToast({ message: decodedError, type: 'error' });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (googleToken && googleUserStr) {
        try {
          const userObj = JSON.parse(decodeURIComponent(googleUserStr));
          setAuthToken(decodeURIComponent(googleToken), userObj);
          setToast({ message: 'Đăng nhập bằng Google thành công!', type: 'success' });
          window.history.replaceState({}, document.title, window.location.pathname);

          const destination = userObj.role === 'ADMIN'
            ? '/dashboard'
            : userObj.role === 'TEACHER'
              ? '/teacher/assignments'
              : '/student/exam-schedule';
          router.replace(destination);
          return;
        } catch {
          // ignore fallback
        }
      }
    }

    const token = getAuthToken();
    const user = getAuthUser();
    if (token && user) {
      const destination = user.role === 'ADMIN'
        ? '/dashboard'
        : user.role === 'TEACHER'
          ? '/teacher/assignments'
          : '/student/exam-schedule';
      router.replace(destination);
    }
  }, [router]);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const handleGoogleLogin = useCallback(() => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.location.href = `${apiBase}/auth/google`;
  }, []);

  const handleManualLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password) {
        setToast({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', type: 'error' });
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/login', { username: username.trim(), password });
        const { accessToken, user } = res.data;
        setAuthToken(accessToken, user);
        if (user.role === 'ADMIN') router.replace('/dashboard');
        else if (user.role === 'TEACHER') router.replace('/teacher/assignments');
        else router.replace('/student/exam-schedule');
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
        setError(msg);
        setToast({ message: msg, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [username, password, router]
  );

  const inputCls = [
    'w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs font-medium placeholder-slate-400 transition duration-200 outline-none',
    'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white',
  ].join(' ');

  return (
    <div
      className={[
        'h-screen w-screen overflow-hidden flex font-sans antialiased',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-blue-50 text-slate-900',
      ].join(' ')}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ══════════ LEFT 40% ══════════ */}
      <aside className="hidden lg:flex lg:w-[40%] flex-col bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-400/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <GraduationCap className="absolute -bottom-12 -right-12 w-72 h-72 text-white/[0.04] rotate-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-10">
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 shadow-md flex items-center justify-center shrink-0">
              <GraduationCap className="w-7 h-7 text-blue-200" />
            </div>
            <div>
              <p className="text-[9.5px] font-bold tracking-[0.25em] text-blue-300 uppercase">Exam System</p>
              <p className="text-[13px] font-black text-white leading-tight tracking-tight">HỆ THỐNG QUẢN LÝ KHẢO THÍ</p>
            </div>
          </div>

          <div className="my-5 flex items-center gap-2.5 shrink-0">
            <div className="flex-1 h-px bg-gradient-to-r from-blue-400/40 to-transparent" />
            <ScrollText className="w-3 h-3 text-blue-400/70" />
            <div className="flex-1 h-px bg-gradient-to-l from-blue-400/40 to-transparent" />
          </div>

          <div className="shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-200 text-[13px] font-semibold tracking-wide uppercase">
              <CalendarDays className="w-3.5 h-3.5" />
              Năm học 2025 – 2026 &nbsp;•&nbsp; Học kỳ II
            </div>
            <h2 className="mt-3.5 text-[28px] xl:text-[32px] font-bold text-white leading-[1.2] tracking-tight">
              Quản lý khảo thí
              <span className="block text-blue-300">Đăng nhập Google tập trung</span>
            </h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-blue-100/80 font-normal max-w-xs">
              Đăng nhập một chạm an toàn bằng tài khoản Google. Hệ thống tự động xác thực vai trò Admin, Giảng viên hoặc Sinh viên theo email của bạn.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-5 shrink-0">
            {[
              { icon: Lock, label: 'Bảo mật Google OAuth', desc: 'Xác thực Google SSO an toàn' },
              { icon: BarChart3, label: 'Tự động phân quyền', desc: 'Tự động định tuyến vai trò' },
              { icon: FileSpreadsheet, label: 'Chuẩn hóa tài khoản', desc: 'Đã tích hợp cơ sở dữ liệu' },
              { icon: MonitorCheck, label: 'Truy cập tức thì', desc: 'Đăng nhập 1-Click nhanh chóng' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 rounded-xl bg-white/[0.07] border border-white/10 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-400/20 border border-blue-300/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-200" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-snug">{label}</p>
                  <p className="text-[13px] text-blue-100/70 mt-0.5 leading-snug font-normal">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto shrink-0">
            <div className="grid grid-cols-3 border-t border-white/12 pt-4">
              {[
                { icon: Library, value: 'Chuẩn hóa', label: 'Ngân hàng câu hỏi' },
                { icon: Users, value: 'Trực tuyến', label: 'Giám sát phòng thi' },
                { icon: Award, value: 'Tự động', label: 'Sinh đề & chấm điểm' },
              ].map(({ icon: Icon, value, label }, i) => (
                <div key={label} className={['py-3', i < 2 ? 'border-r border-white/12 pr-3' : 'pl-3'].join(' ')}>
                  <div className="flex items-center gap-1">
                    <Icon className="w-4 h-4 text-blue-300" />
                    <span className="text-lg font-bold text-white">{value}</span>
                  </div>
                  <p className="text-[13px] text-blue-100/70 mt-0.5 font-normal">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[13px] text-blue-100/70 font-normal">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/80" />
                Đạt chuẩn quy chế đào tạo tín chỉ
              </span>
              <span>© 2026 Exam System. All rights reserved.</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════ RIGHT 60% ══════════ */}
      <main
        className={[
          'flex-1 h-full flex flex-col overflow-hidden relative',
          isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200',
        ].join(' ')}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Theme toggle */}
        <div className="relative z-10 flex justify-end p-4 shrink-0">
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Chuyển chủ đề sáng/tối"
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[15px] font-medium border transition duration-200 cursor-pointer',
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            {isDark ? <><Sun className="w-4 h-4 text-amber-400" /><span>Sáng</span></> : <><Moon className="w-4 h-4" /><span>Tối</span></>}
          </button>
        </div>

        {/* Card */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-4 overflow-hidden">
          <div
            className={[
              'w-full max-w-[440px] rounded-3xl border shadow-2xl transition-colors duration-300 overflow-hidden',
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/60' : 'bg-white border-slate-200/80 shadow-slate-200/80',
            ].join(' ')}
          >
            <div className="p-8 sm:p-9">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 mb-6" />

              {/* Mobile logo */}
              <div className="flex lg:hidden items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-slate-900">EXAM SYSTEM</p>
                  <p className="text-[13px] font-semibold tracking-wider text-blue-600 uppercase">Hệ thống quản lý khảo thí</p>
                </div>
              </div>

              {/* Header */}
              <div className="mb-6">
                <h2 className={['text-[24px] font-semibold tracking-tight leading-tight', isDark ? 'text-white' : 'text-[#0F172A]'].join(' ')}>
                  Đăng nhập hệ thống
                </h2>
                <p className={['mt-1.5 text-[15px] font-normal leading-relaxed', isDark ? 'text-slate-400' : 'text-[#64748B]'].join(' ')}>
                  Sử dụng tài khoản Google để truy cập nhanh. Hệ thống tự động xác định vai trò của bạn theo email.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[15px] font-medium flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Main Google Login Button */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 px-5 text-[15px] font-medium transition-all duration-200 cursor-pointer border shadow-md hover:shadow-lg active:scale-[0.99] bg-white border-slate-200 text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}</span>
                  {!loading && <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-slate-600 ml-auto" />}
                </button>
              </div>

              {/* Optional Manual Login Accordion (For Dev / Admin Local Access) */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualLogin((prev) => !prev)}
                  className={['w-full flex items-center justify-between text-[15px] font-medium transition cursor-pointer', isDark ? 'text-slate-400 hover:text-slate-200' : 'text-[#64748B] hover:text-[#0F172A]'].join(' ')}
                >
                  <span>Hoặc đăng nhập bằng tài khoản nội bộ</span>
                  {showManualLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showManualLogin && (
                  <form onSubmit={handleManualLogin} noValidate className="space-y-3 mt-4 animate-fade-in">
                    <div>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Tên đăng nhập hoặc mã số"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mật khẩu"
                          className={[inputCls, 'pr-10'].join(' ')}
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={loading || !username || !password}
                      isLoading={loading}
                      className="w-full"
                    >
                      Đăng nhập nội bộ
                    </Button>
                  </form>
                )}
              </div>

              {/* Footer support */}
              <div className={['mt-5 pt-4 border-t text-center', isDark ? 'border-slate-800' : 'border-slate-100'].join(' ')}>
                <p className={['flex items-center justify-center gap-1.5 text-[15px] font-normal', isDark ? 'text-slate-400' : 'text-[#64748B]'].join(' ')}>
                  <Headphones className="w-4 h-4" />
                  Cần hỗ trợ?{' '}
                  <button type="button" onClick={() => router.push('/contact')} className="text-blue-600 hover:text-blue-700 font-bold transition cursor-pointer">Liên hệ quản trị hệ thống</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
