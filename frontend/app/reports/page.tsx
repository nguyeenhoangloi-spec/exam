'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { DashboardErrorState } from '../../components/dashboard/DashboardErrorState';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DashboardStatistics } from '../../components/dashboard/DashboardStatistics';
import { ExamProgressOverview } from '../../components/dashboard/ExamProgressOverview';
import { ExamScheduleChart } from '../../components/dashboard/ExamScheduleChart';
import { QuestionStatusChart } from '../../components/dashboard/QuestionStatusChart';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { User } from '../../types';
import { DashboardOverview } from '../../types/dashboard';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<DashboardOverview>('/dashboard/overview');
      setData(response.data);
    } catch (requestError: any) {
      setError(requestError.message || 'Không tải được báo cáo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) return void router.replace('/login');
    if (currentUser.role !== 'ADMIN') return void router.replace('/dashboard');
    setUser(currentUser);
    load();
  }, [load, router]);

  return (
    <AppShell user={user} title="Báo cáo tổng quan">
      <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6 xl:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-sky-700">Báo cáo quản trị</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Tổng quan hệ thống khảo thí</h1>
          <p className="mt-1 text-sm text-slate-500">Số liệu được tổng hợp trực tiếp từ PostgreSQL tại thời điểm xem báo cáo.</p>
        </div>
        {loading ? <DashboardSkeleton /> : error || !data ? (
          <DashboardErrorState message={error || 'Báo cáo không khả dụng.'} onRetry={load} />
        ) : (
          <div className="space-y-6">
            <DashboardStatistics summary={data.summary} />
            <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
              <ExamScheduleChart data={data.examChart} />
              <QuestionStatusChart data={data.questionStatus} />
              <ExamProgressOverview periods={data.examProgress} />
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
