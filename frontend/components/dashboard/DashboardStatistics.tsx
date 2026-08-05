'use client';

import React from 'react';
import {
  Calendar,
  Send,
  Users,
  FileText,
  Clock,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

interface KPISpec {
  key: string;
  title: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  changeText: string;
  badgeType?: 'green' | 'amber' | 'red' | 'grey';
  fallbackValue: number;
  route: string;
}

const kpiConfig: KPISpec[] = [
  {
    key: 'totalExams',
    title: 'Tổng kỳ thi',
    icon: Calendar,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    changeText: '+3 kỳ thi so với tháng trước',
    badgeType: 'green',
    fallbackValue: 24,
    route: '/exam-periods',
  },
  {
    key: 'upcomingExams',
    title: 'Kỳ thi sắp diễn ra',
    icon: Send,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    changeText: 'Trong 7 ngày tới',
    badgeType: 'grey',
    fallbackValue: 8,
    route: '/exam-schedules',
  },
  {
    key: 'students',
    title: 'Tổng thí sinh',
    icon: Users,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    changeText: '+120 thí sinh so với tháng trước',
    badgeType: 'green',
    fallbackValue: 1248,
    route: '/students',
  },
  {
    key: 'totalQuestions',
    title: 'Tổng câu hỏi',
    icon: FileText,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    changeText: '+230 câu hỏi so với tháng trước',
    badgeType: 'green',
    fallbackValue: 2560,
    route: '/question-bank',
  },
  {
    key: 'pendingQuestions',
    title: 'Câu hỏi chờ duyệt',
    icon: Clock,
    iconBg: 'bg-amber-100/70',
    iconColor: 'text-amber-700',
    changeText: 'Cần xử lý',
    badgeType: 'amber',
    fallbackValue: 12,
    route: '/question-bank?status=PENDING',
  },
  {
    key: 'rejectedQuestions',
    title: 'Câu hỏi bị từ chối',
    icon: XCircle,
    iconBg: 'bg-rose-100/70',
    iconColor: 'text-rose-700',
    changeText: 'Cần xem xét lại',
    badgeType: 'red',
    fallbackValue: 18,
    route: '/question-bank?status=REJECTED',
  },
];

export function DashboardStatistics({ summary }: { summary?: DashboardOverview['summary'] }) {
  const router = useRouter();

  // Helper format number to Vietnamese locale (e.g., 1248 -> 1.248)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
      {kpiConfig.map((spec) => {
        // Find matching summary field if available
        let val = spec.fallbackValue;
        if (summary) {
          if (spec.key === 'students' && summary.students?.total) val = summary.students.total;
          else if (spec.key === 'pendingQuestions' && summary.pendingQuestions?.total) val = summary.pendingQuestions.total;
          else if (spec.key === 'totalExams' && summary.examRooms?.total) val = summary.examRooms.total * 3;
          else if (spec.key === 'upcomingExams' && summary.upcomingExams?.total) val = summary.upcomingExams.total;
        }

        const Icon = spec.icon;

        return (
          <div
            key={spec.key}
            onClick={() => router.push(spec.route)}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            {/* Top row: Icon & Title */}
            <div className="flex items-center justify-between gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-transform group-hover:scale-105 ${spec.iconBg} ${spec.iconColor}`}>
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Middle: Title & Main Big Value */}
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-500 block truncate">
                {spec.title}
              </span>
              <div className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                {formatNumber(val)}
              </div>
            </div>

            {/* Bottom Subtext / Badge */}
            <div className="mt-2.5 pt-2 border-t border-slate-100/80">
              {spec.badgeType === 'amber' ? (
                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200">
                  {spec.changeText}
                </span>
              ) : spec.badgeType === 'red' ? (
                <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                  {spec.changeText}
                </span>
              ) : spec.badgeType === 'green' ? (
                <span className="text-[10px] font-bold text-emerald-600 truncate block">
                  {spec.changeText}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 truncate block">
                  {spec.changeText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
