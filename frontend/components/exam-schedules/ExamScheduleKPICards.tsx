'use client';

import React from 'react';
import { Calendar, Clock, UserCheck, CheckCircle2, XCircle } from 'lucide-react';

interface ExamScheduleKPICardsProps {
  total?: number;
  upcoming?: number;
  completed?: number;
  ongoing?: number;
  cancelled?: number;
}

export function ExamScheduleKPICards({
  total = 0,
  upcoming = 0,
  completed = 0,
  ongoing = 0,
  cancelled = 0,
}: ExamScheduleKPICardsProps) {
  const items = [
    {
      title: 'Tổng lịch thi',
      value: total,
      subtext: 'Tất cả lịch thi',
      icon: Calendar,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Sắp diễn ra',
      value: upcoming,
      subtext: 'Trong 7 ngày tới',
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã diễn ra',
      value: completed,
      subtext: 'Đã hoàn thành',
      icon: UserCheck,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đang diễn ra',
      value: ongoing,
      subtext: 'Hiện tại',
      icon: CheckCircle2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã hủy',
      value: cancelled,
      subtext: 'Bị hủy',
      icon: XCircle,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
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
                <span className="text-[13px] font-semibold text-[#64748B] tracking-wider">
                  {item.title}
                </span>
                <p className="text-[32px] font-bold text-[#0F172A] leading-[38px]">
                  {item.value.toLocaleString('vi-VN')}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-transform group-hover:scale-110`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <span className="text-[13px] font-normal text-[#64748B] mt-2">
              {item.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}
