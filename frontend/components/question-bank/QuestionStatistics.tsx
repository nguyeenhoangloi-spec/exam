import { Archive, CheckCircle2, Clock3, FileQuestion, XCircle } from 'lucide-react';
export function QuestionStatistics({ counts }: { counts: Record<string, number> }) {
  const items = [
    ['Tổng câu hỏi', counts.total || 0, FileQuestion, 'text-sky-600 bg-sky-50'],
    ['Chờ duyệt', counts.PENDING || 0, Clock3, 'text-amber-600 bg-amber-50'],
    ['Đã duyệt', counts.APPROVED || 0, CheckCircle2, 'text-emerald-600 bg-emerald-50'],
    ['Từ chối', counts.REJECTED || 0, XCircle, 'text-rose-600 bg-rose-50'],
    ['Ngừng sử dụng', counts.ARCHIVED || 0, Archive, 'text-indigo-600 bg-indigo-50'],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{items.map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{value}</p></div><div className={`rounded-xl p-2.5 ${color}`}><Icon className="h-5 w-5" /></div></div></div>)}</div>;
}
