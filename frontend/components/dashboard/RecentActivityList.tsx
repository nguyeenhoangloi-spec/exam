'use client';

import React from 'react';
import {
  ArrowRight,
  LogIn,
  PlusCircle,
  FileText,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

export function RecentActivityList({ activities }: { activities?: DashboardOverview['recentActivities'] }) {
  const router = useRouter();

  const activityList = (activities && activities.length > 0)
    ? activities.slice(0, 5).map((act, idx) => {
        const actionStr = (act.action || 'ACTIVITY').toUpperCase();
        let icon = FileText;
        if (actionStr.includes('LOGIN')) icon = LogIn;
        else if (actionStr.includes('CREATE')) icon = PlusCircle;
        else if (actionStr.includes('APPEAL') || actionStr.includes('GRADE')) icon = AlertCircle;

        return {
          id: act.id || String(idx),
          actorName: act.actor?.username || 'admin',
          actionTag: actionStr,
          targetInfo: act.description || 'Thao tác hệ thống',
          time: act.createdAt ? (() => {
            const d = new Date(act.createdAt);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
          })() : 'Vừa xong',
          icon,
        };
      })
    : [
        {
          id: '1',
          actorName: 'admin',
          actionTag: 'LOGIN',
          targetInfo: 'Đã đăng nhập bằng Google (Quản trị viên)',
          time: 'Vừa xong',
          icon: LogIn,
        },
        {
          id: '2',
          actorName: 'admin',
          actionTag: 'CREATE',
          targetInfo: 'Đã tạo câu hỏi 0002733',
          time: 'Vừa xong',
          icon: PlusCircle,
        },
        {
          id: '3',
          actorName: 'admin',
          actionTag: 'CREATE',
          targetInfo: 'Đã tạo câu hỏi 0002732',
          time: 'Vừa xong',
          icon: PlusCircle,
        },
        {
          id: '4',
          actorName: 'admin',
          actionTag: 'LOGIN',
          targetInfo: 'Đã đăng nhập bằng Google (Quản trị viên)',
          time: 'Vừa xong',
          icon: LogIn,
        },
        {
          id: '5',
          actorName: 'sv048',
          actionTag: 'CREATE_GRADE_APPEAL',
          targetInfo: 'Sinh viên gửi đơn phúc khảo cho lượt thi...',
          time: 'Vừa xong',
          icon: AlertCircle,
        },
      ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-[17px] font-bold text-slate-900">Hoạt động gần đây</h3>

        <button
          type="button"
          onClick={() => router.push('/reports')}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Timeline Items List */}
      {activityList.length > 0 ? (
        <div className="space-y-3 my-auto">
          {activityList.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start justify-between gap-2.5 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200/80 text-slate-600 mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-semibold text-slate-900 truncate">
                      {item.actorName} <span className="font-bold text-slate-500 uppercase">{item.actionTag}</span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                      {item.targetInfo}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-slate-400 shrink-0 mt-0.5">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center my-auto space-y-2 text-slate-400">
          <Activity className="w-8 h-8 mx-auto text-slate-700" />
          <p className="text-xs font-semibold text-slate-500">Chưa có hoạt động gần đây nào</p>
        </div>
      )}
    </div>
  );
}
