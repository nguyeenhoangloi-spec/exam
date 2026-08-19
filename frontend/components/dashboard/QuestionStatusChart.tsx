'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import {
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';
import { CardActionLink } from '../ui/CardActionLink';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const [filter, setFilter] = useState('Tất cả');
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 0;
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 0;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;

  const rawItems = [
    {
      status: 'APPROVED',
      label: 'Đã phê duyệt',
      sublabel: 'Sẵn sàng ra đề',
      count: approvedCount,
      color: 'var(--ui-primary)',
      dotColor: 'bg-blue-600',
    },
    {
      status: 'PENDING',
      label: 'Chờ thẩm định',
      sublabel: 'Cần giảng viên duyệt',
      count: pendingCount,
      color: 'var(--ui-chart-primary-light)',
      dotColor: 'bg-blue-400',
    },
    {
      status: 'REJECTED',
      label: 'Cần chỉnh sửa',
      sublabel: 'Yêu cầu sửa đổi',
      count: rejectedCount,
      color: 'var(--ui-text-disabled)',
      dotColor: 'bg-slate-300 dark:bg-slate-600',
    },
  ];

  const totalCount = rawItems.reduce((acc, curr) => acc + curr.count, 0);
  const approvedPct = totalCount > 0 ? (approvedCount / totalCount) * 100 : 100;

  const chartData = rawItems.map((item) => {
    const rawPct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
    const formattedPct = rawPct.toFixed(1).replace('.', ',') + '%';
    return {
      ...item,
      percent: formattedPct,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs h-full flex flex-col justify-between space-y-4">
      {/* ── 1. Header & Filter (Clean, Flat & Informative) ── */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="edu-card-title text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              Trạng thái câu hỏi
            </h3>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
              Phân bố & mức độ sẵn sàng của ngân hàng đề
            </p>
          </div>
        </div>

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

      {/* ── 2. Middle Section: Slender Donut + Flat Borderless Breakdown ── */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 py-1 min-w-0">
        {/* Slender Modern Donut Ring */}
        <div className="relative h-[142px] w-[142px] shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalCount > 0 ? chartData : [{ label: 'Trống', count: 1, color: 'var(--ui-border)' }]}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={totalCount > 0 ? 3 : 0}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {totalCount > 0 ? (
                    chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${entry.status}`}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === idx ? 1 : 0.45}
                        className="transition-opacity duration-200 cursor-pointer"
                      />
                    ))
                  ) : (
                    <Cell fill="var(--ui-border)" />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--ui-border)',
                    backgroundColor: 'var(--ui-surface)',
                    color: 'var(--ui-text-primary)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    fontSize: 'var(--fs-helper)',
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => [`${new Intl.NumberFormat('vi-VN').format(Number(value))} câu`, `${name}`]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          )}

          {/* Central Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-type-section font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {new Intl.NumberFormat('vi-VN').format(totalCount)}
            </span>
            <span className="text-type-helper font-medium text-slate-400 mt-1">
              Câu hỏi
            </span>
          </div>
        </div>

        {/* Flat Divider-First Breakdown (NO Grey Box Framing!) */}
        <div className="flex-1 w-full divide-y divide-slate-100 dark:divide-slate-800/80 min-w-0">
          {chartData.map((item, idx) => (
            <div
              key={item.status}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between gap-3 py-2 px-2 rounded-xl transition-colors cursor-pointer ${
                activeIndex === idx ? 'bg-slate-50 dark:bg-slate-800/60' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.dotColor}`} />
                <div className="min-w-0">
                  <p className="text-type-helper font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">
                    {item.label}
                  </p>
                  <p className="text-type-helper text-slate-400 dark:text-slate-500 truncate leading-snug">
                    {item.sublabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('vi-VN').format(item.count)}
                </span>
                <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 w-12 text-right">
                  {item.percent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Innovative 3-Pillar Micro Health Insights (Flat & Modern) ── */}
      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="px-1 border-r border-slate-100 dark:border-slate-800">
          <p className="text-type-helper text-slate-400 dark:text-slate-500 font-medium">Tỷ lệ duyệt</p>
          <p className="text-type-body-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {Math.round(approvedPct)}%
          </p>
        </div>
        <div className="px-1 border-r border-slate-100 dark:border-slate-800">
          <p className="text-type-helper text-slate-400 dark:text-slate-500 font-medium">Cần xử lý</p>
          <p className={`text-type-body-sm font-semibold mt-0.5 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
            {pendingCount} câu
          </p>
        </div>
        <div className="px-1">
          <p className="text-type-helper text-slate-400 dark:text-slate-500 font-medium">Tiêu chuẩn</p>
          <p className="text-type-body-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center justify-center gap-1">
            <Check className="h-3.5 w-3.5" />
            <span>ISO 9001</span>
          </p>
        </div>
      </div>

      {/* ── 4. Footer with Interactive Direct Link ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-type-helper">
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Ngân hàng câu hỏi được mã hóa</span>
        </span>
        <CardActionLink href="/question-bank" iconType="external">
          Khám phá kho
        </CardActionLink>
      </div>
    </div>
  );
}
