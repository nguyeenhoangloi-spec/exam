'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthToken, getAuthUser, setAuthToken } from '../../lib/auth';
import { Toast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GraduationCap,
  Headphones,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  User as UserIcon,
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

    const params = new URLSearchParams(window.location.search);
    const googleSuccess = params.get('google') === 'success';
    const googleError = params.get('google_error');

    if (googleError) {
      const message = decodeURIComponent(googleError);
      setError(message);
      setToast({ message, type: 'error' });
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

    const token = getAuthToken();
    const user = getAuthUser();
    if (token && user) {
      const destination = user.role === 'ADMIN' ? '/dashboard' : user.role === 'TEACHER' ? '/teacher/assignments' : '/student/exam-schedule';
      router.replace(destination);
    }
  }, [router]);

  const toggleDark = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous;
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

  const handleManualLogin = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
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
      const message = err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      setError(message);
      setToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [password, router, username]);

  const inputClassName = [
    'h-11 w-full rounded-xl border px-3.5 pl-10 text-[15px] font-normal outline-none transition',
    'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
    isDark ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400',
  ].join(' ');

  return (
    <div className={['flex min-h-screen w-screen font-sans antialiased', isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'].join(' ')}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 lg:flex lg:w-[42%] xl:w-[44%]">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[30rem] w-[30rem] rounded-full bg-blue-900/20 blur-3xl" />
        <GraduationCap className="absolute -bottom-12 -right-16 h-80 w-80 rotate-12 text-white/[0.045]" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-blue-100/80">Exam System</p>
                <p className="text-sm font-semibold text-white">Hệ thống quản lý khảo thí</p>
              </div>
            </div>

            <div className="mt-14 max-w-md">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-sm">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Năm học 2025 – 2026 · Học kỳ II</span>
              </div>
              <h1 className="edu-page-title text-white">Mọi kỳ thi, trong một không gian rõ ràng.</h1>
              <p className="mt-5 max-w-sm text-[15px] leading-7 text-blue-50/80">Đăng nhập để quản lý lịch thi, đề thi và kết quả theo đúng vai trò của bạn.</p>
            </div>
          </div>

          <div className="max-w-sm border-t border-white/20 pt-5 text-xs leading-6 text-blue-100/75">
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Xác thực an toàn · Phân quyền tự động</p>
            <p className="mt-1">© 2026 Exam System</p>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between p-5 sm:p-7">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm"><GraduationCap className="h-5 w-5 text-white" /></div>
            <div><p className="text-xs font-semibold">Exam System</p><p className="text-xs font-medium text-blue-600">Hệ thống khảo thí</p></div>
          </div>
          <button type="button" onClick={toggleDark} aria-label="Chuyển chủ đề sáng/tối" className={['ml-auto flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition', isDark ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'].join(' ')}>
            {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-600" />}
            <span>{isDark ? 'Sáng' : 'Tối'}</span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
          <section className={['w-full max-w-[430px] rounded-3xl border p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-9', isDark ? 'border-slate-800 bg-slate-900 shadow-black/30' : 'border-slate-200/80 bg-white'].join(' ')}>
            <div className="mb-8">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><ShieldCheck className="h-5 w-5" /></div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Chào mừng trở lại</p>
              <h2 className="edu-card-title mt-1.5 tracking-tight">Đăng nhập hệ thống</h2>
              <p className={['mt-3 text-sm leading-6', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>Chọn phương thức đăng nhập phù hợp với tài khoản của bạn.</p>
            </div>

            {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}

            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <span className="flex items-center gap-3"><svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path fill="var(--ui-brand-google-blue)" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="var(--ui-brand-google-green)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="var(--ui-brand-google-yellow)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="var(--ui-brand-google-red)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>{loading ? 'Đang kết nối Google…' : 'Đăng nhập bằng Google'}</span>
              {!loading && <ArrowRight className="h-4 w-4 text-slate-400" />}
            </button>

            <div className="my-7 flex items-center gap-3 text-xs font-medium text-slate-400"><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /><span>hoặc</span><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /></div>

            <button type="button" onClick={() => setShowManualLogin((previous) => !previous)} className={['flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition', isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-800 hover:bg-slate-50'].join(' ')}>
              <span className="flex items-center gap-3"><UserIcon className="h-4 w-4 text-slate-500" /> Tài khoản nội bộ</span>
              {showManualLogin ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {showManualLogin && <form onSubmit={handleManualLogin} noValidate className="mt-4 space-y-3">
              <div className="relative"><UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tên đăng nhập hoặc mã số" className={inputClassName} /></div>
              <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu" className={[inputClassName, 'pr-10'].join(' ')} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              <Button type="submit" variant="secondary" size="md" disabled={loading || !username || !password} isLoading={loading} className="w-full">Đăng nhập nội bộ</Button>
            </form>}

            <div className={['mt-8 border-t pt-6 text-center text-sm', isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'].join(' ')}><p className="flex flex-wrap items-center justify-center gap-2"><Headphones className="h-4 w-4 text-slate-400" /> Cần hỗ trợ? <button type="button" onClick={() => router.push('/contact')} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Liên hệ quản trị hệ thống</button></p></div>
          </section>
        </div>
      </main>
    </div>
  );
}
