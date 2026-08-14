'use client';

import React from 'react';
import { BarChart3, CheckCircle2, ClipboardList, UserCheck } from 'lucide-react';

interface ExamReportKPICardsProps {
  totalExams: number;
  totalSchedules: number;
  totalAssigned: number;
  totalSubmitted: number;
  totalAbsent: number;
  totalUngraded: number;
  totalFlagged: number;
  avgScore: number;
  passRate: number;
  passCount: number;
}

export function ExamReportKPICards({
  totalExams,
  totalSchedules,
  totalAssigned,
  totalSubmitted,
  totalAbsent,
  totalUngraded,
  totalFlagged,
  avgScore,
  passRate,
  passCount,
}: ExamReportKPICardsProps) {
  const items = [
    {
      title: 'Tổng ca thi',
      value: totalSchedules,
      subtext: `${totalExams} kỳ thi trong phạm vi lọc`,
      progressPercent: totalSchedules > 0 ? 100 : 0,
      icon: ClipboardList,
      unit: '',
    },
    {
      title: 'Sinh viên dự thi',
      value: totalSubmitted,
      subtext: `${totalAssigned > 0 ? ((totalSubmitted / totalAssigned) * 100).toFixed(1) : 0}% trên tổng số được gán`,
      progressPercent: totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 100,
      icon: UserCheck,
      unit: '',
    },
    {
      title: 'Tỷ lệ đạt',
      value: passRate,
      subtext: `${passCount} bài đạt từ 5.0 điểm`,
      progressPercent: Math.min(Math.max(passRate, 0), 100),
      icon: CheckCircle2,
      unit: '%',
    },
    {
      title: 'Điểm trung bình',
      value: avgScore,
      subtext: 'Trên thang điểm 10',
      progressPercent: Math.min(Math.max(avgScore * 10, 0), 100),
      icon: BarChart3,
      unit: ' /10',
    },
  ];

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
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
                    {item.value.toLocaleString('vi-VN')}
                    {item.unit || ''}
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

      {/* Bar Thống kê tổng hợp tinh giản */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-wider text-[12px]">Tổng hợp:</span>
        <span>Được gán: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{totalAssigned.toLocaleString('vi-VN')}</strong></span>
        <span>Vắng thi: <strong className="text-rose-600 font-semibold">{totalAbsent.toLocaleString('vi-VN')}</strong></span>
        <span>Chưa chấm: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{totalUngraded.toLocaleString('vi-VN')}</strong></span>
        <span>Bất thường / Giám sát: <strong className="text-amber-600 font-semibold">{totalFlagged.toLocaleString('vi-VN')}</strong></span>
      </div>
    </div>
  );
}
