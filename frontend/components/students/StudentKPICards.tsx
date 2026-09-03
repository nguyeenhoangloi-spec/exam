'use client';

import React from 'react';
import { Users, CheckCircle2, School, Filter } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface StudentKPICardsProps {
  total: number;
  withClass: number;
  totalClasses: number;
  filtered: number;
}

export function StudentKPICards({ total, withClass, totalClasses, filtered }: StudentKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng sinh viên',
      value: total,
      subtext: 'Chính quy trong hệ thống',
      progressPercent: total > 0 ? 100 : 0,
      icon: Users,
    },
    {
      title: 'Đã phân lớp',
      value: withClass,
      subtext: 'Sinh viên đã được xếp lớp',
      progressPercent: total > 0 ? Math.round((withClass / total) * 100) : 100,
      icon: CheckCircle2,
    },
    {
      title: 'Số lớp học',
      value: totalClasses,
      subtext: 'Lớp đào tạo chuyên ngành',
      progressPercent: totalClasses > 0 ? 100 : 0,
      icon: School,
    },
    {
      title: 'Đang hiển thị',
      value: filtered,
      subtext: 'Theo bộ lọc hiện tại',
      progressPercent: total > 0 ? Math.round((filtered / total) * 100) : 100,
      icon: Filter,
    },
  ];

  return <KPICards items={items} columns={4} />;
}

