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
  CalendarDays,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
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
      const googleToken = null;
      const googleUserStr = null;
      const googleSuccess = urlParams.get('google') === 'success';
      const googleError = urlParams.get('google_error');

      if (googleError) {
        const decodedError = decodeURIComponent(googleError);
        setError(decodedError);
        setToast({ message: decodedError, type: 'error' });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (googleSuccess) {
        window.history.replaceState({}, document.title, window.location.pathname);
        api.post('/auth/refresh').then((res) => {
          const { accessToken, user } = res.data || {};
          if (!accessToken || !user) throw new Error('Invalid Google session');
          setAuthToken(accessToken, user);
          setToast({ message: 'Đăng nhập bằng Google thành công!', type: 'success' });
          const destination = user.role === 'ADMIN' ? '/dashboard' : user.role === 'TEACHER' ? '/teacher/assignments' : '/student/exam-schedule';
          router.replace(destination);
        }).catch(() => setError('Không thể hoàn tất phiên đăng nhập Google.'));
        return;
      }

      // Legacy query-token flow is intentionally disabled; tokens must never be accepted from the URL.
      if (false && googleToken && googleUserStr) {
        try {
          const userObj = JSON.parse(decodeURIComponent(googleUserStr));
          setAuthToken(decodeURIComponent(googleToken), userObj);
          setToast({ message: 'Đăng nhập bằng Google thành công!', type: 'success' });
          window.history.replaceState({}, document.title, window.location.pathname);

          const destination =
            userObj.role === 'ADMIN'
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
      const destination =
        user.role === 'ADMIN'
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
        const msg =
          err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
        setError(msg);
        setToast({ message: msg, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [username, password, router],
  );

  const inputCls = [
    'w-full h-10 rounded-xl border px-3.5 pl-10 text-xs font-medium placeholder-slate-400 transition duration-150 outline-none',
    'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    isDark
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
      : 'bg-white border-slate-200 text-slate-800 focus:bg-white',
  ].join(' ');

  return (
    <div
      className={[
        'h-screen w-screen overflow-hidden flex font-sans antialiased select-none',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FBFF] text-slate-900',
      ].join(' ')}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ══════════ LEFT PANEL: BRANDING ══════════ */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col bg-gradient-to-br from-[#0038A8] via-[#1D4ED8] to-[#2563EB] relative overflow-hidden shrink-0">
        {/* Subtle Organic Wave & Light Pattern Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-300/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none" />
        <GraduationCap className="absolute -bottom-12 -right-12 w-96 h-96 text-white/[0.04] rotate-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-12 justify-between">
          {/* 1. Top Brand Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 shadow-md flex items-center justify-center shrink-0 backdrop-blur-md">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-blue-200 uppercase">EXAM SYSTEM</p>
                <h1 className="text-sm font-extrabold text-white leading-tight tracking-tight uppercase">
                  HỆ THỐNG QUẢN LÝ KHẢO THÍ
                </h1>
              </div>
            </div>

            {/* 2. Academic Term Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
              <CalendarDays className="w-3.5 h-3.5 text-blue-200" />
              <span>NĂM HỌC 2025 – 2026 &nbsp;•&nbsp; HỌC KỲ II</span>
            </div>

            {/* 3. Hero Titles & Subtitle */}
            <div className="space-y-2 pt-2">
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
                Quản lý khảo thí
              </h2>
              <p className="text-xl xl:text-2xl font-bold text-blue-100/90 leading-snug">
                Đăng nhập tập trung, truy cập nhanh
              </p>
              <p className="text-xs xl:text-sm text-blue-100/80 leading-relaxed font-normal pt-1 max-w-md">
                Đăng nhập một chạm an toàn bằng tài khoản Google.
                <br />
                Hệ thống tự động xác thực và phân quyền
                <br />
                theo vai trò của bạn.
              </p>
            </div>
          </div>

          {/* 4. Three Bottom Feature Cards (Grid 3 Columns) */}
          <div className="grid grid-cols-3 gap-3 my-6">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mb-2.5 shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xs font-bold text-white leading-tight">Xác thực an toàn</h3>
              <p className="text-[11px] text-blue-100/75 mt-1 leading-snug font-normal">
                Đăng nhập bằng Google bảo mật và tin cậy
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mb-2.5 shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xs font-bold text-white leading-tight">Phân quyền tự động</h3>
              <p className="text-[11px] text-blue-100/75 mt-1 leading-snug font-normal">
                Hệ thống tự động xác định vai trò và quyền truy cập
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mb-2.5 shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xs font-bold text-white leading-tight">Truy cập nhanh</h3>
              <p className="text-[11px] text-blue-100/75 mt-1 leading-snug font-normal">
                Một lần đăng nhập, sử dụng mọi tính năng
              </p>
            </div>
          </div>

          {/* 5. Left Panel Footer */}
          <div className="pt-3 border-t border-white/15 flex flex-col gap-1 text-[11px] text-blue-200/80 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              Bảo mật &nbsp;•&nbsp; Tin cậy &nbsp;•&nbsp; Hiệu quả
            </span>
            <span>© 2026 Exam System. All rights reserved.</span>
          </div>
        </div>
      </aside>

      {/* ══════════ RIGHT PANEL: LIGHT & SPACIOUS ══════════ */}
      <main
        className={[
          'flex-1 h-full flex flex-col overflow-hidden relative justify-between',
          isDark ? 'bg-slate-950' : 'bg-[#F8FBFF]',
        ].join(' ')}
      >
        {/* Soft Organic Dotted Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none dark:opacity-10" />

        {/* Top Header Bar (Theme Toggle) */}
        <div className="relative z-10 flex justify-between items-center p-6 shrink-0">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">EXAM SYSTEM</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Hệ thống khảo thí</p>
            </div>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={toggleDark}
              aria-label="Chuyển chủ đề sáng/tối"
              className={[
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition duration-200 cursor-pointer shadow-2xs',
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Tối</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Centered Login Card Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div
            className={[
              'w-full max-w-[460px] rounded-3xl border transition-all duration-300 overflow-hidden',
              isDark
                ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50'
                : 'bg-white border-slate-100 shadow-xl shadow-slate-900/5',
            ].join(' ')}
          >
            <div className="p-8 sm:p-10">
              {/* Blue Brand Marker Line */}
              <div className="w-12 h-1 rounded-full bg-[#2563EB] mb-6" />

              {/* Card Title & Subtitle */}
              <div className="mb-6 space-y-1.5">
                <h2
                  className={[
                    'text-2xl font-bold tracking-tight leading-tight',
                    isDark ? 'text-white' : 'text-[#0F172A]',
                  ].join(' ')}
                >
                  Đăng nhập hệ thống
                </h2>
                <p
                  className={[
                    'text-xs sm:text-sm font-normal leading-relaxed',
                    isDark ? 'text-slate-400' : 'text-[#64748B]',
                  ].join(' ')}
                >
                  Sử dụng tài khoản Google để truy cập nhanh và an toàn.
                  <br />
                  Hệ thống tự động xác định vai trò của bạn theo email.
                </p>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Main Google Login CTA Button */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={[
                    'w-full h-12 flex items-center justify-between px-5 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer border shadow-2xs',
                    'bg-[#F4F8FF] hover:bg-[#EAF2FF] border-[#BFDBFE] text-slate-800',
                    'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700/80',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}</span>
                  </div>
                  {!loading && <ArrowRight className="w-4 h-4 text-slate-500" />}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
                <span className="flex-shrink mx-4 text-xs font-medium text-slate-400">Hoặc</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
              </div>

              {/* Internal Login Accordion Section */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowManualLogin((prev) => !prev)}
                  className={[
                    'w-full h-12 px-4 rounded-2xl border transition flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer',
                    isDark
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-[#F8FAFC] border-slate-200/80 text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Đăng nhập bằng tài khoản nội bộ</span>
                  </div>
                  {showManualLogin ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showManualLogin && (
                  <form onSubmit={handleManualLogin} noValidate className="space-y-3 pt-2 animate-fade-in">
                    <div>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mật khẩu"
                          className={[inputCls, 'pr-10'].join(' ')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
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

              {/* Support Footer */}
              <div
                className={[
                  'mt-8 pt-6 border-t text-center',
                  isDark ? 'border-slate-800' : 'border-slate-100',
                ].join(' ')}
              >
                <p
                  className={[
                    'flex items-center justify-center gap-2 text-xs sm:text-sm font-normal',
                    isDark ? 'text-slate-400' : 'text-slate-600',
                  ].join(' ')}
                >
                  <Headphones className="w-4 h-4 text-slate-500" />
                  <span>Cần hỗ trợ?</span>
                  <button
                    type="button"
                    onClick={() => router.push('/contact')}
                    className="text-[#2563EB] hover:text-[#1D4ED8] font-bold transition cursor-pointer hover:underline"
                  >
                    Liên hệ quản trị hệ thống
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 py-2" />
      </main>
    </div>
  );
}
