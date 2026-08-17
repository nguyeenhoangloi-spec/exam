'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import {
  Plus,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { Toast } from '../Toast';

interface RubricCriterion {
  id?: string;
  label: string;
  description: string;
  fullCreditGuide?: string;
  partialCreditGuide?: string;
  zeroCreditGuide?: string;
  acceptedConcepts?: string;
  commonMistakes?: string;
  scoreStep?: number;
  maxScore: number;
  sortOrder: number;
}

interface RubricDialogProps {
  isOpen: boolean;
  question: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RubricDialog({ isOpen, question, onClose, onSuccess }: RubricDialogProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const loadRubric = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.get(`/essay/questions/${question.id}/rubric`);
      if (res.data && res.data.length > 0) {
        setCriteria(res.data);
      } else {
        // Default 1 criterion matching question score
        setCriteria([
          {
            label: 'Nội dung câu trả lời chính',
            description: 'Đánh giá tính chính xác, đầy đủ của câu trả lời',
            fullCreditGuide: '',
            partialCreditGuide: '',
            zeroCreditGuide: '',
            acceptedConcepts: '',
            commonMistakes: '',
            scoreStep: 0.25,
            maxScore: question.score || 1.0,
            sortOrder: 1,
          },
        ]);
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải danh sách Rubric.');
    } finally {
      setLoading(false);
    }
  }, [question?.id, question?.score]);

  useEffect(() => {
    if (isOpen && question?.id) void loadRubric();
  }, [isOpen, question?.id, loadRubric]);

  const totalRubricScore = Number(criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0).toFixed(2));
  const expectedScore = Number((question?.score || 0).toFixed(2));
  const scoreDiff = Number((expectedScore - totalRubricScore).toFixed(2));
  const isMatched = Math.abs(scoreDiff) < 0.001;

  const handleAddCriterion = () => {
    const nextOrder = criteria.length > 0 ? Math.max(...criteria.map((c) => c.sortOrder)) + 1 : 1;
    const remainingScore = Math.max(0, Number((expectedScore - totalRubricScore).toFixed(2)));
    const defaultNewScore = remainingScore > 0 ? remainingScore : 0.5;

    setCriteria((prev) => [
      ...prev,
      {
        label: `Tiêu chí ${prev.length + 1}`,
        description: '',
        fullCreditGuide: '',
        partialCreditGuide: '',
        zeroCreditGuide: '',
        acceptedConcepts: '',
        commonMistakes: '',
        scoreStep: 0.25,
        maxScore: defaultNewScore,
        sortOrder: nextOrder,
      },
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const handleFieldChange = (index: number, field: keyof RubricCriterion, val: any) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Auto divide total score equally
  const handleAutoDivideScores = () => {
    if (criteria.length === 0) return;
    const splitScore = Number((expectedScore / criteria.length).toFixed(2));
    const lastItemScore = Number((expectedScore - splitScore * (criteria.length - 1)).toFixed(2));

    setCriteria((prev) =>
      prev.map((c, i) => ({
        ...c,
        maxScore: i === prev.length - 1 ? lastItemScore : splitScore,
      }))
    );
  };

  const handleSave = async () => {
    if (!criteria.length) {
      setMessage('Ba-rem Rubric phải có ít nhất 1 tiêu chí chấm.');
      return;
    }

    for (const c of criteria) {
      if (!c.label.trim()) {
        setMessage('Tên tiêu chí không được để trống.');
        return;
      }
      if (c.maxScore <= 0) {
        setMessage(`Điểm tối đa của tiêu chí "${c.label}" phải lớn hơn 0.`);
        return;
      }
    }

    if (!isMatched) {
      if (scoreDiff > 0) {
        setMessage(`Tổng điểm các tiêu chí (${totalRubricScore}đ) còn thiếu ${scoreDiff}đ so với câu hỏi (${expectedScore}đ).`);
      } else {
        setMessage(`Tổng điểm các tiêu chí (${totalRubricScore}đ) đang vượt quá ${Math.abs(scoreDiff)}đ so với câu hỏi (${expectedScore}đ).`);
      }
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await api.post(`/essay/questions/${question.id}/rubric`, {
        criteria: criteria.map((c, i) => ({
          label: c.label.trim(),
          description: c.description || '',
          fullCreditGuide: c.fullCreditGuide || '',
          partialCreditGuide: c.partialCreditGuide || '',
          zeroCreditGuide: c.zeroCreditGuide || '',
          acceptedConcepts: c.acceptedConcepts || '',
          commonMistakes: c.commonMistakes || '',
          scoreStep: Number(c.scoreStep || 0.25),
          maxScore: Number(c.maxScore),
          sortOrder: i + 1,
        })),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể lưu Rubric.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !question) return null;

  return (
    <>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 p-5 text-white shrink-0 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Thiết Lập Ba-rem (Rubric) Chấm Điểm
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chia nhỏ câu hỏi thành các ý để giảng viên và AI chấm điểm chính xác
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50 dark:bg-slate-900/60">
            {/* Question Info Card */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <IdentifierBadge tone="blue">{question.code || 'Câu tự luận'}</IdentifierBadge>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Đề bài:</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Điểm chuẩn: <strong className="text-blue-600 dark:text-blue-400">{expectedScore}đ</strong>
                </span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {question.content}
              </p>
            </div>

            {/* Score Match Balance Status Bar */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-2xs ${
              isMatched
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {isMatched ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span>
                  {isMatched
                    ? 'Tổng điểm các tiêu chí đã khớp 100% với điểm câu hỏi'
                    : scoreDiff > 0
                    ? `Chưa khớp: Tổng điểm đang thiếu ${scoreDiff}đ`
                    : `Chưa khớp: Tổng điểm đang vượt quá ${Math.abs(scoreDiff)}đ`}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums font-bold text-xs">
                  {totalRubricScore} / {expectedScore}đ
                </span>
                {criteria.length > 1 && !isMatched && (
                  <button
                    type="button"
                    onClick={handleAutoDivideScores}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 text-[11px] font-semibold hover:bg-blue-50 transition cursor-pointer"
                    title="Tự động chia đều tổng điểm cho tất cả tiêu chí"
                  >
                    Chia đều điểm
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Danh sách các ý chấm ({criteria.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 dark:hover:bg-blue-900 px-3 py-1.5 rounded-xl transition cursor-pointer border border-blue-200 dark:border-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                  </button>
                </div>

                {/* Criteria Cards */}
                {criteria.map((c, idx) => {
                  const isExpanded = expandedIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 space-y-3 shadow-2xs relative"
                    >
                      {/* Main Criterion Row: Label & Score */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-2">
                          {idx + 1}
                        </div>

                        <div className="flex-1 space-y-1">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                            Tên ý chấm / Tiêu chí <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Nêu đúng định nghĩa, cho ví dụ minh họa..."
                            value={c.label}
                            onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                            className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="w-28 space-y-1">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                            Điểm tối đa <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step={0.1}
                              min={0.1}
                              max={expectedScore}
                              value={c.maxScore}
                              onChange={(e) => handleFieldChange(idx, 'maxScore', Number(e.target.value))}
                              className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums focus:bg-white focus:border-blue-500 focus:outline-none"
                            />
                            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-medium pointer-events-none">
                              đ
                            </span>
                          </div>
                        </div>

                        {criteria.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCriterion(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer shrink-0 mt-6"
                            title="Xóa tiêu chí này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Brief description */}
                      <div className="space-y-1 pl-9">
                        <label className="block text-[11px] font-normal text-slate-500">
                          Mô tả nội dung đạt yêu cầu (tùy chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="Mô tả tóm tắt nội dung sinh viên cần nêu được..."
                          value={c.description}
                          onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                          className="w-full bg-slate-50/30 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none font-normal"
                        />
                      </div>

                      {/* Expandable AI Prompt Guides */}
                      <div className="pl-9 pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{isExpanded ? 'Thu gọn hướng dẫn chi tiết cho AI' : 'Mở rộng hướng dẫn chi tiết cho AI (Nâng cao)'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-emerald-600">Đạt điểm tối đa</label>
                                <textarea
                                  rows={2}
                                  placeholder="Ý cần có để đạt full điểm..."
                                  value={c.fullCreditGuide || ''}
                                  onChange={(e) => handleFieldChange(idx, 'fullCreditGuide', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-amber-600">Đạt điểm một phần</label>
                                <textarea
                                  rows={2}
                                  placeholder="Thiếu sót hoặc chưa đủ..."
                                  value={c.partialCreditGuide || ''}
                                  onChange={(e) => handleFieldChange(idx, 'partialCreditGuide', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-rose-600">Không đạt điểm</label>
                                <textarea
                                  rows={2}
                                  placeholder="Không trả lời hoặc sai..."
                                  value={c.zeroCreditGuide || ''}
                                  onChange={(e) => handleFieldChange(idx, 'zeroCreditGuide', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              Tổng ba-rem: <strong className="text-slate-900 dark:text-slate-100">{totalRubricScore}đ</strong> / {expectedScore}đ
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || !isMatched}
                isLoading={saving}
              >
                Lưu ba-rem Rubric
              </Button>
            </div>
          </div>
        </div>
      </div>
      {message && <Toast message={message} type="error" onClose={() => setMessage('')} />}
    </>
  );
}
