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
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { ProfileDrawer } from '@/components/ProfileDrawer';
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang tải thông tin kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Không thể tải kết quả</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{error}</p>
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
  const isEssayWaiting = Boolean(result.gradingStatus && result.gradingStatus !== 'PUBLISHED');

  if (isEssayWaiting) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 md:p-12 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center shadow-2xs space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Bài đã nộp, đang chờ chấm điểm</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
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
              <div className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-5 rounded-xl space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2.5 text-[15px]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-[14px] leading-5 tracking-wide">Trạng thái bài thi:</span>
                  <StatusBadge status={result.status} />
                  <span className="sr-only">
                    {result.status === 'UNDER_REVIEW' ? 'Đang được xem xét' : result.status === 'GRADED' ? 'Đã chấm điểm' : result.status === 'SUBMITTED' ? 'Đã nộp bài' : result.status}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2.5 text-[15px]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-[14px] leading-5 tracking-wide">Thời điểm nộp bài:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] leading-6 tabular-nums">
                    {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây'}
                  </span>
                </div>

                {result.totalScore !== undefined && result.totalScore !== null ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700 text-[18px]">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm">Điểm số đạt được:</span>
                    <span className="edu-kpi text-emerald-600">
                      {result.totalScore} / {result.maxScore || 10} điểm
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-100 text-xs font-medium">
                    <strong>Quy chế công bố điểm thi:</strong> Điểm số chính thức sẽ được công bố sau khi ca thi kết thúc{result.examEndTime ? ` (Dự kiến lúc ${result.examEndTime})` : ''}.
                  </div>
                )}
              </div>
            </div>

            {isUnderReview && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-5 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" /> Gửi giải trình sự cố
                </h3>
                <p className="text-[13px] text-amber-900 dark:text-amber-100 font-medium leading-[18px]">
                  Nếu bài thi bị gián đoạn do rớt mạng, lỗi trình duyệt hoặc lý do khách quan, bạn có thể gửi giải trình bên dưới.
                </p>

                {appealSuccess ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-100 text-[13px] leading-[18px] font-semibold">
                    Đã gửi giải trình thành công. Giám thị sẽ tiến hành xem xét biên bản.
                  </div>
                ) : (
                  <form onSubmit={(event) => { event.preventDefault(); setShowAppealConfirm(true); }} className="space-y-3">
                    <textarea
                      rows={3}
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Nhập chi tiết lý do sự cố xảy ra..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-normal"
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
        subtitle={`Môn thi: ${result?.subjectCode || '---'}`}
        avatarText={result?.subjectCode?.slice(0, 2)?.toUpperCase() || 'KQ'}
        badge={{
          label: result?.status === 'UNDER_REVIEW' ? 'Chờ xem xét' : result?.status === 'GRADED' ? 'Đã chấm điểm' : 'Đã nộp bài',
          status: result?.status || 'SUBMITTED',
        }}
        details={[
          { label: 'Tên bài thi', value: result?.paperTitle || result?.subjectName || '---', icon: BookOpen },
          { label: 'Mã học phần', value: <IdentifierBadge tone="blue">{result?.subjectCode || '---'}</IdentifierBadge> },
          { label: 'Trạng thái bài thi', value: <StatusBadge status={result?.status} /> },
          { label: 'Thời gian nộp bài', value: result?.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây', icon: Clock },
          ...(result?.totalScore !== undefined && result?.totalScore !== null ? [{
            label: 'Điểm số bài thi',
            value: (
              <span className="text-[15px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
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
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
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
