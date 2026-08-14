'use client';

import React from 'react';
import { GraduationCap, Award, Building2, Users } from 'lucide-react';

interface TeacherKPICardsProps {
  total: number;
  withDegree: number;
  withDept: number;
  filtered: number;
}

export function TeacherKPICards({ total, withDegree, withDept, filtered }: TeacherKPICardsProps) {
  const items = [
    {
      title: 'Tổng giảng viên',
      value: total,
      subtext: 'Cán bộ giảng dạy',
      icon: GraduationCap,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Có học vị khai báo',
      value: withDegree,
      subtext: 'TS / ThS / GS',
      icon: Award,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã phân khoa',
      value: withDept,
      subtext: 'Có đơn vị quản lý',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đang hiển thị',
      value: filtered,
      subtext: 'Theo bộ lọc hiện tại',
      icon: Users,
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
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 leading-[38px] tracking-tight tabular-nums">
                  {item.value.toLocaleString('vi-VN')}
                </div>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}
              >
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
