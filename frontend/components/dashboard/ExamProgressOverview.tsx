'use client';

import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';

export function ExamProgressOverview({ periods }: { periods?: DashboardOverview['examProgress'] }) {
  const router = useRouter();

  const list = (periods && periods.length > 0)
    ? periods.slice(0, 5).map((p, idx) => {
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Tiến độ tổ chức kỳ thi</h3>

        <button
          type="button"
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress Bars List */}
      {list.length > 0 ? (
        <div className="space-y-4 my-auto">
          {list.map((item) => (
            <div key={item.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 truncate pr-2">
                  <span className="font-black text-slate-900">{item.code}</span> - {item.name}
                </span>
                <span className={`font-black text-xs ${item.textColor} shrink-0`}>
                  {item.progress}%
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-md bg-slate-100">
                <div
                  className={`h-full rounded-md transition-all duration-500 ${item.color}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center my-auto space-y-2 text-slate-400">
          <Layers className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Chưa có tiến độ kỳ thi nào</p>
        </div>
      )}

      {/* Footer Legend */}
      <div className="flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 inline-block" />
          <span>Chưa bắt đầu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 inline-block" />
          <span>Đang thực hiện</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 inline-block" />
          <span>Hoàn thành</span>
        </div>
      </div>
    </div>
  );
}
