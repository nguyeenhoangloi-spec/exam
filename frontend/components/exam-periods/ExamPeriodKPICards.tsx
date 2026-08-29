'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, Award, XCircle } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ExamPeriodKPICardsProps {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export function ExamPeriodKPICards({
  total,
  upcoming,
  ongoing,
  completed,
  cancelled,
}: ExamPeriodKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng số kỳ thi',
      value: total,
      subtext: 'Tất cả đợt thi',
      progressPercent: 100,
      icon: Calendar,
    },
    {
      title: 'Sắp diễn ra',
      value: upcoming,
      subtext: 'Chuẩn bị tổ chức',
      progressPercent: total > 0 ? Math.round((upcoming / total) * 100) : 100,
      icon: Clock,
    },
    {
      title: 'Đang diễn ra',
      value: ongoing,
      subtext: 'Đang tổ chức thi',
      progressPercent: total > 0 ? Math.round((ongoing / total) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Đã hoàn thành',
      value: completed,
      subtext: 'Đã kết thúc',
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 100,
      icon: Award,
    },
    {
      title: 'Đã hủy',
      value: cancelled,
      subtext: 'Bị hủy bỏ',
      progressPercent: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      icon: XCircle,
    },
  ];

  return <KPICards items={items} columns={5} />;
}

