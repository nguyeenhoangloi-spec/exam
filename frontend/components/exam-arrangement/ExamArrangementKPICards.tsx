'use client';

import React from 'react';
import { Calendar, DoorOpen, Users, UserCheck, CheckCircle2 } from 'lucide-react';

interface ExamArrangementKPICardsProps {
  totalSchedules: number;
  availableRooms: number;
  totalRooms: number;
  selectedCapacity: number;
  selectedRoomCount: number;
  totalStudents: number;
  totalAssignedRooms: number;
}

export function ExamArrangementKPICards({
  totalSchedules,
  availableRooms,
  totalRooms,
  selectedCapacity,
  selectedRoomCount,
  totalStudents,
  totalAssignedRooms,
}: ExamArrangementKPICardsProps) {
  const fillPercent =
    selectedCapacity > 0 ? Math.min(100, Math.round((totalStudents / selectedCapacity) * 100)) : 0;

  const items = [
    {
      title: 'Tổng số ca thi',
      value: totalSchedules,
      subtext: 'Tất cả ca thi',
      progressPercent: 100,
      icon: Calendar,
    },
    {
      title: 'Phòng khả dụng',
      value: availableRooms,
      subtext: `Tổng: ${totalRooms} phòng`,
      progressPercent: totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 100,
      icon: DoorOpen,
    },
    {
      title: 'Tổng sức chứa',
      value: selectedCapacity,
      subtext: `${selectedRoomCount} phòng đã chọn`,
      progressPercent: totalRooms > 0 ? Math.round((selectedRoomCount / totalRooms) * 100) : 100,
      icon: Users,
    },
    {
      title: 'Thí sinh đã xếp',
      value: totalStudents,
      subtext: totalStudents > 0 ? `${totalAssignedRooms} phòng đã gán` : 'Chưa xếp chỗ',
      progressPercent: totalStudents > 0 ? 100 : 0,
      icon: UserCheck,
    },
    {
      title: 'Tỷ lệ lấp đầy',
      value: `${fillPercent}%`,
      subtext: 'Hiệu suất chỗ ngồi',
      progressPercent: fillPercent,
      icon: CheckCircle2,
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
            {/* Top row: Title + Value on left, Icon on right */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-[32px] font-semibold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {typeof item.value === 'number' ? item.value.toLocaleString('vi-VN') : item.value}
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

            {/* Bottom Subtext */}
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
