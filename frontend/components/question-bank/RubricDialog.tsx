'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import { HelpCircle, Plus, Trash2, Save, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';

interface RubricCriterion {
  id?: string;
  label: string;
  description: string;
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
            label: 'Nội dung trả lời chính',
            description: 'Đánh giá câu trả lời tự luận',
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

  const handleAddCriterion = () => {
    const nextOrder = criteria.length > 0 ? Math.max(...criteria.map((c) => c.sortOrder)) + 1 : 1;
    setCriteria((prev) => [
      ...prev,
      {
        label: `Tiêu chí ${prev.length + 1}`,
        description: '',
        maxScore: 0.5,
        sortOrder: nextOrder,
      },
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof RubricCriterion, val: any) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const totalRubricScore = Number(criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0).toFixed(2));
  const expectedScore = Number((question?.score || 0).toFixed(2));
  const isMatched = Math.abs(totalRubricScore - expectedScore) < 0.001;

  const handleSave = async () => {
    if (!criteria.length) {
      setMessage('Rubric phải có ít nhất 1 tiêu chí.');
      return;
    }

    // Sort order check
    const orders = criteria.map((c) => c.sortOrder);
    if (new Set(orders).size !== orders.length) {
      setMessage('Thứ tự (sortOrder) của các tiêu chí không được trùng nhau.');
      return;
    }

    // maxScore check
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
      setMessage(`Tổng điểm các tiêu chí Rubric (${totalRubricScore}đ) phải bằng đúng điểm của câu hỏi (${expectedScore}đ).`);
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await api.post(`/essay/questions/${question.id}/rubric`, {
        criteria: criteria.map((c) => ({
          label: c.label.trim(),
          description: c.description || '',
          maxScore: Number(c.maxScore),
          sortOrder: Number(c.sortOrder),
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
    <div role="dialog" aria-modal="true" aria-label="Quản lý rubric chấm điểm" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Modern Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 text-white shrink-0 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-[18px] font-semibold leading-snug text-white">
                  Thiết Lập Rubric Chấm Điểm Tự Luận
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-blue-100/90">
                  <IdentifierBadge tone="inverse">Mã câu: {question.code || 'Q'}</IdentifierBadge>
                  <span>· Điểm câu hỏi: <strong className="text-white font-semibold">{expectedScore}đ</strong></span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
          {/* Question preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200">
            <span className="font-semibold text-slate-900">Nội dung câu hỏi: </span>
            {question.content}
          </div>

          {message && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Real-time score balance status badge */}
          <div className={`inline-flex w-full items-center justify-between gap-3 text-[14px] leading-5 font-semibold ${isMatched
            ? 'text-success-600'
            : 'text-warning-600'
            }`}>
            <span className="inline-flex items-center gap-[6px]">
              {isMatched ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {isMatched ? 'Tổng điểm Rubric đã khớp hoàn hảo với điểm câu hỏi' : 'Tổng điểm Rubric CHƯA khớp với điểm câu hỏi'}
            </span>
            <span className=" tabular-nums text-sm font-semibold">
              {totalRubricScore} / {expectedScore}đ
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-500">Danh sách tiêu chí Rubric</h3>
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                </button>
              </div>

              {criteria.map((c, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 relative">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 space-y-1">
                      <label className="block text-[15px] font-medium text-slate-900 dark:text-slate-100">Tên tiêu chí *</label>
                      <input
                        type="text"
                        placeholder="Nhập tên tiêu chí..."
                        value={c.label}
                        onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[15px] text-slate-900 dark:text-slate-100 font-normal focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="block text-[15px] font-medium text-slate-900 dark:text-slate-100">Điểm tối đa *</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.01}
                        max={100}
                        value={c.maxScore}
                        onChange={(e) => handleFieldChange(idx, 'maxScore', Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[15px] text-slate-900 dark:text-slate-100 font-medium tabular-nums focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3 flex justify-between items-end">
                      <div className="space-y-1">
                         <label className="block text-[15px] font-medium text-slate-900 dark:text-slate-100">Thứ tự *</label>
                        <input
                          type="number"
                          min={1}
                          value={c.sortOrder}
                          onChange={(e) => handleFieldChange(idx, 'sortOrder', Number(e.target.value))}
                           className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-[15px] font-normal text-center focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                     <label className="block text-[15px] font-medium text-slate-900 dark:text-slate-100">Mô tả / Hướng dẫn tiêu chí (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Mô tả hướng dẫn tiêu chí chấm..."
                      value={c.description}
                      onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saving || !isMatched}
            isLoading={saving}
          >
            Lưu rubric
          </Button>
        </div>
      </div>
    </div>
  );
}
