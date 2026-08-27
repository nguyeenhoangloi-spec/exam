'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Calendar, Clock, Building, Users } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import api from '../../lib/api';
import { ExamScheduleItemExtended } from './ExamScheduleTable';

interface CancelScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ExamScheduleItemExtended | null;
  onSuccess: (message: string) => void;
}

const QUICK_CANCEL_REASONS = [
  'Sự cố kỹ thuật / mất điện',
  'Theo quyết định điều chỉnh khẩn cấp',
  'Dời sang đợt thi phụ bổ sung',
  'Điều kiện thời tiết bất khả kháng',
];

export function CancelScheduleModal({
  isOpen,
  onClose,
  schedule,
  onSuccess,
}: CancelScheduleModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!schedule) return null;

  const handleConfirmCancel = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy ca thi để lưu vết kiểm toán và thông báo cho các bên liên quan.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.post(`/exam-schedules/${schedule.id}/cancel`, {
        reason: reason.trim(),
      });
      onSuccess(res.data?.message || 'Đã hủy ca thi và gửi thông báo khẩn thành công!');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Hủy ca thi thất bại.';
      setError(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  const dateFormatted = schedule.examDate
    ? new Date(schedule.examDate).toLocaleDateString('vi-VN')
    : '---';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận hủy ca thi"
      subtitle={`${schedule.subject?.subjectName || schedule.periodName || 'Học phần'} (${schedule.code})`}
      size="md"
    >
      <div className="space-y-4 text-type-body">
        {/* Warning & Schedule Summary (Bố cục phẳng kết hợp) */}
        <div className="rounded-xl border border-rose-200/90 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 p-3.5 space-y-2.5">
          <div className="flex items-start gap-2 text-type-helper text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>
              Thao tác này sẽ chuyển ca sang trạng thái <strong>ĐÃ HỦY</strong>, giải phóng giám thị và phát thông báo khẩn đến thí sinh.
            </span>
          </div>

          <div className="flex items-center gap-3.5 text-type-helper text-slate-700 dark:text-slate-300 flex-wrap pt-1.5 border-t border-rose-200/60 dark:border-rose-900/40">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{dateFormatted}</span>
            </span>
            <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{schedule.startTime} - {schedule.endTime}</span>
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{schedule.roomName || 'Chưa xếp phòng'}</span>
            </span>
            <span className="flex items-center gap-1 font-medium text-rose-700 dark:text-rose-400">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{schedule.studentCount ?? 0} thí sinh</span>
            </span>
          </div>
        </div>

        {/* Reason Input with Quick Suggestions */}
        <div className="space-y-1.5">
          <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
            Lý do hủy ca thi <span className="text-rose-500">*</span>
          </label>

          {/* Gợi ý lý do nhanh */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_CANCEL_REASONS.map((qReason) => (
              <button
                key={qReason}
                type="button"
                onClick={() => setReason(qReason)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-rose-300 hover:text-rose-600 text-type-helper font-medium transition cursor-pointer"
              >
                + {qReason}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do hủy ca thi hoặc chọn gợi ý bên trên..."
            className="w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-type-helper flex items-start gap-2 whitespace-pre-line">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleConfirmCancel}
            isLoading={loading}
          >
            Xác nhận hủy ca thi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
