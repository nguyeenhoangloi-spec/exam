'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  KeyRound,
  Download,
  Printer,
  RotateCcw,
  Award,
  Search,
  CheckCircle2,
  CalendarDays,
  Clock,
  HelpCircle,
  FileText,
  Volume2,
  Maximize2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ExamPaper } from '../../types';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { getImageUrl } from '../../lib/media-utils';
import { DynamicImage } from '../ui/DynamicImage';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { printExamPaper, getPublishedTemplatesMap } from '../../lib/export-print';
import { StatusBadge } from '../common/StatusBadge';
import { FillBlankInlineContent } from '../../lib/fill-blank-helper';

export interface ExamPaperDetailDrawerProps {
  paper: ExamPaper | null;
  isOpen: boolean;
  onClose: () => void;
  showAnswers: boolean;
  onToggleShowAnswers: () => void;
  onExportWord: (paper: any, showAnswers: boolean) => void;
  onSwapQuestion?: (index: number, question: any) => void;
  onRubric?: (rubricData: { id: number; code?: string; content?: string; score?: number }) => void;
  onPublish?: (paper: ExamPaper) => void;
  onArchive?: (paper: ExamPaper) => void;
  currentUserRole?: string;
  busyId?: number | null;
}

function questionChoices(q: any) {
  let opts = q.options;
  if (typeof opts === 'string') {
    try {
      opts = JSON.parse(opts);
    } catch {
      opts = [];
    }
  }
  if (Array.isArray(opts) && opts.length > 0) {
    return opts
      .map((option: any, index: number) => ({
        label: option.label || String.fromCharCode(65 + index),
        text: option.content || option.text || option.answer || '',
        isCorrect: Boolean(option.isCorrect),
      }))
      .filter((option: any) => option.text);
  }
  return [
    { label: 'A', text: q.optionA, isCorrect: q.correctAnswer === 'A' },
    { label: 'B', text: q.optionB, isCorrect: q.correctAnswer === 'B' },
    { label: 'C', text: q.optionC, isCorrect: q.correctAnswer === 'C' },
    { label: 'D', text: q.optionD, isCorrect: q.correctAnswer === 'D' },
  ].filter((option) => option.text);
}

