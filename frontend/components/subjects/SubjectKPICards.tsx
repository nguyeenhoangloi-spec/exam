'use client';

import React from 'react';
import { BookOpen, Award, Building2, BookMarked, HelpCircle } from 'lucide-react';

interface SubjectKPICardsProps {
  total: number;
  totalCredits: number;
  totalDepartments: number;
  threeCreditCount: number;
  questionCount: number;
}

export function SubjectKPICards({
  total,
  totalCredits,
  totalDepartments,
  threeCreditCount,
  questionCount,
}: SubjectKPICardsProps) {
  const items = [
    {
      title: 'Tổng số Môn học',
      value: total,
      subtext: 'Danh mục môn học',
      icon: BookOpen,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Tổng số Tín chỉ',
      value: totalCredits,
      subtext: 'Tổng số TC tích lũy',
      icon: Award,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' TC',
    },
    {
      title: 'Khoa Đào tạo',
      value: totalDepartments,
      subtext: 'Khu vực chuyên ngành',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' khoa',
    },
    {
      title: 'Môn 3 Tín chỉ',
      value: threeCreditCount,
      subtext: 'Phổ biến nhất',
      icon: BookMarked,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã có Đề / Câu hỏi',
      value: questionCount,
      subtext: 'Ngân hàng dữ liệu',
      icon: HelpCircle,
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
