'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
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
  X,
} from 'lucide-react';
import { ExamPaper } from '../../types';
import { Button } from '../ui/Button';
import { DetailDrawer } from '../ui/DetailDrawer';
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { getImageUrl } from '../../lib/media-utils';
import { DynamicImage } from '../ui/DynamicImage';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { StatusBadge } from '../common/StatusBadge';
import { FillBlankInlineContent } from '../../lib/fill-blank-helper';
import { getPaperCodeRange } from './ExamPaperTable';

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
  if (!q) return [];
  const rawCorrect = q.correctAnswer ?? q.answer ?? q.sampleAnswer ?? '';
  const correctKey = String(rawCorrect).trim().toUpperCase();

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
      .map((option: any, index: number) => {
        const label = String(option.label || option.key || String.fromCharCode(65 + index)).trim().toUpperCase();
        const text = option.content || option.text || option.answer || '';
        const isOptCorrect = option.isCorrect === true || option.isCorrect === 1 || String(option.isCorrect).toLowerCase() === 'true';
        const isKeyMatch = Boolean(correctKey && (label === correctKey || String(text).trim().toUpperCase() === correctKey));
        return {
          label,
          text,
          isCorrect: Boolean(isOptCorrect || isKeyMatch),
        };
      })
      .filter((option: any) => option.text);
  }

  return [
    { label: 'A', text: q.optionA, isCorrect: Boolean(q.optionA && (correctKey === 'A' || String(q.optionA).trim().toUpperCase() === correctKey)) },
    { label: 'B', text: q.optionB, isCorrect: Boolean(q.optionB && (correctKey === 'B' || String(q.optionB).trim().toUpperCase() === correctKey)) },
    { label: 'C', text: q.optionC, isCorrect: Boolean(q.optionC && (correctKey === 'C' || String(q.optionC).trim().toUpperCase() === correctKey)) },
    { label: 'D', text: q.optionD, isCorrect: Boolean(q.optionD && (correctKey === 'D' || String(q.optionD).trim().toUpperCase() === correctKey)) },
  ].filter((option) => option.text);
}

function extractFillBlankAnswers(q: any): any[] {
  if (!q) return [];
  let raw = q.fillBlankAnswers ?? q.answers ?? q.correctAnswers ?? (q.type === 'FILL_BLANK' ? (q.correctAnswer ?? q.answer) : undefined);
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      if (raw.includes(',') || raw.includes('|') || raw.includes(';')) {
        const parts = raw.split(/[,|;]/).map((p: string) => p.trim()).filter(Boolean);
        return parts.map((ans: string, idx: number) => ({ blankIndex: idx + 1, answer: ans }));
      }
      return [{ blankIndex: 1, answer: raw.trim() }];
    }
  }
  if (Array.isArray(raw)) {
    return raw.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return { blankIndex: idx + 1, answer: item };
      }
      return {
        blankIndex: Number(item.blankIndex || item.index || item.order || idx + 1),
        answer: item.answer || item.text || item.content || item.value || '',
        score: item.score,
      };
    });
  }
  return [];
}

