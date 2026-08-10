'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { ChevronDown } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const [filter, setFilter] = useState('Tất cả');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find counts from real API data
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 0;
  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 0;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;

  // Items list matching real API data
  const rawItems = [
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: approvedCount,
      color: '#16a34a',
    },
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: pendingCount,
      color: '#f59e0b',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: rejectedCount,
      color: '#ef4444',
    },
  ];

  // Calculate sum
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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs h-full flex flex-col justify-between overflow-hidden">
      {/* Header & Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-[18px] font-semibold text-[#0F172A]">Thống kê trạng thái câu hỏi</h3>

        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 pr-8 text-[14px] font-medium text-[#334155] outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Tháng này">Tháng này</option>
            <option value="Học kỳ này">Học kỳ này</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
        </div>
      </div>

      {/* Donut & Legend side by side - BIG & SPACIOUS */}
      <div className="flex-1 flex flex-row items-center justify-between gap-6 py-4 min-w-0 my-auto">
        {/* Large Donut Canvas */}
        <div className="relative h-52 w-52 shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="none"
                >
                  {chartData.map((item) => (
                    <Cell key={item.status} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => [`${Number(value).toLocaleString('vi-VN')} câu`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-full bg-slate-100 animate-pulse" />
          )}

          {/* Large Center Text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[13px] font-semibold text-[#64748B]">Tổng</span>
            <span className="text-[28px] font-bold text-[#0F172A] leading-none my-1">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[13px] font-semibold text-[#64748B]">câu hỏi</span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className="flex-1 min-w-0 space-y-3">
          {chartData.map((item) => (
            <div key={item.status} className="flex flex-col gap-0.5 border-b border-slate-100 pb-2 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={item.status} customLabel={item.label} />
                <span className="text-[14px] font-semibold text-[#0F172A]">{item.count.toLocaleString('vi-VN')}</span>
              </div>
              <div className="text-right text-[13px] text-[#64748B] font-normal">
                {item.percent} tổng số câu hỏi
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
