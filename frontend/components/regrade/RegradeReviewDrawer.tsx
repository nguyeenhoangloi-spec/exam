'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, FileEdit, Award, GraduationCap, Clock, BookOpen, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
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
  const [mounted, setMounted] = useState(false);
  const [viewingAttemptModal, setViewingAttemptModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!selectedAppeal || !mounted) return null;

  const subjectName = selectedAppeal.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Không xác định';
  const subjectCode = selectedAppeal.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectCode || '';
  const shortAvatar = selectedAppeal.student.fullName
    ? selectedAppeal.student.fullName.trim().slice(0, 2).toUpperCase()
    : 'SV';

  const badgeStatus = selectedAppeal.status === 'APPROVED_REGRADE' ? 'APPROVED' : selectedAppeal.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

  const content = (
    <>
      <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Dark Blur Overlay Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200 animate-slide-left">
          {/* ── 1. Standard Solid Blue Header (Matching ProfileDrawer) ── */}
          <div className="bg-[#2563EB] p-5 text-white shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold text-base text-white border border-white/20 shadow-xs">
                  {shortAvatar}
                </div>

                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="truncate text-[20px] font-bold leading-[28px] text-white" title={selectedAppeal.student.fullName}>
                      Thẩm định Đơn Phúc khảo
                    </h2>
                    <span className="shrink-0 rounded-lg bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20">
                      {selectedAppeal.student.studentCode}
                    </span>
                  </div>
                  <p className="truncate text-[13px] font-medium text-blue-100 mt-1">
                    Sinh viên: <strong className="font-extrabold text-white">{selectedAppeal.student.fullName}</strong>
                    {selectedAppeal.student.class?.code ? ` (${selectedAppeal.student.class.code})` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/10 hover:text-white transition cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── 2. Scrollable Content Body ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 text-xs">
            {/* Card 1: Thông tin tổng quan đơn & Nút xem bài thi trực tiếp */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-[14px] font-bold text-slate-900">Thông tin chi tiết</h3>
                <StatusBadge status={badgeStatus} className="text-xs" />
              </div>

              <div className="grid gap-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    Môn thi:
                  </span>
                  <span className="font-bold text-slate-900 text-right">
                    {subjectName} {subjectCode ? `(${subjectCode})` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <Award className="h-4 w-4 text-slate-400" />
                    Điểm thi ban đầu:
                  </span>
                  <span className="font-extrabold text-blue-600 text-sm">
                    {selectedAppeal.originalScore.toFixed(1)} điểm
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    Lớp sinh viên:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedAppeal.student.class?.name || selectedAppeal.student.class?.code || 'Chưa xếp lớp'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Thời gian gửi đơn:
                  </span>
                  <span className="font-normal text-slate-600">
                    {new Date(selectedAppeal.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                    {new Date(selectedAppeal.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Nút Liên Kết Xem Bài Làm Chi Tiết Của Sinh Viên */}
              {selectedAppeal.attemptId && (
                <div className="pt-2.5 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setViewingAttemptModal(true)}
                    leftIcon={<Eye className="h-4 w-4" />}
                    className="w-full justify-center text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs py-2.5"
                  >
                    Xem bài làm chi tiết & Đáp án từng câu
                  </Button>
                </div>
              )}
            </div>

            {/* Card 2: Nội dung & Lý do xin phúc khảo */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nội dung & Lý do xin phúc khảo
              </h3>
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-slate-900 leading-relaxed font-normal text-xs">
                {selectedAppeal.reason}
              </div>
            </div>

            {/* Card 3: Bài làm sinh viên (Chi tiết các câu tự luận nếu có) */}
            {selectedAppeal.attempt?.attemptAnswers && selectedAppeal.attempt.attemptAnswers.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Xem nhanh câu trả lời ({selectedAppeal.attempt.attemptAnswers.length} câu)
                </h3>
                <div className="space-y-3">
                  {selectedAppeal.attempt.attemptAnswers.map((ans: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Câu {idx + 1} ({ans.questionCode || 'Tự luận'}):
                        </span>
                        <span className="font-mono font-extrabold text-blue-600 text-xs">
                          {ans.score !== undefined ? `${ans.score} / ${ans.maxScore || 10} điểm` : ''}
                        </span>
                      </div>
                      <p className="font-medium text-slate-700 leading-relaxed text-xs">{ans.questionText}</p>
                      <div className="rounded-xl bg-white p-3 border border-slate-200 text-slate-900 font-mono text-[11.5px] leading-relaxed">
                        {ans.studentAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card 4: Quyết định thẩm định & Chấm lại */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quyết định thẩm định & Chấm lại
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReviewStatus('APPROVED_REGRADE')}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition cursor-pointer ${
                    reviewStatus === 'APPROVED_REGRADE'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Chấp nhận & Đổi điểm
                </button>

                <button
                  type="button"
                  onClick={() => setReviewStatus('REJECTED')}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition cursor-pointer ${
                    reviewStatus === 'REJECTED'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Từ chối phúc khảo
                </button>
              </div>

              {reviewStatus === 'APPROVED_REGRADE' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Điểm số mới sau phúc khảo (Thang điểm 10):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={revisedScore}
                    onChange={(e) => setRevisedScore(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Nhập điểm mới..."
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Ghi chú & Nhận xét của CB Thẩm định:
                </label>
                <textarea
                  rows={3}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition shadow-2xs"
                  placeholder="Nhập lý do chấp nhận / từ chối hoặc giải trình điểm chấm lại..."
                />
              </div>
            </div>
          </div>

          {/* ── 3. Standard Footer ── */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 px-6 shrink-0 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveReview}
              isLoading={submitting}
            >
              Lưu & Công bố kết quả
            </Button>
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
