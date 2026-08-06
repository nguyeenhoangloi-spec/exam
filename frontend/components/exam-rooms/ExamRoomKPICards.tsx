'use client';

import React from 'react';
import { DoorOpen, Monitor, BookOpen, Users, Building } from 'lucide-react';

interface ExamRoomKPICardsProps {
  total: number;
  labCount: number;
  theoryCount: number;
  totalCapacity: number;
  activeBuildingCount: number;
}

export function ExamRoomKPICards({
  total,
  labCount,
  theoryCount,
  totalCapacity,
  activeBuildingCount,
}: ExamRoomKPICardsProps) {
  const items = [
    {
      title: 'Tổng số phòng',
      value: total,
      subtext: 'Tất cả phòng thi',
      icon: DoorOpen,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Phòng Máy tính',
      value: labCount,
      subtext: 'Thi trắc nghiệm máy',
      icon: Monitor,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Phòng Lý thuyết',
      value: theoryCount,
      subtext: 'Thi viết & tự luận',
      icon: BookOpen,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Tổng sức chứa',
      value: totalCapacity,
      subtext: 'Tổng số chỗ ngồi',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' chỗ',
    },
    {
      title: 'Số tòa nhà',
      value: activeBuildingCount,
      subtext: 'Khu vực tổ chức thi',
      icon: Building,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' tòa',
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
