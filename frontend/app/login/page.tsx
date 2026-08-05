'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { setAuthToken } from '../../lib/auth';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ScrollText,
  Library,
  Users,
  Award,
  CalendarDays,
  FileCheck2,
  MonitorCheck,
  FileSpreadsheet,
} from 'lucide-react';

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
    { id: 'TEACHER', label: 'Giảng viên', icon: BookOpen, user: 'GV001', pass: 'GV001', badge: 'Ngân hàng đề & Coi thi' },
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
    <div className="min-h-screen bg-white text-slate-900 flex font-sans relative overflow-hidden">
      {/* ===== LEFT: Branding Panel (White + Blue Dominant) ===== */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 flex-col justify-between relative overflow-hidden border-r border-blue-900">
        {/* Subtle white grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"></div>
        {/* Soft glow accents */}
        <div className="absolute -top-40 -right-40 w-[560px] h-[560px] bg-sky-400/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute -bottom-44 -left-32 w-[520px] h-[520px] bg-blue-500/25 rounded-full blur-[150px] pointer-events-none"></div>
        {/* Watermark emblem */}
        <GraduationCap className="absolute -bottom-24 -right-24 w-[420px] h-[420px] text-white/[0.04] rotate-12 pointer-events-none" />

        <div className="relative z-10 p-12 xl:p-16 flex flex-col flex-1">
          {/* System Logo Header */}
          <div className="flex items-start space-x-4">
            <div className="relative shrink-0">
              <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-xl shadow-blue-900/40 flex items-center justify-center">
                <GraduationCap className="w-9 h-9 text-white" />
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-sky-300"></span>
            </div>
            <div className="pt-1">
              <p className="text-[11px] font-bold tracking-[0.28em] text-sky-300 uppercase">Nền tảng khảo thí số</p>
              <h1 className="mt-1.5 text-2xl xl:text-[26px] font-black text-white tracking-tight leading-snug">
                EduTest <span className="text-sky-300">Portal</span>
              </h1>
              <p className="mt-2 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase">
                <span className="w-6 h-px bg-sky-300"></span>
                Hệ thống quản lý khảo thí của chúng tôi
              </p>
            </div>
          </div>

          {/* Academic Divider */}
          <div className="mt-8 mb-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-sky-300/50 to-transparent"></div>
            <ScrollText className="w-4 h-4 text-sky-300/80" />
            <div className="flex-1 h-px bg-gradient-to-l from-sky-300/50 to-transparent"></div>
          </div>

          {/* Main Statement */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-200 text-[11px] font-bold uppercase tracking-[0.18em]">
              <CalendarDays className="w-3.5 h-3.5" />
              Năm học 2025 – 2026 &nbsp;•&nbsp; Học kỳ II
            </div>
            <h2 className="mt-6 text-[34px] xl:text-[40px] font-black text-white leading-[1.15] tracking-tight">
              Quản lý khảo thí
              <span className="block text-sky-300">toàn diện & minh bạch</span>
            </h2>
            <p className="mt-5 text-[13.5px] leading-relaxed text-blue-100/80 font-medium max-w-lg">
              Một hệ thống duy nhất cho toàn bộ quy trình khảo thí: xây dựng ngân hàng đề chuẩn,
              tổ chức lịch thi, giám sát phòng thi trực tiếp và công bố kết quả — đơn giản, chính xác, đúng quy chế.
            </p>
          </div>

          {/* Feature Pillars */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl">
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-sky-400/20 border border-sky-300/30 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5 text-sky-200" />
              </div>
              <h4 className="text-[12.5px] font-bold text-white tracking-wide">Ngân hàng đề chuẩn</h4>
              <p className="text-[11px] text-blue-100/60 mt-1.5 leading-relaxed">Ma trận đề thi khoa học, phân quyền chặt chẽ</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-sky-400/20 border border-sky-300/30 flex items-center justify-center mb-3">
                <MonitorCheck className="w-5 h-5 text-sky-200" />
              </div>
              <h4 className="text-[12.5px] font-bold text-white tracking-wide">Giám sát trực tiếp</h4>
              <p className="text-[11px] text-blue-100/60 mt-1.5 leading-relaxed">Cảnh báo vi phạm theo thời gian thực</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-sky-400/20 border border-sky-300/30 flex items-center justify-center mb-3">
                <FileCheck2 className="w-5 h-5 text-sky-200" />
              </div>
              <h4 className="text-[12.5px] font-bold text-white tracking-wide">Kết quả minh bạch</h4>
              <p className="text-[11px] text-blue-100/60 mt-1.5 leading-relaxed">Chấm điểm tự động, lưu trữ hồ sơ đầy đủ</p>
            </div>
          </div>

          {/* System Stats */}
          <div className="mt-auto pt-10">
            <div className="grid grid-cols-3 max-w-2xl">
              <div className="border-r border-white/15 pr-6">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-sky-300" />
                  <span className="text-2xl font-black text-white">1.200+</span>
                </div>
                <p className="text-[11px] text-blue-100/60 mt-1 font-medium">Đề thi & bộ câu hỏi</p>
              </div>
              <div className="border-r border-white/15 px-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-300" />
                  <span className="text-2xl font-black text-white">50.000+</span>
                </div>
                <p className="text-[11px] text-blue-100/60 mt-1 font-medium">Lượt thí sinh phục vụ</p>
              </div>
              <div className="pl-6">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-300" />
                  <span className="text-2xl font-black text-white">99.9%</span>
                </div>
                <p className="text-[11px] text-blue-100/60 mt-1 font-medium">Độ sẵn sàng hệ thống</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-blue-100/70 font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
                Đạt chuẩn quy chế đào tạo tín chỉ
              </span>
              <span>© 2026 EduTest Portal — Hệ thống quản lý khảo thí</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Login Form (Clean White Card) ===== */}
      <div className="flex-1 min-h-screen flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-white via-sky-50/50 to-blue-50/60">
        <div className="w-full max-w-md bg-white border border-blue-100 rounded-2xl shadow-[0_24px_60px_-12px_rgba(29,78,216,0.18)] p-8 md:p-10">
          {/* Blue top accent */}
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 mb-6"></div>

          {/* Form Header */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-300/50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-base font-black text-blue-950 leading-tight">EduTest Portal</p>
                <p className="text-[10px] font-bold tracking-[0.18em] text-blue-500 uppercase">Quản lý khảo thí</p>
              </div>
            </div>
            <h2 className="text-2xl md:text-[27px] font-black text-blue-950 tracking-tight">Đăng nhập hệ thống</h2>
            <p className="mt-1.5 text-xs md:text-[13px] text-slate-500 font-medium">
              Chọn vai trò và nhập thông tin tài khoản để tiếp tục
            </p>
          </div>

          {/* Role Quick Tabs */}
          <div className="mt-6 grid grid-cols-3 gap-1.5 bg-blue-50/80 p-1.5 rounded-xl border border-blue-100">
            {rolePresets.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r.id as any)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-bold transition duration-200 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                      : 'text-slate-500 hover:text-blue-700 hover:bg-white/80'
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
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 mt-1"></div>
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-blue-950 uppercase tracking-[0.12em] mb-2">
                Tên đăng nhập / Mã số
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-blue-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc mã SV/GV"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-blue-950 uppercase tracking-[0.12em] mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-blue-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 text-slate-800 text-sm font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-blue-700 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition duration-200 text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
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

          {/* Demo Account Notice */}
          <div className="mt-5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-slate-600 flex items-center justify-between font-medium">
            <span>
              Tài khoản: <strong className="text-blue-900 font-bold">{rolePresets.find((r) => r.id === selectedRole)?.label}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-100 text-blue-700 font-mono font-bold">
              {username} / {password}
            </span>
          </div>

          {/* Footer note */}
          <p className="mt-6 pt-5 border-t border-slate-100 text-center text-[10.5px] text-slate-400 font-medium">
            EduTest Portal — Hệ thống quản lý khảo thí của chúng tôi
            <br />© 2026 • Hỗ trợ kỹ thuật: hotro@edutest.edu.vn
          </p>
        </div>
      </div>
    </div>
  );
}
