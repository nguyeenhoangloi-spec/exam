'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Users, Calendar, Clock, Building } from 'lucide-react';
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
      subtitle={`Môn: ${schedule.subject?.subjectName || schedule.periodName || 'Học phần'} (${schedule.code})`}
      size="md"
    >
      <div className="space-y-4 text-type-body">
        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-type-helper text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Cảnh báo: Hủy ca thi và phát thông báo khẩn</span>
          </div>
          <p className="text-type-helper leading-relaxed text-rose-800 dark:text-rose-300">
            Thao tác này sẽ chuyển ca thi sang trạng thái <strong>ĐÃ HỦY</strong>, giải phóng phân công cán bộ coi thi và tự động phát thông báo khẩn cấp đến toàn bộ thí sinh trong danh sách.
          </p>
        </div>

        {/* Schedule Info Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-type-helper text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Môn thi:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{schedule.subject?.subjectName || '---'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Thời gian:</span>
            <span className="font-medium">{dateFormatted} ({schedule.startTime} - {schedule.endTime})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Phòng thi:</span>
            <span className="font-medium">{schedule.roomName || 'Chưa xếp phòng'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Số lượng thí sinh bị ảnh hưởng:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">{schedule.studentCount ?? 0} sinh viên</span>
          </div>
        </div>

        {/* Reason Input */}
        <div>
          <label className="ui-label block text-type-body font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Lý do hủy ca thi <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Sự cố mất điện đột xuất, dịch bệnh, điều chỉnh theo quyết định số..."
            className="ui-textarea text-type-body w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-type-helper flex items-start gap-2 whitespace-pre-line">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmCancel}
            disabled={loading}
          >
            {loading ? 'Đang hủy...' : 'Xác nhận hủy và gửi thông báo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
