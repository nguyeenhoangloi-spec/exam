'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Loader2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../Modal';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { DynamicImage } from '../ui/DynamicImage';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { getImageUrl } from '../../lib/media-utils';

interface RubricCriterion {
  id?: string;
  label: string;
  description?: string;
  fullCreditGuide?: string;
  partialCreditGuide?: string;
  zeroCreditGuide?: string;
  acceptedConcepts?: string;
  commonMistakes?: string;
  maxScore: number;
  sortOrder?: number;
}

interface RubricViewerModalProps {
  isOpen: boolean;
  question: {
    id: string;
    questionId?: string;
    code?: string;
    content?: string;
    media?: any[];
    score?: number;
    sampleAnswer?: string;
    explanation?: string;
    correctAnswer?: string;
    rubric?: RubricCriterion[];
  } | null;
  onClose: () => void;
}

export function RubricViewerModal({ isOpen, question, onClose }: RubricViewerModalProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [fetchedAnswer, setFetchedAnswer] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !question) return;

    const qId = question.id || question.questionId;
    const initialAnswer = question.sampleAnswer || question.explanation || question.correctAnswer || '';
    setFetchedAnswer(initialAnswer);

    if (question.rubric && question.rubric.length > 0) {
      setCriteria(question.rubric);
    }

    if (qId) {
      setLoading(true);
      Promise.all([
        (!question.rubric || question.rubric.length === 0)
          ? api.get(`/essay/questions/${qId}/rubric`).catch(() => null)
          : Promise.resolve(null),
        !initialAnswer
          ? api.get(`/questions/${qId}`).catch(() => null)
          : Promise.resolve(null),
      ])
        .then(([rubricRes, qRes]) => {
          if (rubricRes?.data && Array.isArray(rubricRes.data)) {
            setCriteria(rubricRes.data);
          }
          if (qRes?.data) {
            const ans = qRes.data.explanation || qRes.data.sampleAnswer || qRes.data.correctAnswer || '';
            if (ans) setFetchedAnswer(ans);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, question]);

  if (!isOpen || !question) return null;

  const sampleAns = (fetchedAnswer || question.sampleAnswer || question.explanation || question.correctAnswer || '').trim();
  const totalRubricScore = criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Đáp án & ba-rem chấm"
      subtitle={
        question.code
          ? `Câu ${question.code}, điểm tối đa: ${question.score || totalRubricScore || 0} điểm`
          : `Điểm tối đa: ${question.score || totalRubricScore || 0} điểm`
      }
    >
      <div className="space-y-4">
        {/* Đề bài câu hỏi */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
            <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Đề bài câu hỏi
            </h4>
          </div>
          <p className="text-type-body leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
            {question.content}
          </p>
          {Array.isArray(question.media) && question.media.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {question.media.map((mediaItem: any, mIdx: number) => {
                const fullUrl = getImageUrl(mediaItem.url);
                const mime: string = mediaItem.mimeType || '';
                const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(mediaItem.url);
                const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(mediaItem.url);

                if (isVid) {
                  return (
                    <div key={mediaItem.id || mIdx} className="w-full max-w-lg">
                      <QuestionMediaPlayer
                        src={fullUrl}
                        type="video"
                        fileName={mediaItem.fileName}
                        maxPlays={0}
                        mode="REFERENCE"
                      />
                    </div>
                  );
                }

                if (isAud) {
                  return (
                    <div key={mediaItem.id || mIdx} className="w-full max-w-lg">
                      <QuestionMediaPlayer
                        src={fullUrl}
                        type="audio"
                        fileName={mediaItem.fileName}
                        maxPlays={0}
                        mode="REFERENCE"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={mediaItem.id || mIdx}
                    onClick={() => setLightboxUrl(mediaItem.url)}
                    className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                    title="Bấm để xem ảnh phóng to"
                  >
                    <DynamicImage
                      src={fullUrl}
                      alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                      className="max-h-44 rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Bấm để xem ảnh phóng to">
                      <Maximize2 className="h-4.5 w-4.5 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Đáp án mẫu / Hướng dẫn giải */}
        <div className="space-y-2 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
            <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Đáp án mẫu & Hướng dẫn giải
            </h4>
          </div>
          {sampleAns ? (
            <p className="text-type-body leading-relaxed text-slate-800 dark:text-slate-200 font-normal whitespace-pre-wrap">
              {sampleAns}
            </p>
          ) : (
            <p className="text-type-body-sm text-slate-400 italic">
              Chưa có văn bản đáp án mẫu trong ngân hàng câu hỏi.
            </p>
          )}
        </div>

        {/* Tiêu chí chấm điểm chi tiết */}
        <div className="space-y-2 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
              <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                Tiêu chí chấm điểm chi tiết ({criteria.length > 0 ? criteria.length : 1})
              </h4>
            </div>
            <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              Tổng: {question.score || totalRubricScore || 0}đ
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          ) : criteria.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {criteria.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="py-3 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-type-helper">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                        {c.label}
                      </span>
                    </div>

                    {c.description && (
                      <p className="text-type-body-sm text-slate-500 dark:text-slate-400 leading-relaxed pl-7.5">
                        {c.description}
                      </p>
                    )}

                    {(c.fullCreditGuide || c.partialCreditGuide || c.zeroCreditGuide) && (
                      <div className="text-type-helper space-y-0.5 pt-1 text-slate-500 pl-7.5 font-normal">
                        {c.fullCreditGuide && (
                          <div>- <span className="font-medium text-emerald-600 dark:text-emerald-400">Đạt tối đa:</span> {c.fullCreditGuide}</div>
                        )}
                        {c.partialCreditGuide && (
                          <div>- <span className="font-medium text-amber-600 dark:text-amber-400">Đạt một phần:</span> {c.partialCreditGuide}</div>
                        )}
                        {c.zeroCreditGuide && (
                          <div>- <span className="font-medium text-rose-600 dark:text-rose-400">Không đạt:</span> {c.zeroCreditGuide}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-0.5 text-right">
                    <span className="font-semibold text-type-body-sm text-blue-600 dark:text-blue-400 tabular-nums">
                      {c.maxScore}đ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2.5 text-type-body-sm text-slate-500 italic">
              Chưa bóc tách tiêu chí chi tiết (Hệ thống áp dụng 1 tiêu chí mặc định toàn vẹn {question.score || 0}đ).
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>

      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </Modal>
  );
}
