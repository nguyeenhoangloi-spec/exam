'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { CheckCircle2, AlertCircle, FileText, Send, ArrowLeft, Eye } from 'lucide-react';
import { ExamAttemptReviewModal } from '@/components/exam-reports/ExamAttemptReviewModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';

export default function StudentExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [showAppealConfirm, setShowAppealConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showReview, setShowReview] = useState(false);

  const loadResult = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.getAttemptResult(attemptId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải kết quả bài thi');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    void loadResult();
  }, [attemptId, loadResult]);

  const handleSendAppeal = async () => {
    if (!appealReason.trim() || submittingAppeal || appealSuccess) return;

    try {
      setSubmittingAppeal(true);
      await onlineExamService.submitAppeal(attemptId, appealReason);
      setAppealSuccess(true);
      setToast({ type: 'success', message: 'Đã gửi giải trình để giám thị xem xét.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Không thể gửi giải trình' });
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-600">Đang tải thông tin kết quả...</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không Thể Tải Kết Quả</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/student/exam-schedule')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl"
          >
            Về Lịch Thi
          </button>
        </div>
      </div>
    );
  }

  const isUnderReview = result.status === 'UNDER_REVIEW' || result.isFlagged;
  const isEssayWaiting = Boolean(result.gradingStatus && result.gradingStatus !== 'PUBLISHED');

  if (isEssayWaiting) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 text-slate-900 flex items-center justify-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-2xs space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-xl font-black text-slate-900">Bài đã nộp, đang chờ chấm điểm</h1>
          <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
            Điểm tự luận sẽ hiển thị sau khi giảng viên hoàn tất chấm bài và ban quản trị duyệt công bố kết quả.
          </p>
          <button
            type="button"
            onClick={() => router.push('/student/exam-schedule')}
            className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer"
          >
            Quay về lịch thi
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 text-slate-900 p-6 md:p-12">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-8 shadow-2xs space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            {isUnderReview ? (
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-700">
                <AlertCircle className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            )}

            <h1 className="text-xl font-black text-slate-900 mb-1">
              {isUnderReview ? 'Bài Thi Cần Được Xem Xét' : 'Hoàn Thành Bài Thi Trực Tuyến'}
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              {isUnderReview
                ? 'Hệ thống nhận thấy có một số sự kiện rủi ro cần cán bộ coi thi phê duyệt.'
                : 'Bài thi của bạn đã được lưu và gửi về hệ thống thành công.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl space-y-2.5">
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5 text-xs">
                <span className="text-slate-500 font-medium">Trạng thái bài thi:</span>
                <span className="inline-flex items-center rounded-[6px] bg-[#EFF6FF] px-2 py-1 text-[13px] font-semibold text-[#2563EB]">
                  {result.status === 'UNDER_REVIEW' ? 'Đang được xem xét' : result.status === 'GRADED' ? 'Đã chấm điểm' : result.status === 'SUBMITTED' ? 'Đã nộp bài' : result.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5 text-xs">
                <span className="text-slate-500 font-medium">Thời điểm nộp bài:</span>
                <span className="font-semibold text-slate-700">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây'}
                </span>
              </div>

              {result.totalScore !== undefined && result.totalScore !== null ? (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-sm">
                  <span className="text-slate-700 font-bold">Điểm số đạt được:</span>
                  <span className="text-emerald-600 text-xl font-black font-mono">
                    {result.totalScore} / {result.maxScore || 10} điểm
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                  <strong>Quy chế công bố điểm thi:</strong> Điểm số chính thức sẽ được công bố sau khi ca thi kết thúc{result.examEndTime ? ` (Dự kiến lúc ${result.examEndTime})` : ''}.
                </div>
              )}
            </div>
          </div>

          {isUnderReview && (
            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" /> Gửi Giải Trình Sự Cố
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                Nếu bài thi bị gián đoạn do rớt mạng, lỗi trình duyệt hoặc lý do khách quan, bạn có thể gửi giải trình bên dưới.
              </p>

              {appealSuccess ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                  Đã gửi giải trình thành công. Giám thị sẽ tiến hành xem xét biên bản.
                </div>
              ) : (
                <form onSubmit={(event) => { event.preventDefault(); setShowAppealConfirm(true); }} className="space-y-3">
                  <textarea
                    rows={3}
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Nhập chi tiết lý do sự cố xảy ra..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submittingAppeal || !appealReason.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi giải trình cho giám thị
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/student/exam-schedule')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Về danh sách lịch thi
            </button>

            {result.allowReview !== false && (
              <button
                type="button"
                onClick={() => setShowReview(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-4 py-2 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" /> Xem lại bài làm
              </button>
            )}
          </div>
        </div>
      </div>

      {showReview && (
        <ExamAttemptReviewModal
          attemptId={attemptId}
          onClose={() => setShowReview(false)}
        />
      )}
      <ConfirmModal
        isOpen={showAppealConfirm}
        isLoading={submittingAppeal}
        onClose={() => setShowAppealConfirm(false)}
        onConfirm={() => {
          setShowAppealConfirm(false);
          void handleSendAppeal();
        }}
        title="Xác nhận gửi giải trình"
        message="Giải trình sẽ được chuyển cho giám thị để xem xét. Bạn không thể chỉnh sửa nội dung sau khi gửi."
        type="warning"
        confirmText="Gửi giải trình"
        cancelText="Quay lại sửa"
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
