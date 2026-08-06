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
      title: 'Tổng số Khoa',
      value: total,
      subtext: 'Khoa đào tạo',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Môn học thuộc Khoa',
      value: totalSubjects,
      subtext: 'Danh mục môn học',
      icon: BookOpen,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Lớp học trực thuộc',
      value: totalClasses,
      subtext: 'Lớp sinh viên',
      icon: GraduationCap,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Giảng viên',
      value: totalTeachers,
      subtext: 'Cán bộ giảng dạy',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Khung CT Đào tạo',
      value: curriculumCount,
      subtext: 'Khung môn học đã lập',
      icon: Sparkles,
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