function getDifficultyLabel(diff?: string) {
  switch (diff?.toUpperCase()) {
    case 'EASY':
      return { text: 'Dễ', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60' };
    case 'HARD':
      return { text: 'Khó', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60' };
    case 'MEDIUM':
    default:
      return { text: 'Trung bình', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60' };
  }
}

function getTypeLabel(type?: string) {
  switch (type?.toUpperCase()) {
    case 'ESSAY':
      return 'Tự luận';
    case 'FILL_BLANK':
      return 'Điền khuyết';
    case 'TRUE_FALSE':
      return 'Đúng/Sai';
    default:
      return 'Trắc nghiệm';
  }
}

export function ExamPaperDetailDrawer({
  paper,
  isOpen,
  onClose,
  showAnswers,
  onToggleShowAnswers,
  onExportWord,
  onSwapQuestion,
  onRubric,
  onPublish,
  onArchive,
  currentUserRole,
  busyId,
}: ExamPaperDetailDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setIsSearchOpen(false);
      setActiveFilter('ALL');
      setLightboxUrl(null);
    }
  }, [isOpen, paper?.id]);

  const rawQuestions: any[] = useMemo(() => {
    if (!paper) return [];
    return ((paper as any).details || paper.questions || (paper as any).paperDetails || []);
  }, [paper]);

  const questionCount = rawQuestions.length;

  const difficultyCount = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    rawQuestions.forEach((item) => {
      const q = item.question || item;
      const diff = q.difficulty?.toUpperCase();
      if (diff === 'EASY') easy++;
      else if (diff === 'HARD') hard++;
      else medium++;
    });
    return { easy, medium, hard };
  }, [rawQuestions]);

  const filteredQuestions = useMemo(() => {
    return rawQuestions.map((item, originalIndex) => ({ detail: item, originalIndex })).filter(({ detail }) => {
      const q = detail.question || detail;
      const contentMatch = !searchTerm.trim() || q.content?.toLowerCase().includes(searchTerm.toLowerCase()) || q.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const difficultyMatch = activeFilter === 'ALL' || q.difficulty?.toUpperCase() === activeFilter;
      return contentMatch && difficultyMatch;
    });
  }, [rawQuestions, searchTerm, activeFilter]);

  if (!paper) return null;

  const subjectName = (paper as any).subjectName || (paper.examSchedule as any)?.subjectName || (paper.examSchedule?.subject as any)?.subjectName || 'Môn thi';
  const periodName = (paper.examSchedule as any)?.periodName || (paper.examSchedule as any)?.examPeriod?.name || 'Kỳ thi chính thức';
  const isBusy = busyId === Number(paper.id);

  return (
    <div role="dialog" aria-modal="true" aria-label="Chi tiết đề thi" className={`fixed inset-0 z-[100] overflow-hidden ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-[101] w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform pointer-events-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-type-card font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  {subjectName}
                </h2>
                {(() => {
                  const match = (paper.title || '').match(/Bộ\s*(\d+)\s*mã/i);
                  const variantCount = match ? parseInt(match[1], 10) : ((paper as any).variantCount || 1);
                  const baseNum = parseInt((paper.paperCode || '').replace(/\D/g, ''), 10);
                  const rangeText = !isNaN(baseNum) && variantCount > 1 ? `${baseNum} – ${baseNum + variantCount - 1}` : paper.paperCode;
                  return <IdentifierBadge tone="blue">#{rangeText}</IdentifierBadge>;
                })()}
                <StatusBadge status={paper.status} />
              </div>

              <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 truncate">
                {periodName ? `${periodName} · ` : ''}{questionCount} câu · {paper.totalScore}đ · {paper.durationMinutes} phút
                {((paper as any).mediaMaxPlays || (paper as any).mediaMode) && (
                  <span> · {(paper as any).mediaMode === 'REFERENCE' || (paper as any).mediaMaxPlays === 0 ? 'Media tự do' : `Khảo thí: ${(paper as any).mediaMaxPlays || 2} lượt`}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onToggleShowAnswers}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-type-helper font-semibold transition cursor-pointer ${
                  showAnswers
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
              >
                {showAnswers ? <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <EyeOff className="h-4 w-4" />}
                <span>Đáp án</span>
              </button>

              <button
                type="button"
                onClick={() => onExportWord(paper, showAnswers)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tải file Word / In đề thi"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Question Body List (Hiển thị thẳng danh sách câu hỏi) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
          {rawQuestions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-type-body-sm font-semibold text-slate-700 dark:text-slate-300">Đề thi chưa có câu hỏi nào</p>
            </div>
          ) : (
            rawQuestions.map((detail, originalIndex) => {
              const q = detail.question || detail;
              const choices = questionChoices(q);
              const diffBadge = getDifficultyLabel(q.difficulty);
              const typeLabel = getTypeLabel(q.type);
              const score = detail.score || (paper.totalScore / (questionCount || 1)).toFixed(2);
              const answerText = q.correctAnswer || q.sampleAnswer || q.explanation || q.answer || q.solution || '';

              return (
                <div
                  key={detail.id || originalIndex}
                  className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="flex h-6.5 items-center px-3 rounded-xl text-type-helper font-semibold bg-blue-600 text-white shadow-2xs">
                        Câu {originalIndex + 1}
                      </span>
                      <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                        {typeLabel}
                      </span>
                      <span className={`px-2.5 py-0.5 ui-pill rounded-full text-type-helper font-medium border ${diffBadge.color}`}>
                        {diffBadge.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2.5 py-1 ui-pill rounded-full text-type-helper font-medium text-slate-800 dark:text-slate-200">
                        {score}đ
                      </span>

                      {/* Action buttons (Đổi câu / Rubric) */}
                      {paper.status === 'DRAFT' && onSwapQuestion && (
                        <button
                          type="button"
                          onClick={() => onSwapQuestion(originalIndex, q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-type-helper font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                          title="Đổi câu hỏi ngẫu nhiên tương đương từ Ngân hàng đề"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Đổi câu</span>
                        </button>
                      )}

                      {q.type === 'ESSAY' && onRubric && (
                        <button
                          type="button"
                          onClick={() =>
                            onRubric({
                              id: Number(q.id || detail.questionId || detail.id || 0),
                              code: q.code || `Câu ${originalIndex + 1}`,
                              content: q.content,
                              score: detail.score || 1,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-type-helper font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                          title="Cấu hình thang điểm chi tiết (Rubric)"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Rubric</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-type-body font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words pl-0.5">
                    <FillBlankInlineContent
                      content={q.content}
                      fillBlankAnswers={q.fillBlankAnswers || (q as any).answers}
                      showAnswers={showAnswers}
                    />
                  </div>

                  {/* Media đính kèm (Ảnh / Video / Audio) */}
                  {(() => {
                    const questionMedia = Array.isArray(q.media) && q.media.length > 0
                      ? q.media
                      : Array.isArray((detail as any)?.media) && (detail as any)?.media.length > 0
                        ? (detail as any)?.media
                        : [];
                    if (questionMedia.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {questionMedia.map((media: any) => {
                          const fullUrl = getImageUrl(media.url);
                          const mime: string = media.mimeType || '';
                          const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(media.url);
                          const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(media.url);

                          if (isVid || isAud) {
                            return (
                              <div key={media.id || media.url} className="w-full max-w-lg">
                                <QuestionMediaPlayer
                                  src={fullUrl}
                                  type={isVid ? 'video' : 'audio'}
                                  fileName={media.fileName}
                                  maxPlays={(paper as any).mediaMode === 'REFERENCE' || (paper as any).mediaMaxPlays === 0 ? 0 : ((paper as any).mediaMaxPlays || 2)}
                                  mode={(paper as any).mediaMode === 'REFERENCE' || (paper as any).mediaMaxPlays === 0 ? 'REFERENCE' : 'STRICT_EXAM'}
                                />
                              </div>
                            );
                          }
                          return (
                            <div
                              key={media.id || media.url}
                              onClick={() => setLightboxUrl(media.url)}
                              className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                              title="Bấm để xem ảnh phóng to"
                            >
                              <DynamicImage
                                src={fullUrl}
                                alt={media.altText || media.fileName}
                                className="max-h-48 max-w-full rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                              />
                              <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Bấm để xem ảnh phóng to">
                                <Maximize2 className="h-4.5 w-4.5 text-white" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Multiple Choice Options (A, B, C, D) */}
                  {choices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-type-body pt-1">
                      {choices.map((c) => {
                        const isCorrect = c.isCorrect;
                        const isHighlighted = showAnswers && isCorrect;

                        return (
                          <div
                            key={c.label}
                            className={`rounded-xl p-3 px-3.5 transition flex items-start gap-3 border ${isHighlighted
                                ? 'border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 shadow-2xs font-semibold'
                                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-medium'
                              }`}
                          >
                            <span
                              className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-xl text-type-helper font-semibold ${isHighlighted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                                }`}
                            >
                              {c.label}
                            </span>
                            <span className="flex-1 min-w-0 break-words leading-relaxed pt-0.5">{c.text}</span>
                            {isHighlighted && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-type-helper pt-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : q.type === 'FILL_BLANK' ? (
                    /* Điền khuyết */
                    <div className="text-type-body pt-1 space-y-2">
                      {showAnswers ? (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 space-y-2 text-emerald-900 dark:text-emerald-200">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-type-helper flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đáp án chính xác cho các chỗ trống:
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(q.fillBlankAnswers || (q as any).answers || []).length > 0 ? (
                              (q.fillBlankAnswers || (q as any).answers).map((ans: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="rounded-xl bg-emerald-100/90 dark:bg-emerald-900/60 px-3 py-1.5 text-type-helper font-semibold text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                                >
                                  Ô #{ans.blankIndex || idx + 1}: {ans.answer || ans.text || 'đáp án đúng'} {ans.score ? `(${ans.score}đ)` : ''}
                                </span>
                              ))
                            ) : (
                              <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400 italic">
                                Dữ liệu đáp án điền khuyết theo cú pháp {'{{blank_1}}'} trong câu hỏi.
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-type-helper italic font-medium text-slate-400 pl-0.5">
                          (Nhấn &quot;Hiện đáp án&quot; phía trên để xem đáp án các ô điền khuyết)
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Tự luận */
                    <div className="text-type-body pt-1 space-y-2">
                      {showAnswers ? (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 space-y-2 text-emerald-900 dark:text-emerald-200">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-type-helper flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gợi ý Đáp án &amp; Thang điểm Tự luận:
                          </p>
                          <p className="font-medium whitespace-pre-wrap leading-relaxed">
                            {answerText || 'Chưa có đáp án mẫu hoặc hướng dẫn chấm cho câu hỏi này.'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-type-helper italic font-medium text-slate-400 pl-0.5">
                          (Nhấn &quot;Hiện đáp án&quot; phía trên để xem đáp án gợi ý &amp; thang điểm)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── 4. Sticky Action Footer ── */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 px-6 py-4 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Đóng
          </Button>

          {paper.status === 'DRAFT' && (currentUserRole === 'ADMIN' || currentUserRole === 'TEACHER') && onPublish && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onPublish(paper)}
              disabled={isBusy}
              isLoading={isBusy}
            >
              Phát hành
            </Button>
          )}

          {paper.status === 'PUBLISHED' && currentUserRole === 'ADMIN' && onArchive && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onArchive(paper)}
              disabled={isBusy}
              isLoading={isBusy}
            >
              Lưu trữ
            </Button>
          )}
        </div>
      </div>

      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  );
}
