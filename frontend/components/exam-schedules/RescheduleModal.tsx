'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Building, Users, ArrowLeftRight, Check } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import api from '../../lib/api';
import { ExamScheduleItemExtended } from './ExamScheduleTable';
import { ExamRoom } from '../../types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ExamScheduleItemExtended | null;
  rooms: ExamRoom[];
  onSuccess: (message: string) => void;
}

const QUICK_SHIFTS = [
  { label: 'Ca 1', time: '07:30 - 09:00', start: '07:30', end: '09:00' },
  { label: 'Ca 2', time: '09:30 - 11:00', start: '09:30', end: '11:00' },
  { label: 'Ca 3', time: '13:30 - 15:00', start: '13:30', end: '15:00' },
  { label: 'Ca 4', time: '15:30 - 17:00', start: '15:30', end: '17:00' },
];

const QUICK_REASONS = [
  'Điều chỉnh kế hoạch đào tạo',
  'Sự cố phòng thi / kỹ thuật',
  'Trùng lịch thi học phần',
  'Cán bộ coi thi bận đột xuất',
];

export function RescheduleModal({
  isOpen,
  onClose,
  schedule,
  rooms,
  onSuccess,
}: RescheduleModalProps) {
  const [newExamDate, setNewExamDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('07:30');
  const [newEndTime, setNewEndTime] = useState('09:00');
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    isValid: boolean;
    conflicts: string[];
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schedule && isOpen) {
      const d = schedule.examDate ? new Date(schedule.examDate).toISOString().split('T')[0] : '';
      setNewExamDate(d);
      setNewStartTime(schedule.startTime || '07:30');
      setNewEndTime(schedule.endTime || '09:00');
      setNewRoomId(schedule.examScheduleRooms?.[0]?.roomId ? String(schedule.examScheduleRooms[0].roomId) : '');
      setReason('');
      setCheckResult(null);
      setError(null);
    }
  }, [schedule, isOpen]);

  if (!schedule) return null;

  const handleShiftSelect = (start: string, end: string) => {
    setNewStartTime(start);
    setNewEndTime(end);
    setCheckResult(null);
  };

  const handleCheckConflicts = async () => {
    if (!newExamDate || !newStartTime || !newEndTime) {
      setError('Vui lòng chọn đầy đủ ngày và giờ thi mới trước khi kiểm tra.');
      return;
    }
    setError(null);
    setChecking(true);
    try {
      const res = await api.post(`/exam-schedules/${schedule.id}/check-conflicts`, {
        newExamDate,
        newStartTime,
        newEndTime,
        newRoomId: newRoomId ? parseInt(newRoomId, 10) : undefined,
      });
      setCheckResult(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể kiểm tra trùng lịch.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!newExamDate || !newStartTime || !newEndTime) {
      setError('Vui lòng chọn đầy đủ ngày và giờ thi mới.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do dời lịch thi để lưu vết kiểm toán và thông báo cho sinh viên.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.post(`/exam-schedules/${schedule.id}/reschedule`, {
        newExamDate,
        newStartTime,
        newEndTime,
        newRoomId: newRoomId ? parseInt(newRoomId, 10) : undefined,
        reason: reason.trim(),
      });
      onSuccess(res.data?.message || 'Đã dời lịch thi và gửi thông báo thành công!');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Dời lịch thi thất bại.';
      setError(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  const oldDateFormatted = schedule.examDate
    ? new Date(schedule.examDate).toLocaleDateString('vi-VN')
    : '---';

  const isCurrentShift = (start: string, end: string) =>
    newStartTime === start && newEndTime === end;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dời lịch thi & Đổi ca thi"
      subtitle={`${schedule.subject?.subjectName || schedule.periodName || 'Học phần'} (${schedule.code})`}
      size="lg"
    >
      <div className="space-y-4 text-type-body">
        {/* Current Schedule Summary (Bố cục phẳng inline) */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1.5">
          <div className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
            Lịch thi hiện tại:
          </div>
          <div className="flex items-center gap-4 text-type-body-sm text-slate-700 dark:text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{oldDateFormatted}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{schedule.startTime} - {schedule.endTime}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{schedule.roomName || 'Chưa xếp phòng'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{schedule.studentCount ?? 0} thí sinh</span>
            </span>
          </div>
        </div>

        {/* Hàng 1: Ngày thi mới & Phòng thi (50% - 50%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
              Ngày thi mới <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newExamDate}
              onChange={(e) => {
                setNewExamDate(e.target.value);
                setCheckResult(null);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
              Phòng thi
            </label>
            <select
              value={newRoomId}
              onChange={(e) => {
                setNewRoomId(e.target.value);
                setCheckResult(null);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            >
              <option value="">Giữ nguyên phòng hiện tại</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomCode} ({r.roomName} - {r.capacity} chỗ)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hàng 2: Khung giờ thi mới (4 Ca cân đối + Tùy chỉnh giờ) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
              Khung giờ thi mới <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {checkResult && checkResult.isValid && (
                <span className="text-type-helper text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Hợp lệ (không trùng lịch)
                </span>
              )}
              <button
                type="button"
                onClick={handleCheckConflicts}
                disabled={checking || loading}
                className="text-type-helper font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer inline-flex items-center gap-1 transition"
              >
                {checking ? 'Đang kiểm tra...' : 'Kiểm tra trùng lịch'}
              </button>
            </div>
          </div>

          {/* 4 Ca thi chia đều 25% x 4 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_SHIFTS.map((shift) => {
              const active = isCurrentShift(shift.start, shift.end);
              return (
                <button
                  key={shift.label}
                  type="button"
                  onClick={() => handleShiftSelect(shift.start, shift.end)}
                  className={`h-11 px-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    active
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold shadow-2xs'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-type-body-sm font-semibold">{shift.label}</span>
                  <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400">{shift.time}</span>
                </button>
              );
            })}
          </div>

          {/* 2 ô giờ bắt đầu - kết thúc (50% - 50%) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-0.5">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">Giờ bắt đầu</span>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => {
                  setNewStartTime(e.target.value);
                  setCheckResult(null);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-0.5">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">Giờ kết thúc</span>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => {
                  setNewEndTime(e.target.value);
                  setCheckResult(null);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Hàng 3: Lý do dời lịch thi */}
        <div className="space-y-1.5">
          <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
            Lý do dời lịch thi <span className="text-rose-500">*</span>
          </label>

          {/* Gợi ý lý do nhanh */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_REASONS.map((qReason) => (
              <button
                key={qReason}
                type="button"
                onClick={() => setReason(qReason)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 text-type-helper font-medium transition cursor-pointer"
              >
                + {qReason}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do dời lịch thi hoặc chọn gợi ý bên trên..."
            className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
          />
          <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400">
            * Lý do sẽ được ghi nhận vào nhật ký kiểm toán và gửi thông báo trực tiếp đến sinh viên / giám thị.
          </p>
        </div>

        {/* Cảnh báo xung đột nếu có (Chỉ hiện khi có lỗi trùng lịch) */}
        {checkResult && !checkResult.isValid && (
          <div className="p-3 rounded-xl border border-rose-200/90 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-type-helper text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Phát hiện xung đột lịch thi:</span>
            </div>
            {checkResult.conflicts.length > 0 && (
              <ul className="list-disc list-inside text-type-helper space-y-0.5 pl-1 font-normal">
                {checkResult.conflicts.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Error alert nếu có */}
        {error && (
          <div className="flex items-center gap-2 text-type-helper text-rose-600 dark:text-rose-400 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions (Chuẩn Button Hierarchy) */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirmReschedule}
            isLoading={loading}
            disabled={loading || (checkResult !== null && !checkResult.isValid)}
          >
            Xác nhận dời lịch thi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
