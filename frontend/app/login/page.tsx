'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { getAuthToken, getAuthUser, setAuthToken } from '../../lib/auth';
import { Toast } from '../../components/Toast';
import {
  Award,
  BarChart3,
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
        .catch(() => setError('Không thể hoàn tất phiên đăng nhập Google.'));
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
      setError('');
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
        setError(message);
        setToast({ message, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [password, router, username]
  );

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden [scrollbar-gutter:stable] font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#FAFCFF] text-slate-900'
      }`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Background Decorative Vector Waves & Grids ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Subtle grid dots pattern */}
        <div
          className="absolute top-8 left-1/3 w-[500px] h-60 opacity-35 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#3B82F6 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-blue-100/70 dark:bg-blue-900/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[650px] h-[650px] bg-sky-100/60 dark:bg-indigo-950/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-10 w-[700px] h-[400px] bg-blue-50/80 dark:bg-slate-900/40 rounded-full blur-[100px]" />

        {/* Abstract Flowing Vector Wave at Bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full max-w-4xl h-64 opacity-30 dark:opacity-10"
          viewBox="0 0 900 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 220 C180 140, 350 290, 580 180 C750 100, 850 250, 1000 200"
            stroke="#93C5FD"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-50 250 C210 170, 380 320, 610 210 C780 130, 880 280, 1000 230"
            stroke="#60A5FA"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-50 280 C240 200, 410 340, 640 240 C810 160, 910 300, 1000 260"
            stroke="#3B82F6"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 w-full max-w-[1380px] mx-auto px-6 sm:px-10 pt-6 pb-2 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[19px] font-black tracking-tight text-slate-900 dark:text-white block leading-none">
              EXAMSYS
            </span>
            <span className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mt-1 block">
              HỆ THỐNG KHẢO THÍ
            </span>
          </div>
        </div>

        {/* Minimal Icon-Only Theme Toggle */}
        <button
          type="button"
          onClick={toggleDark}
          aria-label="Chuyển chủ đề sáng/tối"
          title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-200 cursor-pointer"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </button>
      </header>

      {/* ── Main Section: 2-Column Desktop Grid (Spacious & Balanced) ── */}
      <main className="relative z-10 max-w-[1380px] mx-auto px-6 sm:px-10 pt-4 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start w-full flex-1">
        {/* ── Left Column: System Showcase (7 Cols ~ 58%) ── */}
        <section className="lg:col-span-7 flex flex-col space-y-8">
          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              HỆ THỐNG <br />
              <span className="text-blue-600 dark:text-blue-500">KHẢO THÍ TRỰC TUYẾN</span>
            </h1>
            <p className="text-[15px] sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Giải pháp toàn diện cho quản lý kỳ thi, tổ chức đánh giá và phân tích kết quả học tập chuyên nghiệp.
            </p>
          </div>

          {/* 3D Isometric Academic Centerpiece with Visual Depth */}
          <div className="relative w-full max-w-[520px] aspect-[16/10] mx-auto flex items-center justify-center py-2">
            {/* Ambient Radial Glow */}
            <div className="absolute inset-4 bg-gradient-to-tr from-blue-200/50 via-sky-100/40 to-blue-300/30 dark:from-blue-900/25 dark:to-indigo-950/20 rounded-full blur-3xl" />

            {/* Floating Glass Pill Badge: Security */}
            <div className="absolute top-2 -left-2 sm:left-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md border border-slate-100/90 dark:border-slate-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Bảo mật cao</span>
            </div>

            {/* Floating Glass Pill Badge: Smart Analytics */}
            <div className="absolute top-4 -right-2 sm:right-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md border border-slate-100/90 dark:border-slate-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Phân tích thông minh</span>
            </div>

            {/* Floating Glass Pill Badge: Fast grading */}
            <div className="absolute -bottom-2 -left-2 sm:left-6 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md border border-slate-100/90 dark:border-slate-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Tiết kiệm thời gian</span>
            </div>

            {/* 3D Vector Isometric Exam Illustration */}
            <svg
              className="w-full h-full relative z-10 drop-shadow-2xl"
              viewBox="0 0 460 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#F8FAFC" />
                </linearGradient>
                <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="book1Grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="book2Grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>

              {/* Monitor Shadow */}
              <ellipse cx="230" cy="285" rx="100" ry="16" fill="#CBD5E1" opacity="0.4" />

              {/* Monitor Base */}
              <ellipse cx="230" cy="275" rx="46" ry="9" fill="#94A3B8" />
              <ellipse cx="230" cy="273" rx="46" ry="9" fill="#CBD5E1" />
              <path d="M221 220 L239 220 L237 272 L223 272 Z" fill="#94A3B8" />
              <path d="M223 220 L237 220 L235 272 L225 272 Z" fill="#CBD5E1" />

              {/* Monitor Body */}
              <rect x="90" y="75" width="280" height="160" rx="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="4" />
              <rect x="100" y="85" width="260" height="140" rx="12" fill="url(#screenGrad)" />

              {/* Monitor Top Bar */}
              <path d="M100 97 C100 90.37 105.37 85 112 85 L348 85 C354.63 85 360 90.37 360 97 L360 108 L100 108 Z" fill="#2563EB" />
              <circle cx="118" cy="96" r="3.5" fill="#EF4444" />
              <circle cx="129" cy="96" r="3.5" fill="#F59E0B" />
              <circle cx="140" cy="96" r="3.5" fill="#10B981" />
              <rect x="165" y="93" width="130" height="7" rx="3.5" fill="#FFFFFF" opacity="0.4" />

              {/* Test Content */}
              <g transform="translate(120, 120)">
                <rect x="0" y="0" width="140" height="8" rx="3" fill="#64748B" />
                <rect x="0" y="13" width="95" height="6" rx="2" fill="#94A3B8" opacity="0.5" />

                {/* Option A Checked */}
                <g transform="translate(0, 28)">
                  <rect x="0" y="0" width="15" height="15" rx="4" fill="#2563EB" />
                  <text x="3.5" y="11.5" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A</text>
                  <rect x="24" y="2" width="13" height="13" rx="3" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
                  <path d="M27 8 L30 11 L35 5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="46" y="5" width="80" height="6" rx="2" fill="#CBD5E1" />
                </g>

                {/* Option B */}
                <g transform="translate(0, 52)">
                  <rect x="0" y="0" width="15" height="15" rx="4" fill="#E2E8F0" />
                  <text x="3.5" y="11.5" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">B</text>
                  <rect x="24" y="2" width="13" height="13" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                  <rect x="46" y="5" width="100" height="6" rx="2" fill="#CBD5E1" />
                </g>

                {/* Option C */}
                <g transform="translate(0, 76)">
                  <rect x="0" y="0" width="15" height="15" rx="4" fill="#E2E8F0" />
                  <text x="3.5" y="11.5" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">C</text>
                  <rect x="24" y="2" width="13" height="13" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                  <rect x="46" y="5" width="65" height="6" rx="2" fill="#CBD5E1" />
                </g>
              </g>

              {/* Graduation Cap */}
              <g transform="translate(215, 12)">
                <path d="M20 50 Q48 70 76 50 L76 66 Q48 86 20 66 Z" fill="#1E3A8A" />
                <path d="M22 52 Q48 72 74 52 L74 63 Q48 83 22 63 Z" fill="#2563EB" />
                <polygon points="48,20 98,42 48,64 -2,42" fill="#172554" />
                <polygon points="48,24 94,43 48,62 2,43" fill="url(#capGrad)" />
                <circle cx="48" cy="43" r="4" fill="#F59E0B" />
                <path d="M48 43 Q70 46 82 74" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="82" cy="76" r="3.5" fill="#D97706" />
              </g>

              {/* Floating A+ Paper */}
              <g transform="translate(60, 205)">
                <rect x="0" y="0" width="80" height="96" rx="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                <rect x="14" y="15" width="52" height="6" rx="2" fill="#94A3B8" />
                <rect x="14" y="28" width="38" height="4" rx="2" fill="#E2E8F0" />
                <rect x="14" y="37" width="46" height="4" rx="2" fill="#E2E8F0" />
                <circle cx="50" cy="66" r="18" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
                <text x="39" y="73" fill="#2563EB" fontSize="18" fontWeight="900" fontFamily="sans-serif">A+</text>
              </g>

              {/* 3D Stack of Academic Books */}
              <g transform="translate(295, 220)">
                <rect x="0" y="28" width="105" height="24" rx="5" fill="url(#book1Grad)" />
                <rect x="96" y="32" width="8" height="16" rx="2" fill="#F8FAFC" />
                <rect x="10" y="10" width="95" height="22" rx="5" fill="url(#book2Grad)" />
                <rect x="94" y="14" width="8" height="14" rx="2" fill="#F8FAFC" />
              </g>

              {/* 3D Security Shield */}
              <g transform="translate(320, 120)">
                <path
                  d="M30 0 L60 13 L60 36 C60 58 30 70 30 70 C30 70 0 58 0 36 L0 13 Z"
                  fill="url(#shieldGrad)"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 34 L27 43 L43 23"
                  stroke="#FFFFFF"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            </svg>
          </div>

          {/* 4 Feature Highlights in a Clean 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-100/90 dark:border-slate-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">Bảo mật cao</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dữ liệu mã hóa theo chuẩn quốc tế</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-100/90 dark:border-slate-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <FileCheck2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">Quản lý toàn diện</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Từ đề thi, tổ chức thi đến chấm điểm</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-100/90 dark:border-slate-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <BarChart3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">Phân tích thông minh</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Báo cáo chi tiết và biểu đồ trực quan</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-100/90 dark:border-slate-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">Tiết kiệm thời gian</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tự động hóa quy trình chấm và thi</p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Statistics */}
          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shadow-2xs">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  10,000+
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Người dùng</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shadow-2xs">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  50,000+
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Kỳ thi đã tổ chức</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  99.9%
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Độ tin cậy hệ thống</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Modern Academic Login Form Card (5 Cols ~ 42%) ── */}
        <section className="lg:col-span-5 flex justify-center w-full">
          <div
            className={`w-full max-w-[460px] rounded-[32px] border p-8 sm:p-9 transition-all duration-300 ${
              isDark
                ? 'border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl'
                : 'border-slate-100/90 bg-white shadow-[0_20px_50px_-15px_rgba(37,99,235,0.08),0_10px_25px_-5px_rgba(0,0,0,0.03)] backdrop-blur-sm'
            }`}
          >
            {/* Top User Avatar Circle */}
            <div className="text-center mb-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 border border-blue-100/80 dark:border-blue-900 shadow-inner">
                <UserIcon className="h-8 w-8" />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">
                Đăng nhập hệ thống
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
                Chào mừng bạn quay trở lại!
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-medium leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 flex items-start gap-2">
                <span className="shrink-0 text-rose-600 font-bold">•</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── HERO PRIMARY ACTION: Google OAuth Login Button ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/90 bg-white px-4 text-[15px] font-bold text-slate-800 shadow-2xs transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.49 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
            </button>

            {/* Subtle Divider */}
            <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400">
              <div className="h-px flex-1 bg-slate-200/90 dark:bg-slate-800" />
              <span>hoặc sử dụng tài khoản</span>
              <div className="h-px flex-1 bg-slate-200/90 dark:bg-slate-800" />
            </div>

            {/* ── Collapsible Internal Login Section ── */}
            <div className="space-y-1.5">
              {/* Trigger Button to Expand/Collapse Form */}
              <button
                type="button"
                onClick={() => setShowManualLogin((prev) => !prev)}
                className={`w-full h-11 rounded-2xl border px-4 flex items-center justify-between text-[13.5px] font-semibold transition-all duration-300 cursor-pointer ${
                  showManualLogin
                    ? 'border-blue-300 bg-blue-50/40 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-200/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                  <span>Đăng nhập nội bộ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-normal text-slate-400">
                    {showManualLogin ? 'Thu gọn' : 'Nhấn để mở form'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                      showManualLogin ? 'rotate-180 text-blue-600' : 'rotate-0 text-slate-400'
                    }`}
                  />
                </div>
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
                  <form onSubmit={handleManualLogin} noValidate className="space-y-3.5 pt-3 pb-1">
                    {/* Username / Email Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                        Email hoặc tên đăng nhập
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Nhập email hoặc tên đăng nhập"
                          required
                          className={`w-full h-[46px] rounded-2xl border pl-10 pr-4 text-[14px] outline-none transition ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu"
                          required
                          className={`w-full h-[46px] rounded-2xl border pl-10 pr-11 text-[14px] outline-none transition ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Ghi nhớ đăng nhập</span>
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
                      className="w-full h-[46px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-sm shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer mt-1"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang xác thực...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Đăng nhập</span>
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Card Footer Help Link */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center text-xs text-slate-500 dark:text-slate-400">
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
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 mt-auto">
        <p className="flex items-center justify-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-[11.5px] text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
