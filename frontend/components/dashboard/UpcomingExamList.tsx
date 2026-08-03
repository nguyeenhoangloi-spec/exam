'use client';

import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const statusLabel = {
  UPCOMING: ['Sắp diễn ra', 'bg-sky-50 text-sky-700'],
  ONGOING: ['Đang diễn ra', 'bg-emerald-50 text-emerald-700'],
  COMPLETED: ['Đã hoàn thành', 'bg-slate-100 text-slate-600'],
  CANCELLED: ['Đã hủy', 'bg-rose-50 text-rose-700'],
} as const;

export function UpcomingExamList({ exams }: { exams: DashboardOverview['upcomingExams'] }) {
  const router = useRouter();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Lịch thi sắp tới</h2>
          <p className="text-xs text-slate-500">Các lịch thi gần nhất cần theo dõi</p>
        </div>
        <button onClick={() => router.push('/exam-schedules')} className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800">
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {!exams.length ? <DashboardEmptyState message="Chưa có lịch thi sắp tới." /> : (
        <div className="divide-y divide-slate-100">
          {exams.map((exam) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => router.push(`/exam-schedules?view=${exam.id}`)}
              className="grid w-full gap-2 py-3 text-left transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:px-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="truncate text-sm text-slate-800">{exam.subjectName}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusLabel[exam.status][1]}`}>{statusLabel[exam.status][0]}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{exam.periodName} · {exam.subjectCode}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(exam.examDate).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{exam.startTime}–{exam.endTime}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{exam.roomCodes.join(', ') || 'Chưa xếp phòng'}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{exam.studentCount} SV</span>
                </div>
              </div>
              <span className="self-center text-xs font-semibold text-sky-700">Chi tiết</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
