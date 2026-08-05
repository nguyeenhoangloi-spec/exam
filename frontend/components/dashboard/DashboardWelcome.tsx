'use client';

import { Calendar, Plus, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardWelcome({
  username,
  examCount,
  pendingQuestionCount,
}: {
  username: string;
  examCount: number;
  pendingQuestionCount: number;
}) {
  const router = useRouter();
  const [todayText, setTodayText] = useState('');
  const [shortDate, setShortDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(now);

    // Capitalize first letter of weekday
    const capitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    setTodayText(capitalized);

    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setShortDate(`${dd}/${mm}/${yyyy}`);
  }, []);

  return (
    <section className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs lg:flex-row lg:items-center">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Chào buổi sáng, {username || 'Quản trị viên'} <span className="animate-bounce inline-block">👋</span>
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Theo dõi tình hình tổ chức thi và các công việc cần xử lý hôm nay.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {/* Date Display */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/70 px-4 py-2 text-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs">{todayText || 'Thứ Sáu, 8 tháng 4 năm 2026'}</p>
            <p className="text-[11px] font-semibold text-slate-400">{shortDate || '08/04/2026'}</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => router.push('/exam-periods?action=create')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-3 shadow-sm transition hover:shadow-md active:scale-98"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Tạo kỳ thi</span>
        </button>

        {/* Secondary Action Button */}
        <button
          type="button"
          onClick={() => router.push('/exam-arrangement')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-3 shadow-2xs transition hover:border-slate-300 active:scale-98"
        >
          <Layers className="h-4 w-4 text-slate-600" />
          <span>Xếp lịch thi</span>
        </button>
      </div>
    </section>
  );
}
