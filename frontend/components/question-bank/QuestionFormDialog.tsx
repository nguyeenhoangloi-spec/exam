'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '../../lib/api';
import { Question, Subject } from '../../types';
import { Modal } from '../Modal';
import {
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  BLOOM_LABELS,
} from '../../lib/enum-labels';

const option = z.object({
  label: z.string().min(1),
  content: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number(),
});

const schema = z.object({
  subjectId: z.number().min(1),
  chapterId: z.string().uuid(),
  content: z.string().min(5),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE']),
  score: z.number().positive(),
  explanation: z.string().optional(),
  keywords: z.string().optional(),
  options: z.array(option),
});

type Form = z.infer<typeof schema>;

const defaults: Form = {
  subjectId: 0,
  chapterId: '',
  content: '',
  type: 'SINGLE_CHOICE',
  difficulty: 'MEDIUM',
  bloomLevel: 'UNDERSTAND',
  score: 0.25,
  explanation: '',
  keywords: '',
  options: ['A', 'B', 'C', 'D'].map((label, order) => ({
    label,
    content: '',
    isCorrect: order === 0,
    order,
  })),
};

export function QuestionFormDialog({
  open,
  subjects,
  question,
  onClose,
  onSaved,
}: {
  open: boolean;
  subjects: Subject[];
  question?: Question | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'options',
  });

  const subjectId = watch('subjectId');
  const type = watch('type');
  const subject = subjects.find((s) => s.id === Number(subjectId));

  useEffect(() => {
    if (!open) return;
    reset(
      question
        ? {
            subjectId: question.subjectId,
            chapterId: question.chapterId,
            content: question.content,
            type: question.type,
            difficulty: question.difficulty,
            bloomLevel: question.bloomLevel,
            score: question.score,
            explanation: question.explanation || '',
            keywords: question.keywords || '',
            options: question.options || [],
          }
        : {
            ...defaults,
            subjectId: subjects[0]?.id || 0,
            chapterId: subjects[0]?.chapters?.[0]?.id || '',
          }
    );
  }, [open, question, subjects, reset]);

  const submit = async (data: Form) => {
    await (question ? api.patch(`/questions/${question.id}`, data) : api.post('/questions', data));
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Môn */}
          <select {...register('subjectId', { valueAsNumber: true })} className="rounded-xl border p-2.5 text-sm font-medium">
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectName}
              </option>
            ))}
          </select>

          {/* Chương */}
          <select {...register('chapterId')} className="rounded-xl border p-2.5 text-sm font-medium">
            <option value="">Chọn chương</option>
            {subject?.chapters?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Loại câu hỏi */}
          <select {...register('type')} className="rounded-xl border p-2.5 text-sm font-medium">
            {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Độ khó */}
          <select {...register('difficulty')} className="rounded-xl border p-2.5 text-sm font-medium">
            {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Mức độ Bloom */}
          <select {...register('bloomLevel')} className="rounded-xl border p-2.5 text-sm font-medium">
            {Object.entries(BLOOM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Điểm số */}
          <input
            type="number"
            step="0.25"
            {...register('score', { valueAsNumber: true })}
            placeholder="Điểm số câu hỏi (ví dụ: 0.25)"
            className="rounded-xl border p-2.5 text-sm font-semibold"
          />
        </div>

        <textarea
          {...register('content')}
          rows={4}
          placeholder="Nội dung câu hỏi..."
          className="w-full rounded-xl border p-3 text-sm font-medium"
        />

        {!['FILL_BLANK', 'ESSAY'].includes(type) && (
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <span className="text-xs font-bold text-slate-700">Danh sách đáp án:</span>
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  {...register(`options.${i}.isCorrect`)}
                  type={type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <input
                  {...register(`options.${i}.label`)}
                  className="w-12 rounded-lg border p-2 text-center text-xs font-bold"
                />
                <input
                  {...register(`options.${i}.content`)}
                  className="flex-1 rounded-lg border p-2 text-sm"
                  placeholder={`Nội dung đáp án ${field.label}...`}
                />
                <button
                  type="button"
                  onClick={() => i && move(i, i - 1)}
                  className="px-1.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="px-1.5 text-rose-500 hover:text-rose-700 font-bold text-base"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                append({
                  label: String.fromCharCode(65 + fields.length),
                  content: '',
                  isCorrect: false,
                  order: fields.length,
                })
              }
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              + Thêm lựa chọn đáp án
            </button>
          </div>
        )}

        <input
          {...register('keywords')}
          placeholder="Từ khóa tìm kiếm (ngăn cách bởi dấu phẩy)..."
          className="w-full rounded-xl border p-2.5 text-sm"
        />
        <textarea
          {...register('explanation')}
          rows={2}
          placeholder="Giải thích lý do đáp án đúng..."
          className="w-full rounded-xl border p-2.5 text-sm"
        />

        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-semibold text-rose-600">
            Vui lòng kiểm tra lại các trường thông tin bắt buộc và danh sách đáp án.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            disabled={isSubmitting}
            className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu câu hỏi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
