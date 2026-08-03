'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '../../lib/api';
import { Question, Subject } from '../../types';
import { Modal } from '../Modal';

const option = z.object({ label: z.string().min(1), content: z.string().min(1), isCorrect: z.boolean(), order: z.number() });
const schema = z.object({ subjectId: z.number().min(1), chapterId: z.string().uuid(), content: z.string().min(5), type: z.enum(['SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','ESSAY']), difficulty: z.enum(['EASY','MEDIUM','HARD']), bloomLevel: z.enum(['REMEMBER','UNDERSTAND','APPLY','ANALYZE']), score: z.number().positive(), explanation: z.string().optional(), keywords: z.string().optional(), options: z.array(option) });
type Form = z.infer<typeof schema>;
const defaults: Form = { subjectId: 0, chapterId: '', content: '', type: 'SINGLE_CHOICE', difficulty: 'MEDIUM', bloomLevel: 'UNDERSTAND', score: .25, explanation: '', keywords: '', options: ['A','B','C','D'].map((label, order) => ({ label, content: '', isCorrect: order === 0, order })) };

export function QuestionFormDialog({ open, subjects, question, onClose, onSaved }: { open: boolean; subjects: Subject[]; question?: Question | null; onClose: () => void; onSaved: () => void }) {
  const { register, control, watch, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { fields, append, remove, move } = useFieldArray({ control, name: 'options' });
  const subjectId = watch('subjectId'); const type = watch('type'); const subject = subjects.find(s => s.id === Number(subjectId));
  useEffect(() => { if (!open) return; reset(question ? { subjectId: question.subjectId, chapterId: question.chapterId, content: question.content, type: question.type, difficulty: question.difficulty, bloomLevel: question.bloomLevel, score: question.score, explanation: question.explanation || '', keywords: question.keywords || '', options: question.options || [] } : { ...defaults, subjectId: subjects[0]?.id || 0, chapterId: subjects[0]?.chapters?.[0]?.id || '' }); }, [open, question, subjects, reset]);
  const submit = async (data: Form) => { await (question ? api.patch(`/questions/${question.id}`, data) : api.post('/questions', data)); onSaved(); onClose(); };
  return <Modal isOpen={open} onClose={onClose} title={question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}>
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2"><select {...register('subjectId', { valueAsNumber: true })} className="rounded-xl border p-2">{subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}</select><select {...register('chapterId')} className="rounded-xl border p-2"><option value="">Chọn chương</option>{subject?.chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select {...register('type')} className="rounded-xl border p-2"><option>SINGLE_CHOICE</option><option>MULTIPLE_CHOICE</option><option>TRUE_FALSE</option><option>FILL_BLANK</option><option>ESSAY</option></select><select {...register('difficulty')} className="rounded-xl border p-2"><option>EASY</option><option>MEDIUM</option><option>HARD</option></select><select {...register('bloomLevel')} className="rounded-xl border p-2"><option>REMEMBER</option><option>UNDERSTAND</option><option>APPLY</option><option>ANALYZE</option></select><input type="number" step=".25" {...register('score', { valueAsNumber: true })} className="rounded-xl border p-2" /></div>
      <textarea {...register('content')} rows={4} placeholder="Nội dung câu hỏi" className="w-full rounded-xl border p-3" />
      {!['FILL_BLANK','ESSAY'].includes(type) && <div className="space-y-2">{fields.map((field, i) => <div key={field.id} className="flex gap-2"><input {...register(`options.${i}.isCorrect`)} type={type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'} className="mt-3" /><input {...register(`options.${i}.label`)} className="w-12 rounded-lg border p-2" /><input {...register(`options.${i}.content`)} className="flex-1 rounded-lg border p-2" placeholder="Nội dung đáp án" /><button type="button" onClick={() => i && move(i, i - 1)}>↑</button><button type="button" onClick={() => remove(i)}>×</button></div>)}<button type="button" onClick={() => append({ label: String.fromCharCode(65 + fields.length), content: '', isCorrect: false, order: fields.length })} className="text-sm text-sky-700">+ Thêm đáp án</button></div>}
      <input {...register('keywords')} placeholder="Từ khóa" className="w-full rounded-xl border p-2" /><textarea {...register('explanation')} placeholder="Giải thích" className="w-full rounded-xl border p-2" />
      {Object.keys(errors).length > 0 && <p className="text-sm text-rose-600">Vui lòng kiểm tra các trường bắt buộc và đáp án.</p>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2">Hủy</button><button disabled={isSubmitting} className="rounded-xl bg-sky-600 px-4 py-2 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu câu hỏi'}</button></div>
    </form>
  </Modal>;
}
