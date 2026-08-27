'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Calendar, Clock, MapPin, AlertCircle, X, ShieldAlert } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui';

interface AssignmentItem {
  id: number;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  roomName?: string;
  roomCode?: string;
  building?: string;
  role: string;
  status: string;
}

interface SupervisorChangeRequestModalProps {
  isOpen: boolean;
  assignment: AssignmentItem | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const QUICK_REASONS = [
  'Trùng lịch giảng dạy / thi',
  'Bận lịch công tác đột xuất',
  'Lý do sức khỏe',
  'Trùng lịch họp / hội đồng',
];

export function SupervisorChangeRequestModal({
  isOpen,
  assignment,
  onClose,
  onSuccess,
}: SupervisorChangeRequestModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError('Vui lòng nhập lý do cụ thể (tối thiểu 10 ký tự) để Hội đồng khảo thí xem xét.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/teachers/my-assignments/${assignment.id}/change-requests`, {
        reason: trimmed,
      });
      onSuccess(
        `Đã gửi yêu cầu xin đổi ca coi thi môn ${assignment.subjectName}. Yêu cầu đang chờ Quản trị viên phê duyệt.`
      );
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Không thể gửi yêu cầu xin đổi ca coi thi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">
                Xin đổi ca coi thi
              </h2>
              <p className="text-type-helper text-slate-500 dark:text-slate-400">
                Gửi yêu cầu chuyển ca để Hội đồng khảo thí sắp xếp giám thị thay thế
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-type-body-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Thông tin ca thi */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                Ca thi cần đổi
              </span>
              <span className="ui-pill inline-flex items-center rounded-full border border-blue-300 dark:border-blue-700 bg-transparent px-2.5 py-0.5 text-type-helper font-medium text-blue-700 dark:text-blue-300">
                {assignment.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2'}
              </span>
            </div>

            <div className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              {assignment.subjectCode} — {assignment.subjectName}
            </div>

            <div className="flex items-center gap-3 text-type-helper text-slate-600 dark:text-slate-300 flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>{new Date(assignment.examDate).toLocaleDateString('vi-VN')}</span>
              </span>
              <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{assignment.startTime} - {assignment.endTime}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{assignment.roomName || assignment.roomCode} {assignment.building ? `(${assignment.building})` : ''}</span>
              </span>
            </div>
          </div>

          {/* Gợi ý lý do nhanh */}
          <div className="space-y-1.5">
            <span className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
              Gợi ý lý do nhanh
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-xl border text-type-helper transition cursor-pointer ${
                    reason === r
                      ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nhập lý do chi tiết */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                Lý do xin đổi ca chi tiết <span className="text-rose-500">*</span>
              </label>
              <span className={`text-type-helper tabular-nums ${reason.length < 10 ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
                {reason.length}/500 ký tự (tối thiểu 10)
              </span>
            </div>
            <textarea
              rows={3}
              placeholder="Vui lòng nêu rõ lý do xin đổi ca..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition shadow-2xs"
              required
            />
          </div>

          {/* Ghi chú */}
          <div className="flex items-start gap-2 text-type-helper text-slate-500 dark:text-slate-400">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <span>
              Yêu cầu sẽ được gửi tới Ban Khảo thí để xem xét và phân công người thay thế.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={submitting}>
              Đóng
            </Button>
            <Button
              type="submit"
              variant="warning"
              size="md"
              isLoading={submitting}
              disabled={reason.trim().length < 10}
            >
              Gửi yêu cầu đổi ca
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
