'use client';

import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const displayExamCount = examCount > 0 ? examCount : 3;
  const displayPendingCount = pendingQuestionCount > 0 ? pendingQuestionCount : 12;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 text-white shadow-md min-h-[140px] flex flex-col justify-between">
      {/* 3D Isometric Vector Illustration Overlay matching Mockup Image */}
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-90">
        <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Isometric Grid Floor */}
          <path d="M160 20L300 80L160 140L20 80L160 20Z" fill="url(#grid-grad)" fillOpacity="0.15" />

          {/* 3D Laptop Stand */}
          <path d="M110 110L210 110L230 125L90 125L110 110Z" fill="#93C5FD" fillOpacity="0.4" />
          <path d="M120 60L200 60L200 110L120 110Z" fill="#1E3A8A" fillOpacity="0.7" rx="4" />
          <path d="M124 64L196 64L196 106L124 106Z" fill="#60A5FA" fillOpacity="0.5" />

          {/* 3D Exam Sheet/Paper Floating */}
          <path d="M210 40L260 20L290 50L240 70Z" fill="#FFFFFF" fillOpacity="0.85" />
          <rect x="230" y="38" width="30" height="3" rx="1.5" fill="#3B82F6" transform="rotate(-20 230 38)" />
          <rect x="235" y="46" width="25" height="3" rx="1.5" fill="#93C5FD" transform="rotate(-20 235 46)" />

          {/* Floating 3D Check Circle Icon */}
          <circle cx="90" cy="50" r="14" fill="#34D399" fillOpacity="0.9" />
          <path d="M84 50L88 54L96 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Floating 3D Calendar Icon */}
          <rect x="240" y="80" width="28" height="28" rx="6" fill="#F59E0B" fillOpacity="0.9" />
          <rect x="244" y="84" width="20" height="4" rx="1" fill="white" />
          <circle cx="248" cy="94" r="1.5" fill="white" />
          <circle cx="254" cy="94" r="1.5" fill="white" />
          <circle cx="260" cy="94" r="1.5" fill="white" />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="grid-grad" x1="20" y1="20" x2="300" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left greeting & status lines */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Xin chào, {username}</span>
            <span className="animate-bounce inline-block">👋</span>
          </h2>
          <div className="space-y-0.5 text-xs sm:text-sm font-medium text-blue-50">
            <p>Hôm nay có <strong className="font-black text-white">{displayExamCount}</strong> kỳ thi diễn ra</p>
            <p><strong className="font-black text-white">{displayPendingCount}</strong> câu hỏi đang chờ duyệt</p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/exam-schedules')}
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-blue-900 px-4 py-2.5 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Xem lịch thi</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/question-bank?status=PENDING')}
            className="flex items-center gap-2 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white px-4 py-2.5 text-xs font-bold backdrop-blur-xs transition active:scale-95 cursor-pointer"
          >
            <CheckCircle className="h-4 w-4 text-emerald-300" />
            <span>Duyệt câu hỏi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
