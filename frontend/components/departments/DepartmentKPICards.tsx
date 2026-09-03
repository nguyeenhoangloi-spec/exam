'use client';

import React from 'react';
import { Building2, BookOpen, School, GraduationCap, BookMarked } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface DepartmentKPICardsProps {
  total: number;
  totalSubjects: number;
  totalClasses: number;
  totalTeachers: number;
  curriculumCount: number;
}

export function DepartmentKPICards({
  total,
  totalSubjects,
  totalClasses,
  totalTeachers,
  curriculumCount,
}: DepartmentKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng số khoa',
      value: total,
      subtext: 'Khoa đào tạo',
      progressPercent: total > 0 ? 100 : 0,
      icon: Building2,
      unit: ' khoa',
    },
    {
      title: 'Môn học thuộc khoa',
      value: totalSubjects,
      subtext: 'Danh mục môn học',
      progressPercent: totalSubjects > 0 ? 100 : 0,
      icon: BookOpen,
      unit: ' môn',
    },
    {
      title: 'Lớp học trực thuộc',
      value: totalClasses,
      subtext: 'Lớp sinh viên',
      progressPercent: totalClasses > 0 ? 100 : 0,
      icon: School,
      unit: ' lớp',
    },
    {
      title: 'Giảng viên',
      value: totalTeachers,
      subtext: 'Cán bộ giảng dạy',
      progressPercent: totalTeachers > 0 ? 100 : 0,
      icon: GraduationCap,
      unit: ' GV',
    },
    {
      title: 'Khung CT đào tạo',
      value: curriculumCount,
      subtext: 'Khung môn học đã lập',
      progressPercent: total > 0 ? Math.round((curriculumCount / total) * 100) : 0,
      icon: BookMarked,
      unit: ' khung',
    },
  ];

  return <KPICards items={items} columns={5} />;
}

