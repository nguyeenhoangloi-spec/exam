'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const [filter, setFilter] = useState('Tất cả');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 0;
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 0;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;

  // 100% chuẩn sắc độ Xanh dương & Trắng & Xám Slate
  const rawItems = [
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: approvedCount,
      color: '#2563eb', // Blue-600
      icon: CheckCircle2,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: pendingCount,
      color: '#60a5fa', // Blue-400
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-500 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: rejectedCount,
      color: '#94a3b8', // Slate-400
      icon: XCircle,
      iconBg: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
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
        {/* Donut Canvas with Center Total Display */}
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
                  {totalCount > 0 ? (
                    chartData.map((entry) => (
                      <Cell key={`cell-${entry.status}`} fill={entry.color} />
                    ))
                  ) : (
                    <Cell fill="#e2e8f0" />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => [`${value} câu`, `${name}`]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          )}

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[17px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {new Intl.NumberFormat('vi-VN').format(totalCount)}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Tổng số
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex-1 space-y-2 min-w-0">
          {chartData.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('vi-VN').format(item.count)}
                </span>
                <span className="text-[11.5px] font-semibold text-slate-400 w-10 text-right">
                  {item.percent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info note */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[12px] text-slate-500">
        <span>Ngân hàng câu hỏi</span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 100}% đạt chuẩn
        </span>
      </div>
    </div>
  );
}
