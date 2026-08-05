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
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Sắp diễn ra',
      value: upcoming,
      subtext: 'Chuẩn bị tổ chức',
      icon: Clock,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Đang diễn ra',
      value: ongoing,
      subtext: 'Đang tổ chức thi',
      icon: CheckCircle2,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      title: 'Đã hoàn thành',
      value: completed,
      subtext: 'Đã kết thúc',
      icon: Award,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Đã hủy',
      value: cancelled,
      subtext: 'Bị hủy bỏ',
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.title}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {item.value.toLocaleString('vi-VN')}
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
