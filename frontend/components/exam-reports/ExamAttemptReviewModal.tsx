'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  XCircle,
  Minus,
  FileText,
  AlertTriangle,
  Clock,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Maximize2,
} from 'lucide-react';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { DynamicImage } from '../ui/DynamicImage';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { getImageUrl } from '@/lib/media-utils';

interface ExamAttemptReviewModalProps {
  attemptId: string | null;
  onClose: () => void;
}

function OptionItem({
  label,
  text,
  isSelected,
  isCorrect,
  showAnswer,
}: {
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
  showAnswer: boolean;
}) {
  let containerCls = 'border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200';
  let badgeEl = null;

  if (showAnswer) {
    if (isSelected && isCorrect) {
      containerCls = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/30';
      badgeEl = (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
          title="Sinh viên đã chọn — Đúng"
        >
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    } else if (isSelected && !isCorrect) {
      containerCls = 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/30';
      badgeEl = (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400"
          title="Sinh viên đã chọn — Sai"
        >
          <XCircle className="w-4 h-4" />
        </span>
      );
    } else if (!isSelected && isCorrect) {
      containerCls = 'border-emerald-400 border-dashed bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
      badgeEl = (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
          title="Đáp án đúng"
        >
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    }
  } else if (isSelected) {
    containerCls = 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/30 font-semibold';
    badgeEl = (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400"
        title="Sinh viên đã chọn"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
      </span>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 sm:px-4 sm:py-3 text-type-body transition shadow-2xs ${containerCls}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-type-helper font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 mt-0.5">
          {label}
        </span>
        <span className="flex-1 leading-relaxed pt-0.5">{text}</span>
      </div>
      {badgeEl && <div className="shrink-0">{badgeEl}</div>}
    </div>
  );
}

function QuestionCard({
  q,
  idx,
  showAnswer,
  onOpenLightbox,
}: {
  q: any;
  idx: number;
  showAnswer: boolean;
  onOpenLightbox: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const sel = q.studentSelection;
  const selectedIds: string[] = sel?.selectedOptionIds || [];
  const isCorrect = sel?.isCorrect;
  const score = sel?.finalScore ?? 0;

  let statusColor = 'text-slate-400';
  let StatusIcon: any = Minus;
  if (q.type !== 'ESSAY') {
    if (showAnswer) {
      if (isCorrect) {
        statusColor = 'text-emerald-600';
        StatusIcon = CheckCircle2;
      } else if (selectedIds.length === 0) {
        statusColor = 'text-slate-400';
        StatusIcon = Minus;
      } else {
        statusColor = 'text-rose-500';
        StatusIcon = XCircle;
      }
    } else if (selectedIds.length > 0) {
      statusColor = 'text-blue-600';
      StatusIcon = CheckCircle2;
    }
  }

  const borderCls =
    showAnswer && q.type !== 'ESSAY'
      ? isCorrect
        ? 'border-emerald-200 dark:border-emerald-900/60'
        : selectedIds.length === 0
        ? 'border-slate-200/60 dark:border-slate-800'
        : 'border-rose-200 dark:border-rose-900/60'
      : 'border-slate-200/60 dark:border-slate-800';

  const typeLabel =
    q.type === 'ESSAY'
      ? 'Tự luận'
      : q.type === 'FILL_BLANK'
      ? 'Điền khuyết'
      : q.type === 'TRUE_FALSE'
      ? 'Đúng / Sai'
      : 'Trắc nghiệm';

  const diffLabel = q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'Trung bình';

  return (
    <div className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-[background-color,border-color,box-shadow,opacity,transform] duration-150 ease-out ${borderCls}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 p-4 sm:px-5 sm:py-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`shrink-0 mt-0.5 ${statusColor}`}>
            <StatusIcon className="w-4 h-4" />
          </span>
          <p className="flex-1 min-w-0 text-type-body font-semibold text-slate-900 dark:text-white leading-relaxed">
            Câu {idx + 1}: {q.content}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-type-helper font-semibold tabular-nums ${
              showAnswer && q.type !== 'ESSAY'
                ? isCorrect
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : selectedIds.length === 0
                  ? 'text-slate-500'
                  : 'text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-blue-600 dark:text-blue-400 font-semibold'
            }`}
          >
            {showAnswer ? `${score} / ${q.maxScore} đ` : `${q.maxScore} đ`}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 pt-3.5 space-y-3.5 bg-slate-50/40 dark:bg-slate-850/40 text-type-helper">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ui-pill rounded-full text-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-type-helper font-medium border border-slate-200/80 dark:border-slate-700">
              {typeLabel}
            </span>
            <span className="ui-pill rounded-full text-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-type-helper font-medium border border-slate-200/80 dark:border-slate-700">
              {diffLabel}
            </span>
          </div>

          {/* Media đính kèm câu hỏi */}
          {Array.isArray(q.media) && q.media.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {q.media.map((mediaItem: any, mIdx: number) => {
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
                    onClick={() => onOpenLightbox(mediaItem.url)}
                    className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                    title="Bấm để xem ảnh phóng to"
                  >
                    <DynamicImage
                      src={fullUrl}
                      alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                      className="max-h-48 rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Bấm để xem ảnh phóng to">
                      <Maximize2 className="h-4.5 w-4.5 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {q.type !== 'ESSAY' && q.type !== 'FILL_BLANK' && q.options?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {q.options.map((opt: any) => (
                <OptionItem
                  key={opt.id}
                  label={opt.label || '?'}
                  text={opt.content || opt.text || ''}
                  isSelected={selectedIds.includes(opt.id)}
                  isCorrect={Boolean(opt.isCorrect)}
                  showAnswer={showAnswer}
                />
              ))}
            </div>
          )}

          {q.type === 'FILL_BLANK' && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 p-4 rounded-xl">
              <p className="text-type-helper font-semibold text-slate-700 dark:text-slate-300 tracking-wider">
                Bài làm điền khuyết của sinh viên:
              </p>
              <div className="space-y-2">
                {((q.fillBlankAnswers && q.fillBlankAnswers.length > 0 ? q.fillBlankAnswers : [{ blankIndex: 1 }]) as any[]).map(
                  (expected: any) => {
                    const bIdx = expected.blankIndex || 1;
                    const studentItem = (sel?.fillBlankAnswers || []).find((ans: any) => Number(ans.blankIndex) === Number(bIdx));
                    const studentVal = studentItem?.value || '';
                    const correctVal = expected.answer || '';
                    return (
                      <div
                        key={bIdx}
                        className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 p-3 rounded-xl text-type-helper shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">Ô #{bIdx}:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {studentVal || <span className="italic font-normal text-slate-400">Bỏ trống</span>}
                          </span>
                        </div>
                        {showAnswer && (
                          <div className="inline-flex items-center gap-1.5 text-type-helper font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            Đáp án đúng: <span className="font-semibold text-emerald-800 dark:text-emerald-300">{correctVal || '---'}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {q.type === 'ESSAY' && (
            <div className="space-y-2">
              <p className="text-type-helper font-semibold text-slate-700 dark:text-slate-300 tracking-wider">Bài làm tự luận của sinh viên:</p>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-type-body text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed min-h-[60px] shadow-2xs">
                {sel?.textAnswer || <span className="italic font-normal text-slate-400">Sinh viên không nộp câu tự luận này</span>}
              </div>
              {showAnswer && sel?.teacherComment && (
                <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 p-4 space-y-1">
                  <p className="text-type-helper font-semibold text-blue-800 dark:text-blue-300 tracking-wider">Nhận xét của giảng viên:</p>
                  <p className="text-type-helper text-blue-900 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">{sel.teacherComment}</p>
                </div>
              )}
            </div>
          )}

          {showAnswer && q.explanation && (
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-1">
              <p className="text-type-helper font-semibold text-blue-900 dark:text-blue-300 tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Giải thích đáp án:
              </p>
              <p className="text-type-helper text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExamAttemptReviewModal({ attemptId, onClose }: ExamAttemptReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.getAttemptReview(attemptId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Không thể tải bài làm chi tiết.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (attemptId) void load();
  }, [attemptId, load]);

  if (!attemptId || !mounted) return null;

  const correct = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === true).length ?? 0;
  const wrong = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === false).length ?? 0;
  const skipped =
    data?.questions?.filter(
      (q: any) => q.studentSelection?.isCorrect === null && (q.studentSelection?.selectedOptionIds?.length ?? 0) === 0
    ).length ?? 0;

  const hasEssay = data?.questions?.some((q: any) => q.type === 'ESSAY');

  const content = (
    <div role="dialog" aria-modal="true" aria-label="Chi tiết bài làm" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-modal-backdrop"
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <div className="relative z-[101] w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-apple-modal flex flex-col max-h-[calc(100dvh-1.5rem)] overflow-hidden border border-slate-200/90 dark:border-slate-800 animate-modal-dialog will-change-transform sm:max-h-[calc(100dvh-2rem)]">
        {/* ── 1. Clean Flat Modal Header ── */}
        <div className="bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/60 dark:border-slate-800 px-6 py-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-type-body shadow-2xs">
                <FileText className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white truncate">
                    Xem lại chi tiết bài thi
                  </h2>
                  {data?.paper?.paperCode && (
                    <IdentifierBadge tone="blue">{data.paper.paperCode}</IdentifierBadge>
                  )}
                </div>
                {data && (
                  <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Sinh viên: <strong className="font-semibold text-slate-900 dark:text-slate-100">{data.student?.fullName}</strong>
                    {' '}(<span className="font-medium text-slate-700 dark:text-slate-300">{data.student?.studentCode}</span>)
                    {data.paper?.subjectName && <span> ({data.paper.subjectName})</span>}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── 2. Scrollable Body Content ── */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 bg-white dark:bg-slate-900">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-type-helper font-semibold text-slate-500">Đang tải bài làm chi tiết sinh viên...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <p className="text-type-helper font-semibold text-rose-600">{error}</p>
              <Button variant="secondary" size="sm" onClick={load}>
                Thử lại ngay
              </Button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 p-4 text-center shadow-2xs">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Tổng điểm
                  </span>
                  <p className="text-type-section font-semibold text-blue-600 dark:text-blue-400">
                    {data.attemptInfo?.totalScore ?? '--'}{' '}
                    <span className="text-type-helper font-medium text-slate-400">/ {data.attemptInfo?.maxScore ?? 10}đ</span>
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 p-4 text-center shadow-2xs">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Câu đúng
                  </span>
                  <p className="text-type-section font-semibold text-emerald-600 dark:text-emerald-400">
                    {correct}{' '}
                    <span className="text-type-helper font-medium text-slate-400">câu</span>
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 p-4 text-center shadow-2xs">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Câu sai
                  </span>
                  <p className="text-type-section font-semibold text-rose-600 dark:text-rose-400">
                    {wrong}{' '}
                    <span className="text-type-helper font-medium text-slate-400">câu</span>
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 p-4 text-center shadow-2xs">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Bỏ qua
                  </span>
                  <p className="text-type-section font-semibold text-slate-600 dark:text-slate-400">
                    {skipped}{' '}
                    <span className="text-type-helper font-medium text-slate-400">câu</span>
                  </p>
                </div>
              </div>

              {/* Sub-info Badges */}
              <div className="flex flex-wrap items-center gap-2.5 text-type-helper font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  {data.student?.className || data.student?.classCode || 'Chính quy'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Thời gian: {data.paper?.durationMinutes || 60} phút
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Nộp bài: {data.attemptInfo?.submittedAt ? new Date(data.attemptInfo.submittedAt).toLocaleString('vi-VN') : '---'}
                </span>
              </div>

              {/* Questions List Header with Section Indicator */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Chi tiết từng câu ({data.questions?.length ?? 0} câu)
                  </h3>
                </div>

                <Button
                  type="button"
                  variant={showAnswer ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setShowAnswer(!showAnswer)}
                  leftIcon={showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                >
                  {showAnswer ? 'Ẩn đáp án đúng' : 'Hiện đáp án đúng'}
                </Button>
              </div>

              {/* Questions List */}
              <div className="space-y-3.5">
                {(data.questions || []).map((q: any, idx: number) => (
                  <QuestionCard
                    key={q.questionId || idx}
                    q={q}
                    idx={idx}
                    showAnswer={showAnswer}
                    onOpenLightbox={(url: string) => setLightboxUrl(url)}
                  />
                ))}
              </div>

              {/* Incidents Warning Box */}
              {data.incidents?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-2.5">
                  <h4 className="text-type-body-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Sự cố &amp; vi phạm ghi nhận ({data.incidents.length})
                  </h4>
                  <div className="space-y-2">
                    {data.incidents.map((inc: any, i: number) => (
                      <div
                        key={inc.id || i}
                        className="text-type-helper text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-900 rounded-lg border border-amber-200/80 dark:border-amber-900/60 p-3 leading-relaxed shadow-2xs"
                      >
                        <span className="font-semibold text-amber-950 dark:text-amber-100">{inc.decision || 'Cảnh báo hệ thống'}:</span>{' '}
                        {inc.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 3. Standard Footer ── */}
        <div className="border-t border-slate-200/60 dark:border-slate-800 px-6 py-4 shrink-0 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-850/80">
          {hasEssay ? (
            <a href={`/teacher/essay-grading?attemptId=${attemptId}`}>
              <Button variant="primary" size="md" leftIcon={<ExternalLink className="w-4 h-4" />}>
                Chấm / sửa điểm tự luận
              </Button>
            </a>
          ) : (
            <div />
          )}
          <Button variant="secondary" size="md" onClick={onClose}>
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
    </div>
  );

  return createPortal(content, document.body);
}
