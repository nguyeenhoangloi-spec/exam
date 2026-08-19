'use client';

import React from 'react';
import { GraduationCap, Building2, Users, BarChart3, Flame } from 'lucide-react';

interface ClassKPICardsProps {
  total: number;
  totalDepartments: number;
  totalStudents: number;
  avgStudents: number;
  maxClassStudents: number;
}

export function ClassKPICards({
  total,
  totalDepartments,
  totalStudents,
  avgStudents,
  maxClassStudents,
}: ClassKPICardsProps) {
  const items = [
    {
      title: 'Tổng số lớp học',
      value: total,
      subtext: 'Lớp sinh viên',
      progressPercent: total > 0 ? 100 : 0,
      icon: GraduationCap,
    },
    {
      title: 'Khoa đào tạo',
      value: totalDepartments,
      subtext: 'Khoa quản lý lớp',
      progressPercent: totalDepartments > 0 ? 100 : 0,
      icon: Building2,
      unit: ' khoa',
    },
    {
      title: 'Tổng sinh viên',
      value: totalStudents,
      subtext: 'Sinh viên đã vào lớp',
      progressPercent: totalStudents > 0 ? 100 : 0,
      icon: Users,
      unit: ' SV',
    },
    {
      title: 'Trung bình sĩ số',
      value: avgStudents,
      subtext: 'Sinh viên / lớp',
      progressPercent: maxClassStudents > 0 ? Math.round((avgStudents / maxClassStudents) * 100) : 50,
      icon: BarChart3,
      unit: ' SV/lớp',
    },
    {
      title: 'Sĩ số tối đa',
      value: maxClassStudents,
      subtext: 'Lớp đông sinh viên nhất',
      progressPercent: maxClassStudents > 0 ? 100 : 0,
      icon: Flame,
      unit: ' SV',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
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
                className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
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
