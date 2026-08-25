'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Building, Users } from 'lucide-react';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dời lịch thi & Đổi ca thi"
      subtitle={`Môn: ${schedule.subject?.subjectName || schedule.periodName || 'Học phần'} (${schedule.code})`}
      size="lg"
    >
      <div className="space-y-5 text-type-body">
        {/* Current Schedule Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <div className="text-type-helper font-medium text-slate-500">
            Lịch thi hiện tại
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800 dark:text-slate-200 text-type-body-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{oldDateFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{schedule.startTime} - {schedule.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{schedule.roomName || 'Chưa xếp phòng'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{schedule.studentCount ?? 0} thí sinh</span>
            </div>
          </div>
        </div>

        {/* Form Inputs for New Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="ui-label block text-type-body font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày thi mới <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newExamDate}
              onChange={(e) => {
                setNewExamDate(e.target.value);
                setCheckResult(null);
              }}
              className="ui-input text-type-body w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="ui-label block text-type-body font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Phòng thi
            </label>
            <select
              value={newRoomId}
              onChange={(e) => {
                setNewRoomId(e.target.value);
                setCheckResult(null);
              }}
              className="ui-select text-type-body w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Time Inputs & Quick Shift Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="ui-label text-type-body font-medium text-slate-700 dark:text-slate-300">
              Khung giờ thi mới <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-type-helper text-slate-500 font-medium">Chọn nhanh ca:</span>
              <button
                type="button"
                onClick={() => handleShiftSelect('07:30', '09:00')}
                className="px-2.5 py-1 text-type-helper font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Ca 1 (7:30)
              </button>
              <button
                type="button"
                onClick={() => handleShiftSelect('09:30', '11:00')}
                className="px-2.5 py-1 text-type-helper font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Ca 2 (9:30)
              </button>
              <button
                type="button"
                onClick={() => handleShiftSelect('13:30', '15:00')}
                className="px-2.5 py-1 text-type-helper font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Ca 3 (13:30)
              </button>
              <button
                type="button"
                onClick={() => handleShiftSelect('15:30', '17:00')}
                className="px-2.5 py-1 text-type-helper font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Ca 4 (15:30)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => {
                  setNewStartTime(e.target.value);
                  setCheckResult(null);
                }}
                className="ui-input text-type-body w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => {
                  setNewEndTime(e.target.value);
                  setCheckResult(null);
                }}
                className="ui-input text-type-body w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reason for rescheduling */}
        <div>
          <label className="ui-label block text-type-body font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Lý do dời lịch thi <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Điều chỉnh lịch đào tạo nhà trường, sự cố phòng máy, theo văn bản số..."
            className="ui-textarea text-type-body w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-type-helper text-slate-500 mt-1">
            * Lý do này sẽ được gửi trực tiếp qua chuông thông báo đến toàn bộ thí sinh và cán bộ coi thi liên quan.
          </p>
        </div>

        {/* Pre-flight Conflict Check Result */}
        {checkResult && (
          <div
            className={`p-3.5 rounded-xl border ${
              checkResult.isValid
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-type-helper mb-1">
              {checkResult.isValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>An toàn: Không có xung đột lịch thi, phòng thi hoặc sinh viên.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Phát hiện xung đột không thể dời lịch:</span>
                </>
              )}
            </div>
            {!checkResult.isValid && checkResult.conflicts.length > 0 && (
              <ul className="list-disc list-inside text-type-helper space-y-1 mt-1.5 pl-1">
                {checkResult.conflicts.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Error message if any */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-type-helper flex items-start gap-2 whitespace-pre-line">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCheckConflicts}
            disabled={checking || loading}
          >
            {checking ? 'Đang kiểm tra...' : 'Kiểm tra trùng lịch'}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmReschedule}
              disabled={loading || (checkResult !== null && !checkResult.isValid)}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận dời lịch và gửi thông báo'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
