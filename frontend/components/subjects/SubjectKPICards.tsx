'use client';

import React from 'react';
import { BookOpen, Award, Building2, BookMarked, HelpCircle } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface SubjectKPICardsProps {
  total: number;
  totalCredits: number;
  totalDepartments: number;
  threeCreditCount: number;
  questionCount: number;
}

export function SubjectKPICards({
  total,
  totalCredits,
  totalDepartments,
  threeCreditCount,
  questionCount,
}: SubjectKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng số môn học',
      value: total,
      subtext: 'Danh mục môn học',
      progressPercent: total > 0 ? 100 : 0,
      icon: BookOpen,
    },
    {
      title: 'Tổng số tín chỉ',
      value: totalCredits,
      subtext: 'Tổng số TC tích lũy',
      progressPercent: totalCredits > 0 ? 100 : 0,
      icon: Award,
      unit: ' TC',
    },
    {
      title: 'Khoa đào tạo',
      value: totalDepartments,
      subtext: 'Khu vực chuyên ngành',
      progressPercent: totalDepartments > 0 ? 100 : 0,
      icon: Building2,
      unit: ' khoa',
    },
    {
      title: 'Môn 3 tín chỉ',
      value: threeCreditCount,
      subtext: 'Phổ biến nhất',
      progressPercent: total > 0 ? Math.round((threeCreditCount / total) * 100) : 0,
      icon: BookMarked,
    },
    {
      title: 'Đã có đề / câu hỏi',
      value: questionCount,
      subtext: 'Ngân hàng dữ liệu',
      progressPercent: total > 0 ? Math.round((questionCount / total) * 100) : 0,
      icon: HelpCircle,
    },
  ];

  return <KPICards items={items} columns={5} />;
}

