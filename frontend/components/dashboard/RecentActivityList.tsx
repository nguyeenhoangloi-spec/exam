'use client';

import React from 'react';
import {
  ArrowRight,
  FilePlus,
  CheckCircle2,
  CalendarPlus,
  Clock,
  Bell,
  Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

export function RecentActivityList({ activities }: { activities?: DashboardOverview['recentActivities'] }) {
  const router = useRouter();

  const activityList = (activities && activities.length > 0)
    ? activities.slice(0, 5).map((act, idx) => {
        const icons = [FilePlus, CheckCircle2, CalendarPlus, Clock, Bell];

        return {
          id: act.id || String(idx),
          actorName: act.actor?.username || 'Hệ thống',
          actionText: act.action || 'thực hiện thao tác',
          targetInfo: act.description || 'Hoạt động hệ thống',
          time: act.createdAt ? (() => {
            const d = new Date(act.createdAt);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
          })() : 'Vừa xong',
          icon: icons[idx % icons.length],
        };
      })
    : [];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Hoạt động gần đây</h3>

        <button
          type="button"
          onClick={() => router.push('/reports')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Timeline Items List */}
      {activityList.length > 0 ? (
        <div className="space-y-3.5 my-auto">
          {activityList.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 border border-slate-200/80 text-slate-700 font-bold mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-slate-800">
                      <strong className="font-extrabold text-slate-900">{item.actorName}</strong>{' '}
                      <span className="font-medium text-slate-700">{item.actionText}</span>
                    </p>
                    <p className="text-[10.5px] font-medium text-slate-500 truncate mt-0.5">
                      {item.targetInfo}
                    </p>
                  </div>
                </div>

                <span className="text-[10.5px] font-bold text-slate-400 shrink-0 mt-0.5">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center my-auto space-y-2 text-slate-400">
          <Activity className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Chưa có hoạt động gần đây nào</p>
        </div>
      )}
    </div>
  );
}
