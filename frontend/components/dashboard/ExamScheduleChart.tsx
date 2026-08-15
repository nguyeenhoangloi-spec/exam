'use client';

import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { Calendar, TrendingUp } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function ExamScheduleChart({ data }: { data?: DashboardOverview['examChart'] }) {
  const [timeFilter, setTimeFilter] = useState('7 ngày tới');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData: Array<{ label: string; count: number }> = data && data.length > 0
    ? data
    : [
        { label: '11/04', count: 0 },
        { label: '12/04', count: 3 },
        { label: '13/04', count: 2 },
        { label: '14/04', count: 18 },
        { label: '15/04', count: 0 },
        { label: '16/04', count: 1 },
        { label: '17/04', count: 14 },
      ];

  const totalExams = chartData.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-2 h-full flex flex-col justify-between">
      {/* Header & Dropdown Filter */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">Lịch thi trong 7 ngày tới</h3>

        <FilterSelect
          size="sm"
          variant="ghost"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="7 ngày tới">7 ngày tới</option>
          <option value="14 ngày tới">14 ngày tới</option>
          <option value="30 ngày tới">30 ngày tới</option>
        </FilterSelect>
      </div>

      {/* Subheader badge */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shrink-0">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {totalExams} kỳ thi sắp diễn ra
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3" />
          <span>Theo tiến độ</span>
        </span>
      </div>

      {/* Y-axis label */}
      <div className="text-[12px] font-medium text-slate-400 pl-1">
        Số ca thi
      </div>

      {/* Chart Canvas */}
      <div className="h-40 w-full min-w-0">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ui-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--ui-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--ui-text-disabled)', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--ui-text-disabled)', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ stroke: 'var(--ui-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid var(--ui-border)',
                  backgroundColor: 'var(--ui-surface)',
                  color: 'var(--ui-text-primary)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
                formatter={(value) => [`${value} ca thi`, 'Số ca thi']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--ui-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExams)"
                dot={{ r: 3.5, fill: 'var(--ui-primary)', stroke: 'var(--ui-surface)', strokeWidth: 2 }}
                activeDot={{ r: 5.5, fill: 'var(--ui-primary-hover)', stroke: 'var(--ui-surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}
      </div>

      {/* Legend at bottom */}
      <div className="flex items-center justify-center border-t border-slate-100 dark:border-slate-800 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
          <span>Số ca thi trong ngày</span>
        </div>
      </div>
    </div>
  );
}
