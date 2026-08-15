'use client';

import React from 'react';
import {
  ChevronRight,
  LogIn,
  PlusCircle,
  FileText,
  Activity,
  AlertCircle,
  ShieldCheck,
  Database,
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
        else if (actionStr.includes('BACKUP')) icon = Database;

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
          targetInfo: 'Đã đăng nhập vào hệ thống (Quản trị viên)',
          time: 'Vừa xong',
          icon: LogIn,
        },
        {
          id: '2',
          actorName: 'admin',
          actionTag: 'CREATE_QUESTION',
          targetInfo: 'Đã thêm mới câu hỏi trắc nghiệm vào ngân hàng đề',
          time: '10 phút trước',
          icon: PlusCircle,
        },
        {
          id: '3',
          actorName: 'admin',
          actionTag: 'BACKUP_QUEUED',
          targetInfo: 'Đã khởi tạo bản sao lưu snapshot cơ sở dữ liệu',
          time: '35 phút trước',
          icon: Database,
        },
        {
          id: '4',
          actorName: 'admin',
          actionTag: 'APPROVE_QUESTION',
          targetInfo: 'Phê duyệt câu hỏi thi trắc nghiệm',
          time: '1 giờ trước',
          icon: ShieldCheck,
        },
        {
          id: '5',
          actorName: 'sv048',
          actionTag: 'CREATE_GRADE_APPEAL',
          targetInfo: 'Sinh viên gửi đơn xin phúc khảo điểm thi',
          time: '2 giờ trước',
          icon: AlertCircle,
        },
      ];

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">Hoạt động gần đây</h3>

        <button
          type="button"
          onClick={() => router.push('/admin/activity-logs')}
          className="inline-flex items-center gap-1 text-[13.5px] leading-5 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition cursor-pointer select-none"
        >
          <span>Xem tất cả</span>
          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>

      {/* Timeline Items List */}
      {activityList.length > 0 ? (
        <div className="space-y-2.5 my-auto">
          {activityList.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start justify-between gap-2.5 text-xs py-1">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[13px]">
                      {item.actorName} <span className="font-normal text-slate-500 dark:text-slate-400 text-[12px]">• {item.actionTag}</span>
                    </p>
                    <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.targetInfo}
                    </p>
                  </div>
                </div>

                <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center my-auto space-y-2 text-slate-400">
          <Activity className="w-7 h-7 mx-auto text-slate-400 dark:text-slate-600" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chưa có hoạt động gần đây nào</p>
        </div>
      )}
    </div>
  );
}

