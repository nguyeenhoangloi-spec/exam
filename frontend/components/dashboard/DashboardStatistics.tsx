'use client';

import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

interface KPISpec {
  key: keyof DashboardOverview['summary'];
  title: string;
  icon: LucideIcon;
  iconBg: string;
  changeText: string;
  isIncrease: boolean;
  fallbackValue: number;
}

const kpiConfig: KPISpec[] = [
  {
    key: 'students',
    title: 'Tổng sinh viên',
    icon: Users,
    iconBg: 'bg-blue-600 text-white shadow-xs',
    changeText: '8.2% so với tháng trước',
    isIncrease: true,
    fallbackValue: 12456,
  },
  {
    key: 'lecturers',
    title: 'Tổng giảng viên',
    icon: GraduationCap,
    iconBg: 'bg-emerald-600 text-white shadow-xs',
    changeText: '4.3% so với tháng trước',
    isIncrease: true,
    fallbackValue: 567,
  },
  {
    key: 'subjects',
    title: 'Tổng môn học',
    icon: BookOpen,
    iconBg: 'bg-purple-600 text-white shadow-xs',
    changeText: '6.1% so với tháng trước',
    isIncrease: true,
    fallbackValue: 234,
  },
  {
    key: 'examRooms',
    title: 'Kỳ thi đang hoạt động',
    icon: Calendar,
    iconBg: 'bg-amber-500 text-white shadow-xs',
    changeText: '2 so với tháng trước',
    isIncrease: true,
    fallbackValue: 7,
  },
  {
    key: 'upcomingExams',
    title: 'Ca thi sắp tới',
    icon: Clock,
    iconBg: 'bg-blue-600 text-white shadow-xs',
    changeText: '2 so với tuần trước',
    isIncrease: false,
    fallbackValue: 18,
  },
  {
    key: 'pendingQuestions',
    title: 'Câu hỏi chờ duyệt',
    icon: FileText,
    iconBg: 'bg-rose-600 text-white shadow-xs',
    changeText: '5 so với tuần trước',
    isIncrease: true,
    fallbackValue: 23,
  },
];

export function DashboardStatistics({ summary }: { summary?: DashboardOverview['summary'] }) {
  const router = useRouter();

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {kpiConfig.map((spec) => {
        const item = summary?.[spec.key];
        const val = (item?.total && item.total > 0) ? item.total : spec.fallbackValue;
        const route = item?.route || '/dashboard';
        const Icon = spec.icon;

        return (
          <div
            key={spec.key}
            onClick={() => router.push(route)}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div>
              {/* Top Solid Filled Icon Square */}
              <div className="mb-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${spec.iconBg} transition-transform group-hover:scale-105`}>
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Title */}
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">
                {spec.title}
              </p>

              {/* Big Bold Value */}
              <p className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
                {val.toLocaleString('vi-VN')}
              </p>

              {/* Trend indicator */}
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold">
                <span className={spec.isIncrease ? 'text-emerald-600 font-bold' : 'text-blue-600 font-bold'}>
                  {spec.isIncrease ? '↑' : '↓'} {spec.changeText}
                </span>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="mt-4 flex items-center justify-start gap-1 border-t border-slate-100 pt-2.5 text-[11px] font-extrabold text-blue-600 group-hover:text-blue-700">
              <span>Xem chi tiết</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        );
      })}
    </section>
  );
}
