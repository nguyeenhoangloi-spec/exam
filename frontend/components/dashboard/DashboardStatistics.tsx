'use client';

import React from 'react';
import {
  Calendar,
  Send,
  Users,
  FileText,
  Clock,
  XCircle,
  Building2,
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
  const approvedQuestionsCount = questionStatus.find((q) => q.status === 'APPROVED')?.count || 0;
  const rejectedQuestionsCount = questionStatus.find((q) => q.status === 'REJECTED')?.count || 0;
  const pendingQuestionsCount = summary?.pendingQuestions?.total ?? (questionStatus.find((q) => q.status === 'PENDING')?.count || 0);

  const approvalRate = totalQuestionsCount > 0
    ? Math.round((approvedQuestionsCount / totalQuestionsCount) * 100)
    : 100;

  // Tính toán tỷ lệ phần trăm tiến độ thực tế (0% - 100%)
  const kpis = [
    {
      key: 'upcomingExams',
      title: 'Kỳ thi sắp tới',
      value: summary?.upcomingExams?.total ?? 0,
      subtext: summary?.upcomingExams?.description || 'Không có lịch thi hôm nay',
      progressPercent: (summary?.upcomingExams?.total ?? 0) > 0 ? 100 : 100,
      progressLabel: 'Tiến độ lịch thi',
      icon: Send,
      route: '/exam-schedules',
    },
    {
      key: 'examRooms',
      title: 'Tổng phòng thi',
      value: summary?.examRooms?.total ?? 0,
      subtext: summary?.examRooms?.description || `${summary?.examRooms?.total ?? 0} phòng sẵn sàng`,
      progressPercent: 100,
      progressLabel: '100% phòng máy sẵn sàng',
      icon: Building2,
      route: '/exam-rooms',
    },
    {
      key: 'students',
      title: 'Tổng sinh viên',
      value: summary?.students?.total ?? 0,
      subtext: summary?.students?.description || 'Đã đăng ký hệ thống',
      progressPercent: 100,
      progressLabel: 'Dữ liệu toàn khóa',
      icon: Users,
      route: '/students',
    },
    {
      key: 'totalQuestions',
      title: 'Tổng câu hỏi',
      value: totalQuestionsCount,
      subtext: `Duyệt: ${approvalRate}% (${formatNumber(approvedQuestionsCount)} câu)`,
      progressPercent: approvalRate,
      progressLabel: `${approvalRate}% đã phê duyệt`,
      icon: FileText,
      route: '/question-bank',
    },
    {
      key: 'pendingQuestions',
      title: 'Câu hỏi chờ duyệt',
      value: pendingQuestionsCount,
      subtext: pendingQuestionsCount > 0 ? `${pendingQuestionsCount} câu cần duyệt` : 'Đã duyệt toàn bộ',
      progressPercent: totalQuestionsCount > 0
        ? Math.round(((totalQuestionsCount - pendingQuestionsCount) / totalQuestionsCount) * 100)
        : 100,
      progressLabel: pendingQuestionsCount > 0 ? 'Đang chờ xử lý' : 'Đã hoàn tất 100%',
      icon: Clock,
      route: '/question-bank?status=PENDING',
    },
    {
      key: 'rejectedQuestions',
      title: 'Câu hỏi bị từ chối',
      value: rejectedQuestionsCount,
      subtext: rejectedQuestionsCount > 0 ? `${rejectedQuestionsCount} câu cần sửa lại` : 'Không có câu lỗi',
      progressPercent: totalQuestionsCount > 0
        ? Math.round(((totalQuestionsCount - rejectedQuestionsCount) / totalQuestionsCount) * 100)
        : 100,
      progressLabel: rejectedQuestionsCount > 0 ? 'Cần giảng viên sửa' : 'Đạt chuẩn 100%',
      icon: XCircle,
      route: '/question-bank?status=REJECTED',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
      {kpis.map((spec) => {
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
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer overflow-visible"
          >
            {/* Top row: Title + Big Value on Left, Icon on Right */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {spec.title}
                </span>
                <div className="text-type-kpi font-bold leading-[38px] tracking-tight text-slate-900 dark:text-slate-100">
                  {formatNumber(spec.value)}
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(spec.progressPercent, 5), 100)}%` }}
              />
            </div>

            {/* Bottom Subtext */}
            <div className="mt-2.5">
              <span
                title={spec.subtext}
                className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
              >
                {spec.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