function getDifficultyLabel(diff?: string) {
  switch (diff?.toUpperCase()) {
    case 'EASY':
      return { text: 'Dễ', className: 'text-emerald-600 dark:text-emerald-400 font-medium' };
    case 'HARD':
      return { text: 'Khó', className: 'text-rose-600 dark:text-rose-400 font-medium' };
    case 'MEDIUM':
    default:
      return { text: 'Trung bình', className: 'text-amber-600 dark:text-amber-400 font-medium' };
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

  const subjectName = paper ? ((paper as any).subjectName || (paper.examSchedule as any)?.subjectName || (paper.examSchedule?.subject as any)?.subjectName || 'Môn thi') : '';
  const periodName = paper ? ((paper.examSchedule as any)?.periodName || (paper.examSchedule as any)?.examPeriod?.name || 'Kỳ thi chính thức') : '';
  const isBusy = paper ? busyId === Number(paper.id) : false;

  return (
    <>
      <DetailDrawer
        isOpen={isOpen && Boolean(paper)}
        onClose={onClose}
        showAvatar={true}
        avatarIcon={<FileText className="h-5 w-5 text-white" />}
        title={
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-type-card font-semibold text-slate-950 dark:text-white tracking-tight">
              {subjectName || 'Đề thi kết thúc học phần'}
            </span>
            {paper && (
              <span className="text-type-body font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                ({getPaperCodeRange(paper).rangeText || paper.paperCode || paper.id})
              </span>
            )}
          </div>
        }
        badge={paper ? <StatusBadge status={paper.status} variant="pill" /> : undefined}
        subtitle={
          periodName ? (
            <div className="flex items-center gap-2 text-type-helper text-slate-600 dark:text-slate-400 font-medium">
              <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-slate-800 dark:text-slate-200">{periodName}</span>
              {paper?.totalQuestions ? (
                <>
                  <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
                  <span>{paper.totalQuestions} câu hỏi</span>
                </>
              ) : null}
              {paper?.durationMinutes ? (
                <>
                  <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
                  <span>{paper.durationMinutes} phút</span>
                </>
              ) : null}
            </div>
          ) : undefined
        }
        maxWidth="3xl"
        headerExtra={
          paper ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Sliding Segmented Control - Chuẩn Toàn Hệ Thống 2026 */}
              <SlidingSegmentedControl<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>
                value={activeFilter}
                onChange={(val) => setActiveFilter(val)}
                size="md"
                options={[
                  { value: 'ALL', label: 'Tất cả', count: questionCount },
                  { value: 'EASY', label: 'Dễ', count: difficultyCount.easy },
                  { value: 'MEDIUM', label: 'Trung bình', count: difficultyCount.medium },
                  { value: 'HARD', label: 'Khó', count: difficultyCount.hard },
                ]}
              />

              {/* Action Toolbar - Icon Đơn Thuần Không Viền */}
              <div className="flex items-center gap-1">
                {/* Nút Hiện / Ẩn Đáp Án Icon-Only Không Viền */}
                <button
                  type="button"
                  onClick={onToggleShowAnswers}
                  className={`flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer ${
                    showAnswers
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
                  aria-label={showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
                >
                  {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Nút In Đề Thi Icon-Only Không Viền (Mở Popup Tùy Chọn) */}
                <button
                  type="button"
                  onClick={() => onExportWord(paper, showAnswers)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  title="In đề thi / PDF"
                  aria-label="In đề thi / PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : undefined
        }
        footer={
          paper ? (
            <div className="flex items-center justify-end gap-2.5 w-full">
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
          ) : undefined
        }
      >
        {paper && (
          <div className="space-y-4">
            {/* Search Bar if questions exist */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhanh câu hỏi trong đề (nội dung, mã câu hỏi)..."
                className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 pl-10 pr-4 text-type-body font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Questions List */}
            {isBusy && rawQuestions.length === 0 ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-850 rounded-xl" />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="h-8 bg-slate-100 dark:bg-slate-850 rounded-lg" />
                      <div className="h-8 bg-slate-100 dark:bg-slate-850 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-type-body-sm font-semibold text-slate-500">Không tìm thấy câu hỏi nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map(({ detail, originalIndex }, displayIndex) => {
                  const rawQ = detail.question || detail;
                  const q = { ...(detail.question || {}), ...detail, ...rawQ, options: (detail.question?.options || detail.options || rawQ.options) };
                  const choices = questionChoices(q);
                  const isEssay = q.type?.toUpperCase() === 'ESSAY';
                  const isFillBlank = q.type?.toUpperCase() === 'FILL_BLANK';
                  const fillBlankAnswers = extractFillBlankAnswers(q);
                  const diff = getDifficultyLabel(q.difficulty);
                  const score = detail.score || q.score || 1;
                  const answerText = q.answer || q.correctAnswer || (q.explanation ? `Hướng dẫn: ${q.explanation}` : '');

                  return (
                    <div
                      key={detail.id || originalIndex}
                      className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3.5"
                    >
                      {/* Header câu hỏi - Màu sắc nhã nhặn, thanh lịch */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap text-type-helper text-slate-500 dark:text-slate-400">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-type-helper tabular-nums border border-slate-200/80 dark:border-slate-700">
                            {displayIndex + 1}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {q.code || `Q${originalIndex + 1}`}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
                          <span className="text-slate-600 dark:text-slate-300">{getTypeLabel(q.type)}</span>
                          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
                          <span className={diff.className}>{diff.text}</span>
                          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                            {score} điểm
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {isEssay && onRubric && (
                            <button
                              type="button"
                              onClick={() => onRubric({ id: q.id, code: q.code, content: q.content, score })}
                              className="px-2.5 py-1 text-type-helper font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            >
                              Rubric
                            </button>
                          )}

                          {onSwapQuestion && paper?.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => onSwapQuestion(originalIndex, q)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-type-helper font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                              title="Đổi câu hỏi khác từ ngân hàng"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Đổi</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nội dung câu hỏi */}
                      <div className="text-type-body-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                        {isFillBlank ? (
                          <FillBlankInlineContent
                            content={q.content}
                            fillBlankAnswers={fillBlankAnswers}
                            showAnswers={showAnswers}
                          />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: q.content }} />
                        )}
                      </div>

                      {/* Media Attachments */}
                      {q.media?.length ? (
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {q.media.map((m: any) => {
                            const fullUrl = getImageUrl(m.url);
                            if (m.type === 'IMAGE') {
                              return (
                                <div
                                  key={m.id || m.url}
                                  onClick={() => setLightboxUrl(fullUrl)}
                                  className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-2xs"
                                >
                                  <DynamicImage
                                    src={m.url}
                                    alt="Hình câu hỏi"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : null}

                      {/* Lựa chọn trắc nghiệm - Khung đáp án hài hòa, tinh tế */}
                      {!isEssay && !isFillBlank && choices.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {choices.map((choice) => {
                            const isCorrect = choice.isCorrect;
                            return (
                              <div
                                key={choice.label}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border text-type-body-sm transition ${
                                  showAnswers && isCorrect
                                    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-400/30'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-semibold text-type-helper tabular-nums select-none ${
                                    showAnswers && isCorrect
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700'
                                  }`}
                                >
                                  {choice.label}
                                </span>
                                <span className={`pt-0.5 leading-snug break-words font-medium ${showAnswers && isCorrect ? 'font-semibold text-emerald-950 dark:text-emerald-100' : ''}`}>
                                  {choice.text}
                                </span>
                                {showAnswers && isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto self-center" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Chi tiết đáp án điền khuyết khi bật hiện đáp án */}
                      {showAnswers && isFillBlank && (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 space-y-2 text-type-body-sm text-emerald-950 dark:text-emerald-200">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-type-helper flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Đáp án các vị trí điền khuyết:</span>
                          </p>
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {fillBlankAnswers.length > 0 ? (
                              fillBlankAnswers.map((item, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-type-helper font-semibold text-emerald-900 dark:text-emerald-200 shadow-2xs"
                                >
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ô [{item.blankIndex}]:</span>
                                  <span>{item.answer}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-type-helper italic text-slate-500">Chưa có đáp án mẫu được lưu cho câu hỏi này.</span>
                            )}
                          </div>
                          {q.explanation && (
                            <p className="text-type-body-sm font-medium leading-relaxed pt-1 text-emerald-950 dark:text-emerald-200 border-t border-emerald-200/60 dark:border-emerald-800/60">
                              <span className="font-semibold text-emerald-800 dark:text-emerald-300">Giải thích:</span> {q.explanation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Giải thích / Hướng dẫn giải cho câu trắc nghiệm khi bật hiện đáp án */}
                      {showAnswers && !isEssay && !isFillBlank && q.explanation && (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 space-y-1 text-type-body-sm text-emerald-950 dark:text-emerald-200">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-type-helper flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Giải thích / Hướng dẫn giải:</span>
                          </p>
                          <p className="font-medium leading-relaxed whitespace-pre-wrap">
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* Gợi ý đáp án tự luận */}
                      {isEssay && (
                        <div className="text-type-body pt-1 space-y-2">
                          {showAnswers ? (
                            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 space-y-2 text-emerald-900 dark:text-emerald-200">
                              <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-type-helper flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gợi ý đáp án &amp; Thang điểm:
                              </p>
                              <p className="font-medium whitespace-pre-wrap leading-relaxed text-type-body-sm">
                                {answerText || 'Chưa có đáp án mẫu hoặc hướng dẫn chấm.'}
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
                })}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </>
  );
}
