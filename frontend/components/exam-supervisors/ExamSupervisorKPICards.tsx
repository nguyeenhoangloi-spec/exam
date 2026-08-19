'use client';

import React from 'react';
import { UserCheck, CheckCircle2, Clock, RefreshCw, ShieldCheck } from 'lucide-react';

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
  const pendingCount = Math.max(
    0,
    totalAssignments - confirmedCount - changeRequestedCount - completedCount,
  );

  const cards = [
    {
      title: 'Tổng phân công',
      value: totalAssignments,
      subtext: `Lịch thi: ${totalRooms} phòng`,
      progressPercent: totalAssignments > 0 ? 100 : 0,
      icon: UserCheck,
    },
    {
      title: 'Đã xác nhận',
      value: confirmedCount,
      subtext: 'Sẵn sàng gác thi',
      progressPercent:
        totalAssignments > 0 ? Math.round((confirmedCount / totalAssignments) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Chờ xác nhận',
      value: pendingCount,
      subtext: 'Chờ phản hồi từ GV',
      progressPercent:
        totalAssignments > 0 ? Math.round((pendingCount / totalAssignments) * 100) : 0,
      icon: Clock,
    },
    {
      title: 'Yêu cầu đổi ca',
      value: changeRequestedCount,
      subtext: changeRequestedCount > 0 ? 'Cần duyệt đổi ca' : 'Không có yêu cầu',
      progressPercent:
        totalAssignments > 0 ? Math.round((changeRequestedCount / totalAssignments) * 100) : 0,
      icon: RefreshCw,
    },
    {
      title: 'Đã hoàn thành',
      value: completedCount,
      subtext: 'Đã kết thúc gác thi',
      progressPercent:
        totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
          >
            {/* Top row: Title + Value on left, Icon on right */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-type-kpi font-semibold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {typeof item.value === 'number' ? item.value.toLocaleString('vi-VN') : item.value}
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <IconComponent className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
              />
            </div>

            {/* Bottom Subtext */}
            <div className="mt-2.5">
              <span
                title={item.subtext}
                className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
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
