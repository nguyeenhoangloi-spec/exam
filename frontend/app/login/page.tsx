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
      className={`h-screen max-h-screen w-full relative overflow-hidden [scrollbar-gutter:stable] font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#FAFCFF] text-slate-900'
      }`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Background Decorative Vector Waves & Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Subtle grid pattern */}
        <div
          className="absolute top-6 left-1/3 w-[600px] h-60 opacity-30 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#3B82F6 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute -top-28 -left-28 w-[500px] h-[500px] bg-blue-100/70 dark:bg-blue-900/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 -right-28 w-[550px] h-[550px] bg-sky-100/60 dark:bg-indigo-950/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-36 left-10 w-[600px] h-[350px] bg-blue-50/80 dark:bg-slate-900/40 rounded-full blur-[90px]" />

        {/* Vector Flow Waves */}
        <svg
          className="absolute bottom-0 left-0 w-full max-w-4xl h-56 opacity-30 dark:opacity-10"
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
      <header className="relative z-10 w-full max-w-[1360px] mx-auto px-6 sm:px-10 pt-4 pb-1 shrink-0 flex items-center justify-between">
        {/* Brand Logo with Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                EXAMSYS
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống sẵn sàng
              </span>
            </div>
            <p className="text-[10.5px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mt-0.5">
              HỆ THỐNG KHẢO THÍ ĐIỆN TỬ
            </p>
          </div>
        </div>

        {/* Minimal Icon-Only Theme Toggle */}
        <button
          type="button"
          onClick={toggleDark}
          aria-label="Chuyển chủ đề sáng/tối"
          title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-200 cursor-pointer"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </header>

      {/* ── Main Section: 2-Column Desktop Grid (Fits 100vh Perfectly) ── */}
      <main className="relative z-10 max-w-[1360px] mx-auto px-6 sm:px-10 py-1 min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
        {/* ── Left Column: System Showcase (7 Cols ~ 58%) ── */}
        <section className="lg:col-span-7 flex flex-col justify-between h-full py-1 space-y-3">
          {/* Main Headline */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              HỆ THỐNG <br />
              <span className="text-blue-600 dark:text-blue-500">KHẢO THÍ TRỰC TUYẾN</span>
            </h1>
            <p className="text-[13.5px] sm:text-[14px] text-slate-600 dark:text-slate-300 max-w-lg font-normal leading-relaxed">
              Giải pháp toàn diện cho quản lý kỳ thi, tổ chức thi trắc nghiệm và phân tích kết quả học thuật.
            </p>
          </div>

          {/* Center Area: 4 Features & 3D Centerpiece side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto">
            {/* 4 Key Features Column */}
            <div className="sm:col-span-5 space-y-2.5">
              {/* Feature 1 */}
              <div className="flex items-start gap-2.5 group">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition duration-200 group-hover:scale-105 shadow-2xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Bảo mật cao</h2>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Mã hóa chuẩn quốc tế
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-2.5 group">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition duration-200 group-hover:scale-105 shadow-2xs">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Quản lý toàn diện</h2>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Từ đề thi đến chấm điểm
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-2.5 group">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition duration-200 group-hover:scale-105 shadow-2xs">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Phân tích thông minh</h2>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Thống kê & biểu đồ trực quan
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-2.5 group">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition duration-200 group-hover:scale-105 shadow-2xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Tiết kiệm thời gian</h2>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Tối ưu hiệu suất làm việc
                  </p>
                </div>
              </div>
            </div>

            {/* Academic 3D Centerpiece */}
            <div className="sm:col-span-7 flex justify-center items-center relative py-1">
              <div className="relative w-full max-w-[320px] aspect-[4/3] flex items-center justify-center">
                {/* Soft Ambient Glow */}
                <div className="absolute inset-0 bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-xl" />

                {/* Floating Micro Badge: Test Check */}
                <div className="absolute -top-1 left-20 z-20 h-7.5 w-7.5 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600">
                  <FileCheck2 className="h-3.5 w-3.5" />
                </div>

                {/* Floating Micro Badge: Chart */}
                <div className="absolute top-12 right-0 z-20 h-7.5 w-7.5 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>

                {/* 3D Vector Isometric Exam Illustration */}
                <svg
                  className="w-full h-full relative z-10 drop-shadow-lg"
                  viewBox="0 0 420 320"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#F1F5F9" />
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

                  {/* Monitor Desk Shadow */}
                  <ellipse cx="205" cy="275" rx="85" ry="14" fill="#CBD5E1" opacity="0.4" />

                  {/* Monitor Stand Base & Pole */}
                  <ellipse cx="205" cy="265" rx="42" ry="8" fill="#94A3B8" />
                  <ellipse cx="205" cy="263" rx="42" ry="8" fill="#CBD5E1" />
                  <path d="M197 215 L213 215 L211 262 L199 262 Z" fill="#94A3B8" />
                  <path d="M199 215 L211 215 L209 262 L201 262 Z" fill="#CBD5E1" />

                  {/* Monitor Screen Frame */}
                  <rect x="75" y="80" width="260" height="150" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="4" />
                  <rect x="85" y="90" width="240" height="130" rx="10" fill="url(#screenGrad)" />

                  {/* Monitor Screen Header */}
                  <path d="M85 100 C85 94.48 89.48 90 95 90 L315 90 C320.52 90 325 94.48 325 100 L325 110 L85 110 Z" fill="#2563EB" />
                  <circle cx="100" cy="100" r="3" fill="#EF4444" />
                  <circle cx="110" cy="100" r="3" fill="#F59E0B" />
                  <circle cx="120" cy="100" r="3" fill="#10B981" />
                  <rect x="140" y="96" width="130" height="8" rx="4" fill="#FFFFFF" opacity="0.4" />

                  {/* Exam Form Questions & Radio Options */}
                  <g transform="translate(100, 125)">
                    <rect x="0" y="0" width="130" height="8" rx="3" fill="#64748B" />
                    <rect x="0" y="12" width="90" height="6" rx="2" fill="#94A3B8" opacity="0.6" />

                    {/* Option A (Selected) */}
                    <g transform="translate(0, 26)">
                      <rect x="0" y="0" width="14" height="14" rx="4" fill="#2563EB" />
                      <text x="3" y="11" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A</text>
                      <rect x="22" y="2" width="12" height="12" rx="3" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
                      <path d="M25 8 L27 10 L31 5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="42" y="4" width="70" height="6" rx="2" fill="#CBD5E1" />
                    </g>

                    {/* Option B */}
                    <g transform="translate(0, 48)">
                      <rect x="0" y="0" width="14" height="14" rx="4" fill="#E2E8F0" />
                      <text x="3" y="11" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">B</text>
                      <rect x="22" y="2" width="12" height="12" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                      <rect x="42" y="4" width="85" height="6" rx="2" fill="#CBD5E1" />
                    </g>

                    {/* Option C */}
                    <g transform="translate(0, 70)">
                      <rect x="0" y="0" width="14" height="14" rx="4" fill="#E2E8F0" />
                      <text x="3" y="11" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">C</text>
                      <rect x="22" y="2" width="12" height="12" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                      <rect x="42" y="4" width="60" height="6" rx="2" fill="#CBD5E1" />
                    </g>
                  </g>

                  {/* 3D Graduation Cap on Top of Monitor */}
                  <g transform="translate(195, 20)">
                    <path d="M20 50 Q45 68 70 50 L70 65 Q45 83 20 65 Z" fill="#1E3A8A" />
                    <path d="M22 52 Q45 70 68 52 L68 62 Q45 80 22 62 Z" fill="#2563EB" />
                    <polygon points="45,22 92,42 45,62 -2,42" fill="#172554" />
                    <polygon points="45,26 88,43 45,60 2,43" fill="url(#capGrad)" />
                    <circle cx="45" cy="43" r="3.5" fill="#F59E0B" />
                    <path d="M45 43 Q65 46 76 72" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <circle cx="76" cy="74" r="3.5" fill="#D97706" />
                  </g>

                  {/* Floating A+ Exam Paper on Bottom Left */}
                  <g transform="translate(50, 200)">
                    <rect x="0" y="0" width="75" height="92" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                    <rect x="12" y="14" width="50" height="6" rx="2" fill="#94A3B8" />
                    <rect x="12" y="26" width="35" height="4" rx="2" fill="#E2E8F0" />
                    <rect x="12" y="34" width="45" height="4" rx="2" fill="#E2E8F0" />
                    <circle cx="48" cy="62" r="17" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
                    <text x="38" y="68" fill="#2563EB" fontSize="16" fontWeight="900" fontFamily="sans-serif">A+</text>
                  </g>

                  {/* 3D Stack of Academic Books at Bottom Right */}
                  <g transform="translate(265, 215)">
                    <rect x="0" y="26" width="95" height="22" rx="4" fill="url(#book1Grad)" />
                    <rect x="88" y="30" width="7" height="14" rx="1.5" fill="#F8FAFC" />
                    <rect x="8" y="10" width="85" height="20" rx="4" fill="url(#book2Grad)" />
                    <rect x="85" y="14" width="7" height="12" rx="1.5" fill="#F8FAFC" />
                  </g>

                  {/* 3D Security Shield Badge with Checkmark */}
                  <g transform="translate(285, 125)">
                    <path
                      d="M28 0 L56 12 L56 34 C56 55 28 66 28 66 C28 66 0 55 0 34 L0 12 Z"
                      fill="url(#shieldGrad)"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M17 32 L25 40 L40 21"
                      stroke="#FFFFFF"
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

          {/* Bottom Trust Statistics */}
          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  10,000+
                </p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">Người dùng</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  50,000+
                </p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">Kỳ thi đã tổ chức</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  99.9%
                </p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">Độ tin cậy</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Modern Academic Login Form Card (5 Cols ~ 42%) ── */}
        <section className="lg:col-span-5 flex justify-center w-full">
          <div
            className={`w-full max-w-[420px] rounded-[26px] border p-5 sm:p-6 transition-all duration-300 ${
              isDark
                ? 'border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl'
                : 'border-slate-100/90 bg-white shadow-[0_15px_40px_-10px_rgba(37,99,235,0.08),0_6px_16px_-3px_rgba(0,0,0,0.03)] backdrop-blur-sm'
            }`}
          >
            {/* Top User Avatar Circle */}
            <div className="text-center mb-3.5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-1.5 border border-blue-100/80 dark:border-blue-900 shadow-inner">
                <UserIcon className="h-6 w-6" />
              </div>
              <h2 className="text-[21px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">
                Đăng nhập hệ thống
              </h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                Chào mừng bạn quay trở lại!
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 flex items-start gap-2">
                <span className="shrink-0 text-rose-600 font-bold">•</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── HERO PRIMARY ACTION: Google OAuth Login Button ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-[44px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/90 bg-white px-4 text-[13.5px] font-bold text-slate-800 shadow-2xs transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <svg
                className="w-5 h-5 shrink-0"
                width="20"
                height="20"
                style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
            <div className="my-3 flex items-center gap-3 text-xs font-medium text-slate-400">
              <div className="h-px flex-1 bg-slate-200/90 dark:bg-slate-800" />
              <span>hoặc</span>
              <div className="h-px flex-1 bg-slate-200/90 dark:bg-slate-800" />
            </div>

            {/* ── Collapsible Internal Login Section ── */}
            <div className="space-y-1">
              {/* Trigger Button to Expand/Collapse Form */}
              <button
                type="button"
                onClick={() => setShowManualLogin((prev) => !prev)}
                className={`w-full h-10 rounded-2xl border px-3 flex items-center justify-between text-[12.5px] font-semibold transition-all duration-300 cursor-pointer ${
                  showManualLogin
                    ? 'border-blue-300 bg-blue-50/40 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-200/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Đăng nhập tài khoản nội bộ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-normal text-slate-400">
                    {showManualLogin ? 'Thu gọn' : 'Nhấn để mở form'}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${
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
                  <form onSubmit={handleManualLogin} noValidate className="space-y-2.5 pt-2 pb-0.5">
                    {/* Username / Email Input */}
                    <div className="space-y-0.5">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        Email hoặc tên đăng nhập
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Nhập email hoặc tên đăng nhập"
                          required
                          className={`w-full h-[38px] rounded-2xl border pl-8.5 pr-3 text-[13px] outline-none transition ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-0.5">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu"
                          required
                          className={`w-full h-[38px] rounded-2xl border pl-8.5 pr-9 text-[13px] outline-none transition ${
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div className="flex items-center justify-between text-[11.5px] pt-0.5">
                      <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                      className="w-full h-[40px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-[13.5px] shadow-sm shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer mt-1"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang xác thực...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Đăng nhập</span>
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Card Footer Help Link */}
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-xs text-slate-500 dark:text-slate-400">
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
      <footer className="relative z-10 w-full py-2.5 shrink-0 text-center text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
        <p className="flex items-center justify-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-[11.5px]">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-[10.5px] text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
