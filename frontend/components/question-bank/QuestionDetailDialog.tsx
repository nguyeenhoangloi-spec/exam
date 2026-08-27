import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Question } from '../../types';
import api from '../../lib/api';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { VideoLightboxModal } from '../VideoLightboxModal';
import { RubricDialog } from './RubricDialog';
import { Maximize2, X, CheckCircle2, FileText, User, Calendar, BookOpen, Layers, HelpCircle, Hash, Award, Brain, Sliders } from 'lucide-react';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { DynamicImage } from '../ui/DynamicImage';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';

export function QuestionDetailDialog({
  question,
  onClose,
  onRubricSaved,
}: {
  question: Question | null;
  onClose: () => void;
  onRubricSaved?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (question) {
      if (question.type === 'ESSAY') {
        void fetchRubrics(question.id);
      } else {
        setRubrics([]);
      }
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [question, fetchRubrics]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxUrl && !videoLightbox) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxUrl, videoLightbox, handleClose]);

  if (!question || !mounted) return null;

  const rich = question?.contentRich && typeof question.contentRich === 'object' && 'html' in question.contentRich ? String((question.contentRich as { html?: string }).html || '') : '';
  const codeText = question.code || `QH${question.id.slice(-5).toUpperCase()}`;

  const creatorName =
    question.createdByName ||
    (question.createdBy as any)?.teacher?.fullName ||
    question.createdBy?.fullName ||
    question.createdBy?.username ||
    (question.createdById ? `User #${question.createdById}` : 'Hệ thống');

  const getBloomLabel = (level?: string) => {
    if (level === 'REMEMBER') return 'Ghi nhớ';
    if (level === 'UNDERSTAND') return 'Thông hiểu';
    if (level === 'APPLY') return 'Vận dụng';
    if (level === 'ANALYZE') return 'Phân tích';
    return 'Thông hiểu';
  };

  const scoreText = question.score !== undefined && question.score !== null ? `${question.score} điểm` : '1.0 điểm';
  const topicText = (question as any).topic || (question as any).chapter?.chapterName || 'Chưa phân loại';

  const content = (
    <div role="dialog" aria-modal="true" aria-label="Chi tiết câu hỏi" className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop mờ nền */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

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

      {/* Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={`w-screen max-w-[620px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/60 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            visible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header — Tương phản cao, Phân cấp chuẩn mực */}
          <div className="relative bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/60 dark:border-slate-800 p-6 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Icon Squircle Thương hiệu */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-type-body shadow-sm shadow-blue-500/25 border border-blue-400/30">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white break-words">
                      Chi tiết câu hỏi
                    </h2>
                    <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                  </div>
                  <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Môn học: <strong className="font-semibold text-slate-900 dark:text-slate-100">{question.subject?.subjectName || 'Chưa phân loại'}</strong>
                  </p>
                </div>
              </div>

              {/* Nút Đóng */}
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Đóng chi tiết"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body — Black-forward Palette, Phẳng, Không khung lồng */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
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

            {/* Section 3: Danh sách đáp án */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                  Danh sách đáp án
                </h3>
              </div>

              {question.type === 'FILL_BLANK' ? (
                <div className="space-y-2.5">
                  {(() => {
                    const fbList =
                      Array.isArray(question.fillBlankAnswers) && question.fillBlankAnswers.length > 0
                        ? question.fillBlankAnswers
                        : Array.isArray((question as any).answers) && (question as any).answers.length > 0
                        ? (question as any).answers
                        : [];

                    if (!fbList.length) {
                      const matches = Array.from(question.content?.matchAll(/\{\{blank_(\d+)\}\}/g) || []);
                      if (matches.length > 0) {
                        return (
                          <div className="space-y-2">
                            {matches.map((m, idx) => (
                              <div
                                key={idx}
                                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 flex items-center justify-between gap-3"
                              >
                                <span className="ui-pill inline-flex items-center px-2.5 py-1 rounded-full text-blue-700 dark:text-blue-300 font-medium text-type-helper border border-blue-200/80 dark:border-blue-800">
                                  Ô trống #{m[1] || idx + 1}
                                </span>
                                <span className="text-type-helper text-slate-500 italic">Chưa thiết lập đáp án</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="text-type-body-sm text-slate-500 italic">Chưa có cấu hình đáp án điền khuyết.</p>;
                    }

                    return (
                      <div className="space-y-2.5">
                        {fbList.map((ans: any, idx: number) => {
                          const bIdx = ans.blankIndex || idx + 1;
                          const mainAns = ans.answer || ans.value || ans.content || '---';
                          let altList: string[] = [];
                          if (Array.isArray(ans.acceptedAnswers)) {
                            altList = ans.acceptedAnswers;
                          } else if (typeof ans.acceptedAnswers === 'string') {
                            try {
                              const parsed = JSON.parse(ans.acceptedAnswers);
                              if (Array.isArray(parsed)) altList = parsed;
                              else altList = ans.acceptedAnswers.split(',').map((s: string) => s.trim()).filter(Boolean);
                            } catch {
                              altList = ans.acceptedAnswers.split(',').map((s: string) => s.trim()).filter(Boolean);
                            }
                          }

                          return (
                            <div
                              key={ans.id || idx}
                              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 transition flex items-start gap-3"
                            >
                              <span className="ui-pill inline-flex items-center px-2.5 py-1 rounded-full text-blue-700 dark:text-blue-300 font-medium text-type-helper border border-blue-200/80 dark:border-blue-800 shrink-0">
                                Ô trống #{bIdx}
                              </span>

                              <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">Đáp án chính xác:</span>
                                  <span className="ui-pill inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-type-helper font-medium text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    {mainAns}
                                  </span>
                                  {ans.score !== undefined && (
                                    <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">
                                      ({ans.score} điểm)
                                    </span>
                                  )}
                                </div>

                                {altList.length > 0 && (
                                  <div className="text-type-helper text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-slate-500">Chấp nhận thêm:</span>
                                    {altList.map((alt, aIdx) => (
                                      <span
                                        key={aIdx}
                                        className="rounded bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.5 text-slate-800 dark:text-slate-200 font-medium"
                                      >
                                        {alt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : question.options && question.options.length > 0 ? (
                <div className="space-y-2.5">
                  {question.options.map((o) => (
                    <div
                      key={o.id || o.order}
                      className={`rounded-2xl border p-3.5 transition flex items-start gap-3 ${
                        o.isCorrect
                          ? 'border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-type-helper font-semibold ${
                          o.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                        }`}
                      >
                        {o.label}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5 text-type-body-sm">
                        <p className="font-medium text-slate-900 dark:text-white leading-relaxed">{o.content}</p>
                        {o.isCorrect && (
                          <span className="inline-flex items-center gap-1 text-type-helper font-semibold text-emerald-700 dark:text-emerald-400 mt-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Đáp án chính xác
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-type-body-sm text-slate-500 italic">Câu hỏi tự luận (không có đáp án trắc nghiệm chọn trước).</p>
              )}

              {question.explanation && (
                <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 p-4 text-type-body-sm text-slate-800 dark:text-slate-200 space-y-1.5">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-200">Giải thích đáp án / Hướng dẫn chấm:</h5>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{question.explanation}</p>
                </div>
              )}
            </div>

            {/* Section 3.5: Tiêu chí chấm Rubric (dạng phẳng ngăn cách bằng đường kẻ ngang) */}
            {question.type === 'ESSAY' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Tiêu chí chấm Rubric ({rubrics.length > 0 ? rubrics.length : 1})
                  </h3>
                </div>

                {rubrics.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {rubrics.map((r, i) => (
                      <div
                        key={r.id || i}
                        className="py-3 px-1 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 -mx-1 rounded-xl"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-type-helper">
                              {i + 1}
                            </span>
                            <span className="font-semibold text-type-body-sm text-slate-900 dark:text-slate-100">
                              {r.label}
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed pl-7.5">
                              {r.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 pt-0.5 text-right">
                          <span className="font-semibold text-type-body-sm text-blue-600 dark:text-blue-400 tabular-nums">
                            {rubrics.length === 1 && question.score ? question.score : r.maxScore}đ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-type-body-sm text-slate-500 italic">
                    Chưa bóc tách tiêu chí chi tiết (Đang áp dụng 1 tiêu chí mặc định toàn vẹn {scoreText}).
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Metadata thông tin chi tiết (Phẳng dạng divide-y) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                  Thông tin thuộc tính
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  { label: 'Mã câu hỏi', value: <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>, icon: Hash },
                  { label: 'Môn học', value: question.subject?.subjectName || 'Chưa gán', icon: BookOpen },
                  { label: 'Điểm số', value: <span className="text-blue-600 font-semibold">{scoreText}</span>, icon: Award },
                  { label: 'Độ khó', value: <QuestionDifficultyBadge difficulty={question.difficulty || 'MEDIUM'} />, icon: HelpCircle },
                  { label: 'Loại câu hỏi', value: <QuestionTypeBadge type={question.type || 'SINGLE_CHOICE'} />, icon: FileText },
                  { label: 'Mức độ tư duy', value: getBloomLabel(question.bloomLevel), icon: Brain },
                  { label: 'Chủ đề / Chương', value: topicText, icon: Layers },
                  { label: 'Người tạo', value: creatorName, icon: User },
                  { label: 'Ngày tạo', value: question.createdAt ? new Date(question.createdAt).toLocaleDateString('vi-VN') : '---', icon: Calendar },
                ].map((r, idx) => {
                  const Icon = r.icon;
                  return (
                    <div
                      key={idx}
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

          {/* Standard Footer with Primary Action */}
          <div className="border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={handleClose}
            >
              Đóng
            </Button>
            {question.type === 'ESSAY' && (
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
        </div>
      </div>

      {/* Rubric Dialog */}
      {rubricOpen && (
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
    </div>
  );

  return createPortal(content, document.body);
}
