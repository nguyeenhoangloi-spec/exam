'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '../../lib/api';
import { Question, Subject } from '../../types';
import { Modal } from '../Modal';
import { RichQuestionEditor } from './RichQuestionEditor';
import { Button, controlClassName } from '../ui';
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

const fillBlankAnswer = z.object({
  blankIndex: z.number().int().min(1),
  answer: z.string().min(1),
  acceptedAnswersText: z.string().optional(),
  score: z.number().min(0),
  caseSensitive: z.boolean().optional(),
  ignoreWhitespace: z.boolean().optional(),
  ignoreVietnameseTone: z.boolean().optional(),
});

const schema = z.object({
  subjectId: z.number().min(1),
  content: z.string().min(5),
  contentRich: z.object({ html: z.string() }).optional(),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE']),
  score: z.number().positive(),
  explanation: z.string().optional(),
  keywords: z.string().optional(),
  options: z.array(option),
  fillBlankAnswers: z.array(fillBlankAnswer).optional(),
});

type Form = z.infer<typeof schema>;

const defaults: Form = {
  subjectId: 0,
  content: '',
  contentRich: { html: '' },
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
  fillBlankAnswers: [],
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
  onSaved: (msg?: string) => void;
}) {
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const mediaUrlsRef = React.useRef<string[]>([]);

  const addMediaFiles = (incoming: File[]) => {
    const urls = incoming.map((f) => URL.createObjectURL(f));
    setMediaFiles((cur) => [...cur, ...incoming]);
    setMediaUrls((cur) => { const next = [...cur, ...urls]; mediaUrlsRef.current = next; return next; });
  };

  const removeMediaFile = (idx: number) => {
    URL.revokeObjectURL(mediaUrlsRef.current[idx]);
    setMediaFiles((cur) => cur.filter((_, i) => i !== idx));
    setMediaUrls((cur) => { const next = cur.filter((_, i) => i !== idx); mediaUrlsRef.current = next; return next; });
  };
  const {
    register,
    control,
    watch,
    reset,
    setValue,
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
  const fillBlankFields = useFieldArray({ control, name: 'fillBlankAnswers' });

  const subjectId = watch('subjectId');
  const type = watch('type');

  useEffect(() => {
    if (!open) return;
    // Revoke old URLs via ref to avoid dep-array warning
    mediaUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    mediaUrlsRef.current = [];
    setMediaFiles([]);
    setMediaUrls([]);
    reset(
      question
        ? {
            subjectId: question.subjectId,
            content: question.content,
            contentRich: (question.contentRich as { html?: string } | null) || { html: '' },
            type: question.type,
            difficulty: question.difficulty,
            bloomLevel: question.bloomLevel,
            score: question.score,
            explanation: question.explanation || '',
            keywords: question.keywords || '',
            options: question.options || [],
            fillBlankAnswers: (question as any).fillBlankAnswers?.map((item: any) => ({ ...item, acceptedAnswersText: (item.acceptedAnswers || []).join(', ') })) || [],
          }
        : {
            ...defaults,
            subjectId: subjects[0]?.id || 0,
          }
    );
  }, [open, question, subjects, reset]);

  const watchType = watch('type');

  useEffect(() => {
    if (!question && watchType) {
      setValue('score', watchType === 'ESSAY' ? 1.0 : 0.25);
    }
  }, [watchType, question, setValue]);

  const submit = async (data: Form) => {
    const html = data.contentRich?.html || '';
    let plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || data.content;
    if (data.type === 'FILL_BLANK' && !plain.includes('{{blank_')) {
      plain = `${plain} {{blank_1}}`;
    }
    const payload = {
      ...data,
      content: plain,
      contentRich: html ? { html } : undefined,
      fillBlankAnswers: data.type === 'FILL_BLANK'
        ? (data.fillBlankAnswers?.length ? data.fillBlankAnswers : [{ blankIndex: 1, answer: 'đáp_án_đúng', score: data.score || 0.25 }]).map(({ acceptedAnswersText, ...item }) => ({ ...item, acceptedAnswers: acceptedAnswersText?.split(',').map(value => value.trim()).filter(Boolean) || [] }))
        : [],
    };
    const response = await (question ? api.patch(`/questions/${question.id}`, payload) : api.post('/questions', payload));
    const savedId = question?.id || response.data?.id;
    if (savedId && mediaFiles.length) {
      const form = new FormData();
      form.append('questionId', savedId);
      mediaFiles.forEach((file) => form.append('files', file));
      await api.post('/questions/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    onSaved(question ? 'Đã cập nhật thông tin câu hỏi thành công!' : 'Đã tạo thành công câu hỏi mới vào ngân hàng!');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Môn */}
          <select {...register('subjectId', { valueAsNumber: true })} className={controlClassName}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectName}
              </option>
            ))}
          </select>

          {/* Loại câu hỏi */}
          <select {...register('type')} className={controlClassName}>
            {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Độ khó */}
          <select {...register('difficulty')} className={controlClassName}>
            {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Mức độ Bloom */}
          <select {...register('bloomLevel')} className={controlClassName}>
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
            className={controlClassName}
          />
        </div>

        <input type="hidden" {...register('content')} />
        <RichQuestionEditor value={watch('contentRich')} fallback={watch('content')} onFiles={(files) => addMediaFiles(files)} onChange={(html) => { setValue('contentRich', { html }, { shouldDirty: true }); setValue('content', html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), { shouldValidate: true }); }} placeholder="Nội dung câu hỏi..." />

        {/* Media Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Đính kèm media (Tùy chọn)</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition">
              <input
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addMediaFiles(Array.from(e.target.files));
                  e.target.value = '';
                }}
              />
              Thêm ảnh / video / audio
            </label>
          </div>

          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                  {file.type.startsWith('image/') && (
                    <img src={mediaUrls[idx]} alt={file.name} className="h-20 w-28 object-cover" />
                  )}
                  {file.type.startsWith('video/') && (
                    <video src={mediaUrls[idx]} controls className="h-20 w-36 object-cover bg-black" />
                  )}
                  {file.type.startsWith('audio/') && (
                    <div className="flex flex-col items-center justify-center px-3 py-2 gap-1">
                      <span className="text-[10px] font-semibold text-slate-600 max-w-[120px] truncate">{file.name}</span>
                      <audio src={mediaUrls[idx]} controls className="h-8 w-36" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMediaFile(idx)}
                    className="absolute top-1 right-1 rounded-full bg-slate-900/60 text-white w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!['FILL_BLANK', 'ESSAY'].includes(type) && (
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <span className="text-xs font-bold text-slate-700">Danh sách đáp án:</span>
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  {...register(`options.${i}.isCorrect`)}
                  type={type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Thêm lựa chọn đáp án
            </button>
          </div>
        )}

        {type === 'FILL_BLANK' && (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              Đặt chỗ trống trong nội dung theo mẫu <b>{'{{blank_1}}'}</b>, <b>{'{{blank_2}}'}</b>. Tổng điểm các ô phải bằng điểm của câu hỏi.
            </div>
            {fillBlankFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[70px_1fr_100px_auto]">
                <input type="number" readOnly {...register(`fillBlankAnswers.${index}.blankIndex`, { valueAsNumber: true })} className="rounded-lg border bg-slate-50 p-2 text-sm" />
                <input {...register(`fillBlankAnswers.${index}.answer`)} placeholder="Đáp án chính" className="rounded-lg border p-2 text-sm" />
                <input type="number" step="0.25" {...register(`fillBlankAnswers.${index}.score`, { valueAsNumber: true })} placeholder="Điểm" className="rounded-lg border p-2 text-sm" />
                <button type="button" onClick={() => fillBlankFields.remove(index)} className="px-2 text-rose-600">×</button>
                <input {...register(`fillBlankAnswers.${index}.acceptedAnswersText`)} placeholder="Đáp án chấp nhận thêm, ngăn cách bằng dấu phẩy" className="md:col-span-4 rounded-lg border p-2 text-xs" />
              </div>
            ))}
            <button type="button" onClick={() => {
              const index = fillBlankFields.fields.length + 1;
              const currentScore = Number(watch('score')) || 0;
              fillBlankFields.append({ blankIndex: index, answer: '', acceptedAnswersText: '', score: index === 1 ? currentScore : 0, ignoreWhitespace: true, caseSensitive: false, ignoreVietnameseTone: false });
              const raw = watch('contentRich')?.html || watch('content') || '';
              if (!raw.includes(`{{blank_${index}}}`)) setValue('contentRich', { html: `${raw}${raw ? ' ' : ''}{{blank_${index}}}` });
            }} className="text-xs font-bold text-blue-600 hover:underline">+ Thêm chỗ trống</button>
          </div>
        )}

        <input
          {...register('keywords')}
          placeholder="Từ khóa tìm kiếm (ngăn cách bởi dấu phẩy)..."
          className={controlClassName}
        />
        <textarea
          {...register('explanation')}
          rows={2}
          placeholder="Giải thích lý do đáp án đúng..."
          className={controlClassName}
        />

        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-semibold text-rose-600">
            Vui lòng kiểm tra lại các trường thông tin bắt buộc và danh sách đáp án.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" isLoading={isSubmitting}>Lưu câu hỏi</Button>
        </div>
      </form>
    </Modal>
  );
}
