'use client';

import React from 'react';
import { School, Building2, Users, BarChart3, TrendingUp } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ClassKPICardsProps {
  total: number;
  totalDepartments: number;
  totalStudents: number;
  avgStudents: number;
  maxClassStudents: number;
}

export function ClassKPICards({
  total,
  totalDepartments,
  totalStudents,
  avgStudents,
  maxClassStudents,
}: ClassKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng số lớp học',
      value: total,
      subtext: 'Lớp sinh viên',
      progressPercent: total > 0 ? 100 : 0,
      icon: School,
    },
    {
      title: 'Khoa đào tạo',
      value: totalDepartments,
      subtext: 'Khoa quản lý lớp',
      progressPercent: totalDepartments > 0 ? 100 : 0,
      icon: Building2,
      unit: ' khoa',
    },
    {
      title: 'Tổng sinh viên',
      value: totalStudents,
      subtext: 'Sinh viên đã vào lớp',
      progressPercent: totalStudents > 0 ? 100 : 0,
      icon: Users,
      unit: ' SV',
    },
    {
      title: 'Trung bình sĩ số',
      value: avgStudents,
      subtext: 'Sinh viên / lớp',
      progressPercent: maxClassStudents > 0 ? Math.round((avgStudents / maxClassStudents) * 100) : 50,
      icon: BarChart3,
      unit: ' SV/lớp',
    },
    {
      title: 'Sĩ số tối đa',
      value: maxClassStudents,
      subtext: 'Lớp đông sinh viên nhất',
      progressPercent: maxClassStudents > 0 ? 100 : 0,
      icon: TrendingUp,
      unit: ' SV',
    },
  ];

  return <KPICards items={items} columns={5} />;
}

