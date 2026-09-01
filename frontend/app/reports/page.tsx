'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '../../components/PageTitleContext';
import { DashboardErrorState } from '../../components/dashboard/DashboardErrorState';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DashboardStatistics } from '../../components/dashboard/DashboardStatistics';
import { ExamProgressOverview } from '../../components/dashboard/ExamProgressOverview';
import { ExamScheduleChart } from '../../components/dashboard/ExamScheduleChart';
import { QuestionStatusChart } from '../../components/dashboard/QuestionStatusChart';
import { TaskAttention } from '../../components/dashboard/TaskAttention';
import { RecentActivityList } from '../../components/dashboard/RecentActivityList';
import { Button } from '../../components/ui/Button';
import { DataActionsDropdown } from '../../components/ui/DataActionsDropdown';
import { printReport } from '../../lib/export-print';
import api, { getCachedData } from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { User } from '../../types';
import { DashboardOverview } from '../../types/dashboard';
import { RefreshCw, BarChart2, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function ReportsPage() {
  usePageTitle('Báo cáo tổng quan');
  const router = useRouter();
  const cachedData = typeof window !== 'undefined' ? getCachedData<DashboardOverview>('/dashboard/overview') : null;
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardOverview | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (showLoading = false) => {
    if (showLoading && !data && !cachedData) setLoading(true);
    setIsRefreshing(true);
    setError('');
    try {
      const response = await api.get<DashboardOverview>('/dashboard/overview');
      setData(response.data);
    } catch (requestError: any) {
      setError(requestError.message || 'Không tải được báo cáo.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  // Cached data is an initial-render hint and must not recreate the loader after setData.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) return void router.replace('/login');
    if (currentUser.role !== 'ADMIN') return void router.replace('/dashboard');
    setUser(currentUser);
    load();
  }, [load, router]);

  const handlePrint = () => {
    if (!data) return;
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const totalQuestions = data.questionStatus?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
    const approvedQuestions = data.questionStatus?.find((q) => q.status === 'APPROVED')?.count || 0;
    const pendingQuestions = data.questionStatus?.find((q) => q.status === 'PENDING')?.count || 0;
    const rejectedQuestions = data.questionStatus?.find((q) => q.status === 'REJECTED')?.count || 0;

    printReport({
      title: 'BÁO CÁO TỔNG QUAN HỆ THỐNG KHẢO THÍ & NGÂN HÀNG ĐỀ THI',
      subtitle: `Tổng hợp số liệu thời gian thực, ngày trích xuất: ${dateStr}`,
      facultyName: 'BAN KHẢO THÍ & ĐẢM BẢO CHẤT LƯỢNG',
      metaInfo: [
        { label: 'Đơn vị lập báo cáo', value: 'Ban Khảo thí & Đảm bảo chất lượng giáo dục' },
        { label: 'Hệ thống', value: 'Exam Management System (EMS)' },
      ],
      columns: [
        { header: 'STT', width: '50px', align: 'center' },
        { header: 'Hạng mục / Chỉ số khảo thí', width: '280px', align: 'left' },
        { header: 'Số lượng / Giá trị', width: '140px', align: 'center' },
        { header: 'Ghi chú chi tiết', width: '220px', align: 'left' },
      ],
      rows: [
        [1, 'Lịch thi & Ca thi sắp diễn ra', `${data.summary?.upcomingExams?.total ?? 0} ca thi`, data.summary?.upcomingExams?.description || 'Lịch thi chuẩn bị diễn ra'],
        [2, 'Tổng số Phòng thi máy tính', `${data.summary?.examRooms?.total ?? 0} phòng`, data.summary?.examRooms?.description || 'Hệ thống phòng thi chuẩn bị'],
        [3, 'Tổng số Sinh viên / Thí sinh', `${data.summary?.students?.total ?? 0} sinh viên`, data.summary?.students?.description || 'Thí sinh đã đăng ký hệ thống'],
        [4, 'Tổng số Câu hỏi ngân hàng', `${totalQuestions} câu`, `Đã duyệt: ${approvedQuestions} câu`],
        [5, 'Số câu hỏi Chờ phê duyệt', `${pendingQuestions} câu`, 'Cần Trưởng bộ môn kiểm duyệt'],
        [6, 'Số câu hỏi Bị từ chối', `${rejectedQuestions} câu`, 'Cần chỉnh sửa lại nội dung'],
      ],
      footerNotes: 'Báo cáo trích xuất trực tiếp từ cơ sở dữ liệu PostgreSQL của hệ thống khảo thí.',
      signers: [
        { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỞNG BAN KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
      ],
      templateCode: 'EXAM_SUMMARY_REPORT',
    });
  };

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
            Báo cáo tổng quan hệ thống
          </h1>
          <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            Số liệu tổng hợp thời gian thực từ PostgreSQL về Lịch thi, Ngân hàng đề, Phòng thi và Hoạt động khảo thí.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <DataActionsDropdown
            onPrintReport={handlePrint}
          />
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error || !data ? (
        <DashboardErrorState message={error || 'Báo cáo không khả dụng.'} onRetry={() => load(true)} />
      ) : (
        <div className="space-y-5">
          {/* Section 1: KPI Stats (6 Cards) */}
          <DashboardStatistics summary={data.summary} questionStatus={data.questionStatus} />

          {/* Section 2: Charts Row 1 (Grid 12 - Proper Col Spanning) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-5 flex flex-col min-w-0">
              <ExamScheduleChart data={data.examChart || []} />
            </div>
            <div className="lg:col-span-4 flex flex-col min-w-0">
              <QuestionStatusChart data={data.questionStatus || []} />
            </div>
            <div className="lg:col-span-3 flex flex-col min-w-0">
              <TaskAttention attention={data.attention} />
            </div>
          </div>

          {/* Section 3: Charts Row 2 (Grid 12 - Proper Col Spanning) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-8 flex flex-col min-w-0">
              <ExamProgressOverview periods={data.examProgress || []} />
            </div>
            <div className="lg:col-span-4 flex flex-col min-w-0">
              <RecentActivityList activities={data.recentActivities || []} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
