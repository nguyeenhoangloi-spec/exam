'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { HelpCircle, Plus, Trash2, Save, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen && question?.id) {
      loadRubric();
    }
  }, [isOpen, question]);

  const loadRubric = async () => {
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
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-black flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-400" />
              Thiết Lập Rubric Chấm Điểm Tự Luận
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Mã câu: {question.code || 'Q'} · Điểm câu hỏi: <strong className="text-violet-300 font-black">{expectedScore}đ</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Question preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
            <span className="font-bold text-slate-900">Nội dung câu hỏi: </span>
            {question.content}
          </div>

          {message && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Real-time score balance status badge */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
            isMatched
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span className="flex items-center gap-1.5">
              {isMatched ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {isMatched ? 'Tổng điểm Rubric đã khớp hoàn hảo với điểm câu hỏi' : 'Tổng điểm Rubric CHƯA khớp với điểm câu hỏi'}
            </span>
            <span className="font-mono text-sm font-black">
              {totalRubricScore} / {expectedScore}đ
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Danh sách tiêu chí Rubric</h3>
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                </button>
              </div>

              {criteria.map((c, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tên tiêu chí *</label>
                      <input
                        type="text"
                        placeholder="Nhập tên tiêu chí..."
                        value={c.label}
                        onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Điểm tối đa *</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.01}
                        max={100}
                        value={c.maxScore}
                        onChange={(e) => handleFieldChange(idx, 'maxScore', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-3 flex justify-between items-end">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Thứ tự *</label>
                        <input
                          type="number"
                          min={1}
                          value={c.sortOrder}
                          onChange={(e) => handleFieldChange(idx, 'sortOrder', Number(e.target.value))}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      {criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mô tả / Hướng dẫn tiêu chí (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Mô tả hướng dẫn tiêu chí chấm..."
                      value={c.description}
                      onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isMatched}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Rubric'}
          </button>
        </div>
      </div>
    </div>
  );
}
