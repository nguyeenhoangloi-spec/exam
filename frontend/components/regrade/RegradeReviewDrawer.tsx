'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, AlertCircle, Award, GraduationCap, Clock, BookOpen, Eye, FileEdit, ExternalLink, MessageSquareQuote } from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ExamAttemptReviewModal } from '../exam-reports/ExamAttemptReviewModal';

export interface GradeAppealItem {
  id: string;
  attemptId: string;
  studentId: number;
  reason: string;
  evidenceUrls: any;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED_REGRADE' | 'REJECTED' | 'CANCELLED';
  originalScore: number;
  revisedScore: number | null;
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  student: {
    studentCode: string;
    fullName: string;
    class?: {
      code: string;
      name: string;
    };
  };
  attempt: {
    totalScore: number;
    submissionFiles?: any[];
    attemptAnswers?: any[];
    onlineExamConfig: {
      examSchedule: {
        subjectId: number;
        subject: {
          subjectCode: string;
          subjectName: string;
        };
      };
    };
  };
  reviewer?: {
    username: string;
    email: string;
  } | null;
}

interface RegradeReviewDrawerProps {
  selectedAppeal: GradeAppealItem | null;
  onClose: () => void;
  reviewStatus: 'APPROVED_REGRADE' | 'REJECTED';
  setReviewStatus: (status: 'APPROVED_REGRADE' | 'REJECTED') => void;
  revisedScore: string;
  setRevisedScore: (score: string) => void;
  reviewerNote: string;
  setReviewerNote: (note: string) => void;
  handleSaveReview: () => void;
  submitting: boolean;
}

export function RegradeReviewDrawer({
  selectedAppeal,
  onClose,
  reviewStatus,
  setReviewStatus,
  revisedScore,
  setRevisedScore,
  reviewerNote,
  setReviewerNote,
  handleSaveReview,
  submitting,
}: RegradeReviewDrawerProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [viewingAttemptModal, setViewingAttemptModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedAppeal) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [selectedAppeal]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !viewingAttemptModal) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, viewingAttemptModal]);

  if (!selectedAppeal || !mounted) return null;

  const subjectName = selectedAppeal.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Không xác định';
  const subjectCode = selectedAppeal.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectCode || '';
  const shortAvatar = selectedAppeal.student.fullName
    ? selectedAppeal.student.fullName.trim().split(' ').pop()?.slice(0, 2).toUpperCase()
    : 'SV';

  const badgeStatus = selectedAppeal.status === 'APPROVED_REGRADE' ? 'APPROVED' : selectedAppeal.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

  const content = (
    <>
      <div role="dialog" aria-modal="true" aria-label="Xử lý phúc khảo" className="fixed inset-0 z-[100] overflow-hidden">
        {/* Backdrop mờ nền */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
          <div
            className={`w-screen max-w-[600px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/90 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
              visible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header — Tương phản cao, Phân cấp chuẩn mực */}
            <div className="relative bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/90 dark:border-slate-800 p-6 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-type-body shadow-sm shadow-blue-500/25 border border-blue-400/30">
                    {shortAvatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white break-words">
                        Thẩm định Đơn Phúc khảo
                      </h2>
                      <IdentifierBadge tone="neutral">{selectedAppeal.student.studentCode}</IdentifierBadge>
                    </div>
                    <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Sinh viên: <strong className="font-semibold text-slate-900 dark:text-slate-100">{selectedAppeal.student.fullName}</strong>
                      {selectedAppeal.student.class?.code ? ` (${selectedAppeal.student.class.code})` : ''}
                    </p>
                  </div>
                </div>

                {/* Nút Đóng */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Đóng chi tiết"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
              {/* Mục 1: Thông tin chung */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                    <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                      Thông tin hồ sơ phúc khảo
                    </h3>
                  </div>
                  <StatusBadge status={badgeStatus} className="text-type-helper" />
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                      Môn thi:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-right">
                      {subjectName} {subjectCode && <IdentifierBadge tone="neutral">{subjectCode}</IdentifierBadge>}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      <Award className="h-4 w-4 text-blue-600 shrink-0" />
                      Điểm thi ban đầu:
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {selectedAppeal.originalScore.toFixed(1)} / 10 điểm
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                      Lớp sinh viên:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedAppeal.student.class?.name || selectedAppeal.student.class?.code || 'Chưa xếp lớp'}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                      Thời gian gửi đơn:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(selectedAppeal.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                      {new Date(selectedAppeal.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Nút thao tác bài làm */}
                {selectedAppeal.attemptId && (
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const isAdm = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
                        const targetUrl = isAdm
                          ? `/admin/essay-review?attemptId=${selectedAppeal.attemptId}`
                          : `/teacher/essay-grading?attemptId=${selectedAppeal.attemptId}`;
                        router.push(targetUrl);
                      }}
                      leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                      className="flex-1 justify-center text-type-helper font-semibold shadow-2xs"
                    >
                      Chấm lại trên Rubric
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewingAttemptModal(true)}
                      leftIcon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                      className="flex-1 justify-center text-type-helper font-semibold"
                    >
                      Xem toàn bộ bài làm
                    </Button>
                  </div>
                )}
              </div>

              {/* Mục 2: Lý do xin phúc khảo (Flat & Clean Layout) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Lý do &amp; Nguyện vọng xin phúc khảo
                  </h3>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 p-3.5 text-slate-800 dark:text-slate-200 leading-relaxed font-normal text-type-body-sm flex items-start gap-2.5 shadow-2xs">
                  <MessageSquareQuote className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="flex-1 break-words">{selectedAppeal.reason}</span>
                </div>
              </div>

              {/* Mục 3: Quyết định thẩm định & Chấm lại */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    Quyết định thẩm định &amp; Chấm lại
                  </h3>
                </div>

                {/* Segmented 2-State Control */}
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-1 grid grid-cols-2 gap-1 select-none">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED_REGRADE')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-type-helper font-semibold transition cursor-pointer ${
                      reviewStatus === 'APPROVED_REGRADE'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Chấp nhận &amp; Đổi điểm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-type-helper font-semibold transition cursor-pointer ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs ring-1 ring-rose-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span>Từ chối phúc khảo</span>
                  </button>
                </div>

                {reviewStatus === 'APPROVED_REGRADE' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                      Điểm số mới sau phúc khảo (Thang điểm 10):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={revisedScore}
                        onChange={(e) => setRevisedScore(e.target.value)}
                        className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 pr-14 text-type-body font-semibold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                        placeholder="Nhập điểm mới..."
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-type-helper font-semibold text-slate-400 pointer-events-none">
                        / 10 đ
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                    Ghi chú &amp; Nhận xét của CB Thẩm định:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-type-body font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Nhập lý do chấp nhận / từ chối hoặc giải trình điểm chấm lại..."
                  />
                </div>
              </div>
            </div>

            {/* Standard Footer Action Bar */}
            <div className="border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <Button type="button" variant="secondary" size="md" onClick={handleClose}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveReview}
                isLoading={submitting}
              >
                Lưu &amp; Công bố kết quả
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xem Bài Làm Chi Tiết Của Sinh Viên */}
      {viewingAttemptModal && selectedAppeal.attemptId && (
        <ExamAttemptReviewModal
          attemptId={selectedAppeal.attemptId}
          onClose={() => setViewingAttemptModal(false)}
        />
      )}
    </>
  );

  return createPortal(content, document.body);
}
