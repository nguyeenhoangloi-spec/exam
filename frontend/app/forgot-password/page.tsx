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
 ScrollText,
 CalendarDays,
 BarChart3,
 FileSpreadsheet,
 MonitorCheck,
 Library,
 Users,
 Award,
 User as UserIcon,
} from 'lucide-react';
import { Toast } from '../../components/Toast';

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
 setError('Vui lòng nhập Mã số hoặc Email đã đăng ký trong hệ thống.');
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

 const inputCls = [
 'w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-medium placeholder-slate-400 transition duration-200 outline-none',
 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
 isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white',
 ].join(' ');

 return (
 /* Full viewport, no scroll matching Login Page */
 <div
 className={[
 'h-screen w-screen overflow-hidden flex font-sans antialiased',
 isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900',
 ].join(' ')}
 >
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* ══════════ LEFT 40% SAAS BRANDING PANEL ══════════ */}
 <aside className="hidden lg:flex lg:w-[40%] flex-col bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 relative overflow-hidden">
 {/* Texture */}
 <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
 <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-400/15 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute bottom-0 -left-16 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
 <GraduationCap className="absolute -bottom-12 -right-12 w-72 h-72 text-white/[0.04] rotate-12 pointer-events-none" />

 <div className="relative z-10 flex flex-col h-full p-8 xl:p-10">
 {/* Logo */}
 <div className="flex items-center gap-3.5 shrink-0">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg shadow-blue-900/50 flex items-center justify-center shrink-0">
 <GraduationCap className="w-7 h-7 text-white" />
 </div>
 <div>
 <p className="text-[12px] font-semibold tracking-[0.25em] text-blue-300 ">Exam System</p>
 <p className="text-[13px] font-semibold text-white leading-tight tracking-tight">Hệ thống quản lý khảo thí</p>
 </div>
 </div>

 {/* Divider */}
 <div className="my-5 flex items-center gap-2.5 shrink-0">
 <div className="flex-1 h-px bg-gradient-to-r from-blue-400/40 to-transparent" />
 <ScrollText className="w-3 h-3 text-blue-400/70" />
 <div className="flex-1 h-px bg-gradient-to-l from-blue-400/40 to-transparent" />
 </div>

 {/* Headline */}
 <div className="shrink-0">
 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-blue-200 text-[12px] font-semibold tracking-[0.14em] ">
 <ShieldCheck className="w-2.5 h-2.5" />
 Khôi phục mật khẩu &nbsp;•&nbsp; Bảo mật 2 lớp
 </div>
 <h2 className="mt-3.5 text-[26px] xl:text-[30px] font-semibold text-white leading-[1.2] tracking-tight">
 Khôi phục mật khẩu
 <span className="block text-blue-300">Nhanh chóng – An toàn – Nhanh gọn</span>
 </h2>
 <p className="mt-2.5 text-[12px] leading-relaxed text-blue-100/70 font-medium max-w-xs">
 Hệ thống tự động cấp lại mật khẩu an toàn qua mã OTP xác thực email hoặc thông qua Quản trị viên.
 </p>
 </div>

 {/* Features grid */}
 <div className="grid grid-cols-2 gap-2.5 mt-5 shrink-0">
 {[
 { icon: Lock, label: 'Bảo mật 2 lớp OTP', desc: 'Mã xác thực gửi trực tiếp qua email' },
 { icon: ShieldCheck, label: 'Xác thực định danh', desc: 'Đảm bảo chính chủ tài khoản' },
 { icon: Headphones, label: 'Hỗ trợ 24/7', desc: 'Trung tâm kỹ thuật tiếp nhận 24/7' },
 { icon: MonitorCheck, label: 'Mã hóa an toàn', desc: 'Công nghệ mã hóa JWT 256-bit' },
 ].map(({ icon: Icon, label, desc }) => (
 <div key={label} className="p-3 rounded-xl bg-white/[0.07] border border-white/10 flex items-start gap-2.5">
 <div className="w-7 h-7 rounded-lg bg-blue-400/20 border border-blue-300/20 flex items-center justify-center shrink-0">
 <Icon className="w-3.5 h-3.5 text-blue-200" />
 </div>
 <div>
 <p className="text-[12px] font-semibold text-white leading-snug">{label}</p>
 <p className="text-[12px] text-blue-100/50 mt-0.5 leading-snug">{desc}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Stats — push to bottom */}
 <div className="mt-auto shrink-0">
 <div className="grid grid-cols-3 border-t border-white/12 pt-4">
 {[
 { icon: ShieldCheck, value: 'Xác thực', label: 'Email chính chủ' },
 { icon: KeyRound, value: 'Tự động', label: 'Tạo mật khẩu mới' },
 { icon: Award, value: 'Bảo mật', label: 'An toàn dữ liệu' },
 ].map(({ icon: Icon, value, label }, i) => (
 <div key={label} className={['py-3', i < 2 ? 'border-r border-white/12 pr-3' : 'pl-3'].join(' ')}>
 <div className="flex items-center gap-1">
 <Icon className="w-3 h-3 text-blue-300" />
 <span className="text-lg font-semibold text-white">{value}</span>
 </div>
 <p className="text-[12px] text-blue-100/50 mt-0.5 font-medium">{label}</p>
 </div>
 ))}
 </div>
 <div className="mt-3 flex items-center justify-between text-[12px] text-blue-100/45 font-medium">
 <span className="flex items-center gap-1.5">
 <CheckCircle2 className="w-2.5 h-2.5 text-blue-400/60" />
 Hệ thống quản lý khảo thí sinh viên
 </span>
 <span>© 2026 Exam System. All rights reserved.</span>
 </div>
 </div>
 </div>
 </aside>

 {/* ══════════ RIGHT 60% FORM PANEL ══════════ */}
 <main
 className={[
 'flex-1 h-full flex flex-col overflow-hidden relative',
 isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-50/30',
 ].join(' ')}
 >
 {/* Dot pattern */}
 <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

 {/* Top bar: Theme toggle & Back button */}
 <div className="relative z-10 flex items-center justify-between p-4 shrink-0">
 <button
 type="button"
 onClick={() => router.push('/login')}
 className={[
 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition duration-200 cursor-pointer',
 isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
 ].join(' ')}
 >
 <ArrowLeft className="w-3.5 h-3.5" />
 <span>Đăng nhập</span>
 </button>

 <button
 type="button"
 onClick={toggleDark}
 aria-label="Chuyển chủ đề sáng/tối"
 className={[
 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition duration-200 cursor-pointer',
 isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
 ].join(' ')}
 >
 {isDark ? <><Sun className="w-3 h-3 text-amber-400" /><span>Sáng</span></> : <><Moon className="w-3 h-3" /><span>Tối</span></>}
 </button>
 </div>

 {/* Card — centered, fits remaining height */}
 <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-4 overflow-y-auto">
 <div
 className={[
 'w-full max-w-[480px] rounded-2xl border shadow-xl transition-colors duration-300',
 isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-slate-200/80 shadow-slate-200/60',
 ].join(' ')}
 >
 <div className="p-7">
 {/* Accent bar */}
 <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 mb-5" />

 {/* Mobile logo */}
 <div className="flex lg:hidden items-center gap-3 mb-4">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
 <GraduationCap className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-900 dark:text-white">Exam System</p>
 <p className="text-[12px] font-semibold tracking-[0.18em] text-blue-500 ">Khôi phục mật khẩu</p>
 </div>
 </div>

 {/* Step indicator header pills */}
 <div className="mb-4 flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl text-[12px] font-semibold">
 <span className={`flex-1 text-center py-1 rounded-lg transition ${step === 1 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500'}`}>
 1. Thông tin
 </span>
 <span className={`flex-1 text-center py-1 rounded-lg transition ${step === 2 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500'}`}>
 2. Mã OTP
 </span>
 <span className={`flex-1 text-center py-1 rounded-lg transition ${step === 3 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500'}`}>
 3. Mật khẩu
 </span>
 </div>

 {/* Header */}
 <div className="mb-4">
 <h2 className={['text-[22px] font-semibold tracking-tight leading-tight', isDark ? 'text-white' : 'text-slate-900'].join(' ')}>
 {step === 1 && 'Quên mật khẩu?'}
 {step === 2 && 'Xác thực mã OTP'}
 {step === 3 && 'Tạo mật khẩu mới'}
 {step === 4 && 'Hoàn thành khôi phục'}
 </h2>
 <p className={['mt-1 text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>
 {step === 1 && 'Nhập tên đăng nhập, mã số hoặc email đăng ký để nhận mã khôi phục.'}
 {step === 2 && `Mã xác thực 6 chữ số đã gửi về email liên kết với ${identifier}.`}
 {step === 3 && 'Nhập mật khẩu mới an toàn gồm tối thiểu 6 ký tự.'}
 {step === 4 && 'Mật khẩu mới của bạn đã được cập nhật thành công!'}
 </p>
 </div>

 {/* Error Alert Box matching Login Page */}
 {error && (
 <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
 <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
 <span>{error}</span>
 </div>
 )}

 {/* STEP 1 FORM */}
 {step === 1 && (
 <form onSubmit={handleRequestOtp} noValidate className="space-y-3">
 <div>
 <label htmlFor="fp-identifier" className={['block text-[12px] font-semibold tracking-[0.13em] mb-1.5', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
 Mã số sinh viên / Giảng viên / Email
 </label>
 <div className="relative">
 <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 id="fp-identifier"
 type="text"
 value={identifier}
 onChange={(e) => { setIdentifier(e.target.value); if (error) setError(''); }}
 placeholder="Ví dụ: SV001 hoặc admin@exam.edu.vn"
 className={inputCls}
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading || !identifier.trim()}
 className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
 >
 {loading ? (
 <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang gửi mã OTP...</span></>
 ) : (
 <><span>Gửi mã xác thực OTP</span><ArrowRight className="w-4 h-4" /></>
 )}
 </button>
 </form>
 )}

 {/* STEP 2 FORM */}
 {step === 2 && (
 <form onSubmit={handleVerifyOtp} noValidate className="space-y-3">
 <div>
 <label htmlFor="fp-otp" className={['block text-[12px] font-semibold tracking-[0.13em] mb-1.5', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
 Mã xác thực OTP (6 chữ số)
 </label>
 <div className="relative">
 <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 id="fp-otp"
 type="text"
 maxLength={6}
 value={otpCode}
 onChange={(e) => { setOtpCode(e.target.value); if (error) setError(''); }}
 placeholder="123456"
 className={[inputCls, ' tabular-nums text-center text-base tracking-widest'].join(' ')}
 />
 </div>
 </div>

 <div className="flex items-center justify-between text-xs font-semibold pt-1">
 <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-blue-600 transition cursor-pointer">
 Nhập thông tin khác
 </button>
 <button type="button" onClick={() => setToast({ message: 'Đã gửi lại mã OTP mới qua Email!', type: 'success' })} className="text-blue-600 hover:text-blue-700 font-semibold transition cursor-pointer">
 Gửi lại mã OTP
 </button>
 </div>

 <button
 type="submit"
 disabled={loading || otpCode.trim().length < 6}
 className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
 >
 {loading ? (
 <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang xác thực...</span></>
 ) : (
 <><span>Xác nhận mã OTP</span><ArrowRight className="w-4 h-4" /></>
 )}
 </button>
 </form>
 )}

 {/* STEP 3 FORM */}
 {step === 3 && (
 <form onSubmit={handleResetPassword} noValidate className="space-y-3">
 <div>
 <label htmlFor="fp-newpass" className={['block text-[12px] font-semibold tracking-[0.13em] mb-1.5', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
 Mật khẩu mới
 </label>
 <div className="relative">
 <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 id="fp-newpass"
 type={showPassword ? 'text' : 'password'}
 value={newPassword}
 onChange={(e) => { setNewPassword(e.target.value); if (error) setError(''); }}
 placeholder="Nhập mật khẩu mới"
 className={[inputCls, 'pr-10'].join(' ')}
 />
 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <div>
 <label htmlFor="fp-confirmpass" className={['block text-[12px] font-semibold tracking-[0.13em] mb-1.5', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
 Xác nhận mật khẩu mới
 </label>
 <div className="relative">
 <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 id="fp-confirmpass"
 type={showPassword ? 'text' : 'password'}
 value={confirmPassword}
 onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
 placeholder="Nhập lại mật khẩu mới"
 className={inputCls}
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading || !newPassword || !confirmPassword}
 className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
 >
 {loading ? (
 <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang lưu...</span></>
 ) : (
 <><KeyRound className="w-4 h-4" /><span>Lưu mật khẩu mới</span></>
 )}
 </button>
 </form>
 )}

 {/* STEP 4 SUCCESS CARD */}
 {step === 4 && (
 <div className="text-center space-y-4 py-2 animate-fade-in">
 <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-lg">
 <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
 </div>

 <p className={['text-xs font-semibold', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
 Tài khoản của bạn đã được bảo mật thành công với mật khẩu mới.
 </p>

 <button
 type="button"
 onClick={() => router.push('/login')}
 className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl cursor-pointer"
 >
 <span>Quay lại Đăng nhập</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* Footer */}
 <div className={['mt-5 pt-4 border-t text-center', isDark ? 'border-slate-800' : 'border-slate-100'].join(' ')}>
 <p className={['flex items-center justify-center gap-1.5 text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')}>
 <Headphones className="w-3 h-3 text-blue-500" />
 Cần hỗ trợ?{' '}
 <button type="button" onClick={() => router.push('/contact')} className="text-blue-600 hover:text-blue-700 font-semibold transition cursor-pointer">
 Liên hệ quản trị hệ thống
 </button>
 </p>
 </div>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
}
