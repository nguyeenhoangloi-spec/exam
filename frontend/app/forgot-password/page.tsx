'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Headphones,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  Award,
  Zap,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { Toast } from '../../components/Toast';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step state: 1 = Request Email/Username, 2 = Verify OTP Code, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDark, setIsDark] = useState(false);

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

  // Step 1: Request OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Vui lòng nhập Mã số sinh viên/giảng viên hoặc Email đã đăng ký.');
      return;
    }

    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setToast({
        message: 'Mã xác thực OTP (6 chữ số) đã được gửi đến email đăng ký của bạn!',
        type: 'success',
      });
      setStep(2);
    }, 800);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 6) {
      setError('Mã OTP xác thực phải gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setToast({ message: 'Xác thực mã OTP thành công! Vui lòng đặt mật khẩu mới.', type: 'success' });
      setStep(3);
    }, 800);
  };

  // Step 3: Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setToast({ message: 'Đổi mật khẩu thành công! Hãy đăng nhập lại bằng mật khẩu mới.', type: 'success' });
      setStep(4);
    }, 900);
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
          className="absolute top-6 left-1/4 w-[750px] h-80 opacity-30 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#3B82F6 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute -top-28 -left-28 w-[600px] h-[600px] bg-blue-100/70 dark:bg-blue-900/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 -right-28 w-[650px] h-[650px] bg-sky-100/60 dark:bg-indigo-950/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-36 left-10 w-[650px] h-[450px] bg-blue-50/80 dark:bg-slate-900/40 rounded-full blur-[110px]" />

        {/* Abstract Flow Waves */}
        <svg
          className="absolute bottom-0 left-0 w-full max-w-6xl h-72 opacity-30 dark:opacity-10"
          viewBox="0 0 1000 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 220 C200 140, 400 290, 650 180 C820 100, 920 250, 1100 200"
            stroke="#93C5FD"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-50 250 C230 170, 430 320, 680 210 C850 130, 950 280, 1100 230"
            stroke="#60A5FA"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-50 280 C260 200, 460 340, 710 240 C880 160, 980 300, 1100 260"
            stroke="#3B82F6"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 w-full max-w-[1380px] mx-auto px-6 sm:px-10 pt-7 pb-3 shrink-0 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => router.push('/login')}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50 transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="h-6.5 w-6.5" />
          </div>
          <div>
            <span className="text-[21px] font-black tracking-tight text-slate-900 dark:text-white leading-none block">
              EXAMSYS
            </span>
            <p className="text-[11.5px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mt-0.5">
              HỆ THỐNG KHẢO THÍ ĐIỆN TỬ
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
            <span>Về Đăng nhập</span>
          </button>

          <button
            type="button"
            onClick={toggleDark}
            aria-label="Chuyển chủ đề sáng/tối"
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-200 cursor-pointer shadow-2xs"
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* ── Main Section: 2-Column Reset Password Layout ── */}
      <main className="relative z-10 max-w-[1380px] mx-auto px-6 sm:px-10 pt-5 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start w-full">
        {/* ── Left Column: System Security Showcase (7 Cols ~ 58%) ── */}
        <section className="lg:col-span-7 flex flex-col justify-start space-y-9">
          {/* Headline */}
          <div className="space-y-3.5">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              KHÔI PHỤC <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-sky-300">
                MẬT KHẨU TÀI KHOẢN
              </span>
            </h1>
            <p className="text-[15.5px] sm:text-[16.5px] text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Quy trình khôi phục an toàn 2 lớp qua mã OTP email chính chủ hoặc hỗ trợ trực tiếp từ Quản trị viên hệ thống.
            </p>
          </div>

          {/* Center 3D Security Illustration & Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* 4 Security Pillars */}
            <div className="sm:col-span-5 space-y-3.5">
              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <Fingerprint className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Xác thực 2 lớp OTP
                  </h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Mã xác thực gửi về email
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Bảo mật tuyệt đối
                  </h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Mã hóa chuẩn JWT SHA-256
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <Zap className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Tức thì & Tự động
                  </h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Khôi phục chỉ trong 60 giây
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <Headphones className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Hỗ trợ kỹ thuật 24/7
                  </h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Hotline 1800-EXAM-HELP
                  </p>
                </div>
              </div>
            </div>

            {/* 3D Security Art Canvas */}
            <div className="sm:col-span-7 flex justify-center items-center relative py-2">
              <div className="relative w-full max-w-[440px] aspect-[4/3] flex items-center justify-center transition-transform duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/30 via-sky-200/25 to-indigo-300/20 dark:from-blue-900/25 dark:to-indigo-950/20 rounded-full blur-3xl animate-pulse" />

                {/* Floating Key Badge */}
                <div className="absolute -top-3 left-28 z-20 h-11 w-11 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <KeyRound className="h-5.5 w-5.5" />
                </div>

                {/* Floating Shield Badge */}
                <div className="absolute top-16 right-0 z-20 h-11 w-11 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>

                {/* 3D Isometric Key & Shield Illustration */}
                <svg
                  className="w-full h-full relative z-10 drop-shadow-2xl"
                  viewBox="0 0 420 320"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="shieldMainGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1E40AF" />
                    </linearGradient>
                    <linearGradient id="keyGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#F8FAFC" />
                    </linearGradient>
                  </defs>

                  {/* Shadow */}
                  <ellipse cx="210" cy="270" rx="95" ry="16" fill="#CBD5E1" opacity="0.4" />

                  {/* Base Security Card */}
                  <rect x="75" y="70" width="270" height="170" rx="20" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="4" />
                  <rect x="95" y="95" width="230" height="12" rx="6" fill="#2563EB" opacity="0.8" />
                  <rect x="95" y="120" width="160" height="8" rx="4" fill="#94A3B8" opacity="0.5" />
                  <rect x="95" y="138" width="120" height="8" rx="4" fill="#CBD5E1" opacity="0.6" />

                  {/* Password Dots Box */}
                  <rect x="95" y="160" width="180" height="36" rx="10" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
                  <circle cx="115" cy="178" r="4" fill="#2563EB" />
                  <circle cx="135" cy="178" r="4" fill="#2563EB" />
                  <circle cx="155" cy="178" r="4" fill="#2563EB" />
                  <circle cx="175" cy="178" r="4" fill="#2563EB" />
                  <circle cx="195" cy="178" r="4" fill="#2563EB" />
                  <circle cx="215" cy="178" r="4" fill="#2563EB" />

                  {/* Big 3D Security Shield */}
                  <g transform="translate(230, 95)">
                    <path
                      d="M50 0 L100 20 L100 65 C100 105 50 125 50 125 C50 125 0 105 0 65 L0 20 Z"
                      fill="url(#shieldMainGrad)"
                      stroke="#FFFFFF"
                      strokeWidth="5"
                    />
                    <path
                      d="M30 60 L45 75 L75 40"
                      stroke="#FFFFFF"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>

                  {/* 3D Golden Key */}
                  <g transform="translate(65, 175) rotate(-20)">
                    <circle cx="35" cy="35" r="25" fill="url(#keyGrad)" stroke="#D97706" strokeWidth="3" />
                    <circle cx="35" cy="35" r="10" fill="#FFFFFF" />
                    <rect x="60" y="28" width="70" height="14" rx="3" fill="url(#keyGrad)" stroke="#D97706" strokeWidth="2" />
                    <rect x="105" y="42" width="10" height="18" rx="2" fill="url(#keyGrad)" stroke="#D97706" strokeWidth="2" />
                    <rect x="120" y="42" width="10" height="12" rx="2" fill="url(#keyGrad)" stroke="#D97706" strokeWidth="2" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Trust Statistics */}
          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800 shadow-2xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  100%
                </p>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate">Bảo mật định danh</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800 shadow-2xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Clock className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {'< 60s'}
                </p>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate">Thời gian cấp lại</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800 shadow-2xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Headphones className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  24/7
                </p>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate">Hỗ trợ khẩn cấp</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Step Form Card (5 Cols ~ 42%) ── */}
        <section className="lg:col-span-5 flex justify-center w-full items-start">
          <div
            className={`w-full max-w-[460px] rounded-[32px] border p-7 sm:p-8 transition-all duration-300 ${
              isDark
                ? 'border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl'
                : 'border-slate-100/90 bg-white shadow-[0_20px_50px_-10px_rgba(37,99,235,0.09),0_8px_20px_-3px_rgba(0,0,0,0.03)] backdrop-blur-sm'
            }`}
          >
            {/* Top Step Progress Bar */}
            <div className="mb-5 flex items-center justify-between gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl text-[12px] font-semibold">
              <span
                className={`flex-1 text-center py-1.5 rounded-xl transition-all duration-200 ${
                  step === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > 1
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                1. Thông tin
              </span>
              <span
                className={`flex-1 text-center py-1.5 rounded-xl transition-all duration-200 ${
                  step === 2
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > 2
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                2. Mã OTP
              </span>
              <span
                className={`flex-1 text-center py-1.5 rounded-xl transition-all duration-200 ${
                  step === 3
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > 3
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                3. Mật khẩu
              </span>
            </div>

            {/* Step Header */}
            <div className="text-center mb-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2 border border-blue-100/80 dark:border-blue-900 shadow-inner">
                {step === 1 && <Mail className="h-7 w-7" />}
                {step === 2 && <ShieldCheck className="h-7 w-7" />}
                {step === 3 && <KeyRound className="h-7 w-7" />}
                {step === 4 && <CheckCircle2 className="h-7 w-7 text-emerald-500" />}
              </div>
              <h2 className="text-[23px] sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight">
                {step === 1 && 'Quên mật khẩu?'}
                {step === 2 && 'Xác thực mã OTP'}
                {step === 3 && 'Đặt mật khẩu mới'}
                {step === 4 && 'Đổi mật khẩu thành công!'}
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-relaxed">
                {step === 1 && 'Nhập mã số sinh viên, giảng viên hoặc email đăng ký.'}
                {step === 2 && `Mã xác thực gồm 6 chữ số đã gửi đến email của ${identifier}.`}
                {step === 3 && 'Tạo mật khẩu mới an toàn gồm tối thiểu 6 ký tự.'}
                {step === 4 && 'Tài khoản của bạn đã được cập nhật mật khẩu mới an toàn.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 flex items-start gap-2">
                <span className="shrink-0 text-rose-600 font-bold">•</span>
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Request OTP Form */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-300">
                    Mã số hoặc Email đăng ký
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Ví dụ: SV2026 hoặc nguyenvana@exam.edu.vn"
                      required
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-4 text-[14px] outline-none transition ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                          : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-md shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang gửi mã OTP...</span>
                    </div>
                  ) : (
                    <>
                      <span>Gửi mã xác thực OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP Form */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-300">
                    Mã xác thực OTP (6 chữ số)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="123456"
                      required
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-4 text-center tracking-widest text-[18px] font-bold outline-none transition tabular-nums ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                          : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-blue-600 transition cursor-pointer"
                  >
                    Nhập thông tin khác
                  </button>
                  <button
                    type="button"
                    onClick={() => setToast({ message: 'Đã gửi lại mã OTP mới qua Email!', type: 'success' })}
                    className="font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Gửi lại mã</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length < 6}
                  className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-md shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xác thực...</span>
                    </div>
                  ) : (
                    <>
                      <span>Xác nhận mã OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: Reset Password Form */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} noValidate className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-300">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      required
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-11 text-[14px] outline-none transition ${
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
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-300">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-4 text-[14px] outline-none transition ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                          : 'border-slate-200/90 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-md shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer mt-3"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </div>
                  ) : (
                    <>
                      <KeyRound className="h-4.5 w-4.5" />
                      <span>Lưu mật khẩu mới</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: Success View */}
            {step === 4 && (
              <div className="text-center space-y-4 py-3">
                <p className="text-xs sm:text-[13.5px] text-slate-600 dark:text-slate-300 font-medium">
                  Mật khẩu mới đã có hiệu lực ngay bây giờ. Hãy quay lại trang Đăng nhập để truy cập hệ thống.
                </p>

                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-[14.5px] shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}

            {/* Footer Help Link */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center text-xs sm:text-[13.5px] text-slate-500 dark:text-slate-400">
              <p>
                Cần hỗ trợ sự cố?{' '}
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
      <footer className="mt-auto relative z-10 w-full py-5 shrink-0 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300 text-[12.5px]">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
