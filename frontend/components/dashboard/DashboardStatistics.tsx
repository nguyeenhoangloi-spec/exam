'use client';

import React from 'react';
import {
  Send,
  Users,
  FileText,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';
import type { DashboardOverview } from '../../types/dashboard';
import { KPICards, KPICardItem } from '../KPICards';

export function DashboardStatistics({
  summary,
  questionStatus = [],
}: {
  summary?: DashboardOverview['summary'];
  questionStatus?: DashboardOverview['questionStatus'];
}) {
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

  const items: KPICardItem[] = [
    {
      title: 'Kỳ thi sắp tới',
      value: summary?.upcomingExams?.total ?? 0,
      subtext: summary?.upcomingExams?.description || 'Không có lịch thi hôm nay',
      progressPercent: (summary?.upcomingExams?.total ?? 0) > 0 ? 100 : 100,
      icon: Send,
      route: '/exam-schedules',
    },
    {
      title: 'Tổng phòng thi',
      value: summary?.examRooms?.total ?? 0,
      subtext: summary?.examRooms?.description || `${summary?.examRooms?.total ?? 0} phòng sẵn sàng`,
      progressPercent: 100,
      icon: Building2,
      route: '/exam-rooms',
    },
    {
      title: 'Tổng sinh viên',
      value: summary?.students?.total ?? 0,
      subtext: summary?.students?.description || 'Đã đăng ký hệ thống',
      progressPercent: 100,
      icon: Users,
      route: '/students',
    },
    {
      title: 'Tổng câu hỏi',
      value: totalQuestionsCount,
      subtext: `Duyệt: ${approvalRate}% (${formatNumber(approvedQuestionsCount)} câu)`,
      progressPercent: approvalRate,
      icon: FileText,
      route: '/question-bank',
    },
    {
      title: 'Câu hỏi chờ duyệt',
      value: pendingQuestionsCount,
      subtext: pendingQuestionsCount > 0 ? `${pendingQuestionsCount} câu cần duyệt` : 'Đã duyệt toàn bộ',
      progressPercent: totalQuestionsCount > 0
        ? Math.round(((totalQuestionsCount - pendingQuestionsCount) / totalQuestionsCount) * 100)
        : 100,
      icon: Clock,
      route: '/question-bank?status=PENDING',
    },
    {
      title: 'Câu hỏi bị từ chối',
      value: rejectedQuestionsCount,
      subtext: rejectedQuestionsCount > 0 ? `${rejectedQuestionsCount} câu cần sửa lại` : 'Không có câu lỗi',
      progressPercent: totalQuestionsCount > 0
        ? Math.round(((totalQuestionsCount - rejectedQuestionsCount) / totalQuestionsCount) * 100)
        : 100,
      icon: XCircle,
      route: '/question-bank?status=REJECTED',
    },
  ];

  return <KPICards items={items} columns={6} />;
}

