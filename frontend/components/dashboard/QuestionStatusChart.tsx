'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const settings = {
  DRAFT: { label: 'Bản nháp', color: '#94a3b8' },
  PENDING: { label: 'Chờ duyệt', color: '#f59e0b' },
  APPROVED: { label: 'Đã duyệt', color: '#10b981' },
  REJECTED: { label: 'Từ chối', color: '#ef4444' },
  ARCHIVED: { label: 'Lưu trữ', color: '#6366f1' },
};

export function QuestionStatusChart({ data }: { data: DashboardOverview['questionStatus'] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
      <div>
        <h2 className="font-bold text-slate-900">Trạng thái câu hỏi</h2>
        <p className="text-xs text-slate-500">Phân bổ toàn bộ ngân hàng câu hỏi</p>
      </div>
      {!total ? (
        <div className="mt-5"><DashboardEmptyState message="Chưa có câu hỏi." /></div>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
          <div className="relative h-44 w-full min-w-0 sm:w-1/2 xl:w-full 2xl:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="status" innerRadius={48} outerRadius={70} paddingAngle={2}>
                  {data.map((item) => <Cell key={item.status} fill={settings[item.status].color} />)}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [`${value} câu`, settings[item.payload.status as keyof typeof settings].label]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-xl text-slate-900">{total}</strong>
              <span className="text-[11px] text-slate-500">câu hỏi</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2 text-xs sm:w-1/2 sm:grid-cols-1 xl:w-full xl:grid-cols-2 2xl:w-1/2 2xl:grid-cols-1">
            {data.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: settings[item.status].color }} />
                  <span className="truncate">{settings[item.status].label}</span>
                </span>
                <strong className="text-slate-800">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
