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
      title: 'Tổng số Lớp học',
      value: total,
      subtext: 'Lớp sinh viên',
      icon: GraduationCap,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Khoa đào tạo',
      value: totalDepartments,
      subtext: 'Khoa quản lý lớp',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' khoa',
    },
    {
      title: 'Tổng Sinh viên',
      value: totalStudents,
      subtext: 'Sinh viên đã vào lớp',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' SV',
    },
    {
      title: 'Trung bình sĩ số',
      value: avgStudents,
      subtext: 'Sinh viên / lớp',
      icon: BarChart3,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' SV/lớp',
    },
    {
      title: 'Sĩ số tối đa',
      value: maxClassStudents,
      subtext: 'Lớp đông sinh viên nhất',
      icon: Flame,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
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
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.title}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {item.value.toLocaleString('vi-VN')}
                  {item.unit || ''}
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
