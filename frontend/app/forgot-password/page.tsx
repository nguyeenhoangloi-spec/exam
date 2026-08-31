'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { Button } from '../../components/ui/Button';
import { isDarkModeActive, toggleTheme } from '../../lib/theme';
import api from '../../lib/api';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step state: 1 = Request Email/Username, 2 = Verify OTP Code, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Backend reset session
  const [resetSessionId, setResetSessionId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // 6-box input refs & animations
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isOtpShaking, setIsOtpShaking] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(isDarkModeActive());
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail?.isDark ?? isDarkModeActive());
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const toggleDark = () => {
    const next = toggleTheme();
    setIsDark(next === 'dark');
  };

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus the first empty OTP input when moving to Step 2
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = identifier.trim();
    if (!raw) {
      setError('Vui lòng nhập Mã số sinh viên/giảng viên hoặc Email đã đăng ký.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { identifier: raw });
      const { message, emailMasked: masked, resetSessionId: sid } = res.data || {};
      setResetSessionId(sid || '');
      setEmailMasked(masked || '');
      setResendCountdown(60);
      setToast({
        message: message || `Mã xác thực OTP (6 chữ số) đã được gửi đến email ${masked || 'của bạn'}!`,
        type: 'success',
      });
      setOtpDigits(['', '', '', '', '', '']);
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không tìm thấy tài khoản hoặc gửi mã thất bại.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Verification (Manual or Auto-Submit)
  const submitOtpCode = useCallback(async (codeToVerify: string) => {
    const rawCode = codeToVerify.trim();
    if (rawCode.length < 6) {
      setError('Mã OTP xác thực phải gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', {
        identifier: identifier.trim(),
        otp: rawCode,
        resetSessionId,
      });
      const { resetToken: token, message } = res.data || {};
      if (!token) throw new Error('Không nhận được token đặt lại mật khẩu.');
      setResetToken(token);
      setToast({ message: message || 'Xác thực mã OTP thành công! Vui lòng đặt mật khẩu mới.', type: 'success' });
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
      // Trigger error shake animation
      setIsOtpShaking(true);
      setTimeout(() => setIsOtpShaking(false), 650);
    } finally {
      setLoading(false);
    }
  }, [identifier, resetSessionId]);

  // Step 2: Verify OTP via Form Submit button
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void submitOtpCode(otpDigits.join(''));
  };

  // Handle individual digit typing & auto-advance
  const handleDigitChange = (index: number, value: string) => {
    // If multiple characters pasted directly into input
    const cleanDigits = value.replace(/\D/g, '');
    if (!cleanDigits) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    if (cleanDigits.length > 1) {
      // Pasted or autofilled multiple digits
      const nextDigits = [...otpDigits];
      const chars = cleanDigits.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) nextDigits[index + idx] = c;
      });
      setOtpDigits(nextDigits);
      if (error) setError('');

      const filledCount = nextDigits.filter(Boolean).length;
      if (filledCount === 6) {
        void submitOtpCode(nextDigits.join(''));
      } else {
        const nextFocus = Math.min(index + chars.length, 5);
        otpInputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    // Single digit entry
    const updated = [...otpDigits];
    updated[index] = cleanDigits;
    setOtpDigits(updated);
    if (error) setError('');

    // Auto-advance to next input
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are now filled
    const fullCode = updated.join('');
    if (fullCode.length === 6 && updated.every((d) => d.length === 1)) {
      void submitOtpCode(fullCode);
    }
  };

  // Handle keyboard navigation (Backspace, Left/Right arrows)
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // If current is empty, focus previous and clear it
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        // Clear current digit
        const updated = [...otpDigits];
        updated[index] = '';
        setOtpDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle native paste event on any OTP box
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const nextDigits = pasteData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtpDigits(nextDigits);
      if (error) setError('');
      if (pasteData.length === 6) {
        void submitOtpCode(pasteData);
      } else {
        otpInputRefs.current[pasteData.length]?.focus();
      }
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      const { message, emailMasked: masked, resetSessionId: sid } = res.data || {};
      if (sid) setResetSessionId(sid);
      if (masked) setEmailMasked(masked);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCountdown(60);
      setToast({ message: message || 'Đã gửi lại mã OTP mới qua Email!', type: 'success' });
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP lúc này.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
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
    try {
      const res = await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword,
      });
      setToast({ message: res.data?.message || 'Đổi mật khẩu thành công! Hãy đăng nhập lại bằng mật khẩu mới.', type: 'success' });
      setStep(4);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full relative overflow-y-auto [scrollbar-gutter:stable] font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[var(--ui-page)] text-slate-900'
      }`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Background Decorative Vector Waves & Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div
          className="absolute top-6 left-1/4 w-[750px] h-80 opacity-30 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(var(--ui-chart-primary-light) 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute -top-28 -left-28 w-[600px] h-[600px] bg-blue-100/70 dark:bg-blue-900/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 -right-28 w-[650px] h-[650px] bg-sky-100/60 dark:bg-blue-950/15 rounded-full blur-[140px]" />
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

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 w-full max-w-[1380px] mx-auto px-6 sm:px-10 pt-7 pb-3 shrink-0 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => router.push('/login')}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/50 transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="h-6.5 w-6.5" />
          </div>
          <div>
            <span className="text-type-section font-semibold tracking-tight text-slate-900 dark:text-white block">
              EXAMSYS
            </span>
            <p className="text-type-helper font-semibold tracking-wider text-blue-600 dark:text-blue-400  mt-0.5">
              HỆ THỐNG KHẢO THÍ ĐIỆN TỬ
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Chuyển chủ đề sáng/tối"
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="flex h-10 w-10 items-center justify-center text-slate-400 transition-colors duration-200 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 cursor-pointer"
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            aria-label="Quay lại đăng nhập"
            title="Quay lại đăng nhập"
            className="group flex h-10 w-10 items-center justify-center text-slate-400 transition-all duration-200 hover:scale-105 hover:text-slate-700 active:scale-95 dark:text-slate-500 dark:hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.9} />
          </button>
        </div>
      </header>

      {/* ── Main Section: 2-Column Reset Password Layout ── */}
      <main className="relative z-10 max-w-[1380px] mx-auto px-6 sm:px-10 pt-5 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start w-full">
        {/* ── Left Column: System Security Showcase (7 Cols ~ 58%) ── */}
        <section className="lg:col-span-7 flex flex-col justify-start space-y-9">
          {/* Headline */}
          <div className="space-y-3.5">
            <h1 className="text-type-page lg:text-type-display font-semibold tracking-tight text-slate-900 dark:text-white">
              KHÔI PHỤC <br />
              <span className="inline-block py-1 pb-1.5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-sky-300">
                MẬT KHẨU TÀI KHOẢN
              </span>
            </h1>
            <p className="text-type-body sm:text-type-card text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
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
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Xác thực 2 lớp OTP
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Mã xác thực gửi về email
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Bảo mật tuyệt đối
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Mã hóa chuẩn JWT SHA-256
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <Zap className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Tức thì & Tự động
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Khôi phục chỉ trong 60 giây
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-2xs group cursor-default">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/90 dark:bg-blue-950/60 dark:border-blue-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                  <Headphones className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    Hỗ trợ kỹ thuật 24/7
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Hotline 1800-EXAM-HELP
                  </p>
                </div>
              </div>
            </div>

            {/* 3D Security Art Canvas */}
            <div className="sm:col-span-7 flex justify-center items-center relative py-2">
              <div className="relative w-full max-w-[440px] aspect-[4/3] flex items-center justify-center transition-transform duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/30 via-sky-200/25 to-blue-300/20 dark:from-blue-900/25 dark:to-blue-950/20 rounded-full blur-3xl animate-pulse" />

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
                      <stop offset="0%" stopColor="var(--ui-chart-primary-light)" />
                      <stop offset="100%" stopColor="var(--ui-primary-hover)" />
                    </linearGradient>
                    <linearGradient id="keyGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--ui-chart-warning)" />
                      <stop offset="100%" stopColor="var(--ui-chart-warning)" />
                    </linearGradient>
                    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--ui-surface)" />
                      <stop offset="100%" stopColor="var(--ui-surface-muted)" />
                    </linearGradient>
                  </defs>

                  {/* Shadow */}
                  <ellipse cx="210" cy="270" rx="95" ry="16" fill="var(--ui-border)" opacity="0.4" />

                  {/* Base Security Card */}
                  <rect x="75" y="70" width="270" height="170" rx="20" fill="url(#cardGrad)" stroke="var(--ui-border)" strokeWidth="4" />
                  <rect x="95" y="95" width="230" height="12" rx="6" fill="var(--ui-primary)" opacity="0.8" />
                  <rect x="95" y="120" width="160" height="8" rx="4" fill="var(--ui-text-disabled)" opacity="0.5" />
                  <rect x="95" y="138" width="120" height="8" rx="4" fill="var(--ui-border)" opacity="0.6" />

                  {/* Password Dots Box */}
                  <rect x="95" y="160" width="180" height="36" rx="10" fill="var(--ui-surface-muted)" stroke="var(--ui-border)" strokeWidth="2" />
                  <circle cx="115" cy="178" r="4" fill="var(--ui-primary)" />
                  <circle cx="135" cy="178" r="4" fill="var(--ui-primary)" />
                  <circle cx="155" cy="178" r="4" fill="var(--ui-primary)" />
                  <circle cx="175" cy="178" r="4" fill="var(--ui-primary)" />
                  <circle cx="195" cy="178" r="4" fill="var(--ui-primary)" />
                  <circle cx="215" cy="178" r="4" fill="var(--ui-primary)" />

                  {/* Big 3D Security Shield */}
                  <g transform="translate(230, 95)">
                    <path
                      d="M50 0 L100 20 L100 65 C100 105 50 125 50 125 C50 125 0 105 0 65 L0 20 Z"
                      fill="url(#shieldMainGrad)"
                      stroke="var(--ui-surface)"
                      strokeWidth="5"
                    />
                    <path
                      d="M30 60 L45 75 L75 40"
                      stroke="var(--ui-surface)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>

                  {/* 3D Golden Key */}
                  <g transform="translate(65, 175) rotate(-20)">
                    <circle cx="35" cy="35" r="25" fill="url(#keyGrad)" stroke="var(--ui-chart-warning)" strokeWidth="3" />
                    <circle cx="35" cy="35" r="10" fill="var(--ui-surface)" />
                    <rect x="60" y="28" width="70" height="14" rx="3" fill="url(#keyGrad)" stroke="var(--ui-chart-warning)" strokeWidth="2" />
                    <rect x="105" y="42" width="10" height="18" rx="2" fill="url(#keyGrad)" stroke="var(--ui-chart-warning)" strokeWidth="2" />
                    <rect x="120" y="42" width="10" height="12" rx="2" fill="url(#keyGrad)" stroke="var(--ui-chart-warning)" strokeWidth="2" />
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
                <p className="text-type-card sm:text-type-card font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  100%
                </p>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate">Bảo mật định danh</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800 shadow-2xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Clock className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-type-card sm:text-type-card font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  {'< 60s'}
                </p>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate">Thời gian cấp lại</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800 shadow-2xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Headphones className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-type-card sm:text-type-card font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  24/7
                </p>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate">Hỗ trợ khẩn cấp</p>
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
            <div className="mb-5 flex items-center justify-between gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl text-type-helper font-semibold">
              <span
                className={`flex-1 text-center py-1.5 rounded-xl transition-all duration-200 ${
                  step === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > 1
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
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
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
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
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
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
              <h2 className="text-type-section font-semibold text-slate-900 dark:text-white tracking-tight">
                {step === 1 && 'Quên mật khẩu?'}
                {step === 2 && 'Xác thực mã OTP'}
                {step === 3 && 'Đặt mật khẩu mới'}
                {step === 4 && 'Đổi mật khẩu thành công!'}
              </h2>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-1 font-normal leading-relaxed">
                {step === 1 && 'Nhập mã số sinh viên, giảng viên hoặc email đăng ký.'}
                {step === 2 && (emailMasked ? `Mã xác thực gồm 6 chữ số đã gửi đến email ${emailMasked}.` : `Mã xác thực gồm 6 chữ số đã gửi đến email của ${identifier}.`)}
                {step === 3 && 'Tạo mật khẩu mới an toàn gồm tối thiểu 6 ký tự.'}
                {step === 4 && 'Tài khoản của bạn đã được cập nhật mật khẩu mới an toàn.'}
              </p>
            </div>

            {/* STEP 1: Request OTP Form */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-type-body font-medium text-slate-600 dark:text-slate-300">
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
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-4 text-type-body outline-none transition ${
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
                  className={`w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-type-body shadow-md shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer mt-2 ${
                    loading
                      ? 'disabled:opacity-100 disabled:text-white'
                      : 'disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:opacity-100 dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-300'
                  }`}
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

            {/* STEP 2: Verify OTP Form (6 Segmented Pin Boxes) */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                <div className="space-y-2.5">
                  <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                    Mã xác thực 6 chữ số
                  </label>

                  {/* 6 Individual Square Boxes in 2 Pods of 3 */}
                  <div
                    className={`flex items-center justify-center gap-2 sm:gap-2.5 py-1 ${
                      isOtpShaking ? 'animate-shake' : ''
                    }`}
                  >
                    {/* Pod 1: Boxes 0, 1, 2 */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {[0, 1, 2].map((idx) => {
                        const val = otpDigits[idx];
                        return (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border-2 text-center text-type-section sm:text-type-otp font-semibold tabular-nums outline-none transition-all duration-150 ${
                              isOtpShaking
                                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : val
                                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 text-slate-900 dark:text-white shadow-xs'
                                : isDark
                                ? 'border-slate-700 bg-slate-800/80 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                                : 'border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:bg-white'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Middle Divider Dot/Dash */}
                    <div className="flex items-center justify-center px-0.5 sm:px-1 select-none">
                      <span className="h-1 w-2.5 sm:w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>

                    {/* Pod 2: Boxes 3, 4, 5 */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {[3, 4, 5].map((idx) => {
                        const val = otpDigits[idx];
                        return (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border-2 text-center text-type-section sm:text-type-otp font-semibold tabular-nums outline-none transition-all duration-150 ${
                              isOtpShaking
                                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : val
                                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 text-slate-900 dark:text-white shadow-xs'
                                : isDark
                                ? 'border-slate-700 bg-slate-800/80 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                                : 'border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:bg-white'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sub Action Links with Animated SVG Circular Countdown Ring */}
                <div className="flex items-center justify-between text-type-helper pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpDigits(['', '', '', '', '', '']);
                    }}
                    className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Đổi tài khoản khác</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendCountdown > 0 || loading}
                    onClick={handleResendOtp}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
                  >
                    {resendCountdown > 0 ? (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700">
                        {/* Circular Progress SVG Ring */}
                        <svg className="h-3.5 w-3.5 -rotate-90" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-slate-200 dark:text-slate-700"
                            fill="none"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-linear"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 9}
                            strokeDashoffset={2 * Math.PI * 9 * (1 - resendCountdown / 60)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="tabular-nums font-semibold text-type-helper">{resendCountdown}s</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 hover:underline">
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>Gửi lại mã OTP</span>
                      </div>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length < 6}
                  className={`w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-type-body shadow-md shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer mt-2 ${
                    loading
                      ? 'disabled:opacity-100 disabled:text-white'
                      : 'disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:opacity-100 dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-300'
                  }`}
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
                  <label className="block text-type-body font-medium text-slate-600 dark:text-slate-300">
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
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-11 text-type-body outline-none transition ${
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
                  <label className="block text-type-body font-medium text-slate-600 dark:text-slate-300">
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
                      className={`w-full h-[44px] rounded-2xl border pl-12 pr-4 text-type-body outline-none transition ${
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
                  className={`w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-type-body shadow-md shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer mt-3 ${
                    loading
                      ? 'disabled:opacity-100 disabled:text-white'
                      : 'disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:opacity-100 dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-300'
                  }`}
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
                <p className="text-type-helper sm:text-type-body-sm text-slate-600 dark:text-slate-300 font-medium">
                  Mật khẩu mới đã có hiệu lực ngay bây giờ. Hãy quay lại trang Đăng nhập để truy cập hệ thống.
                </p>

                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-type-body shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Đăng nhập</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}

            {/* Footer Help Link */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center text-type-helper sm:text-type-body-sm text-slate-500 dark:text-slate-400">
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
      <footer className="mt-auto relative z-10 w-full py-5 shrink-0 text-center text-type-helper text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300 text-type-helper">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Hệ thống khảo thí an toàn – Minh bạch – Hiệu quả</span>
        </p>
        <p className="text-type-helper text-slate-400 dark:text-slate-500">© 2026 EXAMSYS. All rights reserved.</p>
      </footer>
    </div>
  );
}
