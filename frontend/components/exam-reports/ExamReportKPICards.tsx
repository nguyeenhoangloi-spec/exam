'use client';

import React from 'react';
import { BarChart3, CheckCircle2, ClipboardList, UserCheck } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ExamReportKPICardsProps {
  totalExams: number;
  totalSchedules: number;
  totalAssigned: number;
  totalSubmitted: number;
  totalAbsent: number;
  totalUngraded: number;
  totalFlagged: number;
  avgScore: number;
  passRate: number;
  passCount: number;
}

export function ExamReportKPICards({
  totalExams,
  totalSchedules,
  totalAssigned,
  totalSubmitted,
  avgScore,
  passRate,
  passCount,
}: ExamReportKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng ca thi',
      value: totalSchedules,
      subtext: `${totalExams} kỳ thi trong phạm vi lọc`,
      progressPercent: totalSchedules > 0 ? 100 : 0,
      icon: ClipboardList,
    },
    {
      title: 'Sinh viên dự thi',
      value: totalSubmitted,
      subtext: `${totalAssigned > 0 ? ((totalSubmitted / totalAssigned) * 100).toFixed(1) : 0}% trên tổng số được gán`,
      progressPercent: totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 100,
      icon: UserCheck,
    },
    {
      title: 'Tỷ lệ đạt',
      value: passRate,
      subtext: `${passCount} bài đạt từ 5.0 điểm`,
      progressPercent: Math.min(Math.max(passRate, 0), 100),
      icon: CheckCircle2,
      unit: '%',
    },
    {
      title: 'Điểm trung bình',
      value: avgScore,
      subtext: 'Trên thang điểm 10',
      progressPercent: Math.min(Math.max(avgScore * 10, 0), 100),
      icon: BarChart3,
      unit: ' /10',
    },
  ];

  return <KPICards items={items} columns={4} />;
}

