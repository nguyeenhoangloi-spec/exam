'use client';

import React from 'react';
import { GraduationCap, Award, Building2, Users, Filter } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface TeacherKPICardsProps {
  total: number;
  withDegree: number;
  withDept: number;
  filtered: number;
}

export function TeacherKPICards({ total, withDegree, withDept, filtered }: TeacherKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng giảng viên',
      value: total,
      subtext: 'Cán bộ giảng dạy',
      progressPercent: total > 0 ? 100 : 0,
      icon: GraduationCap,
    },
    {
      title: 'Có học vị khai báo',
      value: withDegree,
      subtext: 'TS / ThS / GS',
      progressPercent: total > 0 ? Math.round((withDegree / total) * 100) : 100,
      icon: Award,
    },
    {
      title: 'Đã phân khoa',
      value: withDept,
      subtext: 'Có đơn vị quản lý',
      progressPercent: total > 0 ? Math.round((withDept / total) * 100) : 100,
      icon: Building2,
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
