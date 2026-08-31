'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Question } from '../../types';
import api from '../../lib/api';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { VideoLightboxModal } from '../VideoLightboxModal';
import { RubricDialog } from './RubricDialog';
import { Maximize2, CheckCircle2, User, Calendar, BookOpen, Layers, HelpCircle, Award, Brain, Sliders } from 'lucide-react';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { DynamicImage } from '../ui/DynamicImage';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { DetailDrawer } from '../ui/DetailDrawer';

export function QuestionDetailDialog({
  question,
  onClose,
  onRubricSaved,
}: {
  question: Question | null;
  onClose: () => void;
  onRubricSaved?: () => void;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [videoLightbox, setVideoLightbox] = useState<{ url: string; fileName?: string } | null>(null);
  const [rubricOpen, setRubricOpen] = useState(false);
  const [rubrics, setRubrics] = useState<any[]>([]);

  const fetchRubrics = useCallback(async (qid: number | string) => {
    try {
      const res = await api.get(`/essay/questions/${qid}/rubric`);
      setRubrics(res.data || []);
    } catch {
      setRubrics([]);
    }
  }, []);

  useEffect(() => {
    if (question?.type === 'ESSAY') {
      void fetchRubrics(question.id);
    } else {
      setRubrics([]);
    }
  }, [question, fetchRubrics]);

  const rich = question?.contentRich && typeof question.contentRich === 'object' && 'html' in question.contentRich ? String((question.contentRich as { html?: string }).html || '') : '';
  const codeText = question ? (question.code || `QH${String(question.id).slice(-5).toUpperCase()}`) : '';

  const creatorName = question
    ? question.createdByName ||
    (question.createdBy as any)?.teacher?.fullName ||
    question.createdBy?.fullName ||
    question.createdBy?.username ||
    (question.createdById ? `User #${question.createdById}` : 'Hệ thống')
    : '';

  const scoreText = question?.score !== undefined && question?.score !== null ? `${question.score} điểm` : '1.0 điểm';
  const topicText = question ? ((question as any).topic || (question as any).chapter?.chapterName || 'Chưa phân loại') : '';

  return (
    <>
      <DetailDrawer
        isOpen={Boolean(question)}
        onClose={onClose}
        title="Chi tiết câu hỏi"
        subtitle={
          question?.subject?.subjectName
            ? `Môn học: ${question.subject.subjectName}`
            : undefined
        }
        badge={
          codeText ? (
            <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
          ) : undefined
        }
        avatarIcon={<HelpCircle className="h-6 w-6 text-white" />}
        maxWidth="max-w-[620px]"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Đóng
            </Button>
            {question?.type === 'ESSAY' && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Sliders className="h-4 w-4" />}
                onClick={() => setRubricOpen(true)}
              >
                Cấu hình Rubric
              </Button>
            )}
          </div>
        }
      >
        {question && (
          <div className="space-y-6">
            {/* Section 1: Nội dung câu hỏi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Nội dung câu hỏi
                  </h3>
                </div>
                <QuestionStatusBadge status={question.status || 'APPROVED'} />
              </div>

              <div className="text-type-body font-medium text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                {rich ? <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(rich) }} /> : question.content}
              </div>
            </div>

            {/* Section 2: Media Attachments (if available) */}
            {question.media?.length ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Media đính kèm
                  </h3>
                </div>

                <div className="flex flex-wrap gap-3">
                  {question.media.map((media) => {
                    const fullUrl = getImageUrl(media.url);
                    const mime: string = (media as any).mimeType || '';
                    const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(media.url);
                    const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(media.url);

                    if (isVid || isAud) {
                      return (
                        <div key={media.id || media.url} className="w-full max-w-lg">
                          <QuestionMediaPlayer
                            src={fullUrl}
                            type={isVid ? 'video' : 'audio'}
                            fileName={media.fileName}
                            maxPlays={0}
                            mode="REFERENCE"
                          />
                        </div>
                      );
                    }
                    return (
                      <div
                        key={media.id || media.url}
                        role="button"
                        tabIndex={0}
                        onClick={() => setLightboxUrl(media.url)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setLightboxUrl(media.url);
                          }
                        }}
                        className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                        title="Bấm để xem phóng to"
                      >
                        <DynamicImage
                          src={fullUrl}
                          alt={media.altText || media.fileName}
                          className="max-h-48 max-w-full rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Bấm để xem phóng to">
                          <Maximize2 className="h-4.5 w-4.5 text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Section 3: Đáp án trắc nghiệm (cho câu hỏi MULTIPLE_CHOICE) */}
            {question.type === 'MULTIPLE_CHOICE' && question.options && question.options.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Phương án lựa chọn ({question.options.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {question.options.map((opt, idx) => {
                    const isCorrect = opt.isCorrect;
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={opt.id || idx}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${isCorrect
                            ? 'border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                          }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-semibold text-type-helper transition ${isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          {letter}
                        </span>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className={`text-type-body-sm font-medium leading-relaxed ${isCorrect ? 'text-emerald-900 dark:text-emerald-200 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {opt.content}
                          </p>
                        </div>

                        {isCorrect && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-type-helper font-semibold shrink-0 pt-0.5">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Đáp án đúng</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 4: Tiêu chí chấm điểm Rubric (cho câu hỏi ESSAY) */}
            {question.type === 'ESSAY' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                    <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                      Tiêu chí chấm điểm Rubric ({rubrics.length})
                    </h3>
                  </div>
                </div>

                {rubrics.length === 0 ? (
                  <div className="py-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                    <Sliders className="h-7 w-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-type-body-sm font-medium text-slate-500">Chưa cấu hình Rubric cho câu hỏi tự luận này.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {rubrics.map((r, i) => (
                      <div
                        key={r.id || i}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white text-type-body-sm">
                            {i + 1}. {r.criteriaName || r.name || 'Tiêu chí'}
                          </span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 text-type-helper tabular-nums bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
                            {r.maxScore ?? r.score} điểm
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-type-helper text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            {r.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section 5: Lời giải chi tiết / Hướng dẫn chấm */}
            {question.explanation && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-emerald-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Hướng dẫn giải / Đáp án chi tiết
                  </h3>
                </div>

                <div className="rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 p-4 text-type-body-sm font-medium text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  {question.explanation}
                </div>
              </div>
            )}

            {/* Section 6: Bảng thông số thuộc tính câu hỏi */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                  Thuộc tính kỹ thuật
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  { label: 'Loại câu hỏi', value: <QuestionTypeBadge type={question.type} />, icon: Layers },
                  { label: 'Độ khó', value: <QuestionDifficultyBadge difficulty={question.difficulty} />, icon: Brain },
                  { label: 'Điểm số mặc định', value: scoreText, icon: Award },
                  { label: 'Chủ đề / Bài học', value: topicText, icon: BookOpen },
                  { label: 'Người tạo', value: creatorName, icon: User },
                  { label: 'Ngày khởi tạo', value: question.createdAt ? new Date(question.createdAt).toLocaleDateString('vi-VN') : '---', icon: Calendar },
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <div
                      key={r.label}
                      className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group"
                    >
                      <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-type-body font-semibold shrink-0">
                        {Icon && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <span>{r.label}</span>
                      </span>

                      <span className="font-semibold text-slate-900 dark:text-white text-right text-type-body leading-snug break-words max-w-[62%]">
                        {r.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Lightbox Modals */}
      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          altText={`Hình minh họa câu hỏi mã ${question?.code}`}
          onClose={() => setLightboxUrl(null)}
        />
      )}
      {videoLightbox && (
        <VideoLightboxModal
          videoUrl={videoLightbox.url}
          fileName={videoLightbox.fileName}
          onClose={() => setVideoLightbox(null)}
        />
      )}

      {/* Rubric Dialog */}
      {rubricOpen && question && (
        <RubricDialog
          isOpen={rubricOpen}
          question={question}
          onClose={() => setRubricOpen(false)}
          onSuccess={() => {
            void fetchRubrics(question.id);
            onRubricSaved?.();
          }}
        />
      )}
    </>
  );
}
