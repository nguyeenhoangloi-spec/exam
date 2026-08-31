'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  KeyRound,
  Download,
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
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { DetailDrawer } from '../ui/DetailDrawer';
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

  const subjectName = paper ? ((paper as any).subjectName || (paper.examSchedule as any)?.subjectName || (paper.examSchedule?.subject as any)?.subjectName || 'Môn thi') : '';
  const periodName = paper ? ((paper.examSchedule as any)?.periodName || (paper.examSchedule as any)?.examPeriod?.name || 'Kỳ thi chính thức') : '';
  const isBusy = paper ? busyId === Number(paper.id) : false;

  return (
    <>
      <DetailDrawer
        isOpen={isOpen && Boolean(paper)}
        onClose={onClose}
        showAvatar={false}
        title={
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="text-type-card font-semibold text-slate-950 dark:text-white">
              {paper ? (getPaperCodeRange(paper).rangeText || paper.paperCode || `Đề thi #${paper.id}`) : ''}
            </span>
            {paper && <StatusBadge status={paper.status} />}
            <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
            <span className="text-type-body-sm font-medium text-slate-600 dark:text-slate-400 truncate">
              {subjectName} — {periodName}
            </span>
          </div>
        }
        maxWidth="3xl"
        headerExtra={
          paper ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Segmented Control - Phẳng, Gọn Gàng, Không Màu Mè */}
              <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-type-helper font-medium text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Tất cả ({questionCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('EASY')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeFilter === 'EASY'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Dễ ({difficultyCount.easy})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('MEDIUM')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeFilter === 'MEDIUM'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  TB ({difficultyCount.medium})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('HARD')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeFilter === 'HARD'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Khó ({difficultyCount.hard})
                </button>
              </div>

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

                {/* Nút In / Xuất Đề Thi Icon-Only Không Viền (Mở Popup Tùy Chọn) */}
                <button
                  type="button"
                  onClick={() => onExportWord(paper, showAnswers)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  title="Xuất hoặc in đề thi"
                  aria-label="Xuất hoặc in đề thi"
                >
                  <Download className="w-4 h-4" />
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
            {filteredQuestions.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-type-body-sm font-semibold text-slate-500">Không tìm thấy câu hỏi nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              filteredQuestions.map(({ detail, originalIndex }, displayIndex) => {
                const q = detail.question || detail;
                const choices = questionChoices(q);
                const isEssay = q.type?.toUpperCase() === 'ESSAY';
                const isFillBlank = q.type?.toUpperCase() === 'FILL_BLANK';
                const diffBadge = getDifficultyLabel(q.difficulty);
                const score = detail.score || q.score || 1;
                const answerText = q.answer || q.correctAnswer || (q.explanation ? `Hướng dẫn: ${q.explanation}` : '');

                return (
                  <div
                    key={detail.id || originalIndex}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Header câu hỏi */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-type-helper shadow-xs">
                          {displayIndex + 1}
                        </span>
                        <IdentifierBadge tone="neutral">{q.code || `Q${originalIndex + 1}`}</IdentifierBadge>
                        <span className="ui-pill rounded-full px-2.5 py-0.5 text-type-helper font-medium border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getTypeLabel(q.type)}
                        </span>
                        <span className={`ui-pill rounded-full px-2.5 py-0.5 text-type-helper font-medium border ${diffBadge.color}`}>
                          {diffBadge.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-type-helper font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 rounded-xl px-2.5 py-1 tabular-nums">
                          {score} điểm
                        </span>

                        {isEssay && onRubric && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onRubric({ id: q.id, code: q.code, content: q.content, score })}
                            className="shadow-2xs text-type-helper"
                          >
                            Rubric
                          </Button>
                        )}

                        {onSwapQuestion && paper?.status === 'DRAFT' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onSwapQuestion(originalIndex, q)}
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            className="shadow-2xs text-type-helper"
                            title="Đổi câu hỏi khác từ ngân hàng"
                          >
                            Đổi
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Nội dung câu hỏi */}
                    <div className="text-type-body-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                      {isFillBlank ? (
                        <FillBlankInlineContent
                          content={q.content}
                          fillBlankAnswers={q.fillBlankAnswers}
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

                    {/* Lựa chọn trắc nghiệm */}
                    {!isEssay && !isFillBlank && choices.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {choices.map((choice) => {
                          const isCorrect = choice.isCorrect;
                          return (
                            <div
                              key={choice.label}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-type-body-sm transition ${showAnswers && isCorrect
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40'
                                : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                                }`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-semibold text-type-helper ${showAnswers && isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                              >
                                {choice.label}
                              </span>
                              <span className={`pt-0.5 leading-snug break-words ${showAnswers && isCorrect ? 'font-semibold text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                {choice.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Gợi ý đáp án tự luận */}
                    {isEssay && (
                      <div className="text-type-body pt-1 space-y-2">
                        {showAnswers ? (
                          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 space-y-2 text-emerald-900 dark:text-emerald-200">
                            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-type-helper flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gợi ý Đáp án &amp; Thang điểm Tự luận:
                            </p>
                            <p className="font-medium whitespace-pre-wrap leading-relaxed text-type-body-sm">
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
