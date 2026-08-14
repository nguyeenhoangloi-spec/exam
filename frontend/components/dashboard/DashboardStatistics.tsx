'use client';

import React from 'react';
import {
  Calendar,
  Send,
  Users,
  FileText,
  Clock,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

export function DashboardStatistics({
  summary,
  questionStatus = [],
}: {
  summary?: DashboardOverview['summary'];
  questionStatus?: DashboardOverview['questionStatus'];
}) {
  const router = useRouter();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const totalQuestionsCount = questionStatus.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const rejectedQuestionsCount = questionStatus.find((q) => q.status === 'REJECTED')?.count || 0;
  const pendingQuestionsCount = summary?.pendingQuestions?.total ?? (questionStatus.find((q) => q.status === 'PENDING')?.count || 0);

  const kpiItems = [
    {
      key: 'upcomingExams',
      title: 'Kỳ thi sắp tới',
      value: summary?.upcomingExams?.total ?? 0,
      subtext: summary?.upcomingExams?.description || 'Theo lịch khảo thí',
      icon: Send,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      route: '/exam-schedules',
    },
    {
      key: 'examRooms',
      title: 'Tổng phòng thi',
      value: summary?.examRooms?.total ?? 0,
      subtext: summary?.examRooms?.description || 'Số lượng phòng thi',
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      route: '/exam-rooms',
    },
    {
      key: 'students',
      title: 'Tổng sinh viên',
      value: summary?.students?.total ?? 0,
      subtext: summary?.students?.description || 'Đã đăng ký hệ thống',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      route: '/students',
    },
    {
      key: 'totalQuestions',
      title: 'Tổng câu hỏi',
      value: totalQuestionsCount,
      subtext: 'Trong ngân hàng',
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      route: '/question-bank',
    },
    {
      key: 'pendingQuestions',
      title: 'Câu hỏi chờ duyệt',
      value: pendingQuestionsCount,
      subtext: 'Cần phê duyệt',
      icon: Clock,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      route: '/question-bank?status=PENDING',
    },
    {
      key: 'rejectedQuestions',
      title: 'Câu hỏi bị từ chối',
      value: rejectedQuestionsCount,
      subtext: 'Cần chỉnh sửa lại',
      icon: XCircle,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      route: '/question-bank?status=REJECTED',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
      {kpiItems.map((spec) => {
        const Icon = spec.icon;

        return (
          <div
            key={spec.key}
            role="button"
            tabIndex={0}
            onClick={() => router.push(spec.route)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(spec.route);
              }
            }}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            {/* Top row: Title + Big Value on Left, Icon on Right */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 block truncate">
                  {spec.title}
                </span>
                <div className="text-[32px] font-bold leading-[38px] tracking-tight text-slate-900">
                  {formatNumber(spec.value)}
                </div>
              </div>

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 ${spec.iconBg} ${spec.iconColor}`}>
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Bottom Subtext */}
            <div className="mt-2.5 pt-2 border-t border-slate-100/80">
              <span className="text-[13px] font-normal text-slate-500">
                {spec.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
