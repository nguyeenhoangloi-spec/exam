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
      icon: ClipboardList,
      unit: '',
    },
    {
      title: 'Sinh viên dự thi',
      value: totalSubmitted,
      subtext: `${totalAssigned > 0 ? ((totalSubmitted / totalAssigned) * 100).toFixed(1) : 0}% trên tổng số được gán`,
      icon: UserCheck,
      unit: '',
    },
    {
      title: 'Tỷ lệ đạt',
      value: passRate,
      subtext: `${passCount} bài đạt từ 5.0 điểm`,
      icon: CheckCircle2,
      unit: '%',
    },
    {
      title: 'Điểm trung bình',
      value: avgScore,
      subtext: 'Trên thang điểm 10',
      icon: BarChart3,
      unit: ' /10',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.title}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-500 tracking-wider">
                    {item.title}
                  </span>
                  <p className="text-[32px] font-bold text-slate-900 leading-[38px] tabular-nums">
                    {item.value.toLocaleString('vi-VN')}
                    {item.unit || ''}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>

              <span className="text-xs font-normal text-slate-500 mt-2">
                {item.subtext}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bar Thống kê tổng hợp tinh giản */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-600 font-medium">
        <span className="font-semibold text-slate-900 tracking-wider text-[12px]">Tổng hợp:</span>
        <span>Được gán <strong className="text-slate-900 font-semibold">{totalAssigned.toLocaleString('vi-VN')}</strong></span>
        <span>Vắng <strong className="text-rose-600 font-semibold">{totalAbsent.toLocaleString('vi-VN')}</strong></span>
        <span>Chưa chấm <strong className="text-amber-600 font-semibold">{totalUngraded.toLocaleString('vi-VN')}</strong></span>
        <span>Bất thường <strong className="text-rose-600 font-semibold">{totalFlagged.toLocaleString('vi-VN')}</strong></span>
      </div>
    </div>
  );
}
