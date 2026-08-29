'use client';

import React from 'react';
import { DoorOpen, Monitor, BookOpen, Users, Building } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ExamRoomKPICardsProps {
  total: number;
  labCount: number;
  theoryCount: number;
  totalCapacity: number;
  activeBuildingCount: number;
}

export function ExamRoomKPICards({
  total,
  labCount,
  theoryCount,
  totalCapacity,
  activeBuildingCount,
}: ExamRoomKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Tổng số phòng',
      value: total,
      subtext: 'Tất cả phòng thi',
      progressPercent: 100,
      icon: DoorOpen,
    },
    {
      title: 'Phòng máy tính',
      value: labCount,
      subtext: 'Thi trắc nghiệm máy',
      progressPercent: total > 0 ? Math.round((labCount / total) * 100) : 100,
      icon: Monitor,
    },
    {
      title: 'Phòng lý thuyết',
      value: theoryCount,
      subtext: 'Thi viết & tự luận',
      progressPercent: total > 0 ? Math.round((theoryCount / total) * 100) : 0,
      icon: BookOpen,
    },
    {
      title: 'Tổng sức chứa',
      value: totalCapacity,
      subtext: 'Tổng chỗ ngồi sẵn sàng',
      progressPercent: 100,
      icon: Users,
      unit: ' chỗ',
    },
    {
      title: 'Số tòa nhà',
      value: activeBuildingCount,
      subtext: 'Khu vực tổ chức thi',
      progressPercent: 100,
      icon: Building,
      unit: ' tòa',
    },
  ];

  return <KPICards items={items} columns={5} />;
}

