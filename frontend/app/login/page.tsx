'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { getAuthToken, getAuthUser, setAuthToken } from '../../lib/auth';
import { Toast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  GraduationCap,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User as UserIcon,
  Users,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setToast({ message, type: 'error' });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (googleSuccess) {
      window.history.replaceState({}, document.title, window.location.pathname);
      api
        .post('/auth/refresh')
        .then((res) => {
          const { accessToken, user } = res.data || {};
          if (!accessToken || !user) throw new Error('Invalid Google session');
          setAuthToken(accessToken, user);
          setToast({ message: 'Đăng nhập bằng Google thành công!', type: 'success' });
          const destination =
            user.role === 'ADMIN'
              ? '/dashboard'
              : user.role === 'TEACHER'
              ? '/teacher/assignments'
              : '/student/exam-schedule';
          router.replace(destination);
        })
        .catch(() => setToast({ message: 'Không thể hoàn tất phiên đăng nhập Google.', type: 'error' }));
      return;
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

  const handleManualLogin = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!username.trim() || !password) {
        setToast({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', type: 'error' });
        return;
      }

      setLoading(true);
      try {
        const res = await api.post('/auth/login', { username: username.trim(), password });
        const { accessToken, user } = res.data;
        setAuthToken(accessToken, user);
        if (user.role === 'ADMIN') router.replace('/dashboard');
        else if (user.role === 'TEACHER') router.replace('/teacher/assignments');
        else router.replace('/student/exam-schedule');
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
        setToast({ message, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [password, router, username]
  );

  return (
    <div
      className={`min-h-screen w-full relative overflow-y-auto [scrollbar-gutter:stable] font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[var(--ui-page)] text-slate-900'
      }`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Background Decorative Vector Waves & Dynamic Mesh ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Academic geometric grid pattern */}
        <div
          className="absolute top-6 left-1/4 w-[800px] h-96 opacity-30 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(var(--ui-chart-primary-light) 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Vibrant Glows */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-blue-200/60 dark:bg-blue-900/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/4 -right-32 w-[700px] h-[700px] bg-sky-100/70 dark:bg-blue-950/20 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-10 w-[700px] h-[500px] bg-blue-50/90 dark:bg-slate-900/40 rounded-full blur-[120px]" />

        {/* Abstract Smooth Flow Waves */}
        <svg
          className="absolute bottom-0 left-0 w-full max-w-6xl h-80 opacity-35 dark:opacity-10"
          viewBox="0 0 1000 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 220 C200 140, 400 290, 650 180 C820 100, 920 250, 1100 200"
            stroke="var(--ui-chart-primary-light)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-50 250 C230 170, 430 320, 680 210 C850 130, 950 280, 1100 230"
            stroke="var(--ui-chart-primary-light)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-50 280 C260 200, 460 340, 710 240 C880 160, 980 300, 1100 260"
            stroke="var(--ui-chart-primary-light)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* ── Top Header Navigation (Fixed & Sleek) ── */}
      <header className="relative z-10 w-full max-w-[1380px] mx-auto px-6 sm:px-10 pt-7 pb-3 shrink-0 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5 group cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50 transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="h-6.5 w-6.5" />
          </div>
          <div>
            <span className="text-type-section font-semibold tracking-tight text-slate-900 dark:text-white block">
              EXAMSYS
            </span>
            <p className="text-type-helper font-semibold tracking-wider text-blue-600 dark:text-blue-400 mt-1">
              HỆ THỐNG KHẢO THÍ ĐIỆN TỬ
            </p>
          </div>
        </div>

        {/* Right Actions: Minimal Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Chuyển chủ đề sáng/tối"
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition-all duration-200 cursor-pointer shadow-2xs"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      {/* ── Main Section: Big Bold 2-Column Showcase Layout ── */}
      <main className="relative z-10 max-w-[1380px] mx-auto px-6 sm:px-10 pt-6 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start w-full">
        {/* ── Left Column: Large Showcase (7 Cols ~ 58%) ── */}
        <section className="lg:col-span-7 flex flex-col justify-start space-y-8">
          {/* Main Large Headline with Gradient Text */}
          <div className="space-y-3.5">
            <h1 className="text-type-page sm:text-type-display-sm lg:text-type-display font-semibold tracking-tight text-slate-900 dark:text-white">
              HỆ THỐNG <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-blue-300">
                KHẢO THÍ TRỰC TUYẾN
              </span>
            </h1>
            <p className="text-type-body sm:text-type-card text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Giải pháp toàn diện cho quản lý kỳ thi, tổ chức thi trắc nghiệm và phân tích kết quả học thuật minh bạch, chính xác.
            </p>
          </div>

          {/* Center 3D Isometric Art & Interactive Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* 4 Key Features Column */}
            <div className="sm:col-span-5 space-y-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-3.5 p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/90 dark:hover:bg-slate-900/70 hover:shadow-xs group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Bảo mật cao
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    Mã hóa chuẩn quốc tế
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3.5 p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/90 dark:hover:bg-slate-900/70 hover:shadow-xs group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Quản lý toàn diện
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    Từ đề thi đến chấm điểm
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3.5 p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/90 dark:hover:bg-slate-900/70 hover:shadow-xs group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Phân tích thông minh
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    Thống kê & biểu đồ trực quan
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-3.5 p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/90 dark:hover:bg-slate-900/70 hover:shadow-xs group cursor-default">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Tiết kiệm thời gian
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    Tối ưu hiệu suất làm việc
                  </p>
                </div>
              </div>
            </div>

            {/* Academic 3D Centerpiece with Floating Badges */}
            <div className="sm:col-span-7 flex justify-center items-center relative py-2">
              <div className="relative w-full max-w-[460px] aspect-[4/3] flex items-center justify-center transition-transform duration-500 hover:scale-[1.02]">
                {/* Soft Radial Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/30 via-sky-200/25 to-blue-300/20 dark:from-blue-900/25 dark:to-blue-950/20 rounded-full blur-3xl animate-pulse" />

                {/* Floating Micro Badge 1: Test Check */}
                <div className="absolute -top-3 left-28 z-20 h-11 w-11 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <FileCheck2 className="h-5.5 w-5.5" />
                </div>

                {/* Floating Micro Badge 2: Chart */}
                <div className="absolute top-16 right-0 z-20 h-11 w-11 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <BarChart3 className="h-5.5 w-5.5" />
                </div>

                {/* 3D Vector Isometric Exam Illustration */}
                <svg
                  className="w-full h-full relative z-10 drop-shadow-2xl transition-all duration-500"
                  viewBox="0 0 420 320"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--ui-surface)" />
                      <stop offset="100%" stopColor="var(--ui-surface-muted)" />
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--ui-primary)" />
                      <stop offset="100%" stopColor="var(--ui-primary-hover)" />
                    </linearGradient>
                    <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--ui-chart-primary-light)" />
                      <stop offset="100%" stopColor="var(--ui-primary-hover)" />
                    </linearGradient>
                    <linearGradient id="book1Grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--ui-primary-hover)" />
                      <stop offset="100%" stopColor="var(--ui-chart-primary-light)" />
                    </linearGradient>
                    <linearGradient id="book2Grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--ui-primary)" />
                      <stop offset="100%" stopColor="var(--ui-chart-primary-light)" />
                    </linearGradient>
                  </defs>

                  {/* Monitor Desk Shadow */}
                  <ellipse cx="205" cy="275" rx="85" ry="14" fill="var(--ui-border)" opacity="0.4" />

                  {/* Monitor Stand Base & Pole */}
                  <ellipse cx="205" cy="265" rx="42" ry="8" fill="var(--ui-text-disabled)" />
                  <ellipse cx="205" cy="263" rx="42" ry="8" fill="var(--ui-border)" />
                  <path d="M197 215 L213 215 L211 262 L199 262 Z" fill="var(--ui-text-disabled)" />
                  <path d="M199 215 L211 215 L209 262 L201 262 Z" fill="var(--ui-border)" />

                  {/* Monitor Screen Frame */}
                  <rect x="75" y="80" width="260" height="150" rx="16" fill="var(--ui-surface)" stroke="var(--ui-border)" strokeWidth="4" />
                  <rect x="85" y="90" width="240" height="130" rx="10" fill="url(#screenGrad)" />

                  {/* Monitor Screen Header */}
                  <path d="M85 100 C85 94.48 89.48 90 95 90 L315 90 C320.52 90 325 94.48 325 100 L325 110 L85 110 Z" fill="var(--ui-primary)" />
                  <circle cx="100" cy="100" r="3" fill="var(--ui-chart-danger)" />
                  <circle cx="110" cy="100" r="3" fill="var(--ui-chart-warning)" />
                  <circle cx="120" cy="100" r="3" fill="var(--ui-chart-success)" />
                  <rect x="140" y="96" width="130" height="8" rx="4" fill="var(--ui-surface)" opacity="0.4" />

                  {/* Exam Form Questions & Radio Options */}
                  <g transform="translate(100, 125)">
                    <rect x="0" y="0" width="130" height="8" rx="3" fill="var(--ui-text-disabled)" />
                    <rect x="0" y="12" width="90" height="6" rx="2" fill="var(--ui-text-disabled)" opacity="0.6" />

                    {/* Option A (Selected) */}
                    <g transform="translate(0, 26)">
                      <rect x="0" y="0" width="14" height="14" rx="4" fill="var(--ui-primary)" />
                      <text x="3" y="11" fill="var(--ui-surface)" fontSize="10" fontWeight="700" fontFamily="var(--font-inter)">A</text>
                      <rect x="22" y="2" width="12" height="12" rx="3" fill="var(--ui-surface-muted)" stroke="var(--ui-primary)" strokeWidth="1.5" />
                      <path d="M25 8 L27 10 L31 5" stroke="var(--ui-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="42" y="4" width="70" height="6" rx="2" fill="var(--ui-border)" />
                    </g>

                    {/* Option B */}
                    <g transform="translate(0, 48)">
                      <rect x="0" y="0" width="14" height="14" rx="4" fill="var(--ui-border)" />
                      <text x="3" y="11" fill="var(--ui-text-disabled)" fontSize="10" fontWeight="700" fontFamily="var(--font-inter)">B</text>
                      <rect x="22" y="2" width="12" height="12" rx="3" fill="var(--ui-surface)" stroke="var(--ui-border)" strokeWidth="1.5" />
                      <rect x="42" y="4" width="85" height="6" rx="2" fill="var(--ui-border)" />
                    </g>

                    {/* Option C */}
                    <g transform="translate(0, 70)">
                      <rect x="0" y="0" width="14" height="14" rx="4" fill="var(--ui-border)" />
                      <text x="3" y="11" fill="var(--ui-text-disabled)" fontSize="10" fontWeight="700" fontFamily="var(--font-inter)">C</text>
                      <rect x="22" y="2" width="12" height="12" rx="3" fill="var(--ui-surface)" stroke="var(--ui-border)" strokeWidth="1.5" />
                      <rect x="42" y="4" width="60" height="6" rx="2" fill="var(--ui-border)" />
                    </g>
                  </g>

                  {/* 3D Graduation Cap on Top of Monitor */}
                  <g transform="translate(195, 20)">
                    <path d="M20 50 Q45 68 70 50 L70 65 Q45 83 20 65 Z" fill="var(--ui-primary-hover)" />
                    <path d="M22 52 Q45 70 68 52 L68 62 Q45 80 22 62 Z" fill="var(--ui-primary)" />
                    <polygon points="45,22 92,42 45,62 -2,42" fill="var(--ui-primary-hover)" />
                    <polygon points="45,26 88,43 45,60 2,43" fill="url(#capGrad)" />
                    <circle cx="45" cy="43" r="3.5" fill="var(--ui-chart-warning)" />
                    <path d="M45 43 Q65 46 76 72" stroke="var(--ui-chart-warning)" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <circle cx="76" cy="74" r="3.5" fill="var(--ui-chart-warning)" />
                  </g>

                  {/* Floating A+ Exam Paper on Bottom Left */}
                  <g transform="translate(50, 200)">
                    <rect x="0" y="0" width="75" height="92" rx="8" fill="var(--ui-surface)" stroke="var(--ui-border)" strokeWidth="2.5" />
                    <rect x="12" y="14" width="50" height="6" rx="2" fill="var(--ui-text-disabled)" />
                    <rect x="12" y="26" width="35" height="4" rx="2" fill="var(--ui-border)" />
                    <rect x="12" y="34" width="45" height="4" rx="2" fill="var(--ui-border)" />
                    <circle cx="48" cy="62" r="17" fill="var(--ui-surface-muted)" stroke="var(--ui-primary)" strokeWidth="2" strokeDasharray="3 3" />
                    <text x="38" y="68" fill="var(--ui-primary)" fontSize="16" fontWeight="700" fontFamily="var(--font-inter)">A+</text>
                  </g>

                  {/* 3D Stack of Academic Books at Bottom Right */}
                  <g transform="translate(265, 215)">
                    <rect x="0" y="26" width="95" height="22" rx="4" fill="url(#book1Grad)" />
                    <rect x="88" y="30" width="7" height="14" rx="1.5" fill="var(--ui-surface-muted)" />
                    <rect x="8" y="10" width="85" height="20" rx="4" fill="url(#book2Grad)" />
                    <rect x="85" y="14" width="7" height="12" rx="1.5" fill="var(--ui-surface-muted)" />
                  </g>

                  {/* 3D Security Shield Badge with Checkmark */}
                  <g transform="translate(285, 125)">
                    <path
                      d="M28 0 L56 12 L56 34 C56 55 28 66 28 66 C28 66 0 55 0 34 L0 12 Z"
                      fill="url(#shieldGrad)"
                      stroke="var(--ui-surface)"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M17 32 L25 40 L40 21"
                      stroke="var(--ui-surface)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Trust Statistics Cards */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-type-card sm:text-type-section font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  10,000+
                </p>
                <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">Người dùng</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Award className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-type-card sm:text-type-section font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  50,000+
                </p>
                <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">Kỳ thi tổ chức</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-type-card sm:text-type-section font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  99.9%
                </p>
                <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">Độ tin cậy</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Large Modern Academic Login Form Card (5 Cols ~ 42%) ── */}
        <section className="lg:col-span-5 flex justify-center w-full items-start">
          <div
            className={`w-full max-w-[460px] rounded-3xl border p-8 sm:p-9 transition-all duration-300 ${
              isDark
                ? 'border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl'
                : 'border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.12),0_10px_25px_-5px_rgba(0,0,0,0.04)] backdrop-blur-sm'
            }`}
          >
            {/* Top User Avatar Circle */}
            <div className="text-center mb-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-blue-50 to-blue-100/80 dark:from-blue-950/80 dark:to-blue-900/40 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200/80 dark:border-blue-800/80 shadow-xs">
                <UserIcon className="h-8 w-8" />
              </div>
              <h2 className="text-type-section font-semibold text-slate-900 dark:text-white tracking-tight">
                Đăng nhập hệ thống
              </h2>
              <p className="text-type-body text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                Chào mừng bạn quay trở lại!
              </p>
            </div>

            {/* ── HERO PRIMARY ACTION: Google OAuth Login Button (Tactile Elevated 3D) ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`group relative flex h-[50px] w-full items-center justify-center gap-3 rounded-2xl px-5 text-type-body font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${
                isDark
                  ? 'border border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-850 text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.3)] hover:border-blue-500/70 hover:from-slate-750 hover:to-slate-800 hover:shadow-[0_12px_28px_-4px_rgba(66,133,244,0.3)]'
                  : 'border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/90 text-slate-800 shadow-[0_4px_14px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] hover:border-blue-300 hover:from-blue-50/30 hover:via-white hover:to-white hover:text-blue-700 hover:shadow-[0_14px_30px_-4px_rgba(66,133,244,0.22),0_4px_10px_-2px_rgba(0,0,0,0.04)]'
              } hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.985] active:shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:shadow-none`}
            >
              {/* Subtle Ambient Light Sheen on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Icon Container with Smooth Micro-Animation */}
              <div className="flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
                {loading ? (
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5.5 h-5.5 shrink-0"
                    width="22"
                    height="22"
                    style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px' }}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="var(--ui-brand-google-blue)"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="var(--ui-brand-google-green)"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="var(--ui-brand-google-yellow)"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="var(--ui-brand-google-red)"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.49 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
              </div>

              <span className="tracking-tight text-type-body">
                {loading ? 'Đang kết nối tài khoản Google...' : 'Đăng nhập với Google'}
              </span>
            </button>

            {/* Subtle Divider */}
            <div className="my-5 flex items-center gap-3 text-type-helper font-semibold text-slate-400">
              <div className="h-px flex-1 bg-slate-200/90 dark:bg-slate-800" />
              <span>hoặc</span>
              <div className="h-px flex-1 bg-slate-200/90 dark:bg-slate-800" />
            </div>

            {/* ── Collapsible Internal Login Section ── */}
            <div className="space-y-1.5">
              {/* Clean Frameless Trigger Button */}
              <button
                type="button"
                onClick={() => setShowManualLogin((prev) => !prev)}
                className="w-full h-11 px-4 flex items-center justify-center gap-2.5 text-type-body font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <UserIcon className="h-4.5 w-4.5 text-slate-400 group-hover:text-blue-500" />
                <span>Đăng nhập tài khoản nội bộ</span>
                <ChevronDown
                  className={`h-4.5 w-4.5 transition-transform duration-300 ease-in-out ${
                    showManualLogin ? 'rotate-180 text-blue-600' : 'rotate-0 text-slate-400'
                  }`}
                />
              </button>

              {/* Smooth Animated Collapsible Form Container */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  showManualLogin
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <form onSubmit={handleManualLogin} noValidate className="space-y-4 pt-3 pb-1">
                    {/* Username / Email Input */}
                    <div className="space-y-1.5">
                      <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                        Email hoặc tên đăng nhập
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Nhập email hoặc tên đăng nhập"
                          required
                          className={`w-full h-12 rounded-xl border pl-12 pr-4 text-type-body outline-none transition ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu"
                          required
                          className={`w-full h-12 rounded-xl border pl-12 pr-12 text-type-body outline-none transition ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div className="flex items-center justify-between text-type-body-sm pt-1">
                      <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4.5 w-4.5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Ghi nhớ</span>
                      </label>
                      <Link
                        href="/forgot-password"
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                    {/* Primary Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !username || !password}
                      className={`w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.985] active:shadow-xs text-white font-semibold text-type-body shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer mt-2 ${
                        loading
                          ? 'disabled:opacity-100 disabled:text-white'
                          : 'disabled:from-slate-200 disabled:via-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:opacity-100 dark:disabled:from-slate-700 dark:disabled:via-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-300'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2 text-white">
                          <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-white">Đang xác thực...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4.5 w-4.5" />
                          <span>Đăng nhập</span>
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Card Footer Help Link */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center text-type-body-sm text-slate-500 dark:text-slate-400">
              <p>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/contact')}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Liên hệ quản trị hệ thống
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Page Bottom Footer ── */}
      <footer className="mt-auto relative z-10 w-full py-5 shrink-0 text-center text-type-helper text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300 text-type-helper">
          <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-type-helper text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
