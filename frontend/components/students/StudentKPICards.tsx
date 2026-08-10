'use client';

import React from 'react';
import { Users, CheckCircle2, School, Award } from 'lucide-react';

interface StudentKPICardsProps {
  total: number;
  withClass: number;
  totalClasses: number;
  filtered: number;
}

export function StudentKPICards({ total, withClass, totalClasses, filtered }: StudentKPICardsProps) {
  const items = [
    {
      title: 'Tổng Sinh viên',
      value: total,
      subtext: 'Chính quy trong hệ thống',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã phân Lớp',
      value: withClass,
      subtext: 'Sinh viên đã được xếp lớp',
      icon: CheckCircle2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Số Lớp học',
      value: totalClasses,
      subtext: 'Lớp đào tạo chuyên ngành',
      icon: School,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đang Hiển thị',
      value: filtered,
      subtext: 'Theo bộ lọc hiện tại',
      icon: Award,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
  ];

  return (
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
                <span className="text-[14px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {item.title}
                </span>
                <p className="text-[32px] font-bold text-[#0F172A] leading-tight">
                  {item.value.toLocaleString('vi-VN')}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}
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
