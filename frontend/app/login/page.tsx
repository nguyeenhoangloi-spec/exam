'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { setAuthToken } from '../../lib/auth';
import {
  GraduationCap,
  BookOpen,
  Settings2,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  Headphones,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  MonitorCheck,
  Users,
  Award,
  Library,
  ScrollText,
  AlertCircle,
} from 'lucide-react';

type RoleId = 'ADMIN' | 'TEACHER' | 'STUDENT';

interface RolePreset {
  id: RoleId;
  label: string;
  sublabel: string;
  user: string;
  pass: string;
  placeholder: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const ROLES: RolePreset[] = [
  {
    id: 'ADMIN',
    label: 'Admin',
    sublabel: 'Quản trị hệ thống',
    user: 'admin',
    pass: 'admin123',
    placeholder: 'Nhập tài khoản quản trị',
    icon: Settings2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    id: 'TEACHER',
    label: 'Giảng viên',
    sublabel: 'Quản lý kỳ thi',
    user: 'GV001',
    pass: 'GV001',
    placeholder: 'Nhập mã giảng viên hoặc email',
    icon: BookOpen,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    id: 'STUDENT',
    label: 'Sinh viên',
    sublabel: 'Tham gia kỳ thi',
    user: 'SV001',
    pass: '123456',
    placeholder: 'Nhập mã sinh viên',
    icon: GraduationCap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

const RoleCard = memo(function RoleCard({
  role,
  isSelected,
  onSelect,
  isDark,
}: {
  role: RolePreset;
  isSelected: boolean;
  onSelect: (id: RoleId) => void;
  isDark: boolean;
}) {
  const Icon = role.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      aria-pressed={isSelected}
      aria-label={`Chọn vai trò ${role.label}`}
      className={[
        'relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-200/50 scale-[1.02]'
          : isDark
          ? 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40',
      ].join(' ')}
    >
      {isSelected && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}
      <div
        className={[
          'w-8 h-8 rounded-lg flex items-center justify-center',
          isSelected ? 'bg-blue-100' : role.bg,
        ].join(' ')}
      >
        <Icon className={['w-4 h-4', isSelected ? 'text-blue-600' : role.color].join(' ')} />
      </div>
      <span
        className={[
          'text-[11px] font-black leading-none',
          isSelected ? 'text-blue-700' : isDark ? 'text-slate-200' : 'text-slate-800',
        ].join(' ')}
      >
        {role.label}
      </span>
      <span
        className={[
          'text-[9.5px] font-semibold text-center leading-none',
          isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500',
        ].join(' ')}
      >
        {role.sublabel}
      </span>
    </button>
  );
});

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<RoleId>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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

  const handleSelectRole = useCallback((id: RoleId) => {
    const preset = ROLES.find((r) => r.id === id)!;
    setSelectedRole(id);
    setUsername(preset.user);
    setPassword(preset.pass);
    setError('');
    setUsernameError('');
    setPasswordError('');
  }, []);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      let valid = true;
      if (!username.trim()) { setUsernameError('Vui lòng nhập tên đăng nhập.'); valid = false; } else setUsernameError('');
      if (!password) { setPasswordError('Vui lòng nhập mật khẩu.'); valid = false; } else setPasswordError('');
      if (!valid) return;

      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/login', { username: username.trim(), password });
        const { accessToken, user } = res.data;
        setAuthToken(accessToken, user);
        if (user.role === 'ADMIN') router.push('/dashboard');
        else if (user.role === 'TEACHER') router.push('/teacher/assignments');
        else router.push('/student/exam-schedule');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
      } finally {
        setLoading(false);
      }
    },
    [username, password, router]
  );

  const currentRole = ROLES.find((r) => r.id === selectedRole)!;
  const isFormValid = username.trim().length > 0 && password.length > 0;

  const inputCls = [
    'w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-medium placeholder-slate-400 transition duration-200 outline-none',
    'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white',
  ].join(' ');

  return (
    /* Full viewport, no scroll */
    <div
      className={[
        'h-screen w-screen overflow-hidden flex font-sans antialiased',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900',
      ].join(' ')}
    >
      {/* ══════════ LEFT 40% ══════════ */}
      <aside className="hidden lg:flex lg:w-[40%] flex-col bg-gradient-to-br from-[#0f1c4d] via-[#1a3a8f] to-[#1d4ed8] relative overflow-hidden">
        {/* Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-400/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <GraduationCap className="absolute -bottom-12 -right-12 w-72 h-72 text-white/[0.04] rotate-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-10">
          {/* Logo */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-blue-900/50 flex items-center justify-center shrink-0">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[9.5px] font-bold tracking-[0.25em] text-sky-300 uppercase">Exam System</p>
              <p className="text-[13px] font-black text-white leading-tight tracking-tight">HỆ THỐNG QUẢN LÝ KHẢO THÍ</p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-2.5 shrink-0">
            <div className="flex-1 h-px bg-gradient-to-r from-sky-400/40 to-transparent" />
            <ScrollText className="w-3 h-3 text-sky-400/70" />
            <div className="flex-1 h-px bg-gradient-to-l from-sky-400/40 to-transparent" />
          </div>

          {/* Headline */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-sky-200 text-[9.5px] font-bold tracking-[0.14em] uppercase">
              <CalendarDays className="w-2.5 h-2.5" />
              Năm học 2025 – 2026 &nbsp;•&nbsp; Học kỳ II
            </div>
            <h2 className="mt-3.5 text-[26px] xl:text-[30px] font-black text-white leading-[1.2] tracking-tight">
              Quản lý khảo thí
              <span className="block text-sky-300">Hiệu quả – Minh bạch – Chính xác</span>
            </h2>
            <p className="mt-2.5 text-[12px] leading-relaxed text-blue-100/70 font-medium max-w-xs">
              Nền tảng quản lý toàn diện các hoạt động khảo thí dành cho trường đại học, cao đẳng và trung tâm đào tạo.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-5 shrink-0">
            {[
              { icon: Lock, label: 'Bảo mật & An toàn', desc: 'Tiêu chuẩn bảo mật cao nhất' },
              { icon: BarChart3, label: 'Quản lý toàn diện', desc: 'Lịch thi, phòng thi, kết quả' },
              { icon: FileSpreadsheet, label: 'Tự động hóa quy trình', desc: 'Giảm thiểu sai sót thủ công' },
              { icon: MonitorCheck, label: 'Truy cập mọi lúc', desc: 'Hỗ trợ mọi lúc, mọi nơi' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 rounded-xl bg-white/[0.07] border border-white/10 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-300/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-sky-200" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-snug">{label}</p>
                  <p className="text-[10px] text-blue-100/50 mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats — push to bottom */}
          <div className="mt-auto shrink-0">
            <div className="grid grid-cols-3 border-t border-white/12 pt-4">
              {[
                { icon: Library, value: '1.200+', label: 'Đề thi & câu hỏi' },
                { icon: Users, value: '50.000+', label: 'Lượt thí sinh' },
                { icon: Award, value: '99.9%', label: 'Độ sẵn sàng' },
              ].map(({ icon: Icon, value, label }, i) => (
                <div key={label} className={['py-3', i < 2 ? 'border-r border-white/12 pr-3' : 'pl-3'].join(' ')}>
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3 text-sky-300" />
                    <span className="text-lg font-black text-white">{value}</span>
                  </div>
                  <p className="text-[10px] text-blue-100/50 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-blue-100/45 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-sky-400/60" />
                Đạt chuẩn quy chế đào tạo tín chỉ
              </span>
              <span>© 2026 Exam System. All rights reserved.</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════ RIGHT 60% ══════════ */}
      <main
        className={[
          'flex-1 h-full flex flex-col overflow-hidden relative',
          isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/30',
        ].join(' ')}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Theme toggle */}
        <div className="relative z-10 flex justify-end p-4 shrink-0">
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Chuyển chủ đề sáng/tối"
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer',
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            {isDark ? <><Sun className="w-3 h-3 text-amber-400" /><span>Sáng</span></> : <><Moon className="w-3 h-3" /><span>Tối</span></>}
          </button>
        </div>

        {/* Card — centered, fits remaining height */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-4 overflow-hidden">
          <div
            className={[
              'w-full max-w-[480px] rounded-2xl border shadow-xl transition-colors duration-300',
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-slate-200/80 shadow-slate-200/60',
            ].join(' ')}
          >
            <div className="p-7">
              {/* Accent bar */}
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 to-sky-400 mb-5" />

              {/* Mobile logo */}
              <div className="flex lg:hidden items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">EXAM SYSTEM</p>
                  <p className="text-[9px] font-bold tracking-[0.18em] text-blue-500 uppercase">Hệ thống quản lý khảo thí</p>
                </div>
              </div>

              {/* Header */}
              <div className="mb-4">
                <h2 className={['text-[22px] font-black tracking-tight leading-tight', isDark ? 'text-white' : 'text-slate-900'].join(' ')}>
                  Đăng nhập hệ thống
                </h2>
                <p className={['mt-1 text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>
                  Chào mừng bạn quay trở lại!
                </p>
              </div>

              {/* Role selector */}
              <div className="mb-4">
                <p className={['text-[9.5px] font-bold uppercase tracking-[0.14em] mb-2', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>
                  Chọn vai trò đăng nhập
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => (
                    <RoleCard key={role.id} role={role} isSelected={selectedRole === role.id} onSelect={handleSelectRole} isDark={isDark} />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} noValidate className="space-y-3">
                {/* Username */}
                <div>
                  <label htmlFor="login-username" className={['block text-[9.5px] font-bold uppercase tracking-[0.13em] mb-1.5', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
                    Tên đăng nhập / Mã số
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); if (usernameError) setUsernameError(''); }}
                      placeholder={currentRole.placeholder}
                      autoComplete="username"
                      aria-invalid={!!usernameError}
                      className={[inputCls, usernameError ? 'border-rose-400 focus:border-rose-500' : ''].join(' ')}
                    />
                  </div>
                  {usernameError && <p className="mt-1 text-[10.5px] text-rose-600 font-semibold">{usernameError}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className={['block text-[9.5px] font-bold uppercase tracking-[0.13em] mb-1.5', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
                      aria-invalid={!!passwordError}
                      className={[inputCls, 'pr-10', passwordError ? 'border-rose-400 focus:border-rose-500' : ''].join(' ')}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1 text-[10.5px] text-rose-600 font-semibold">{passwordError}</p>}
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer" />
                    <span className={['text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>Ghi nhớ đăng nhập</span>
                  </label>
                  <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer">Quên mật khẩu?</button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang xác thực...</span></>
                  ) : (
                    <><span>Đăng nhập</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Demo hint */}
              <div className={['mt-4 p-2.5 rounded-xl border text-[10.5px] flex items-center justify-between font-medium', isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-blue-50/60 border-blue-100 text-slate-600'].join(' ')}>
                <span>Vai trò: <strong className={isDark ? 'text-sky-400' : 'text-blue-800'}>{currentRole.label}</strong></span>
                <span className={['px-2 py-0.5 rounded-lg font-mono font-bold text-[10px]', isDark ? 'bg-slate-700 text-sky-300 border border-slate-600' : 'bg-white text-blue-700 border border-blue-100'].join(' ')}>
                  {username} / {password}
                </span>
              </div>

              {/* Footer */}
              <div className={['mt-4 pt-4 border-t text-center', isDark ? 'border-slate-800' : 'border-slate-100'].join(' ')}>
                <p className={['flex items-center justify-center gap-1.5 text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>
                  <Headphones className="w-3 h-3" />
                  Cần hỗ trợ?{' '}
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-bold transition cursor-pointer">Liên hệ quản trị hệ thống</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
