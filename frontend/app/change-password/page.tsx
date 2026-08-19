'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  User,
  Settings,
  Clock,
} from 'lucide-react';

export default function ChangePasswordPage() {
  usePageTitle('Đổi mật khẩu');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
    } else {
      setCurrentUser(u);
    }
  }, [router]);

  // Calculate password strength rating
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'Chưa nhập', score: 0, color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Yếu', score: 33, color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
    if (score <= 4) return { label: 'Trung bình', score: 66, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Mạnh', score: 100, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      const msg = 'Vui lòng nhập mật khẩu hiện tại.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      const msg = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = 'Mật khẩu xác nhận không trùng khớp.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setToast({ message: 'Đổi mật khẩu tài khoản thành công!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 4 Standardized KPI Security Cards with uniform min-height & balanced sizing
  const kpis = [
    {
      key: 'encryption',
      title: 'Trạng thái mã hóa',
      value: 'Bcrypt 10-rounds',
      subtext: 'Chuẩn mã hóa cao nhất',
      progressPercent: 100,
      icon: ShieldCheck,
    },
    {
      key: 'min-length',
      title: 'Độ dài tối thiểu',
      value: 'Tối thiểu 6 ký tự',
      subtext: 'Bao gồm chữ & số',
      progressPercent: 100,
      icon: KeyRound,
    },
    {
      key: 'strength',
      title: 'Đánh giá mật khẩu mới',
      value: strength.label,
      subtext: 'Độ phức tạp mật khẩu',
      progressPercent: strength.score > 0 ? strength.score : 5,
      icon: Sparkles,
    },
    {
      key: 'session',
      title: 'Xác thực phiên làm việc',
      value: 'JWT Authenticated',
      subtext: 'Bảo mật tự động',
      progressPercent: 100,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-12 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Banner Enterprise SaaS Style (Consistent Height & Actions) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 p-6 text-white shadow-md">
        {/* Vector Background Overlay */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-85">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="160" cy="80" r="70" fill="white" fillOpacity="0.06" />
            <path d="M120 40L200 40L220 120L100 120Z" fill="white" fillOpacity="0.08" />
            <circle cx="230" cy="40" r="12" fill="var(--ui-chart-primary-light)" fillOpacity="0.4" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-type-page font-semibold leading-[36px] text-white tracking-tight">Đổi mật khẩu tài khoản</h1>
              <p className="text-type-body font-normal leading-[22px] text-blue-100/90">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản khỏi truy cập trái phép</p>
            </div>
          </div>

          {/* Quick Action Sibling Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-blue-700 px-4 py-2 text-type-body font-medium shadow-sm transition active:scale-95 cursor-pointer"
            >
              <User className="h-4 w-4 text-blue-700" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-type-body font-medium transition active:scale-95 cursor-pointer border border-blue-400/20"
            >
              <Settings className="h-4 w-4 text-white" />
              <span>Cài đặt</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Standardized KPI Security Cards (Uniform Height & Balanced Typography) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((spec) => {
          const Icon = spec.icon;
          return (
            <div
              key={spec.key}
              className="group relative flex flex-col justify-between min-h-[118px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {spec.title}
                  </span>
                  <div className="text-type-section font-semibold leading-[28px] tracking-tight text-slate-900 dark:text-slate-100 truncate">
                    {spec.value}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Micro Progress Track */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(spec.progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={spec.subtext}
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {spec.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Password Change Form & Security Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 cols */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
          <h2 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            <span>Biểu mẫu cập nhật mật khẩu</span>
          </h2>

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-800 dark:text-slate-200">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại của bạn..."
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 pr-10 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                title={showCurrent ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-800 dark:text-slate-200">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 pr-10 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                title={showNew ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-type-helper font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Độ mạnh mật khẩu:</span>
                  <span className={strength.text}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-800 dark:text-slate-200">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại chính xác mật khẩu mới..."
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 pr-10 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                title={showConfirm ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              isLoading={loading}
              leftIcon={<KeyRound className="h-4 w-4" />}
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>

        {/* Right Info Box: 5 cols */}
        <div className="lg:col-span-5 rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-5 space-y-4">
          <h3 className="text-type-body-sm leading-5 font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2 border-b border-blue-200/60 dark:border-blue-900/60 pb-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Quy tắc bảo mật mật khẩu</span>
          </h3>

          <ul className="space-y-2.5 text-type-helper font-medium text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Độ dài tối thiểu <strong>6 ký tự</strong> (khuyên dùng từ 8 - 16 ký tự).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt (!@#$).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Không sử dụng mật khẩu dễ đoán như ngày sinh hoặc chuỗi 123456.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Nên đổi mật khẩu định kỳ 90 ngày một lần để bảo mật tài khoản.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
