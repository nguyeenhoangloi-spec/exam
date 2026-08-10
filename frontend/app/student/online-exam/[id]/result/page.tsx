'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { CheckCircle2, AlertCircle, FileText, Send, ArrowLeft, Eye } from 'lucide-react';
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
          <h2 className="text-xl font-bold mb-2">Không Thể Tải Kết Quả</h2>
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
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 text-slate-900 flex items-center justify-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-2xs space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-xl font-black text-slate-900">Bài đã nộp, đang chờ chấm điểm</h1>
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

            <h1 className="text-[28px] font-bold text-[#0F172A] mb-1">
              {isUnderReview ? 'Bài Thi Cần Được Xem Xét' : 'Hoàn Thành Bài Thi Trực Tuyến'}
            </h1>
            <p className="text-[#64748B] text-[15px] font-normal">
              {isUnderReview
                ? 'Hệ thống nhận thấy có một số sự kiện rủi ro cần cán bộ coi thi phê duyệt.'
                : 'Bài thi của bạn đã được lưu và gửi về hệ thống thành công.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl space-y-2.5">
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5 text-[15px]">
                <span className="text-[#64748B] font-normal">Trạng thái bài thi:</span>
                <StatusBadge status={result.status} />
                <span className="sr-only">
                  {result.status === 'UNDER_REVIEW' ? 'Đang được xem xét' : result.status === 'GRADED' ? 'Đã chấm điểm' : result.status === 'SUBMITTED' ? 'Đã nộp bài' : result.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2.5 text-[15px]">
                <span className="text-[#64748B] font-normal">Thời điểm nộp bài:</span>
                <span className="font-semibold text-[#0F172A]">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây'}
                </span>
              </div>

              {result.totalScore !== undefined && result.totalScore !== null ? (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[18px]">
                  <span className="text-[#0F172A] font-semibold">Điểm số đạt được:</span>
                  <span className="text-emerald-600 text-2xl font-bold font-mono">
                    {result.totalScore} / {result.maxScore || 10} điểm
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[15px] font-medium">
                  <strong>Quy chế công bố điểm thi:</strong> Điểm số chính thức sẽ được công bố sau khi ca thi kết thúc{result.examEndTime ? ` (Dự kiến lúc ${result.examEndTime})` : ''}.
                </div>
              )}
            </div>
          </div>

          {isUnderReview && (
            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-xl space-y-3">
              <h3 className="text-[18px] font-semibold text-amber-900 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-amber-700" /> Gửi Giải Trình Sự Cố
              </h3>
              <p className="text-[15px] text-amber-900 font-normal leading-relaxed">
                Nếu bài thi bị gián đoạn do rớt mạng, lỗi trình duyệt hoặc lý do khách quan, bạn có thể gửi giải trình bên dưới.
              </p>

              {appealSuccess ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[15px] font-medium">
                  Đã gửi giải trình thành công. Giám thị sẽ tiến hành xem xét biên bản.
                </div>
              ) : (
                <form onSubmit={(event) => { event.preventDefault(); setShowAppealConfirm(true); }} className="space-y-3">
                  <textarea
                    rows={3}
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Nhập chi tiết lý do sự cố xảy ra..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[15px] text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-blue-500 font-medium"
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
              leftIcon={<ArrowLeft className="w-4 h-4 text-[#64748B]" />}
            >
              Về danh sách lịch thi
            </Button>

            {result.allowReview !== false && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowReview(true)}
                leftIcon={<Eye className="w-4 h-4 text-[#64748B]" />}
              >
                Xem lại bài làm
              </Button>
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
