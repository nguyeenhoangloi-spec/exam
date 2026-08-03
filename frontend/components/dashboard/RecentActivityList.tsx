import { CalendarPlus, CheckCircle2, ClipboardList, FileQuestion, LogIn, UserCheck } from 'lucide-react';
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
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  if (seconds < 60) return formatter.format(-seconds, 'second');
  if (seconds < 3600) return formatter.format(-Math.round(seconds / 60), 'minute');
  if (seconds < 86400) return formatter.format(-Math.round(seconds / 3600), 'hour');
  return formatter.format(-Math.round(seconds / 86400), 'day');
}

export function RecentActivityList({ activities }: { activities: DashboardOverview['recentActivities'] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
      <div className="mb-4">
        <h2 className="font-bold text-slate-900">Hoạt động gần đây</h2>
        <p className="text-xs text-slate-500">Lịch sử thao tác được ghi nhận từ hệ thống</p>
      </div>
      {!activities.length ? <DashboardEmptyState message="Chưa có hoạt động nào được ghi nhận." /> : (
        <div className="divide-y divide-slate-100">
          {activities.map((activity) => {
            const Icon = iconByType[activity.entityType as keyof typeof iconByType] || ClipboardList;
            return (
              <div key={activity.id} className="flex gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-700">{activity.description}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {activity.actor?.username || 'Hệ thống'} · {relativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
