'use client';

import React from 'react';
import { Calendar, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

type WelcomeBannerProps = {
  username: string;
  examCount: number;
  pendingQuestionCount: number;
  onExportPDF?: () => void;
};

export function DashboardWelcome({
  username,
  examCount,
  pendingQuestionCount,
  onExportPDF,
}: WelcomeBannerProps) {
  const router = useRouter();

  const displayExamCount = examCount ?? 0;
  const displayPendingCount = pendingQuestionCount ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0047BA] p-6 text-white shadow-md min-h-[120px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* 3D Isometric Vector Illustration */}
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-30">
        <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Isometric Diamond Base Shadow */}
          <path d="M160 30L300 90L160 150L20 90L160 30Z" fill="#003494" fillOpacity="0.6" />
          <path d="M160 20L290 80L160 140L30 80L160 20Z" fill="#1D4ED8" fillOpacity="0.4" />

          {/* 3D Laptop Screen & Base */}
          <path d="M110 115L210 115L225 125L95 125L110 115Z" fill="#60A5FA" fillOpacity="0.5" />
          <path d="M120 70L200 70L200 115L120 115Z" fill="#1E3A8A" fillOpacity="0.8" rx="3" />
          <path d="M124 74L196 74L196 111L124 111Z" fill="#3B82F6" />

          {/* Floating 3D Check Circle Icon */}
          <circle cx="85" cy="50" r="13" fill="#10B981" />
          <path d="M79 50L83 54L91 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Floating 3D Exam Sheet/Paper */}
          <path d="M235 25L285 45L255 85L205 65Z" fill="#E0F2FE" />
          <rect x="225" y="42" width="30" height="3" rx="1.5" fill="#3B82F6" transform="rotate(22 225 42)" />
          <rect x="222" y="52" width="24" height="3" rx="1.5" fill="#93C5FD" transform="rotate(22 222 52)" />

          {/* Floating 3D Orange Calculator Icon */}
          <rect x="250" y="80" width="22" height="26" rx="4" fill="#F59E0B" />
          <rect x="254" y="84" width="14" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="256" cy="94" r="1" fill="white" />
          <circle cx="261" cy="94" r="1" fill="white" />
          <circle cx="266" cy="94" r="1" fill="white" />
          <circle cx="256" cy="99" r="1" fill="white" />
          <circle cx="261" cy="99" r="1" fill="white" />
          <circle cx="266" cy="99" r="1" fill="white" />
        </svg>
      </div>

      {/* Main Text Content */}
      <div className="relative z-10 max-w-xl space-y-1">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
          Xin chào, <span className="text-[#7DD3FC]">{username}</span>! 👋
        </h2>
        <p className="text-xs font-semibold text-blue-100/90 leading-relaxed pt-0.5">
          Hôm nay có <strong className="text-white font-extrabold">{displayExamCount} kỳ thi</strong> sắp diễn ra và{' '}
          <strong className="text-white font-extrabold">{displayPendingCount} câu hỏi</strong> đang chờ bạn phê duyệt vào ngân hàng câu hỏi.
        </p>
      </div>

      {/* Action Pills - Nằm bên phải theo đúng chuẩn Hero Banner */}
      <div className="relative z-10 flex flex-wrap items-center sm:justify-end gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => router.push('/exam-schedules')}
          className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#003896] px-4 py-2.5 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Calendar className="h-4 w-4 text-[#003896]" />
          <span>Xem lịch thi</span>
        </button>

        {onExportPDF && (
          <button
            type="button"
            onClick={onExportPDF}
            className="flex items-center gap-2 rounded-xl bg-[#001E5C] hover:bg-[#001748] text-white px-4 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-xs border border-blue-400/20"
            title="Xuất Báo cáo tổng quan Dashboard ra file PDF A4"
          >
            <Printer className="h-4 w-4 text-white" />
            <span>Xuất Báo cáo PDF</span>
          </button>
        )}
      </div>
    </div>
  );
}
