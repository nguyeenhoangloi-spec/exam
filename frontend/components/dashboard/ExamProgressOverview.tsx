'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

export function ExamProgressOverview({ periods }: { periods: DashboardOverview['examProgress'] }) {
  const router = useRouter();
  const currentPeriod = periods[0] || {
    id: 1,
    name: 'HK1-2025',
    totalSchedules: 12,
    incompleteSchedules: 0,
    roomProgress: 100,
    supervisorProgress: 100,
    paperProgress: 75,
  };

  const steps = [
    { title: 'Ngân hàng câu hỏi', done: true },
    { title: 'Phân công giảng viên', done: true },
    { title: 'Xếp phòng thi', done: true },
    { title: 'Phát hành đề thi', done: true },
    { title: 'Công bố lịch thi', done: false },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tiến độ tổ chức kỳ thi</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{periods.length || 3} kỳ thi đang diễn ra</p>
        </div>
        <button
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!periods.length ? (
        <DashboardEmptyState message="Chưa có kỳ thi cần chuẩn bị." />
      ) : (
        <div className="space-y-5">
          {/* Active Period Progress Card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">{currentPeriod.name}</h3>
              <span className="text-[11px] font-semibold text-slate-400">01/03/2026 - 30/04/2026</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-end text-[11px] font-extrabold text-blue-600">
                {currentPeriod.paperProgress || 75}%
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${currentPeriod.paperProgress || 75}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timeline Stepper */}
          <div className="pt-2">
            <div className="relative flex items-center justify-between">
              {/* Connecting Line */}
              <div className="absolute left-3 right-3 top-2.5 h-0.5 bg-emerald-300 -z-0" />

              {steps.map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center max-w-[64px]">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${step.done ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-slate-700 leading-tight">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

