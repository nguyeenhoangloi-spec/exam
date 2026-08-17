'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

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
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !question || !mounted) return null;

  const sampleAns = (fetchedAnswer || question.sampleAnswer || question.explanation || question.correctAnswer || '').trim();
  const totalRubricScore = criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

  // Check if rubric is custom (has multiple criteria or detailed guidelines)
  const isDefaultSingleRubric = criteria.length === 1 &&
    (criteria[0].label === 'Nội dung & Đánh giá tổng thể' || criteria[0].label === 'Nội dung câu trả lời tự luận hoàn chỉnh') &&
    !criteria[0].fullCreditGuide && !criteria[0].description;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
              Đáp án & Ba-rem chấm
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {question.code || 'Câu tự luận'} · {question.score || totalRubricScore || 0}đ
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Question Text */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Câu hỏi:</span>
            <p className="text-slate-900 dark:text-slate-100 leading-relaxed font-normal">
              {question.content}
            </p>
          </div>

          {/* Model Answer */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-xs font-semibold text-slate-400">Đáp án mẫu / Hướng dẫn giải:</span>
            {sampleAns ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal text-[13.5px]">
                {sampleAns}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Chưa có văn bản đáp án mẫu trong ngân hàng câu hỏi.
              </p>
            )}
          </div>

          {/* Rubric Criteria (Only show if multiple or detailed criteria exist) */}
          {!isDefaultSingleRubric && criteria.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Tiêu chí chấm điểm chi tiết ({criteria.length})
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Tổng: {totalRubricScore}đ
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {criteria.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {idx + 1}. {c.label}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {c.maxScore}đ
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-xs text-slate-500 font-normal">
                          {c.description}
                        </p>
                      )}
                      {(c.fullCreditGuide || c.partialCreditGuide || c.zeroCreditGuide) && (
                        <div className="text-[11px] space-y-0.5 pt-1 text-slate-500 font-normal">
                          {c.fullCreditGuide && <div>• Đạt tối đa: {c.fullCreditGuide}</div>}
                          {c.partialCreditGuide && <div>• Đạt một phần: {c.partialCreditGuide}</div>}
                          {c.zeroCreditGuide && <div>• Không đạt: {c.zeroCreditGuide}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
