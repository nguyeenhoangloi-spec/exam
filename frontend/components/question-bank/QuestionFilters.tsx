import { Subject } from '../../types';
export type Filters = { subjectId: string; chapterId: string; type: string; difficulty: string; bloomLevel: string; status: string };
export function QuestionFilters({ value, subjects, onChange }: { value: Filters; subjects: Subject[]; onChange: (next: Filters) => void }) {
  const subject = subjects.find(s => String(s.id) === value.subjectId);
  const set = (key: keyof Filters, next: string) => onChange({ ...value, [key]: next, ...(key === 'subjectId' ? { chapterId: '' } : {}) });
  const select = 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none';
  return <div className="flex flex-wrap gap-2">
    <select className={select} value={value.subjectId} onChange={e => set('subjectId', e.target.value)}><option value="">Tất cả môn</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}</select>
    <select className={select} value={value.chapterId} onChange={e => set('chapterId', e.target.value)} disabled={!value.subjectId}><option value="">Tất cả chương</option>{subject?.chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <select className={select} value={value.type} onChange={e => set('type', e.target.value)}><option value="">Tất cả loại</option><option value="SINGLE_CHOICE">Một đáp án</option><option value="MULTIPLE_CHOICE">Nhiều đáp án</option><option value="TRUE_FALSE">Đúng/Sai</option><option value="FILL_BLANK">Điền khuyết</option><option value="ESSAY">Tự luận</option></select>
    <select className={select} value={value.difficulty} onChange={e => set('difficulty', e.target.value)}><option value="">Tất cả độ khó</option><option>EASY</option><option>MEDIUM</option><option>HARD</option></select>
    <select className={select} value={value.bloomLevel} onChange={e => set('bloomLevel', e.target.value)}><option value="">Tất cả Bloom</option><option>REMEMBER</option><option>UNDERSTAND</option><option>APPLY</option><option>ANALYZE</option></select>
    <select className={select} value={value.status} onChange={e => set('status', e.target.value)}><option value="">Tất cả trạng thái</option><option>DRAFT</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>ARCHIVED</option></select>
  </div>;
}
