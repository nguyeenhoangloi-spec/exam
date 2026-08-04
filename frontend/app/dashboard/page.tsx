'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { DashboardWelcome } from '../../components/dashboard/DashboardWelcome';
import { DashboardStatistics } from '../../components/dashboard/DashboardStatistics';
import { ExamScheduleChart } from '../../components/dashboard/ExamScheduleChart';
import { QuestionStatusChart } from '../../components/dashboard/QuestionStatusChart';
import { UpcomingExamList } from '../../components/dashboard/UpcomingExamList';
import { PendingQuestionList } from '../../components/dashboard/PendingQuestionList';
import { ExamProgressOverview } from '../../components/dashboard/ExamProgressOverview';
import { RecentActivityList } from '../../components/dashboard/RecentActivityList';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DashboardErrorState } from '../../components/dashboard/DashboardErrorState';
import { DashboardOverview } from '../../types/dashboard';
import { User } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejecting, setRejecting] = useState<{ id: string; code: string } | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<DashboardOverview>('/dashboard/overview');
      setOverview(response.data);
    } catch (requestError: any) {
      setError(requestError.message || 'Không tải được dữ liệu tổng quan.');
    } finally {
      setLoading(false);
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

  const approve = async (id: string, code: string) => {
    if (!window.confirm(`Duyệt câu hỏi ${code}?`)) return;
    setBusyId(id);
    try {
      await api.post(`/questions/${id}/approve`);
      setToast({ message: `Đã duyệt câu hỏi ${code}.`, type: 'success' });
      await loadOverview();
    } catch (actionError: any) {
      setToast({ message: actionError.message, type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const reject = async () => {
    if (!rejecting || reason.trim().length < 3) {
      setToast({ message: 'Lý do từ chối phải có ít nhất 3 ký tự.', type: 'error' });
      return;
    }
    setBusyId(rejecting.id);
    try {
      await api.post(`/questions/${rejecting.id}/reject`, { reason: reason.trim() });
      setToast({ message: `Đã từ chối câu hỏi ${rejecting.code}.`, type: 'success' });
      setRejecting(null);
      setReason('');
      await loadOverview();
    } catch (actionError: any) {
      setToast({ message: actionError.message, type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <AppShell user={user} title="Admin Dashboard - Thống kê tổng quan">
      <main className="w-full px-6 py-6 space-y-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error || !overview ? (
          <DashboardErrorState message={error || 'Dữ liệu Dashboard không khả dụng.'} onRetry={loadOverview} />
        ) : (
          <div className="space-y-6">
            <DashboardWelcome
              username={user?.username || 'admin'}
              examCount={overview.today.examCount}
              pendingQuestionCount={overview.today.pendingQuestionCount}
            />
            <DashboardStatistics summary={overview.summary} />
            <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
              <ExamScheduleChart data={overview.examChart} />
              <QuestionStatusChart data={overview.questionStatus} />
              <UpcomingExamList exams={overview.upcomingExams} />
              <PendingQuestionList
                questions={overview.pendingQuestions}
                canReview={user?.role === 'ADMIN'}
                busyId={busyId}
                onApprove={approve}
                onReject={(id, code) => {
                  setRejecting({ id, code });
                  setReason('');
                }}
              />
              <ExamProgressOverview periods={overview.examProgress} />
              <RecentActivityList activities={overview.recentActivities} />
              <QuickActions />
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={Boolean(rejecting)}
        onClose={() => {
          setRejecting(null);
          setReason('');
        }}
        title={`Từ chối câu hỏi ${rejecting?.code || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Lý do từ chối
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nhập lý do để người tạo chỉnh sửa câu hỏi..."
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setRejecting(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Hủy
            </button>
            <button type="button" disabled={Boolean(busyId)} onClick={reject} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
