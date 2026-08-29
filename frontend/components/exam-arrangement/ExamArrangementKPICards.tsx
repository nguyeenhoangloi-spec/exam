'use client';

import React from 'react';
import { Calendar, DoorOpen, Users, UserCheck, CheckCircle2 } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ExamArrangementKPICardsProps {
  totalSchedules: number;
  availableRooms: number;
  totalRooms: number;
  selectedCapacity: number;
  selectedRoomCount: number;
  totalStudents: number;
  totalAssignedRooms: number;
}

export function ExamArrangementKPICards({
  totalSchedules,
  availableRooms,
  totalRooms,
  selectedCapacity,
  selectedRoomCount,
  totalStudents,
  totalAssignedRooms,
}: ExamArrangementKPICardsProps) {
  const fillPercent =
    selectedCapacity > 0 ? Math.min(100, Math.round((totalStudents / selectedCapacity) * 100)) : 0;

  const items: KPICardItem[] = [
    {
      title: 'Tổng số ca thi',
      value: totalSchedules,
      subtext: 'Tất cả ca thi',
      progressPercent: 100,
      icon: Calendar,
    },
    {
      title: 'Phòng khả dụng',
      value: availableRooms,
      subtext: `Tổng: ${totalRooms} phòng`,
      progressPercent: totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 100,
      icon: DoorOpen,
    },
    {
      title: 'Tổng sức chứa',
      value: selectedCapacity,
      subtext: `${selectedRoomCount} phòng đã chọn`,
      progressPercent: totalRooms > 0 ? Math.round((selectedRoomCount / totalRooms) * 100) : 100,
      icon: Users,
    },
    {
      title: 'Thí sinh đã xếp',
      value: totalStudents,
      subtext: totalStudents > 0 ? `${totalAssignedRooms} phòng đã gán` : 'Chưa xếp chỗ',
      progressPercent: totalStudents > 0 ? 100 : 0,
      icon: UserCheck,
    },
    {
      title: 'Tỷ lệ lấp đầy',
      value: `${fillPercent}%`,
      subtext: 'Hiệu suất chỗ ngồi',
      progressPercent: fillPercent,
      icon: CheckCircle2,
    },
  ];

  return <KPICards items={items} columns={5} />;
}

