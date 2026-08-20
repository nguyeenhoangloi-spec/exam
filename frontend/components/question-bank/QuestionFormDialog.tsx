'use client';
import React, { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { Question, QuestionMedia, Subject } from '../../types';
import { Modal } from '../Modal';
import { Toast } from '../Toast';
import { RichQuestionEditor } from './RichQuestionEditor';
import { Button, controlClassName } from '../ui';
import { FilterSelect } from '../ui/FilterSelect';
import {
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  BLOOM_LABELS,
} from '../../lib/enum-labels';
import { getImageUrl } from '../../lib/media-utils';
import { ImageIcon, Trash2, Video, Volume2 } from 'lucide-react';
import { DynamicImage } from '../ui/DynamicImage';

const option = z.object({
  label: z.string().min(1),
  content: z.string(),
  isCorrect: z.boolean(),
  order: z.number(),
});

const fillBlankAnswer = z.object({
  blankIndex: z.number().int().min(1),
  answer: z.string().min(1, 'Vui lòng nhập đáp án cho ô trống'),
  acceptedAnswersText: z.string().optional(),
  score: z.number().min(0, 'Điểm số phải >= 0'),
  caseSensitive: z.boolean().optional(),
  ignoreWhitespace: z.boolean().optional(),
  ignoreVietnameseTone: z.boolean().optional(),
});

const schema = z
  .object({
    subjectId: z.number({ message: 'Vui lòng chọn môn học' }).min(1, 'Vui lòng chọn môn học'),
    content: z.string().min(1, 'Nội dung câu hỏi không được để trống'),
    contentRich: z.object({ html: z.string() }).optional(),
    type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE']),
    score: z.number({ message: 'Điểm số phải là số' }).positive('Điểm số phải lớn hơn 0'),
    explanation: z.string().optional(),
    keywords: z.string().optional(),
    options: z.array(option).optional(),
    fillBlankAnswers: z.array(fillBlankAnswer).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'SINGLE_CHOICE' || data.type === 'MULTIPLE_CHOICE' || data.type === 'TRUE_FALSE') {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Cần ít nhất 2 phương án lựa chọn',
        });
        return;
      }
      const emptyOption = data.options.find((o) => !o.content?.trim());
      if (emptyOption) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: `Vui lòng nhập nội dung cho đáp án lựa chọn ${emptyOption.label}`,
        });
        return;
      }
      const hasCorrect = data.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Vui lòng chọn ít nhất 1 đáp án đúng (bấm vào ô chữ A, B, C...)',
        });
      }
    }
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
  // Media đã tồn tại trên server (khi edit)
  const [existingMedia, setExistingMedia] = useState<QuestionMedia[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);

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

  const removeExistingMedia = (mediaId: string) => {
    setExistingMedia((cur) => cur.filter((m) => m.id !== mediaId));
    setRemovedMediaIds((cur) => [...cur, mediaId]);
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
    setToastError(null);
    // Revoke old URLs via ref to avoid dep-array warning
    mediaUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    mediaUrlsRef.current = [];
    setMediaFiles([]);
    setMediaUrls([]);
    setRemovedMediaIds([]);
    // Load media đã tồn tại từ câu hỏi khi edit
    setExistingMedia(question?.media || []);
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
    if (watchType === 'FILL_BLANK' && fillBlankFields.fields.length === 0) {
      fillBlankFields.append({ blankIndex: 1, answer: '', score: 0.25, acceptedAnswersText: '' });
      const currentHtml = watch('contentRich')?.html || '';
      if (!currentHtml.includes('{{blank_1}}')) {
        const appended = currentHtml ? `${currentHtml} {{blank_1}}` : '{{blank_1}}';
        setValue('contentRich', { html: appended });
        setValue('content', appended);
      }
    }
  }, [watchType, question, setValue]);

  const submit = async (data: Form) => {
    try {
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
      // Xóa các media đã đánh dấu xóa
      if (removedMediaIds.length) {
        await Promise.all(removedMediaIds.map((id) => api.delete(`/questions/media/${id}`)));
      }
      // Upload media mới
      if (savedId && mediaFiles.length) {
        const form = new FormData();
        form.append('questionId', savedId);
        mediaFiles.forEach((file) => form.append('files', file));
        await api.post('/questions/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onSaved(question ? 'Đã cập nhật thông tin câu hỏi thành công!' : 'Đã tạo thành công câu hỏi mới vào ngân hàng!');
      onClose();
    } catch (err: any) {
      setToastError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu câu hỏi.');
    }
  };

  const onInvalid = (fieldErrors: any) => {
    let msg = 'Vui lòng kiểm tra lại các trường thông tin còn thiếu.';
    if (fieldErrors.subjectId?.message) {
      msg = fieldErrors.subjectId.message;
    } else if (fieldErrors.content?.message) {
      msg = fieldErrors.content.message;
    } else if (fieldErrors.options?.message) {
      msg = fieldErrors.options.message;
    } else if (fieldErrors.options?.root?.message) {
      msg = fieldErrors.options.root.message;
    } else if (fieldErrors.score?.message) {
      msg = fieldErrors.score.message;
    } else if (fieldErrors.fillBlankAnswers) {
      msg = 'Vui lòng cấu hình đầy đủ đáp án cho các ô điền khuyết.';
    }
    setToastError(msg);
  };

  return (
    <>
      <Modal isOpen={open} onClose={onClose} title={question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'} size="2xl">
        <form onSubmit={handleSubmit(submit, onInvalid)} className="space-y-4">
          {/* Thuộc tính cơ bản câu hỏi */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* Môn */}
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">
                Môn học / Học phần <span className="text-rose-500">*</span>
              </label>
              <FilterSelect fullWidth {...register('subjectId', { valueAsNumber: true })} className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-medium text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName}
                  </option>
                ))}
              </FilterSelect>
            </div>

            {/* Loại câu hỏi */}
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">
                Loại câu hỏi <span className="text-rose-500">*</span>
              </label>
              <FilterSelect fullWidth {...register('type')} className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-medium text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </FilterSelect>
            </div>

            {/* Độ khó */}
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">
                Mức độ khó <span className="text-rose-500">*</span>
              </label>
              <FilterSelect fullWidth {...register('difficulty')} className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-medium text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </FilterSelect>
            </div>

            {/* Mức độ Bloom */}
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">
                Mức độ tư duy (Bloom) <span className="text-rose-500">*</span>
              </label>
              <FilterSelect fullWidth {...register('bloomLevel')} className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-medium text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                {Object.entries(BLOOM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </FilterSelect>
            </div>

            {/* Điểm số */}
            <div className="md:col-span-2">
              <label className="block text-type-body font-medium text-slate-500 mb-1">
                Điểm số mặc định câu hỏi <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.25"
                {...register('score', { valueAsNumber: true })}
                placeholder="Điểm số câu hỏi (ví dụ: 0.25)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body font-medium text-blue-700 focus:border-blue-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Nội dung câu hỏi */}
          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">
              Nội dung câu hỏi <span className="text-rose-500">*</span>
            </label>
            <input type="hidden" {...register('content')} />
            <RichQuestionEditor
              value={watch('contentRich')}
              fallback={watch('content')}
              onFiles={(files) => addMediaFiles(files)}
              onChange={(html) => {
                setValue('contentRich', { html }, { shouldDirty: true });
                const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                const hasMedia = html.includes('<img') || html.includes('<video') || html.includes('<audio') || mediaFiles.length > 0;
                setValue('content', plain || (hasMedia ? '[Hình ảnh / Media]' : ''), { shouldValidate: true });
              }}
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Media Upload Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="block text-type-body font-medium text-slate-500">
                Tệp đính kèm đa phương tiện (Hình ảnh, Video, Audio)
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-type-body font-medium rounded-xl transition">
                <span>+ Thêm tệp</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      addMediaFiles(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {/* Danh sách media đã upload trước đó */}
            {existingMedia.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-type-helper font-medium text-slate-400">Tệp hiện có trên hệ thống:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {existingMedia.map((m, idx) => (
                    <div key={m.id || idx} className="relative group flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {(m.mimeType?.startsWith('image/') || (m as any).mediaType === 'IMAGE') && <DynamicImage src={getImageUrl(m.url)} alt={m.fileName} className="w-10 h-10 object-cover rounded-xl shrink-0" />}
                      {(m.mimeType?.startsWith('video/') || (m as any).mediaType === 'VIDEO') && <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0"><Video className="w-5 h-5 text-slate-500" /></div>}
                      {(m.mimeType?.startsWith('audio/') || (m as any).mediaType === 'AUDIO') && <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0"><Volume2 className="w-5 h-5 text-slate-500" /></div>}
                      <span className="text-type-helper text-slate-700 truncate flex-1 font-medium">{m.fileName}</span>
                      {m.id && (
                        <button
                          type="button"
                          onClick={() => removeExistingMedia(m.id!)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                          title="Xóa tệp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danh sách tệp mới chuẩn bị upload */}
            {mediaFiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-type-helper font-medium text-blue-600">Tệp mới sẽ được tải lên:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mediaFiles.map((f, i) => (
                    <div key={i} className="relative group flex items-center gap-2 p-2 bg-blue-50/60 border border-blue-200 rounded-xl">
                      {f.type.startsWith('image/') && <DynamicImage src={mediaUrls[i] || ''} alt={f.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />}
                      {f.type.startsWith('video/') && <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0"><Video className="w-5 h-5 text-blue-600" /></div>}
                      {f.type.startsWith('audio/') && <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0"><Volume2 className="w-5 h-5 text-blue-600" /></div>}
                      <span className="text-type-helper text-blue-900 truncate flex-1 font-medium">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(i)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        title="Hủy tệp này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Đáp án trắc nghiệm */}
          {(type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-type-body font-medium text-slate-500">
                  Danh sách đáp án lựa chọn <span className="text-rose-500">*</span>
                </label>
                {type !== 'TRUE_FALSE' && (
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
                    className="text-type-helper font-semibold text-blue-600 hover:underline"
                  >
                    + Thêm phương án
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE') {
                          fields.forEach((_, idx) => setValue(`options.${idx}.isCorrect`, idx === i));
                        } else {
                          setValue(`options.${i}.isCorrect`, !watch(`options.${i}.isCorrect`));
                        }
                      }}
                      className={`w-7 h-7 rounded-xl font-medium text-type-helper flex items-center justify-center transition border ${watch(`options.${i}.isCorrect`)
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      title={watch(`options.${i}.isCorrect`) ? 'Đáp án Đúng' : 'Đánh dấu là đáp án Đúng'}
                    >
                      {f.label}
                    </button>
                    <input
                      {...register(`options.${i}.content`)}
                      placeholder={`Nội dung lựa chọn ${f.label}...`}
                      className="flex-1 rounded-xl border border-slate-200 px-3.5 py-1.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
                    />
                    {type !== 'TRUE_FALSE' && fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 font-semibold cursor-pointer rounded-xl hover:bg-rose-50"
                        title="Xóa lựa chọn này"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.options?.message && (
                <p className="text-type-helper font-semibold text-rose-600 dark:text-rose-400 pt-1">
                  * {errors.options.message}
                </p>
              )}
            </div>
          )}

          {/* Điền khuyết */}
          {type === 'FILL_BLANK' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-type-body font-medium text-slate-500">
                  Cấu hình các ô điền khuyết
                </label>
              </div>
              <div className="space-y-2">
                {fillBlankFields.fields.map((f, i) => (
                  <div key={f.id} className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-type-helper font-semibold text-slate-700">Ô trống #{watch(`fillBlankAnswers.${i}.blankIndex`) || i + 1}</span>
                      <button
                        type="button"
                        onClick={() => fillBlankFields.remove(i)}
                        className="text-type-helper font-semibold text-rose-600 hover:underline"
                      >
                        Xóa ô này
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-type-body font-medium text-slate-500 mb-0.5">Đáp án chính xác *</label>
                        <input
                          {...register(`fillBlankAnswers.${i}.answer`)}
                          placeholder="Ví dụ: photosynthesis"
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-type-body font-normal text-slate-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-type-body font-medium text-slate-500 mb-0.5">Điểm số cho ô này *</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(`fillBlankAnswers.${i}.score`, { valueAsNumber: true })}
                          placeholder="Điểm (VD: 0.25)"
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-type-body font-normal text-blue-700 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => {
                const index = fillBlankFields.fields.length + 1;
                fillBlankFields.append({ blankIndex: index, answer: '', score: 0.25, acceptedAnswersText: '' });
                const raw = watch('contentRich')?.html || '';
                if (!raw.includes(`{{blank_${index}}}`)) setValue('contentRich', { html: `${raw}${raw ? ' ' : ''}{{blank_${index}}}` });
              }} className="text-type-helper font-semibold text-blue-600 hover:underline">+ Thêm chỗ trống</button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Từ khóa tìm kiếm (Tùy chọn)</label>
              <input
                {...register('keywords')}
                placeholder="Ví dụ: RSA, ma hoa, security..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Giải thích đáp án (Tùy chọn)</label>
              <textarea
                {...register('explanation')}
                rows={2}
                placeholder="Giải thích lý do đáp án đúng..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="primary" size="md">
              Lưu câu hỏi
            </Button>
          </div>
        </form>
      </Modal>
      {toastError && <Toast message={toastError} type="error" onClose={() => setToastError(null)} />}
    </>
  );
}
