'use client';

import React from 'react';
import { UserCheck, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ExamSupervisorKPICardsProps {
  totalAssignments: number;
  changeRequestedCount: number;
  confirmedCount: number;
  completedCount: number;
  totalRooms: number;
}

export function ExamSupervisorKPICards({
  totalAssignments,
  changeRequestedCount,
  confirmedCount,
  completedCount,
  totalRooms,
}: ExamSupervisorKPICardsProps) {
  const cards = [
    {
      title: 'Lượt phân công',
      value: totalAssignments,
      subtext: `Lịch thi: ${totalRooms} phòng`,
      progressPercent: totalAssignments > 0 ? 100 : 0,
      icon: UserCheck,
    },
    {
      title: 'Yêu cầu đổi ca',
      value: changeRequestedCount,
      subtext: changeRequestedCount > 0 ? 'Cần phê duyệt đổi ca' : 'Không có yêu cầu mới',
      progressPercent: totalAssignments > 0 ? Math.round((changeRequestedCount / totalAssignments) * 100) : 0,
      icon: RefreshCw,
    },
    {
      title: 'Đã xác nhận ca',
      value: confirmedCount,
      subtext: 'Sẵn sàng gác thi',
      progressPercent: totalAssignments > 0 ? Math.round((confirmedCount / totalAssignments) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Đã hoàn thành',
      value: completedCount,
      subtext: 'Đã kết thúc gác thi',
      progressPercent: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {item.value}
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <IconComponent className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
              />
            </div>

            <div className="mt-2.5">
              <span
                title={item.subtext}
                className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
              >
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
