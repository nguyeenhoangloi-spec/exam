'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, Award, XCircle } from 'lucide-react';

interface ExamPeriodKPICardsProps {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export function ExamPeriodKPICards({
  total,
  upcoming,
  ongoing,
  completed,
  cancelled,
}: ExamPeriodKPICardsProps) {
  const items = [
    {
      title: 'Tổng số kỳ thi',
      value: total,
      subtext: 'Tất cả kỳ thi',
      icon: Calendar,
    },
    {
      title: 'Sắp diễn ra',
      value: upcoming,
      subtext: 'Chuẩn bị tổ chức',
      icon: Clock,
    },
    {
      title: 'Đang diễn ra',
      value: ongoing,
      subtext: 'Đang tổ chức thi',
      icon: CheckCircle2,
    },
    {
      title: 'Đã hoàn thành',
      value: completed,
      subtext: 'Đã kết thúc',
      icon: Award,
    },
    {
      title: 'Đã hủy',
      value: cancelled,
      subtext: 'Bị hủy bỏ',
      icon: XCircle,
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
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 leading-[38px] tracking-tight tabular-nums">
                  {item.value.toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                <IconComponent className="h-5 w-5 stroke-[2]" />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100/80">
              <span className="text-[13px] font-normal text-slate-500 block truncate">
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
