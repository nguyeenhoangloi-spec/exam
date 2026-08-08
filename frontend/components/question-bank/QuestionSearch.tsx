import { Search } from 'lucide-react';
export function QuestionSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="relative block min-w-[260px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={value} onChange={e => onChange(e.target.value)} placeholder="Tìm nội dung hoặc mã Q000001..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label>;
}
