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
      progressPercent: total > 0 ? 100 : 0,
      icon: GraduationCap,
    },
    {
      title: 'Có học vị khai báo',
      value: withDegree,
      subtext: 'TS / ThS / GS',
      progressPercent: total > 0 ? Math.round((withDegree / total) * 100) : 100,
      icon: Award,
    },
    {
      title: 'Đã phân khoa',
      value: withDept,
      subtext: 'Có đơn vị quản lý',
      progressPercent: total > 0 ? Math.round((withDept / total) * 100) : 100,
      icon: Building2,
    },
    {
      title: 'Đang hiển thị',
      value: filtered,
      subtext: 'Theo bộ lọc hiện tại',
      progressPercent: total > 0 ? Math.round((filtered / total) * 100) : 100,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {item.value.toLocaleString('vi-VN')}
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
  );
}
