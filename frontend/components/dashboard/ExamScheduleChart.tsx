'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

export function ExamScheduleChart({ data }: { data: DashboardOverview['examChart'] }) {
  const hasData = data.some((item) => item.count > 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
      <div className="mb-5">
        <h2 className="font-bold text-slate-900">Lịch thi theo tháng</h2>
        <p className="text-xs text-slate-500">Số lịch thi trong 6 tháng gần nhất</p>
      </div>
      {!hasData ? (
        <DashboardEmptyState message="Chưa có lịch thi trong 6 tháng gần nhất." />
      ) : (
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [`${value} lịch thi`, 'Số lượng']} />
              <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
