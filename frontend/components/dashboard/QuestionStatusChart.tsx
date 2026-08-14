'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { CheckCircle2, Clock, XCircle, Pencil } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const [filter, setFilter] = useState('Tất cả');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find counts from real API data or fallback to mockup values if API data missing
  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 0;
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 0;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;
  const editCount = data?.find((x) => String(x.status) === 'NEEDS_REVISION' || String(x.status) === 'EDIT')?.count ?? 0;

  const rawItems = [
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: approvedCount,
      color: '#10b981',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: pendingCount,
      color: '#f59e0b',
      icon: Clock,
      iconColor: 'text-amber-500',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: rejectedCount,
      color: '#ef4444',
      icon: XCircle,
      iconColor: 'text-rose-500',
    },
    {
      status: 'NEEDS_REVISION',
      label: 'Cần sửa',
      count: editCount,
      color: '#3b82f6',
      icon: Pencil,
      iconColor: 'text-blue-500',
    },
  ];

  const totalCount = rawItems.reduce((acc, curr) => acc + curr.count, 0);

  const chartData = rawItems.map((item) => {
    const rawPct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
    const formattedPct = rawPct.toFixed(1).replace('.', ',') + '%';
    return {
      ...item,
      percent: formattedPct,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs h-full flex flex-col justify-between">
      {/* Header & Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">Trạng thái câu hỏi</h3>

        <FilterSelect
          size="sm"
          variant="ghost"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả</option>
          <option value="Tháng này">Tháng này</option>
          <option value="Học kỳ này">Học kỳ này</option>
        </FilterSelect>
      </div>

      {/* Donut & Legend side by side */}
      <div className="flex-1 flex flex-row items-center justify-between gap-3 py-2 min-w-0 my-auto">
        {/* Donut Canvas */}
        <div className="relative h-36 w-36 shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalCount > 0 ? chartData : [{ label: 'Trống', count: 1, color: '#e2e8f0' }]}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={totalCount > 0 ? 3 : 0}
                  stroke="none"
                >
                  {(totalCount > 0 ? chartData : [{ color: '#e2e8f0' }]).map((item, idx) => (
                    <Cell key={idx} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => [`${Number(value).toLocaleString('vi-VN')} câu`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          )}

          {/* Center Text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-slate-400">Tổng cộng</span>
            <span className="text-[19px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] font-medium text-slate-400">câu hỏi</span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className="flex-1 min-w-0 space-y-2.5 py-1">
          {chartData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.status} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Icon className={`h-4 w-4 shrink-0 ${item.iconColor}`} />
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-[13px]">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13px]">{item.count.toLocaleString('vi-VN')}</span>
                  <span className="w-10 text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500">{item.percent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


