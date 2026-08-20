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
import { Modal } from '../Modal';

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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const loadRubric = useCallback(async () => {
    setLoading(true);
    setMessage('');
    setMessageType('error');
    const qScore = Number(question?.score || 0);
    try {
      const res = await api.get(`/essay/questions/${question.id}/rubric`);
      if (res.data && res.data.length > 0) {
        if (res.data.length === 1 && qScore > 0 && Math.abs(Number(res.data[0].maxScore) - qScore) > 0.001) {
          setCriteria([{ ...res.data[0], maxScore: qScore }]);
        } else {
          setCriteria(res.data);
        }
      } else {
        // Default 1 criterion matching question score
        setCriteria([
          {
            label: 'Nội dung câu trả lời tự luận hoàn chỉnh',
            description: 'Đánh giá tính chính xác, đầy đủ của câu trả lời',
            fullCreditGuide: '',
            partialCreditGuide: '',
            zeroCreditGuide: '',
            acceptedConcepts: '',
            commonMistakes: '',
            scoreStep: 0.25,
            maxScore: qScore || 1.0,
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

  const handleAiSuggest = async () => {
    setAiGenerating(true);
    setMessage('');
    try {
      const res = await api.post(`/essay/questions/${question.id}/rubric/ai-suggest`);
      if (!Array.isArray(res.data?.criteria) || res.data.criteria.length === 0) {
        throw new Error('AI chưa tạo được tiêu chí Rubric hợp lệ.');
      }
      setCriteria(res.data.criteria);
      setExpandedIndex(null);
      setMessageType('success');
      setMessage('AI đã tạo bản nháp Rubric. Bạn hãy kiểm tra, chỉnh sửa nếu cần rồi bấm “Lưu ba-rem Rubric”.');
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message;
      setMessageType('error');
      setMessage(Array.isArray(apiMsg) ? apiMsg.join(', ') : (apiMsg || e?.message || 'Không thể tạo Rubric bằng AI.'));
    } finally {
      setAiGenerating(false);
    }
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
      const apiMsg = e?.response?.data?.message;
      const displayMsg = Array.isArray(apiMsg) ? apiMsg.join(', ') : (apiMsg || e?.message || 'Không thể lưu Rubric.');
      setMessage(displayMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !question) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Thiết Lập Ba-rem (Rubric) Chấm Điểm"
        subtitle="Chia nhỏ câu hỏi thành các ý để chấm điểm chính xác"
        size="2xl"
      >
        <div className="space-y-4">
          {/* Top Question Strip */}
          <div className="space-y-1.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <IdentifierBadge tone="blue">{question.code || 'Câu tự luận'}</IdentifierBadge>
                <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">Đề bài:</span>
              </div>
              <span className="text-type-helper font-medium text-slate-600 dark:text-slate-400">
                Điểm câu hỏi: <strong className="text-blue-600 dark:text-blue-400 font-semibold text-type-body-sm">{expectedScore}đ</strong>
              </span>
            </div>
            <p className="text-type-body-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {question.content}
            </p>
          </div>

          {/* Inline Status Line (Không dùng nền, phẳng 100%) */}
          <div className="flex items-center justify-between gap-3 text-type-helper py-1">
            <div className="flex items-center gap-2">
              {isMatched ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className={`font-semibold ${
                isMatched
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                {isMatched
                  ? 'Tổng điểm các tiêu chí đã khớp 100% với đề thi'
                  : scoreDiff > 0
                  ? `Chưa khớp: Còn thiếu ${scoreDiff}đ`
                  : `Chưa khớp: Đang dư ${Math.abs(scoreDiff)}đ`}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100 text-type-body-sm">
                {totalRubricScore} / {expectedScore}đ
              </span>
              {criteria.length > 1 && !isMatched && (
                <button
                  type="button"
                  onClick={handleAutoDivideScores}
                  className="text-type-helper font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  (Chia đều)
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-type-body-sm font-semibold text-slate-700 dark:text-slate-300">
                  Các ý chấm điểm ({criteria.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                    onClick={handleAiSuggest}
                    disabled={aiGenerating || loading || saving}
                  >
                    {aiGenerating ? 'Đang tạo Rubric...' : 'AI gợi ý Rubric'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5 text-blue-600" />}
                    onClick={handleAddCriterion}
                    disabled={aiGenerating || saving}
                  >
                    Thêm ý chấm
                  </Button>
                </div>
              </div>

              {/* Flat Criteria Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {criteria.map((c, idx) => (
                  <div key={idx} className="py-3 space-y-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-type-helper flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Nội dung ý ${idx + 1} (Ví dụ: Nêu đúng định nghĩa, giải thích đúng...)`}
                          value={c.label}
                          onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                          className="w-full bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-type-body text-slate-900 dark:text-slate-100 font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>

                      <div className="w-24 relative shrink-0">
                        <input
                          type="number"
                          step={0.1}
                          min={0.1}
                          max={expectedScore}
                          value={c.maxScore}
                          onChange={(e) => handleFieldChange(idx, 'maxScore', Number(e.target.value))}
                          className="w-full bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-6 py-2 text-type-body font-semibold text-blue-600 dark:text-blue-400 tabular-nums focus:bg-white focus:border-blue-500 focus:outline-none transition"
                        />
                        <span className="absolute right-2.5 top-2.5 text-type-helper text-slate-400 font-medium pointer-events-none">
                          đ
                        </span>
                      </div>

                      {criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer shrink-0"
                          title="Xóa ý này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="pl-9 pr-2">
                      <input
                        type="text"
                        placeholder="Ghi chú chi tiết yêu cầu đạt (tùy chọn)..."
                        value={c.description}
                        onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 px-0 py-0.5 text-type-body text-slate-500 dark:text-slate-400 placeholder:text-slate-400 focus:outline-none transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-type-body-sm text-slate-600 dark:text-slate-400 font-medium">
              Tổng điểm ba-rem: <strong className="text-slate-900 dark:text-slate-100 font-semibold text-type-body-sm">{totalRubricScore}đ</strong> / {expectedScore}đ
            </div>
            <div className="flex gap-2.5 items-center">
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={saving || !isMatched}
                isLoading={saving}
              >
                Lưu ba-rem Rubric
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {message && <Toast message={message} type={messageType} onClose={() => setMessage('')} />}
    </>
  );
}
