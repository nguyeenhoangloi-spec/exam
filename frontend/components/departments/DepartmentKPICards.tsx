'use client';

import React from 'react';
import { Building2, BookOpen, GraduationCap, Users, Sparkles } from 'lucide-react';

interface DepartmentKPICardsProps {
  total: number;
  totalSubjects: number;
  totalClasses: number;
  totalTeachers: number;
  curriculumCount: number;
}

export function DepartmentKPICards({
  total,
  totalSubjects,
  totalClasses,
  totalTeachers,
  curriculumCount,
}: DepartmentKPICardsProps) {
  const items = [
    {
      title: 'Tổng số khoa',
      value: total,
      subtext: 'Khoa đào tạo',
      progressPercent: total > 0 ? 100 : 0,
      icon: Building2,
      unit: ' khoa',
    },
    {
      title: 'Môn học thuộc khoa',
      value: totalSubjects,
      subtext: 'Danh mục môn học',
      progressPercent: totalSubjects > 0 ? 100 : 0,
      icon: BookOpen,
      unit: ' môn',
    },
    {
      title: 'Lớp học trực thuộc',
      value: totalClasses,
      subtext: 'Lớp sinh viên',
      progressPercent: totalClasses > 0 ? 100 : 0,
      icon: GraduationCap,
      unit: ' lớp',
    },
    {
      title: 'Giảng viên',
      value: totalTeachers,
      subtext: 'Cán bộ giảng dạy',
      progressPercent: totalTeachers > 0 ? 100 : 0,
      icon: Users,
      unit: ' GV',
    },
    {
      title: 'Khung CT đào tạo',
      value: curriculumCount,
      subtext: 'Khung môn học đã lập',
      progressPercent: total > 0 ? Math.round((curriculumCount / total) * 100) : 0,
      icon: Sparkles,
      unit: ' khung',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
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
