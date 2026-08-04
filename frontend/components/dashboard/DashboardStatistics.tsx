'use client';

import { BookOpen, CalendarClock, DoorOpen, GraduationCap, FileText, Users, ArrowRight, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview, DashboardSummaryItem } from '../../types/dashboard';

const cards: Array<{
  key: keyof DashboardOverview['summary'];
  title: string;
  icon: LucideIcon;
  tone: string;
}> = [
  { key: 'students', title: 'Tổng sinh viên', icon: Users, tone: 'bg-blue-50 text-blue-600' },
  { key: 'lecturers', title: 'Tổng giảng viên', icon: GraduationCap, tone: 'bg-emerald-50 text-emerald-600' },
  { key: 'subjects', title: 'Tổng môn học', icon: BookOpen, tone: 'bg-purple-50 text-purple-600' },
  { key: 'examRooms', title: 'Tổng phòng thi', icon: DoorOpen, tone: 'bg-amber-50 text-amber-600' },
  { key: 'upcomingExams', title: 'Kỳ thi sắp tới', icon: CalendarClock, tone: 'bg-sky-50 text-sky-600' },
  { key: 'pendingQuestions', title: 'Câu hỏi chờ duyệt', icon: FileText, tone: 'bg-rose-50 text-rose-600' },
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
      className="group flex flex-col justify-between min-h-[140px] rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="truncate text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-black text-slate-900 tracking-tight">{item.total.toLocaleString('vi-VN')}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{item.description || 'Đang hoạt động'}</p>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-bold text-[#1e66f5] group-hover:text-blue-700">
        <span>Xem chi tiết</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

export function DashboardStatistics({ summary }: { summary: DashboardOverview['summary'] }) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <DashboardStatCard key={card.key} {...card} item={summary[card.key]} />
      ))}
    </section>
  );
}
