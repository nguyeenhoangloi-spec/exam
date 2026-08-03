import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-slate-700">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${value === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ExamProgressOverview({ periods }: { periods: DashboardOverview['examProgress'] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-12">
      <div className="mb-4">
        <h2 className="font-bold text-slate-900">Tình trạng tổ chức kỳ thi</h2>
        <p className="text-xs text-slate-500">Tiến độ thiết lập các kỳ thi đang chuẩn bị và đang diễn ra</p>
      </div>
      {!periods.length ? <DashboardEmptyState message="Chưa có kỳ thi cần chuẩn bị." /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {periods.map((period) => (
            <article key={period.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-800" title={period.name}>{period.name}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">{period.totalSchedules} lịch thi</p>
                </div>
                {period.incompleteSchedules ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
              <div className="mt-4 space-y-3">
                <ProgressRow label="Xếp phòng" value={period.roomProgress} />
                <ProgressRow label="Phân công giám thị" value={period.supervisorProgress} />
                <ProgressRow label="Tạo đề thi" value={period.paperProgress} />
              </div>
              <p className={`mt-3 text-[11px] font-medium ${period.incompleteSchedules ? 'text-amber-700' : 'text-emerald-700'}`}>
                {period.incompleteSchedules ? `${period.incompleteSchedules} lịch chưa hoàn tất` : 'Đã hoàn tất thiết lập'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
