'use client';

import { CalendarDays, FilePlus2, PlusCircle } from 'lucide-react';
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
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date()));
  }, []);

  const actions = [
    { label: 'Tạo kỳ thi', icon: PlusCircle, route: '/exam-periods?action=create', primary: true },
    { label: 'Tạo đề thi', icon: FilePlus2, route: '/exam-papers' },
    { label: 'Xem lịch thi', icon: CalendarDays, route: '/exam-schedules' },
  ];

  return (
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
      <div className="min-w-0">
        <p className="text-sm font-medium capitalize text-sky-700">{today || '\u00A0'}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Chào mừng trở lại, {username}!
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Hôm nay có <strong className="text-slate-700">{examCount}</strong> lịch thi và{' '}
          <strong className="text-slate-700">{pendingQuestionCount}</strong> câu hỏi đang chờ xử lý.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, icon: Icon, route, primary }) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push(route)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              primary
                ? 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
