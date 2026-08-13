'use client';

import React from 'react';
import { Calendar, FileText } from 'lucide-react';
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
    <div className="rounded-2xl bg-primary-800 border border-white/10 px-6 py-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Text */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white tracking-tight leading-tight">
          Xin chào, <span className="text-blue-200">{username}</span>! 👋
        </h2>
        <p className="text-xs font-medium text-blue-100/80 leading-relaxed">
          Hôm nay có{' '}
          <strong className="text-white font-semibold">{displayExamCount} kỳ thi</strong> sắp diễn ra và{' '}
          <strong className="text-white font-semibold">{displayPendingCount} câu hỏi</strong> đang chờ phê duyệt.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => router.push('/exam-schedules')}
          className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white px-4 py-2 text-xs font-medium transition active:scale-95 cursor-pointer"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Xem lịch thi</span>
        </button>

        {onExportPDF && (
          <button
            type="button"
            onClick={onExportPDF}
            className="flex items-center gap-1.5 rounded-xl bg-white text-primary-800 hover:bg-blue-50 px-4 py-2 text-xs font-medium transition active:scale-95 cursor-pointer shadow-sm"
            title="Xuất Báo cáo PDF"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Xuất PDF</span>
          </button>
        )}
      </div>
    </div>
  );
}
