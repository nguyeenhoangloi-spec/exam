'use client';

import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { StatusBadge } from '../common/StatusBadge';

export function ExamProgressOverview({ periods }: { periods?: DashboardOverview['examProgress'] }) {
  const router = useRouter();
  const list = (periods && periods.length > 0)
    ? periods.slice(0, 5).map((p) => {
        const pct = Math.min(100, Math.max(0, p.paperProgress || p.roomProgress || 0));
        const isComplete = pct === 100;
        const periodItem = p as any;
        return {
          code: periodItem.periodCode || `KT-${p.id}`,
          name: p.name || periodItem.periodName || 'Kỳ thi',
          progress: pct,
          status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
          color: isComplete ? 'bg-emerald-600' : 'bg-blue-600',
          textColor: isComplete ? 'text-emerald-700' : 'text-blue-700',
        };
      })
    : [];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-[18px] font-semibold text-[#0F172A]">Tiến độ tổ chức kỳ thi</h3>
        <button
          type="button"
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-[14px] font-medium text-[#2563EB] hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {list.length > 0 ? (
        <div className="space-y-4 my-auto">
          {list.map((item) => (
            <div key={item.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-[15px]">
                <span className="font-medium text-[#334155] truncate pr-2">
                  <span className="font-bold text-[#0F172A]">{item.code}</span> - {item.name}
                </span>
                <StatusBadge status={item.status} customLabel={`${item.progress}%`} className="shrink-0" />
              </div>
              <div className="h-2 w-full overflow-hidden rounded-md bg-slate-100">
                <div className={`h-full rounded-md transition-all duration-500 ${item.color}`} style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center my-auto space-y-2 text-[#64748B]">
          <Layers className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-[14px] font-normal text-[#64748B]">Chưa có tiến độ kỳ thi nào</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-3 text-[13px] font-normal text-[#64748B]">
        <StatusBadge status="NOT_STARTED" customLabel="Chưa bắt đầu" />
        <StatusBadge status="IN_PROGRESS" customLabel="Đang thực hiện" />
        <StatusBadge status="COMPLETED" customLabel="Hoàn thành" />
      </div>
    </div>
  );
}
