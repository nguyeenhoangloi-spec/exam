'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { setAuthToken } from '../../lib/auth';
import { Lock, User as UserIcon, ShieldCheck, Eye, EyeOff, Sparkles, CheckCircle2, Award, GraduationCap, Building2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'TEACHER' | 'STUDENT'>('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rolePresets = [
    { id: 'ADMIN', label: 'Quản trị viên', icon: ShieldCheck, user: 'admin', pass: 'admin123', badge: 'Hệ thống & Cấu hình' },
    { id: 'TEACHER', label: 'Giảng viên', icon: Building2, user: 'GV001', pass: 'GV001', badge: 'Ngân hàng đề & Coi thi' },
    { id: 'STUDENT', label: 'Sinh viên', icon: GraduationCap, user: 'SV001', pass: '123456', badge: 'Lịch thi & Làm bài' },
  ];

  const handleSelectRole = (role: 'ADMIN' | 'TEACHER' | 'STUDENT') => {
    setSelectedRole(role);
    const preset = rolePresets.find((r) => r.id === role);
    if (preset) {
      setUsername(preset.user);
      setPassword(preset.pass);
      setError('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { username, password });
      const { accessToken, user } = res.data;

      setAuthToken(accessToken, user);

      if (user.role === 'ADMIN') {
        router.push('/dashboard');
      } else if (user.role === 'TEACHER') {
        router.push('/teacher/assignments');
      } else {
        router.push('/student/exam-schedule');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans relative overflow-hidden">
      {/* Light Background Gradient Orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-sky-200/50 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-100/60 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Section: Branding & Highlights (Light Blue-White Theme) */}
        <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-blue-50/80 via-sky-50/40 to-indigo-50/30 border-r border-slate-200/80 p-12 xl:p-16 flex-col justify-between relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Light Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

          <div className="relative z-10">
            {/* Top Logo */}
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-[#1e66f5] flex items-center justify-center shadow-lg shadow-blue-500/25">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight uppercase">EXAM PRO</span>
                <span className="block text-[11px] font-extrabold text-[#1e66f5] uppercase tracking-widest">Enterprise Platform</span>
              </div>
            </div>

            {/* Main Tagline */}
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e66f5]/10 border border-[#1e66f5]/20 text-[#1e66f5] text-xs font-extrabold uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" /> Hệ Thống Khảo Thí Quốc Gia v4.2
              </div>
              <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Quản Lý Khảo Thí & Thi Trắc Nghiệm <span className="text-[#1e66f5]">Chính Xác 100%</span>
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Nền tảng khảo thí toàn diện hỗ trợ lập lịch thi tự động, ngân hàng câu hỏi phân quyền, giám sát trực tiếp thời gian thực và chấm điểm công khai minh bạch.
              </p>
            </div>

            {/* Key Feature Cards */}
            <div className="grid grid-cols-2 gap-4 mt-10 max-w-xl">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm backdrop-blur-md">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-2.5 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Giám Sát AI Realtime</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">Tự động khóa bài thi khi vi phạm chuyển tab quá lần</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm backdrop-blur-md">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-2.5 font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Bảo Mật Chuẩn ISO</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">Mã hóa bcrypt đề thi và xác thực mật khẩu 2 lớp</p>
              </div>
            </div>
          </div>

          {/* Bottom Stats Footer */}
          <div className="relative z-10 pt-8 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <div className="flex items-center space-x-6">
              <div>
                <span className="block text-lg font-black text-slate-900">50.000+</span>
                <span>Thí sinh phục vụ</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <span className="block text-lg font-black text-slate-900">99.9%</span>
                <span>Độ sẵn sàng hệ thống</span>
              </div>
            </div>
            <span>© 2026 Exam Management System</span>
          </div>
        </div>

        {/* Right Section: Login Form (Clean White Card) */}
        <div className="col-span-1 lg:col-span-5 flex items-center justify-center p-6 md:p-12 bg-slate-50">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-8 md:p-10 space-y-6">
            {/* Form Header */}
            <div className="text-center lg:text-left space-y-1.5">
              <div className="lg:hidden flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e66f5] flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tight uppercase">EXAM PRO</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Đăng nhập Hệ thống</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Chọn vai trò truy cập để tiếp tục vào hệ thống</p>
            </div>

            {/* Role Quick Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
              {rolePresets.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r.id as any)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition duration-200 ${
                      isSelected
                        ? 'bg-[#1e66f5] text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[11px] font-extrabold">{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-relaxed flex items-center gap-3 shadow-2xs">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></div>
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Tên đăng nhập / Mã tài khoản
                </label>
                <div className="relative">
                  <UserIcon className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập hoặc mã SV/GV"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 text-sm font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1e66f5] focus:ring-2 focus:ring-[#1e66f5]/20 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Mật khẩu bảo mật
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 text-sm font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1e66f5] focus:ring-2 focus:ring-[#1e66f5]/20 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e66f5] hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition duration-200 text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang xác thực thông tin...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Hệ Thống</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Fill Helper Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
              <span>Đang chọn tài khoản: <strong className="text-slate-900 font-bold">{rolePresets.find((r) => r.id === selectedRole)?.label}</strong></span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#1e66f5] font-mono font-bold">
                {username} / {password}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
