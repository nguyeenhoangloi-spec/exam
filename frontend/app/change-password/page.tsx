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
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function ChangePasswordPage() {
  usePageTitle('Đổi mật khẩu');
  const router = useRouter();

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
    if (!u) router.push('/login');
  }, [router]);

  // Calculate password strength rating
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'Chưa nhập', score: 0, color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Yếu', score: 33, color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 4) return { label: 'Trung bình', score: 66, color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Mạnh', score: 100, color: 'bg-emerald-500', text: 'text-emerald-600' };
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 pb-12 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Banner Enterprise SaaS Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-[28px] font-semibold leading-[36px] text-white tracking-tight">Đổi mật khẩu tài khoản</h1>
              <p className="text-[15px] font-normal leading-[22px] text-blue-100/80">Cập nhật mật khẩu để bảo vệ tài khoản khỏi truy cập trái phép</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Security Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[13px] font-semibold text-slate-400 tracking-wider">Trạng thái mã hóa</span>
          <div className="text-[20px] font-semibold text-emerald-700">Bcrypt 10-rounds</div>
          <span className="text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Chuẩn mã hóa cao nhất
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[13px] font-semibold text-slate-400 tracking-wider">Độ dài tối thiểu</span>
          <div className="text-[20px] font-semibold text-blue-600">Tối thiểu 6 ký tự</div>
          <span className="text-[13px] font-normal text-slate-500">Bao gồm chữ & số</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[13px] font-semibold text-slate-400 tracking-wider">Đánh giá mật khẩu mới</span>
          <div className={`text-[20px] font-semibold ${strength.text || 'text-slate-900'}`}>{strength.label}</div>
          <span className="text-[13px] font-normal text-slate-500">Độ phức tạp mật khẩu</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[13px] font-semibold text-slate-400 tracking-wider">Xác thực phiên làm việc</span>
          <div className="text-[20px] font-semibold text-slate-900">JWT Authenticated</div>
          <span className="text-[13px] font-normal text-slate-500">Bảo mật tự động</span>
        </div>
      </div>

      {/* Main Password Change Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 cols */}
        <form onSubmit={handleSubmit} className="md:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5 text-blue-600" />
            <span>Biểu mẫu cập nhật mật khẩu</span>
          </h2>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại của bạn..."
                required
                className="w-full rounded-xl border border-slate-300 p-3 pr-10 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                required
                className="w-full rounded-xl border border-slate-300 p-3 pr-10 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[12px] font-semibold">
                  <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                  <span className={strength.text}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
            <label className="block text-[15px] font-semibold text-slate-800">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại chính xác mật khẩu mới..."
                required
                className="w-full rounded-xl border border-slate-300 p-3 pr-10 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
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
        <div className="md:col-span-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 space-y-4">
          <h3 className="text-[14px] leading-5 font-semibold text-blue-700 flex items-center gap-2 border-b border-blue-200/60 pb-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Quy tắc bảo mật mật khẩu</span>
          </h3>

          <ul className="space-y-2.5 text-xs font-medium text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Độ dài tối thiểu <strong>6 ký tự</strong> (khuyên dùng từ 8 - 16 ký tự).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt (!@#$).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Không sử dụng mật khẩu dễ đoán như ngày sinh hoặc chuỗi 123456.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Nên đổi mật khẩu định kỳ 90 ngày một lần để bảo mật tài khoản.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
