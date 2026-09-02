'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { CheckCircle2, AlertCircle, FileText, Send, ArrowLeft, Eye, Trophy, Sparkles, Award, Info } from 'lucide-react';
import { ExamAttemptReviewModal } from '@/components/exam-reports/ExamAttemptReviewModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/Button';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookOpen, Clock, Shield, Layers } from 'lucide-react';

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
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const loadResult = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.getAttemptResult(attemptId);
      setResult(res);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('attemptToken');
      }
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6" aria-busy="true" aria-label="Đang tải kết quả bài thi">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-72 rounded" />
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-7 space-y-5">
            <div className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-5 rounded-xl space-y-3">
              <div className="flex justify-between py-1 border-b border-slate-200/90 dark:border-slate-700">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/90 dark:border-slate-700">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>
              <div className="flex justify-between py-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-type-section font-semibold mb-2">Không thể tải kết quả</h2>
          <p className="text-slate-600 dark:text-slate-300 text-type-body-sm mb-6">{error}</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/student/exam-schedule')}
          >
            Về lịch thi
          </Button>
        </div>
      </div>
    );
  }

  const isUnderReview = result.status === 'UNDER_REVIEW' || result.isFlagged;
  // Backend is authoritative. A PUBLISHED status before the official exam end
  // still must look unpublished to students until the release gate opens.
  const isResultReleased = result.showResultImmediately === true;
  const isEssayWaiting = !isResultReleased;

  if (isEssayWaiting) {
    const isWaitingGate = result.gradingStatus === 'PUBLISHED' && result.isExamEnded === false;

    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* ── Seamless Single White Card (Full-Bleed Header) ── */}
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xl overflow-hidden">
          
          {/* Full-Bleed Header Banner: Primary Vivid Blue Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 sm:p-7 text-white shrink-0 shadow-xs">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="edu-page-title text-white tracking-tight leading-snug">
                    Nộp bài thi thành công!
                  </h1>
                  <span className="ui-pill ui-pill-solid inline-flex items-center gap-1 text-type-helper font-medium bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/30">
                    <Clock className="w-3.5 h-3.5 text-blue-200" />
                    {isWaitingGate ? 'Chờ giờ mở điểm' : 'Đang chờ chấm điểm'}
                  </span>
                </div>

                <p className="text-type-helper sm:text-type-body-sm font-medium text-blue-100/90">
                  Bài làm của bạn đã được ghi nhận và lưu trữ an toàn trên máy chủ khảo thí.
                </p>
              </div>
            </div>
          </div>

          {/* Card Body Container */}
          <div className="p-6 sm:p-7 space-y-5">
            {/* Metadata Info Box */}
            <div className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-5 rounded-xl space-y-3">
              {result.subjectName && (
                <div className="flex items-center justify-between border-b border-slate-200/90 dark:border-slate-700 pb-2.5 text-type-body">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-type-body-sm">Môn thi:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-type-body text-right">
                    {result.subjectName} {result.subjectCode ? `(${result.subjectCode})` : ''}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-200/90 dark:border-slate-700 pb-2.5 text-type-body">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-type-body-sm">Thời điểm nộp bài:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-type-body tabular-nums">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Vừa xong'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/90 dark:border-slate-700 pb-2.5 text-type-body">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-type-body-sm">Trạng thái bài thi:</span>
                <StatusBadge status={result.status} />
              </div>

              <div className="flex items-center justify-between text-type-body">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-type-body-sm">Công bố kết quả:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-type-body-sm">
                  {isWaitingGate ? 'Sau khi ca thi kết thúc' : 'Chờ giảng viên chấm điểm'}
                </span>
              </div>
            </div>

            {/* Notice Callout */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-type-helper text-slate-700 dark:text-slate-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="leading-relaxed font-normal">
                {isWaitingGate
                  ? 'Điểm thi đã được chuẩn bị và sẽ tự động hiển thị sau khi toàn bộ ca thi chính thức kết thúc.'
                  : 'Điểm số chính thức sẽ được công bố tại trang Lịch thi sau khi giảng viên và ban khảo thí hoàn tất công tác chấm thi.'}
                {result.examEndTime ? ` (Thời điểm kết thúc ca thi: ${result.examEndTime})` : ''}
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full sm:w-auto min-w-[200px]"
                onClick={() => router.push('/student/exam-schedule')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Quay về danh sách lịch thi
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* ── Seamless Single White Card Architecture (Full-Bleed Header) ── */}
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xl overflow-hidden">

          {/* Full-Bleed Header Banner: Primary Vivid Blue Gradient */}
          <div className={`bg-gradient-to-r ${isUnderReview ? 'from-amber-600 via-amber-700 to-orange-700' : 'from-blue-600 via-blue-700 to-blue-800'} p-6 sm:p-7 text-white shrink-0 shadow-xs`}>
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                {isUnderReview ? <AlertCircle className="h-6 w-6 text-white" /> : <Trophy className="h-6 w-6 text-white" />}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="edu-page-title text-white tracking-tight leading-snug">
                    {isUnderReview ? 'Bài thi cần được xem xét' : 'Hoàn thành bài thi trực tuyến'}
                  </h1>
                  <span className="ui-pill ui-pill-solid inline-flex items-center gap-1 text-type-helper font-medium bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/30">
                    <Sparkles className="w-3 h-3 text-blue-200" />
                    {isUnderReview ? 'Chờ duyệt' : 'Đã nộp'}
                  </span>
                </div>

                <p className="text-type-helper sm:text-type-body-sm font-medium text-blue-100/90">
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
              <div className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-5 rounded-xl space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/90 dark:border-slate-700 pb-2.5 text-type-body">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-type-body-sm leading-5 tracking-wide">Trạng thái bài thi:</span>
                  <StatusBadge status={result.status} />
                  <span className="sr-only">
                    {result.status === 'UNDER_REVIEW' ? 'Đang được xem xét' : result.status === 'GRADED' ? 'Đã chấm điểm' : result.status === 'SUBMITTED' ? 'Đã nộp bài' : 'Chưa xác định'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/90 dark:border-slate-700 pb-2.5 text-type-body">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-type-body-sm leading-5 tracking-wide">Thời điểm nộp bài:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-type-body leading-6 tabular-nums">
                    {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây'}
                  </span>
                </div>

                {result.totalScore !== undefined && result.totalScore !== null ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700 text-type-card">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold text-type-body-sm">Điểm số đạt được:</span>
                    <span className="edu-kpi text-emerald-600">
                      {result.totalScore} / {result.maxScore || 10} điểm
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-100 text-type-helper font-medium">
                    <strong>Quy chế công bố điểm thi:</strong> Điểm số chính thức sẽ được công bố sau khi ca thi kết thúc{result.examEndTime ? ` (Dự kiến lúc ${result.examEndTime})` : ''}.
                  </div>
                )}
              </div>
            </div>

            {isUnderReview && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-5 rounded-xl space-y-3">
                <h3 className="text-type-body-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" /> Gửi giải trình sự cố
                </h3>
                <p className="text-type-helper text-amber-900 dark:text-amber-100 font-medium leading-[18px]">
                  Nếu bài thi bị gián đoạn do rớt mạng, lỗi trình duyệt hoặc lý do khách quan, bạn có thể gửi giải trình bên dưới.
                </p>

                {appealSuccess ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-100 text-type-helper leading-[18px] font-semibold">
                    Đã gửi giải trình thành công. Giám thị sẽ tiến hành xem xét biên bản.
                  </div>
                ) : (
                  <form onSubmit={(event) => { event.preventDefault(); setShowAppealConfirm(true); }} className="space-y-3">
                    <textarea
                      rows={3}
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Nhập chi tiết lý do sự cố xảy ra..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-type-body leading-6 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-normal"
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

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => router.push('/student/exam-schedule')}
                leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              >
                Về danh sách lịch thi
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setShowProfileDrawer(true)}
                  leftIcon={<Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                >
                  Chi tiết kết quả
                </Button>

                {result.allowReview !== false && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowReview(true)}
                    leftIcon={<FileText className="w-4 h-4 text-blue-600" />}
                  >
                    Xem lại bài làm
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title={result?.subjectName || result?.paperTitle || 'Kết quả bài thi'}
        subtitle={`Môn thi: ${result?.subjectCode || '—'}`}
        avatarText={result?.subjectCode?.slice(0, 2)?.toUpperCase() || 'KQ'}
        badge={{
          label: result?.status === 'UNDER_REVIEW' ? 'Chờ xem xét' : result?.status === 'GRADED' ? 'Đã chấm điểm' : 'Đã nộp bài',
          status: result?.status || 'SUBMITTED',
        }}
        details={[
          { label: 'Tên bài thi', value: result?.paperTitle || result?.subjectName || '—', icon: BookOpen },
          { label: 'Mã học phần', value: <IdentifierBadge tone="blue">{result?.subjectCode || '—'}</IdentifierBadge> },
          { label: 'Trạng thái bài thi', value: <StatusBadge status={result?.status} /> },
          { label: 'Thời gian nộp bài', value: result?.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây', icon: Clock },
          ...(result?.totalScore !== undefined && result?.totalScore !== null ? [{
            label: 'Điểm số bài thi',
            value: (
              <span className="text-type-body font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {result.totalScore} / {result.maxScore || 10} điểm
              </span>
            ),
            icon: Award,
          }] : []),
        ]}
        extraSections={[
          {
            title: 'Thao tác liên quan',
            content: (
              <div className="space-y-3">
                <p className="text-type-helper text-slate-500 font-normal leading-relaxed">
                  Kết quả bài thi được lưu trữ an toàn trong hồ sơ khảo thí điện tử của bạn. Bạn có thể xem lại lịch thi hoặc tra cứu bảng điểm tổng hợp.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowProfileDrawer(false);
                      router.push('/student/results');
                    }}
                    leftIcon={<Award className="w-3.5 h-3.5" />}
                  >
                    Xem bảng điểm
                  </Button>
                  {result?.allowReview !== false && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowProfileDrawer(false);
                        setShowReview(true);
                      }}
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                    >
                      Xem bài làm
                    </Button>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

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
        title="Gửi đơn giải trình vi phạm?"
        message="Giải trình sẽ được chuyển cho giám thị để xem xét. Bạn không thể chỉnh sửa nội dung sau khi gửi."
        type="warning"
        confirmText="Gửi giải trình"
        cancelText="Hủy bỏ"
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
