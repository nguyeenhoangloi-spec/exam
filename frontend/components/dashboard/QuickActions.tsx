'use client';

import {
  CalendarPlus,
  Clock,
  Layers,
  UserCheck,
  FilePlus,
  FileText,
  Upload,
  BarChart3,
  LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionItem {
  title: string;
  icon: LucideIcon;
  route: string;
  tone: string;
}

const actions: QuickActionItem[] = [
  { title: 'Tạo kỳ thi', icon: CalendarPlus, route: '/exam-periods?action=create', tone: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { title: 'Tạo ca thi', icon: Clock, route: '/exam-schedules?action=create', tone: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  { title: 'Xếp phòng thi', icon: Layers, route: '/exam-arrangement', tone: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
  { title: 'Phân công GV', icon: UserCheck, route: '/exam-supervisors', tone: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
  { title: 'Tạo câu hỏi', icon: FilePlus, route: '/question-bank?action=create', tone: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
  { title: 'Tạo đề thi', icon: FileText, route: '/exam-papers', tone: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  { title: 'Import dữ liệu', icon: Upload, route: '/question-bank?action=import', tone: 'bg-sky-50 text-sky-600 hover:bg-sky-100' },
  { title: 'Xem báo cáo', icon: BarChart3, route: '/reports', tone: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Tác vụ quản trị nhanh</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ title, icon: Icon, route, tone }) => (
          <button
            key={title}
            type="button"
            onClick={() => router.push(route)}
            className={`group flex items-center justify-center gap-2 rounded-xl p-3.5 text-center transition shadow-2xs hover:shadow-xs active:scale-98 ${tone}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-bold text-slate-800 group-hover:text-slate-900">{title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
