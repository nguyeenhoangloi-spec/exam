'use client';

import { BookOpen, CalendarClock, DoorOpen, GraduationCap, HelpCircle, LucideIcon, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview, DashboardSummaryItem } from '../../types/dashboard';

const cards: Array<{
  key: keyof DashboardOverview['summary'];
  title: string;
  icon: LucideIcon;
  tone: string;
}> = [
  { key: 'students', title: 'Tổng sinh viên', icon: Users, tone: 'bg-sky-50 text-sky-700' },
  { key: 'lecturers', title: 'Tổng giảng viên', icon: GraduationCap, tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'subjects', title: 'Tổng môn học', icon: BookOpen, tone: 'bg-violet-50 text-violet-700' },
  { key: 'examRooms', title: 'Tổng phòng thi', icon: DoorOpen, tone: 'bg-indigo-50 text-indigo-700' },
  { key: 'upcomingExams', title: 'Lịch thi sắp tới', icon: CalendarClock, tone: 'bg-amber-50 text-amber-700' },
  { key: 'pendingQuestions', title: 'Câu hỏi chờ duyệt', icon: HelpCircle, tone: 'bg-rose-50 text-rose-700' },
];

export function DashboardStatCard({
  title,
  item,
  icon: Icon,
  tone,
}: {
  title: string;
  item: DashboardSummaryItem;
  icon: LucideIcon;
  tone: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(item.route)}
      className="group min-h-28 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{item.total.toLocaleString('vi-VN')}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 truncate text-xs text-slate-500">{item.description || 'Đang cập nhật'}</p>
    </button>
  );
}

export function DashboardStatistics({ summary }: { summary: DashboardOverview['summary'] }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <DashboardStatCard key={card.key} {...card} item={summary[card.key]} />
      ))}
    </section>
  );
}
