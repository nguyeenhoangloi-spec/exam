'use client';

import { ArrowRight, CalendarPlus, CheckCircle2, ClipboardList, FileQuestion, LogIn, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const iconByType = {
  AUTH: LogIn,
  QUESTION: FileQuestion,
  EXAM_PERIOD: CalendarPlus,
  EXAM_SCHEDULE: ClipboardList,
  EXAM_SUPERVISOR: UserCheck,
  EXAM_PAPER: CheckCircle2,
};

function relativeTime(value: string) {
  if (!value) return 'vừa xong';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'vừa xong';
  if (seconds < 3600) return `${Math.round(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} giờ trước`;
  return `${Math.round(seconds / 86400)} ngày trước`;
}

export function RecentActivityList({ activities }: { activities: DashboardOverview['recentActivities'] }) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Hoạt động gần đây</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">5 hoạt động mới nhất</p>
        </div>
        <button
          onClick={() => router.push('/reports')}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!activities.length ? (
        <DashboardEmptyState message="Chưa có hoạt động nào được ghi nhận." />
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => {
            const Icon = iconByType[activity.entityType as keyof typeof iconByType] || ClipboardList;
            return (
              <div
                key={activity.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="truncate text-xs text-slate-700 font-medium" title={activity.description}>
                    <strong className="font-bold text-slate-900">{activity.actor?.username || 'Hệ thống'}</strong>{' '}
                    {activity.description}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                  {relativeTime(activity.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
