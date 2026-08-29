'use client';

import React from 'react';
import { UserCheck, CheckCircle2, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface ExamSupervisorKPICardsProps {
  totalAssignments: number;
  changeRequestedCount: number;
  confirmedCount: number;
  completedCount: number;
  totalRooms: number;
}

export function ExamSupervisorKPICards({
  totalAssignments,
  changeRequestedCount,
  confirmedCount,
  completedCount,
  totalRooms,
}: ExamSupervisorKPICardsProps) {
  const pendingCount = Math.max(
    0,
    totalAssignments - confirmedCount - changeRequestedCount - completedCount,
  );

  const items: KPICardItem[] = [
    {
      title: 'Tổng phân công',
      value: totalAssignments,
      subtext: `Lịch thi: ${totalRooms} phòng`,
      progressPercent: totalAssignments > 0 ? 100 : 0,
      icon: UserCheck,
    },
    {
      title: 'Đã xác nhận',
      value: confirmedCount,
      subtext: 'Sẵn sàng gác thi',
      progressPercent:
        totalAssignments > 0 ? Math.round((confirmedCount / totalAssignments) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Chờ xác nhận',
      value: pendingCount,
      subtext: 'Chờ phản hồi từ GV',
      progressPercent:
        totalAssignments > 0 ? Math.round((pendingCount / totalAssignments) * 100) : 0,
      icon: Clock,
    },
    {
      title: 'Yêu cầu đổi ca',
      value: changeRequestedCount,
      subtext: changeRequestedCount > 0 ? 'Cần duyệt đổi ca' : 'Không có yêu cầu',
      progressPercent:
        totalAssignments > 0 ? Math.round((changeRequestedCount / totalAssignments) * 100) : 0,
      icon: RefreshCw,
    },
    {
      title: 'Đã hoàn thành',
      value: completedCount,
      subtext: 'Đã kết thúc gác thi',
      progressPercent:
        totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
      icon: ShieldCheck,
    },
  ];

  return <KPICards items={items} columns={5} />;
}

