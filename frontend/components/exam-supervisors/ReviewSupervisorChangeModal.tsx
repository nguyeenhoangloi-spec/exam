'use client';

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, Calendar, Clock, MapPin, AlertCircle, X, Search, Check, UserCheck, ShieldAlert } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui';

interface ReviewSupervisorChangeModalProps {
  isOpen: boolean;
  request: any | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function ReviewSupervisorChangeModal({
  isOpen,
  request,
  onClose,
  onSuccess,
}: ReviewSupervisorChangeModalProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [error, setError] = useState('');

  const fetchCandidates = useCallback(async () => {
    if (!request) return;
    try {
      setLoadingCandidates(true);
      const res = await api.get(`/teachers/supervisor-change-requests/${request.id}/eligible-replacements`);
      setCandidates(res.data || []);
    } catch (err: any) {
      console.error('Failed to load candidate teachers', err);
      setError('Không thể tải danh sách giảng viên đủ điều kiện thay thế.');
    } finally {
      setLoadingCandidates(false);
    }
  }, [request]);

  useEffect(() => {
    if (isOpen && request) {
      setSelectedTeacherId(null);
      setReviewNote('');
      setSearch('');
      setError('');
      setActionType('APPROVE');
      void fetchCandidates();
    }
  }, [fetchCandidates, isOpen, request]);

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(
      (t) =>
        t.fullName?.toLowerCase().includes(q) ||
        t.teacherCode?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  if (!isOpen || !request) return null;

  const schedule = request.examSupervisor?.examScheduleRoom?.examSchedule;
  const room = request.examSupervisor?.examScheduleRoom?.room;

  const handleApprove = async () => {
    if (!selectedTeacherId) {
      setError('Vui lòng chọn một giảng viên thay thế.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/teachers/supervisor-change-requests/${request.id}/approve`, {
        replacementTeacherId: selectedTeacherId,
        reviewNote: reviewNote.trim() || undefined,
      });
      onSuccess('Đã duyệt đổi ca và phân công giảng viên thay thế thành công.');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Không thể duyệt yêu cầu đổi ca.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      setError('');
      await api.post(`/teachers/supervisor-change-requests/${request.id}/reject`, {
        reviewNote: reviewNote.trim() || undefined,
      });
      onSuccess('Đã từ chối yêu cầu đổi ca; phân công cũ được giữ nguyên.');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Không thể từ chối yêu cầu đổi ca.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !request || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">
                Xử lý yêu cầu đổi ca coi thi
              </h2>
              <p className="text-type-helper text-slate-500 dark:text-slate-400">
                Duyệt chọn người thay thế hoặc từ chối yêu cầu
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

        {/* Action Toggle Tab */}
        <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={() => setActionType('APPROVE')}
            className={`py-2.5 px-4 text-center text-type-body-sm font-semibold border-b-2 transition cursor-pointer ${
              actionType === 'APPROVE'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Duyệt & Chọn người thay
          </button>
          <button
            type="button"
            onClick={() => setActionType('REJECT')}
            className={`py-2.5 px-4 text-center text-type-body-sm font-semibold border-b-2 transition cursor-pointer ${
              actionType === 'REJECT'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Từ chối yêu cầu
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-type-body-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Chi tiết ca thi & Lý do */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                Người yêu cầu: <strong className="text-slate-800 dark:text-slate-200">{request.requesterTeacher?.fullName}</strong> ({request.requesterTeacher?.teacherCode})
              </span>
              <span className="ui-pill inline-flex items-center rounded-full border border-amber-300 dark:border-amber-700 bg-transparent px-2.5 py-0.5 text-type-helper font-medium text-amber-700 dark:text-amber-400">
                Chờ duyệt
              </span>
            </div>

            <div className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              {schedule?.subject?.subjectName} ({schedule?.subject?.subjectCode})
            </div>

            <div className="flex items-center gap-3 text-type-helper text-slate-600 dark:text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>{schedule?.examDate ? new Date(schedule.examDate).toLocaleDateString('vi-VN') : '—'}</span>
              </span>
              <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{schedule?.startTime} – {schedule?.endTime}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Phòng {room?.roomCode || '—'} {room?.building ? `(${room.building})` : ''}</span>
              </span>
            </div>

            <div className="pt-1 text-type-helper text-slate-600 dark:text-slate-300 border-t border-slate-200/90 dark:border-slate-700/60">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Lý do xin đổi: </span>
              <span>{request.reason}</span>
            </div>
          </div>

          {actionType === 'APPROVE' ? (
            /* Chọn giảng viên thay thế */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                  Chọn giảng viên thay thế <span className="text-rose-500">*</span>
                </span>
                <span className="text-type-helper text-slate-500 dark:text-slate-400">
                  {candidates.length} giảng viên rảnh
                </span>
              </div>

              {/* Search candidate */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã giảng viên, bộ môn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Candidate list */}
              {loadingCandidates ? (
                <div className="py-8 text-center text-slate-500 text-type-body-sm">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-1.5" />
                  <p>Đang tìm giảng viên phù hợp...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <UserCheck className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                  <p className="text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                    Không tìm thấy giảng viên rảnh phù hợp
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 custom-scrollbar">
                  {filteredCandidates.map((teacher) => {
                    const isSelected = selectedTeacherId === teacher.id;
                    return (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => setSelectedTeacherId(teacher.id)}
                        className={`w-full flex items-center justify-between p-2.5 text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-type-body-sm font-semibold">{teacher.fullName}</span>
                            <span className="text-type-helper text-slate-500 dark:text-slate-400">({teacher.teacherCode})</span>
                          </div>
                          <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                            {teacher.department || teacher.faculty || 'Khoa / Bộ môn'}
                          </div>
                        </div>

                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Review note */}
              <div className="space-y-1 pt-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                  Ghi chú phê duyệt <span className="text-type-helper text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã trao đổi và điều chuyển cho cô Lan..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>
          ) : (
            /* Từ chối yêu cầu */
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-type-helper text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>
                  Sau khi từ chối, yêu cầu sẽ đóng lại và phân công coi thi của <strong>{request.requesterTeacher?.fullName}</strong> vẫn được giữ nguyên hiệu lực.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                  Lý do từ chối
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đã sát ngày thi, không tìm được người thay thế..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={submitting}>
              Đóng
            </Button>
            {actionType === 'APPROVE' ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleApprove}
                isLoading={submitting}
                disabled={!selectedTeacherId}
              >
                Xác nhận đổi người
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleReject}
                isLoading={submitting}
              >
                Xác nhận từ chối
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
