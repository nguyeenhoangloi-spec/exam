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
      <main className="px-6 py-6 space-y-6 max-w-7xl w-full mx-auto">
        <div>
          <p className="text-xs text-slate-500 font-medium">Số liệu được tổng hợp trực tiếp từ PostgreSQL tại thời điểm hiện tại</p>
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
