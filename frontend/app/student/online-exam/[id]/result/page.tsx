'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { CheckCircle2, AlertCircle, FileText, Send, ArrowLeft, Eye, Trophy, Sparkles, Award } from 'lucide-react';
import { ExamAttemptReviewModal } from '@/components/exam-reports/ExamAttemptReviewModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/Button';

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
          <h2 className="text-xl font-semibold mb-2">Không Thể Tải Kết Quả</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/student/exam-schedule')}
          >
            Về Lịch Thi
          </Button>
        </div>
      </div>
    );
  }

  const isUnderReview = result.status === 'UNDER_REVIEW' || result.isFlagged;
  const isEssayWaiting = Boolean(result.gradingStatus && result.gradingStatus !== 'PUBLISHED');

  if (isEssayWaiting) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6 md:p-12 text-slate-900 flex items-center justify-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-2xs space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">Bài đã nộp, đang chờ chấm điểm</h1>
          <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
            Điểm tự luận sẽ hiển thị sau khi giảng viên hoàn tất chấm bài và ban quản trị duyệt công bố kết quả.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => router.push('/student/exam-schedule')}
          >
            Quay về lịch thi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50/60 text-slate-900 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* ── Seamless Single White Card Architecture (Full-Bleed Header) ── */}
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">

          {/* Full-Bleed Header Banner: Primary Vivid Blue Gradient */}
          <div className={`bg-gradient-to-r ${isUnderReview ? 'from-amber-600 via-amber-700 to-orange-700' : 'from-blue-600 via-blue-700 to-blue-800'} p-6 sm:p-7 text-white shrink-0 shadow-xs`}>
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                {isUnderReview ? <AlertCircle className="h-6 w-6 text-white" /> : <Trophy className="h-6 w-6 text-white" />}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {isUnderReview ? 'Bài Thi Cần Được Xem Xét' : 'Hoàn Thành Bài Thi Trực Tuyến'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/30">
                    <Sparkles className="w-3 h-3 text-blue-200" />
                    {isUnderReview ? 'Chờ duyệt' : 'Đã nộp'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-blue-100/90">
                  {isUnderReview
                    ? 'Hệ thống ghi nhận một số sự kiện cần cán bộ coi thi phê duyệt.'
                    : 'Bài thi của bạn đã được lưu và gửi về hệ thống máy chủ khảo thí thành công.'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Body Container */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <div className="bg-slate-50/70 border border-slate-200/80 p-5 rounded-xl space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-2.5 text-[15px]">
                  <span className="text-slate-500 font-semibold text-[14px] leading-5 tracking-wide">Trạng thái bài thi:</span>
                  <StatusBadge status={result.status} />
                  <span className="sr-only">
                    {result.status === 'UNDER_REVIEW' ? 'Đang được xem xét' : result.status === 'GRADED' ? 'Đã chấm điểm' : result.status === 'SUBMITTED' ? 'Đã nộp bài' : result.status}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2.5 text-[15px]">
                  <span className="text-slate-500 font-semibold text-[14px] leading-5 tracking-wide">Thời điểm nộp bài:</span>
                  <span className="font-semibold text-slate-900 text-[15px] leading-6 tabular-nums">
                    {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây'}
                  </span>
                </div>

                {result.totalScore !== undefined && result.totalScore !== null ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[18px]">
                    <span className="text-slate-900 font-bold text-sm">Điểm số đạt được:</span>
                    <span className="text-emerald-600 text-2xl font-bold tabular-nums">
                      {result.totalScore} / {result.maxScore || 10} điểm
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                    <strong>Quy chế công bố điểm thi:</strong> Điểm số chính thức sẽ được công bố sau khi ca thi kết thúc{result.examEndTime ? ` (Dự kiến lúc ${result.examEndTime})` : ''}.
                  </div>
                )}
              </div>
            </div>

            {isUnderReview && (
              <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" /> Gửi Giải Trình Sự Cố
                </h3>
                <p className="text-[13px] text-amber-900 font-medium leading-[18px]">
                  Nếu bài thi bị gián đoạn do rớt mạng, lỗi trình duyệt hoặc lý do khách quan, bạn có thể gửi giải trình bên dưới.
                </p>

                {appealSuccess ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[13px] leading-[18px] font-semibold">
                    Đã gửi giải trình thành công. Giám thị sẽ tiến hành xem xét biên bản.
                  </div>
                ) : (
                  <form onSubmit={(event) => { event.preventDefault(); setShowAppealConfirm(true); }} className="space-y-3">
                    <textarea
                      rows={3}
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Nhập chi tiết lý do sự cố xảy ra..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                      required
                    />
                    <Button
                      type="submit"
                      variant="warning"
                      size="md"
                      disabled={submittingAppeal || !appealReason.trim()}
                      isLoading={submittingAppeal}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Gửi giải trình cho giám thị
                    </Button>
                  </form>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => router.push('/student/exam-schedule')}
                leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
              >
                Về danh sách lịch thi
              </Button>

              {result.allowReview !== false && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowReview(true)}
                  leftIcon={<Eye className="w-4 h-4 text-slate-500" />}
                >
                  Xem lại bài làm
                </Button>
              )}
            </div>
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
