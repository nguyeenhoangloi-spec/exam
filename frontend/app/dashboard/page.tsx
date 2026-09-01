'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getCachedData } from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';

import { TaskAttention } from '../../components/dashboard/TaskAttention';
import { DashboardStatistics } from '../../components/dashboard/DashboardStatistics';
import { ExamProgressOverview } from '../../components/dashboard/ExamProgressOverview';
import { ExamScheduleChart } from '../../components/dashboard/ExamScheduleChart';
import { QuestionStatusChart } from '../../components/dashboard/QuestionStatusChart';
import { UpcomingExamList } from '../../components/dashboard/UpcomingExamList';
import { PendingQuestionList } from '../../components/dashboard/PendingQuestionList';
import { RecentActivityList } from '../../components/dashboard/RecentActivityList';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DashboardErrorState } from '../../components/dashboard/DashboardErrorState';
import { QuickActionsBar } from '../../components/dashboard/QuickActionsBar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { printReport } from '../../lib/export-print';
import { DashboardOverview } from '../../types/dashboard';
import { User } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  usePageTitle('Tổng quan');
  const router = useRouter();
  const cachedOverview = typeof window !== 'undefined' ? getCachedData<DashboardOverview>('/dashboard/overview') : null;
  const [user, setUser] = useState<User | null>(() => (typeof window !== 'undefined' ? getAuthUser() : null));
  const [overview, setOverview] = useState<DashboardOverview | null>(cachedOverview);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
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
      title: 'Phê duyệt câu hỏi?',
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

  const handleExportPDF = () => {
    if (!overview) return;

    const periodMap: Record<string, string> = {
      ALL: 'Tất cả đợt thi & Học kỳ',
      HK2_2025_2026: 'Học kỳ 2 (Năm học 2025 - 2026)',
      HK1_2025_2026: 'Học kỳ 1 (Năm học 2025 - 2026)',
      HK_HE_2025: 'Học kỳ Hè (Năm học 2024 - 2025)',
    };
    const periodLabel = periodMap[selectedPeriod] || 'Tất cả đợt thi';

    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const totalQuestions = overview.questionStatus?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
    const approvedQuestions = overview.questionStatus?.find((q) => q.status === 'APPROVED')?.count || 0;
    const pendingQuestions = overview.questionStatus?.find((q) => q.status === 'PENDING')?.count || 0;
    const rejectedQuestions = overview.questionStatus?.find((q) => q.status === 'REJECTED')?.count || 0;

    printReport({
      title: 'BÁO CÁO TỔNG QUAN HỆ THỐNG KHẢO THÍ & NGÂN HÀNG ĐỀ THI',
      subtitle: `Học kỳ / Đợt thi: ${periodLabel}, ngày xuất báo cáo: ${dateStr}`,
      metaInfo: [
        { label: 'Đơn vị lập báo cáo', value: 'Ban Khảo thí & Đảm bảo chất lượng giáo dục' },
        { label: 'Hệ thống', value: 'Hệ thống Quản lý Khảo thí Exam Management System' },
      ],
      columns: [
        { header: 'STT', width: '50px', align: 'center' },
        { header: 'Hạng mục / Chỉ số khảo thí', width: '260px', align: 'left' },
        { header: 'Số lượng / Giá trị', width: '130px', align: 'center' },
        { header: 'Ghi chú chi tiết', width: '200px', align: 'left' },
      ],
      rows: [
        [1, 'Ca thi & Lịch thi sắp diễn ra', `${overview.summary?.upcomingExams?.total ?? 0} ca thi`, overview.summary?.upcomingExams?.description || 'Lịch thi khảo thí'],
        [2, 'Tổng số Phòng thi máy tính', `${overview.summary?.examRooms?.total ?? 0} phòng`, overview.summary?.examRooms?.description || 'Hệ thống phòng thi'],
        [3, 'Tổng số Thí sinh đã đăng ký', `${overview.summary?.students?.total ?? 0} sinh viên`, overview.summary?.students?.description || 'Tài khoản hệ thống'],
        [4, 'Tổng số Câu hỏi trong Ngân hàng đề', `${totalQuestions} câu`, `Đã phê duyệt: ${approvedQuestions} câu`],
        [5, 'Số câu hỏi Chờ phê duyệt', `${pendingQuestions} câu`, 'Cần Trưởng bộ môn kiểm duyệt'],
        [6, 'Số câu hỏi Bị từ chối', `${rejectedQuestions} câu`, 'Cần giảng viên biên soạn lại'],
      ],
      footerNotes: 'Báo cáo được trích xuất tự động từ cơ sở dữ liệu hệ thống khảo thí.',
      signers: [
        { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỜNG BAN KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
      ],
    });
  };

  return (
    <>
      <main className="w-full space-y-5 px-6 py-6 min-h-screen text-slate-900 dark:text-slate-100">

        {/* Section 1: Single-Row Compact Header */}
        <DashboardHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error || !overview ? (
          <DashboardErrorState
            message={error || 'Dữ liệu trang tổng quan hiện chưa khả dụng.'}
            onRetry={() => loadOverview(true)}
          />
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Section 2: 6 KPI Statistic Cards Grid (High up near header) */}
            <DashboardStatistics
              summary={overview.summary}
              questionStatus={overview.questionStatus}
            />

            {/* Section 3: Quick Action Launchpad Bar (1-click shortcuts) */}
            <QuickActionsBar />

            {/* Section 4: Row 2 - Biểu đồ Lịch thi (7 cols) + Donut Trạng thái câu hỏi (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-7 flex flex-col min-w-0">
                <ExamScheduleChart data={overview.examChart || []} />
              </div>
              <div className="lg:col-span-5 flex flex-col min-w-0">
                <QuestionStatusChart data={overview.questionStatus || []} />
              </div>
            </div>

            {/* Section 4: Row 3 - Kỳ thi sắp tới (6 cols) + Tác vụ cần xử lý (3 cols) + Hoạt động gần đây (3 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-12 xl:col-span-6 flex flex-col min-w-0">
                <UpcomingExamList exams={overview.upcomingExams || []} />
              </div>
              <div className="lg:col-span-6 xl:col-span-3 flex flex-col min-w-0">
                <TaskAttention attention={overview.attention} />
              </div>
              <div className="lg:col-span-6 xl:col-span-3 flex flex-col min-w-0">
                <RecentActivityList activities={overview.recentActivities || []} />
              </div>
            </div>

            {/* Section 5: Row 4 - Tiến độ đợt thi (4 cols) + Câu hỏi chờ duyệt (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-4 flex flex-col min-w-0">
                <ExamProgressOverview periods={overview.examProgress || []} />
              </div>
              <div className="lg:col-span-8 flex flex-col min-w-0">
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
            </div>
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
            <label htmlFor="reject-reason" className="mb-1.5 block text-type-body font-medium text-slate-700">
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
              className={`w-full resize-none rounded-xl border px-3 py-2.5 text-type-body font-normal outline-none transition focus:ring-2 ${
                reasonError
                  ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200'
                  : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {reasonError && (
              <p className="mt-1 text-type-helper font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {reasonError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSubmittingReject}
              onClick={() => {
                setRejecting(null);
                setReason('');
                setReasonError('');
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={isSubmittingReject}
              isLoading={isSubmittingReject}
              onClick={reject}
            >
              Xác nhận từ chối
            </Button>
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
