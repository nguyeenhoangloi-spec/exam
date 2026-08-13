import { Search } from 'lucide-react';
export function QuestionSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="relative block min-w-[260px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={value} onChange={e => onChange(e.target.value)} placeholder="Tìm nội dung hoặc mã Q000001..." className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-[15px] text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 placeholder:text-slate-400" /></label>;
}
