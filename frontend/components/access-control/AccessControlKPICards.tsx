'use client';

import React from 'react';
import { KeyRound, ShieldAlert, UsersRound, History, LockKeyhole, ShieldCheck } from 'lucide-react';

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
  const items = [
    {
      title: 'Quyền hạn hệ thống',
      value: totalPermissions,
      subtext: `${sensitivePermissions} quyền nhạy cảm yêu cầu bảo mật cao`,
      progressPercent: 100,
      icon: KeyRound,
      color: 'blue',
    },
    {
      title: 'Tài khoản có quyền riêng',
      value: totalUsersWithOverrides,
      subtext: 'Ghi đè ngoại lệ so với vai trò mặc định',
      progressPercent: totalUsersWithOverrides > 0 ? 100 : 0,
      icon: ShieldAlert,
      color: totalUsersWithOverrides > 0 ? 'amber' : 'blue',
    },
    {
      title: 'Giới hạn phạm vi ABAC',
      value: totalUsersWithScopes,
      subtext: 'Tài khoản bị ràng buộc theo Khoa, Lớp, Môn',
      progressPercent: totalUsersWithScopes > 0 ? 100 : 0,
      icon: UsersRound,
      color: 'emerald',
    },
    {
      title: 'Nhật ký phân quyền',
      value: totalAuditLogs,
      subtext: 'Thao tác cấp, sửa hoặc xóa quyền đã ghi nhận',
      progressPercent: 100,
      icon: History,
      color: 'blue',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {loading ? '...' : item.value.toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <IconComponent className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Micro Progress Track */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
              />
            </div>

            <div className="mt-2.5">
              <span
                title={item.subtext}
                className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
              >
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
