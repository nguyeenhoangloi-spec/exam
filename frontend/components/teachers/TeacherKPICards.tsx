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
      title: 'Tổng Giảng viên',
      value: total,
      subtext: 'Cán bộ giảng dạy',
      icon: GraduationCap,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Có Học vị khai báo',
      value: withDegree,
      subtext: 'TS / ThS / GS',
      icon: Award,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã phân Khoa',
      value: withDept,
      subtext: 'Có đơn vị quản lý',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đang Hiển thị',
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
