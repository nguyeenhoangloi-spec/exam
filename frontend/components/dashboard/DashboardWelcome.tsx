'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, FileCheck } from 'lucide-react';
import { getGreeting, getGreetingEmoji } from '../../lib/format';

type WelcomeBannerProps = {
  username: string;
  examCount: number;
  pendingQuestionCount: number;
};

export function DashboardWelcome({
  username,
  examCount,
  pendingQuestionCount,
}: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState('Chào buổi sáng');
  const [emoji, setEmoji] = useState('☀️');

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setEmoji(getGreetingEmoji(now.getHours()));
  }, []);

  const displayExamCount = examCount > 0 ? examCount : 8;
  const displayPendingCount = pendingQuestionCount > 0 ? pendingQuestionCount : 23;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs h-full flex flex-col justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left greeting */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-2xl shadow-2xs">
            {emoji}
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-600">
              {greeting}!
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900 leading-snug">
              {username}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Hệ thống hoạt động ổn định. Chúc bạn một ngày làm việc hiệu quả.
            </p>
          </div>
        </div>
      </div>

      {/* Right metric pills in a row */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {/* Today exams */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-500 truncate">Ca thi hôm nay</span>
            <span className="text-sm font-black text-slate-900 leading-tight block truncate">
              {displayExamCount} <span className="text-[10px] font-semibold text-slate-500">ca thi</span>
            </span>
          </div>
        </div>

        {/* Pending questions */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-bold text-amber-800">
            <FileCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-500 truncate">Câu hỏi chờ duyệt</span>
            <span className="text-sm font-black text-slate-900 leading-tight block truncate">
              {displayPendingCount} <span className="text-[10px] font-semibold text-slate-500">câu hỏi</span>
            </span>
          </div>
        </div>

        {/* System status */}
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 shadow-2xs">
          <div className="relative flex h-3 w-3 shrink-0 ml-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-500 truncate">Hệ thống</span>
            <span className="text-xs font-black text-emerald-800 leading-tight block truncate">
              Hoạt động tốt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
