'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { setAuthToken } from '../../lib/auth';
import { Lock, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Hệ thống Khảo thí</h1>
          <p className="text-sm text-slate-400 mt-1">Đăng nhập tài khoản để tiếp tục</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Tên đăng nhập
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-sky-500/25 transition duration-200 text-sm disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center font-medium mb-3">Tài khoản thử nghiệm nhanh:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => quickLogin('admin', 'admin123')}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg font-medium transition text-center"
            >
              Quản trị viên
            </button>
            <button
              onClick={() => quickLogin('GV001', 'GV001')}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-medium transition text-center"
            >
              Giảng viên
            </button>
            <button
              onClick={() => quickLogin('student1', '123456')}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-medium transition text-center"
            >
              Sinh viên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
