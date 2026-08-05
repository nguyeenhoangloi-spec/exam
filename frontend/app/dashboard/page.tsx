'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getCachedData } from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardWelcome } from '../../components/dashboard/DashboardWelcome';
import { TaskAttention } from '../../components/dashboard/TaskAttention';
import { DashboardStatistics } from '../../components/dashboard/DashboardStatistics';
import { ExamProgressOverview } from '../../components/dashboard/ExamProgressOverview';
import { ExamScheduleChart } from '../../components/dashboard/ExamScheduleChart';
import { QuestionStatusChart } from '../../components/dashboard/QuestionStatusChart';
import { UpcomingExamList } from '../../components/dashboard/UpcomingExamList';
import { PendingQuestionList } from '../../components/dashboard/PendingQuestionList';
import { RecentActivityList } from '../../components/dashboard/RecentActivityList';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DashboardErrorState } from '../../components/dashboard/DashboardErrorState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DashboardOverview } from '../../types/dashboard';
import { User } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  usePageTitle('Tổng quan');
  const router = useRouter();
  const cachedOverview = typeof window !== 'undefined' ? getCachedData<DashboardOverview>('/dashboard/overview') : null;
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(cachedOverview);
  const [loading, setLoading] = useState(!cachedOverview);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    onConfirm: () => {},
  });

  const [rejecting, setRejecting] = useState<{ id: string; code: string } | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadOverview = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setIsRefreshing(true);
    setError('');
    try {
      const response = await api.get<DashboardOverview>('/dashboard/overview');
      setOverview(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError.message || 'Không tải được dữ liệu tổng quan.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (currentUser.role !== 'ADMIN') {
      router.replace(currentUser.role === 'TEACHER' ? '/teacher/assignments' : '/student/exam-schedule');
      return;
    }
    setUser(currentUser);
    loadOverview();
  }, [loadOverview, router]);

  const approve = (id: string, code: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Phê duyệt câu hỏi',
      message: `Bạn có chắc chắn muốn duyệt câu hỏi ${code} vào Ngân hàng câu hỏi?`,
      type: 'success',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setBusyId(id);
        try {
          await api.post(`/questions/${id}/approve`);
          setToast({ message: `Đã duyệt thành công câu hỏi ${code}.`, type: 'success' });
          await loadOverview();
        } catch (actionError: any) {
          setToast({ message: actionError?.response?.data?.message || actionError.message || 'Không thể duyệt câu hỏi.', type: 'error' });
        } finally {
          setBusyId('');
        }
      },
    });
  };

  const reject = async () => {
    setReasonError('');
    if (!rejecting) return;
    if (reason.trim().length < 3) {
      setReasonError('Lý do từ chối phải có ít nhất 3 ký tự.');
      return;
    }

    setIsSubmittingReject(true);
    setBusyId(rejecting.id);
    try {
      await api.post(`/questions/${rejecting.id}/reject`, { reason: reason.trim() });
      setToast({ message: `Đã từ chối câu hỏi ${rejecting.code}.`, type: 'success' });
      setRejecting(null);
      setReason('');
      await loadOverview();
    } catch (actionError: any) {
      setToast({ message: actionError?.response?.data?.message || actionError.message || 'Không thể từ chối câu hỏi.', type: 'error' });
    } finally {
      setIsSubmittingReject(false);
      setBusyId('');
    }
  };

  return (
    <>
      <main className="w-full min-h-screen bg-[#F8FAFC] px-4 sm:px-6 py-6 space-y-6">
        {/* Section 1: Dashboard Header */}
        <DashboardHeader
          onRefresh={() => loadOverview(false)}
          isRefreshing={isRefreshing}
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error || !overview ? (
          <DashboardErrorState
            message={error || 'Dữ liệu trang tổng quan hiện chưa khả dụng.'}
            onRetry={() => loadOverview(true)}
          />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Row 1: Welcome Banner (7 cols) + Task Attention Alert Cards (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col">
                <DashboardWelcome
                  username={user?.username || 'Nguyễn Văn Admin'}
                  examCount={overview.today?.examCount || 8}
                  pendingQuestionCount={overview.today?.pendingQuestionCount || 23}
                />
              </div>
              <div className="lg:col-span-5 flex flex-col">
                <TaskAttention attention={overview.attention} />
              </div>
            </div>

            {/* Row 2: 6 KPI Statistic Cards Grid */}
            <DashboardStatistics summary={overview.summary} />

            {/* Row 3: 3 Column Layout (ExamProgress 6 cols + Bar Chart 3 cols + Donut Chart 3 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 flex flex-col">
                <ExamProgressOverview periods={overview.examProgress || []} />
              </div>
              <div className="lg:col-span-3 flex flex-col min-w-0">
                <ExamScheduleChart data={overview.examChart || []} />
              </div>
              <div className="lg:col-span-3 flex flex-col min-w-0">
                <QuestionStatusChart data={overview.questionStatus || []} />
              </div>
            </div>

            {/* Row 4: 3 Proportionate Columns (Lịch thi sắp tới 5 cols + Câu hỏi chờ duyệt 4 cols + Hoạt động vừa vặn 3 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 flex flex-col min-w-0">
                <UpcomingExamList exams={overview.upcomingExams || []} />
              </div>
              <div className="lg:col-span-4 flex flex-col min-w-0">
                <PendingQuestionList
                  questions={overview.pendingQuestions || []}
                  canReview={user?.role === 'ADMIN'}
                  busyId={busyId}
                  onApprove={approve}
                  onReject={(id, code) => {
                    setRejecting({ id, code });
                    setReason('');
                    setReasonError('');
                  }}
                  onView={(id) => router.push(`/question-bank?view=${id}`)}
                />
              </div>
              <div className="lg:col-span-3 flex flex-col min-w-0">
                <RecentActivityList activities={overview.recentActivities || []} />
              </div>
            </div>

            {/* Row 5: Sleek Horizontal Quick Actions Bar across the bottom */}
            <QuickActions />
          </div>
        )}
      </main>

      {/* Reject Question Modal */}
      <Modal
        isOpen={Boolean(rejecting)}
        onClose={() => {
          if (!isSubmittingReject) {
            setRejecting(null);
            setReason('');
            setReasonError('');
          }
        }}
        title={`Từ chối câu hỏi ${rejecting?.code || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="reject-reason" className="mb-1.5 block text-xs font-bold text-slate-700">
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError('');
              }}
              placeholder="Nhập chi tiết lý do từ chối để giảng viên chỉnh sửa..."
              className={`w-full resize-none rounded-xl border px-3 py-2.5 text-xs font-medium outline-none transition focus:ring-2 ${
                reasonError
                  ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200'
                  : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {reasonError && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {reasonError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={isSubmittingReject}
              onClick={() => {
                setRejecting(null);
                setReason('');
                setReasonError('');
              }}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmittingReject}
              onClick={reject}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs disabled:opacity-50"
            >
              {isSubmittingReject ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận từ chối</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Approve Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
