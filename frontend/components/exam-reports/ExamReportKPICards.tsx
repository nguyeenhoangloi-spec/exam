'use client';

import React from 'react';
import { Users, UserCheck, UserX, BarChart3, CheckCircle2 } from 'lucide-react';

interface ExamReportKPICardsProps {
  totalAssigned: number;
  totalSubmitted: number;
  totalAbsent: number;
  avgScore: number;
  passRate: number;
  passCount: number;
}

export function ExamReportKPICards({
  totalAssigned,
  totalSubmitted,
  totalAbsent,
  avgScore,
  passRate,
  passCount,
}: ExamReportKPICardsProps) {
  const items = [
    {
      title: 'Thí sinh được gán',
      value: totalAssigned,
      subtext: 'Tổng danh sách ca thi',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' thí sinh',
    },
    {
      title: 'Đã tham gia / Nộp',
      value: totalSubmitted,
      subtext: `${totalAssigned > 0 ? ((totalSubmitted / totalAssigned) * 100).toFixed(1) : 0}% tỷ lệ tham gia`,
      icon: UserCheck,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' TS',
    },
    {
      title: 'Vắng thi / Chưa làm',
      value: totalAbsent,
      subtext: 'Không nộp bài thi',
      icon: UserX,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' TS',
    },
    {
      title: 'Điểm Trung bình',
      value: avgScore,
      subtext: 'Thang điểm 10.0',
      icon: BarChart3,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' /10',
    },
    {
      title: 'Tỷ lệ Đạt (>= 5.0)',
      value: passRate,
      subtext: `${passCount} bài thi đạt yêu cầu`,
      icon: CheckCircle2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: '%',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.title}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {typeof item.value === 'number' ? item.value.toLocaleString('vi-VN') : item.value}
                  {item.unit || ''}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-transform group-hover:scale-110`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <span className="text-[10.5px] font-semibold text-slate-400 mt-2">
              {item.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}
