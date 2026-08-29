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
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        <p className="text-type-body font-medium text-slate-700 dark:text-slate-300">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
