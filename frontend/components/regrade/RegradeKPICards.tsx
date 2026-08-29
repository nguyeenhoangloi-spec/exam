'use client';

import React from 'react';
import { FileCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface RegradeKPICardsProps {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function RegradeKPICards({
  all,
  pending,
  approved,
  rejected,
}: RegradeKPICardsProps) {
  const approveRate = all > 0 ? Math.round((approved / all) * 100) : 0;

  const items: KPICardItem[] = [
    {
      title: 'Tổng số đơn',
      value: all,
      unit: 'đơn',
      subtext: 'Đã tiếp nhận trong kỳ thi',
      progressPercent: all > 0 ? 100 : 0,
      icon: FileCheck,
    },
    {
      title: 'Chờ thẩm định',
      value: pending,
      unit: 'đơn',
      subtext: 'Cần xử lý & chấm lại bài',
      progressPercent: all > 0 ? Math.round((pending / all) * 100) : 0,
      icon: Clock,
    },
    {
      title: 'Đã duyệt & Đổi điểm',
      value: approved,
      unit: 'đơn',
      subtext: `Tỷ lệ đổi điểm thành công ${approveRate}%`,
      progressPercent: all > 0 ? approveRate : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Từ chối phúc khảo',
      value: rejected,
      unit: 'đơn',
      subtext: 'Giữ nguyên điểm số ban đầu',
      progressPercent: all > 0 ? Math.round((rejected / all) * 100) : 0,
      icon: XCircle,
    },
  ];

  return <KPICards items={items} columns={4} />;
}

