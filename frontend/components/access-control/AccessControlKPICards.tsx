'use client';

import React from 'react';
import { KeyRound, ShieldAlert, UsersRound, History } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

interface AccessControlKPICardsProps {
  totalPermissions: number;
  sensitivePermissions: number;
  totalUsersWithOverrides: number;
  totalUsersWithScopes: number;
  totalAuditLogs: number;
  loading?: boolean;
}

export function AccessControlKPICards({
  totalPermissions,
  sensitivePermissions,
  totalUsersWithOverrides,
  totalUsersWithScopes,
  totalAuditLogs,
  loading = false,
}: AccessControlKPICardsProps) {
  const items: KPICardItem[] = [
    {
      title: 'Quyền hạn hệ thống',
      value: totalPermissions,
      subtext: `${sensitivePermissions} quyền nhạy cảm yêu cầu bảo mật cao`,
      progressPercent: 100,
      icon: KeyRound,
      color: 'blue',
      loading,
    },
    {
      title: 'Tài khoản có quyền riêng',
      value: totalUsersWithOverrides,
      subtext: 'Ghi đè ngoại lệ so với vai trò mặc định',
      progressPercent: totalUsersWithOverrides > 0 ? 100 : 0,
      icon: ShieldAlert,
      color: 'blue',
      loading,
    },
    {
      title: 'Giới hạn phạm vi ABAC',
      value: totalUsersWithScopes,
      subtext: 'Tài khoản bị ràng buộc theo Khoa, Lớp, Môn',
      progressPercent: totalUsersWithScopes > 0 ? 100 : 0,
      icon: UsersRound,
      color: 'blue',
      loading,
    },
    {
      title: 'Nhật ký phân quyền',
      value: totalAuditLogs,
      subtext: 'Thao tác cấp, sửa hoặc xóa quyền đã ghi nhận',
      progressPercent: 100,
      icon: History,
      color: 'blue',
      loading,
    },
  ];

  return <KPICards items={items} columns={4} />;
}

