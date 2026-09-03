'use client';

import React from 'react';
import { Calendar, Clock, CalendarCheck, CheckCircle2, XCircle } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ExamScheduleKPICardsProps {
  total?: number;
  upcoming?: number;
  completed?: number;
  ongoing?: number;
  cancelled?: number;
}

export function ExamScheduleKPICards({
  total = 0,
  upcoming = 0,
  completed = 0,
  ongoing = 0,
  cancelled = 0,
}: ExamScheduleKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng lịch thi',
      value: total,
      subtext: 'Tất cả ca thi',
      progressPercent: 100,
      icon: Calendar,
    },
    {
      title: 'Sắp diễn ra',
      value: upcoming,
      subtext: 'Trong 7 ngày tới',
      progressPercent: total > 0 ? Math.round((upcoming / total) * 100) : 100,
      icon: Clock,
    },
    {
      title: 'Đang diễn ra',
      value: ongoing,
      subtext: 'Hiện tại',
      progressPercent: total > 0 ? Math.round((ongoing / total) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Đã diễn ra',
      value: completed,
      subtext: 'Đã hoàn thành',
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 100,
      icon: CalendarCheck,
    },
    {
      title: 'Đã hủy',
      value: cancelled,
      subtext: 'Bị hủy',
      progressPercent: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      icon: XCircle,
    },
  ];

  return <KPICards items={items} columns={5} />;
}

