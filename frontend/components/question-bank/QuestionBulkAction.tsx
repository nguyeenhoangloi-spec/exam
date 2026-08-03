export function QuestionBulkAction({ count, onAction, onClear }: { count: number; onAction: (action: string) => void; onClear: () => void }) {
  if (!count) return null;
  return <div className="my-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm"><b>Đã chọn {count}</b>{['APPROVE','REJECT','ARCHIVE'].map(a => <button key={a} onClick={() => onAction(a)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-white">{a}</button>)}<button onClick={onClear} className="ml-auto">Bỏ chọn</button></div>;
}
