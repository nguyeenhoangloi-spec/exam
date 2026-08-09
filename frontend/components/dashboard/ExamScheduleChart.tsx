'use client';

import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { ChevronDown, CalendarDays } from 'lucide-react';

export function ExamScheduleChart({ data }: { data?: DashboardOverview['examChart'] }) {
  const [timeFilter, setTimeFilter] = useState('7 ngày tới');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data && data.length > 0 ? data : [];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      {/* Header & Dropdown Filter */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-[18px] font-semibold text-[#0F172A]">Lịch thi trong 7 ngày tới</h3>

        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1.5 pr-8 text-[14px] font-medium text-[#334155] outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value="7 ngày tới">7 ngày tới</option>
            <option value="14 ngày tới">14 ngày tới</option>
            <option value="30 ngày tới">30 ngày tới</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
        </div>
      </div>

      {/* Y-axis title label */}
      <div className="text-[10px] font-bold text-slate-400 pl-1 -mb-2">
        Số lượng
      </div>

      {/* Chart Canvas */}
      {chartData.length > 0 ? (
        <div className="h-56 w-full min-w-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10.5, fontWeight: 700 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10.5, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                  formatter={(value) => [`${value} kỳ thi`, 'Số kỳ thi']}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  <LabelList dataKey="count" position="top" style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '900' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-2xl bg-slate-100 animate-pulse" />
          )}
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center space-y-2 text-slate-400">
          <CalendarDays className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Chưa có lịch thi trong 7 ngày tới</p>
        </div>
      )}

      {/* Center Legend */}
      <div className="flex items-center justify-center border-t border-slate-100 pt-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
          <span className="h-3 w-3 rounded-xs bg-blue-600 inline-block" />
          <span>Số kỳ thi</span>
        </div>
      </div>
    </div>
  );
}
