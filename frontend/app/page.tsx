'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, getAuthUser } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();

    if (!token || !user) {
      router.push('/login');
    } else if (user.role === 'ADMIN') {
      router.push('/dashboard');
    } else if (user.role === 'TEACHER') {
      router.push('/teacher/assignments');
    } else if (user.role === 'STUDENT') {
      router.push('/student/exam-schedule');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-300 font-medium">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
