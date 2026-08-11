'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Clock3,
  DatabaseBackup,
  HardDrive,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/Modal';
import { Toast } from '../../../components/Toast';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { CriticalConfirmModal, CriticalConfirmPayload } from '../../../components/CriticalConfirmModal';
import { StatusBadge } from '../../../components/common/StatusBadge';

type BackupStatus = 'QUEUED' | 'RUNNING' | 'VERIFYING' | 'SUCCEEDED' | 'FAILED' | 'VERIFY_FAILED' | 'CANCELLED';
type RestoreTarget = 'STAGING' | 'PRODUCTION';

interface BackupJob {
  id: string;
  snapshotId: string;
  type: string;
  status: BackupStatus;
  checksum?: string | null;
  sizeBytes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  errorMessage?: string | null;
  retained?: boolean;
}

interface Overview {
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  timezone: string;
  schedule: string;
  retention: { daily: number; weekly: number; monthly: number };
  latest: BackupJob | null;
  running: number;
  failed24h: number;
  pendingRestores: number;
  totalBytes: string;
}

interface RestoreRequest {
  id: string;
  target: RestoreTarget;
  status: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  backupJob: BackupJob;
  requestedBy?: { id: number; username: string };
  approvedBy?: { id: number; username: string } | null;
}

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
    : 'Chưa có';

const formatBytes = (value?: string | null) => {
  const bytes = Number(value || 0);
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
};

export default function BackupsPage() {
  usePageTitle('Sao lưu & khôi phục');
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [restoreRequests, setRestoreRequests] = useState<RestoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Restore Modal State
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);
  const [target, setTarget] = useState<RestoreTarget>('STAGING');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Critical Confirm Modal State
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [activeRestoreRequest, setActiveRestoreRequest] = useState<RestoreRequest | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [overviewResponse, jobsResponse, restoreResponse] = await Promise.all([
        api.get<Overview>('/backups/overview', { params: { noCache: true } }),
        api.get<{ items: BackupJob[] }>('/backups/jobs', { params: { page: 1, limit: 50, noCache: true } }),
        api.get<RestoreRequest[]>('/backups/restore-requests', { params: { noCache: true } }),
      ]);
      setOverview(overviewResponse.data);
      setJobs(jobsResponse.data.items || []);
      setRestoreRequests(restoreResponse.data || []);
    } catch (error: any) {
      if (error?.response?.status === 403) router.replace('/dashboard');
      else setToast({ message: error?.message || 'Không thể tải trạng thái backup.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    void fetchData();
  }, [fetchData, router]);

  useEffect(() => {
    if (!overview?.running) return;
    const timer = window.setInterval(() => void fetchData(true), 5000);
    return () => window.clearInterval(timer);
  }, [overview?.running, fetchData]);

  const verifiedJobs = useMemo(() => jobs.filter((job) => job.status === 'SUCCEEDED' && job.retained !== false), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !search.trim() ||
        job.snapshotId.toLowerCase().includes(search.toLowerCase()) ||
        (job.errorMessage || '').toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || job.type === filterType;
      const matchStatus = !filterStatus || job.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [jobs, search, filterType, filterStatus]);

  const createBackup = async () => {
    setActionLoading(true);
    try {
      await api.post('/backups/jobs', { type: 'FULL', reason: 'Tạo thủ công từ trang quản trị' });
      setToast({ message: 'Đã đưa yêu cầu backup vào hàng đợi.', type: 'success' });
      await fetchData(true);
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể tạo job backup.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openRestoreModal = (job: BackupJob) => {
    setSelectedJob(job);
    setTarget('STAGING');
    setReason('');
    setRestoreOpen(true);
  };

  const openCriticalApproveModal = (request: RestoreRequest) => {
    setActiveRestoreRequest(request);
    setCriticalModalOpen(true);
  };

  const handleRequestRestore = async () => {
    if (!selectedJob || !reason.trim()) {
      setToast({ message: 'Vui lòng nhập lý do restore.', type: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await api.post('/backups/restore-requests', {
        backupJobId: selectedJob.id,
        target,
        reason: reason.trim(),
      });
      setToast({ message: 'Đã tạo yêu cầu restore. Vui lòng phê duyệt để thực hiện.', type: 'success' });
      setRestoreOpen(false);

      if (response.data?.id) {
        setActiveRestoreRequest({
          id: response.data.id,
          target,
          status: 'PENDING_APPROVAL',
          reason: reason.trim(),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          backupJob: selectedJob,
        });
        setCriticalModalOpen(true);
      }
      await fetchData(true);
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể tạo yêu cầu restore.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCriticalConfirmApprove = async (payload: CriticalConfirmPayload) => {
    if (!activeRestoreRequest) return;
    try {
      await api.post(`/backups/restore-requests/${activeRestoreRequest.id}/approve`, {
        currentPassword: payload.password,
        confirmationPhrase: payload.confirmPhrase,
      });
      setToast({ message: 'Phê duyệt khôi phục dữ liệu thành công! Tiến trình đang được xử lý.', type: 'success' });
      setCriticalModalOpen(false);
      setActiveRestoreRequest(null);
      await fetchData(true);
    } catch (error: any) {
      throw error;
    }
  };

  const getBackupStatusBadge = (jobStatus: BackupStatus) => {
    switch (jobStatus) {
      case 'SUCCEEDED':
        return <StatusBadge status="COMPLETED" customLabel="Thành công" />;
      case 'RUNNING':
        return <StatusBadge status="ONGOING" customLabel="Đang chạy" />;
      case 'VERIFYING':
        return <StatusBadge status="UNDER_REVIEW" customLabel="Đang kiểm tra" />;
      case 'QUEUED':
        return <StatusBadge status="PENDING" customLabel="Đang chờ" />;
      case 'FAILED':
      case 'VERIFY_FAILED':
        return <StatusBadge status="CANCELLED" customLabel="Thất bại" />;
      default:
        return <StatusBadge status="DRAFT" customLabel={jobStatus} />;
    }
  };

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header matching standard page header across all management pages */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-[36px] text-[#0F172A] tracking-tight">
            Sao lưu & khôi phục dữ liệu
          </h1>
          <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
            Theo dõi an toàn database, file upload và các snapshot hệ thống · Lịch chạy: <strong>{overview?.schedule || '02:00'}</strong> ({overview?.timezone || 'Asia/Ho_Chi_Minh'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => void fetchData(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="h-4 w-4 text-[#64748B]" />}
          >
            Làm mới
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void createBackup()}
            isLoading={actionLoading}
            leftIcon={<DatabaseBackup className="h-4 w-4" />}
          >
            Backup ngay
          </Button>
        </div>
      </div>

      {/* Dynamic KPI Cards Row matching ExamPeriodKPICards 100% */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Snapshot gần nhất', value: formatDate(overview?.latest?.completedAt), note: overview?.latest?.snapshotId || 'Chưa có snapshot', icon: Clock3 },
          { label: 'Kiểm tra Database', value: overview?.latest?.status === 'SUCCEEDED' ? 'Đã xác thực' : 'Chưa xác thực', note: overview?.latest?.checksum ? `SHA-256: ${overview.latest.checksum.slice(0, 10)}…` : 'Đang chờ dữ liệu', icon: DatabaseBackup },
          { label: 'File Uploads', value: overview?.latest?.status === 'SUCCEEDED' ? 'Đã đồng bộ' : 'Chưa đồng bộ', note: 'Đề thi & bài làm sinh viên', icon: HardDrive },
          { label: 'Dung lượng tổng', value: formatBytes(overview?.totalBytes), note: `${overview?.failed24h || 0} lỗi trong 24h qua`, icon: ShieldCheck },
        ].map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.label}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[13px] font-semibold text-[#64748B] tracking-wider truncate block">
                    {card.label}
                  </span>
                  <p className="text-[24px] xl:text-[26px] font-bold text-[#0F172A] leading-[32px] truncate">
                    {loading ? 'Đang tải…' : card.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100/80">
                <span className="text-[13px] font-normal text-[#64748B] truncate block">
                  {card.note}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Snapshot ID, mã lỗi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 h-9 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Loại:</span>
            <FilterSelect
              size="sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="FULL">FULL Backup</option>
              <option value="INCREMENTAL">INCREMENTAL</option>
            </FilterSelect>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Trạng thái:</span>
            <FilterSelect
              size="sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUCCEEDED">Thành công</option>
              <option value="RUNNING">Đang chạy</option>
              <option value="VERIFYING">Đang kiểm tra</option>
              <option value="QUEUED">Đang chờ</option>
              <option value="FAILED">Thất bại</option>
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* Dynamic Table Action Toolbar matching ExamPeriodTableToolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <span className="text-xs font-semibold text-slate-600">
          <span className="font-bold text-slate-900">{filteredJobs.length.toLocaleString('vi-VN')}</span> kết quả snapshot
        </span>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Retention: <strong>{overview?.retention?.daily || 14}d / {overview?.retention?.weekly || 8}w / {overview?.retention?.monthly || 12}m</strong></span>
          <span className="rounded-xl bg-blue-50 px-2.5 py-1 font-bold text-blue-700 border border-blue-200/70">{verifiedJobs.length} bản hợp lệ</span>
        </div>
      </div>

      {/* Main Snapshot Table matching ExamPeriodTable standard */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-[15px] text-[#334155]">
          <thead className="bg-slate-50 text-[14px] font-semibold uppercase tracking-wider text-[#475569] border-b border-slate-200">
            <tr>
              <th scope="col" className="p-3.5 pl-4 min-w-[220px]">Snapshot ID</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Loại</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian hoàn thành</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Dung lượng</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>
              <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-500">
                  Đang tải danh sách snapshot…
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-500">
                  Không tìm thấy bản snapshot phù hợp.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="transition hover:bg-blue-50/40">
                  <td className="p-3.5 pl-4 min-w-[220px]">
                    <div className="font-mono text-xs font-extrabold text-slate-900">{job.snapshotId}</div>
                    {job.errorMessage && <div className="mt-1 max-w-[280px] truncate text-xs font-semibold text-rose-600">{job.errorMessage}</div>}
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">{job.type}</td>
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">{formatDate(job.completedAt || job.createdAt)}</td>
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-900">{formatBytes(job.sizeBytes)}</td>
                  <td className="p-3.5 whitespace-nowrap">{getBackupStatusBadge(job.status)}</td>
                  <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                    {job.status === 'SUCCEEDED' && job.retained !== false ? (
                      <Button size="sm" variant="outline" onClick={() => openRestoreModal(job)} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
                        Khôi phục
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">{job.status === 'SUCCEEDED' ? 'Hết retention' : 'Không khả dụng'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pending Restore Requests Table (if any) */}
      {restoreRequests.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Yêu cầu khôi phục đang chờ xử lý ({restoreRequests.length})</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-amber-200/90 bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-[15px] text-[#334155]">
              <thead className="bg-amber-50/60 text-[14px] font-semibold uppercase tracking-wider text-amber-900 border-b border-amber-200">
                <tr>
                  <th scope="col" className="p-3.5 pl-4">Snapshot ID</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap">Môi trường</th>
                  <th scope="col" className="p-3.5">Lý do khôi phục</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap">Người yêu cầu</th>
                  <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium">
                {restoreRequests.map((request) => (
                  <tr key={request.id} className="transition hover:bg-amber-50/30">
                    <td className="p-3.5 pl-4 font-mono text-xs font-extrabold text-slate-900">{request.backupJob.snapshotId}</td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-amber-900">{request.target}</td>
                    <td className="p-3.5 text-xs font-semibold text-slate-700">{request.reason}</td>
                    <td className="p-3.5 whitespace-nowrap text-xs font-bold text-slate-800">{request.requestedBy?.username || 'admin'}</td>
                    <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                      {request.status === 'PENDING_APPROVAL' ? (
                        <Button size="sm" variant="warning" onClick={() => openCriticalApproveModal(request)} leftIcon={<LockKeyhole className="h-3.5 w-3.5" />}>
                          Phê duyệt an toàn
                        </Button>
                      ) : (
                        getBackupStatusBadge(request.status as any)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Initial Restore Creation Modal */}
      <Modal isOpen={restoreOpen} onClose={() => !actionLoading && setRestoreOpen(false)} title="Tạo yêu cầu khôi phục dữ liệu" size="md">
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Khôi phục dữ liệu là thao tác nhạy cảm. Hãy chắc chắn bạn đã chọn đúng môi trường và bản snapshot.</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Snapshot đã chọn</p>
            <p className="mt-1 font-mono text-xs font-extrabold text-slate-900">{selectedJob?.snapshotId}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {formatDate(selectedJob?.completedAt)} · {formatBytes(selectedJob?.sizeBytes)}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Môi trường đích:</label>
            <FilterSelect
              size="md"
              className="w-full"
              containerClassName="w-full"
              value={target}
              onChange={(e) => setTarget(e.target.value as RestoreTarget)}
            >
              <option value="STAGING">Staging — Môi trường kiểm thử an toàn</option>
              <option value="PRODUCTION">Production — Môi trường vận hành thực tế</option>
            </FilterSelect>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Lý do khôi phục <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Mô tả cụ thể sự cố cần phục hồi hoặc mục đích thử nghiệm..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setRestoreOpen(false)} disabled={actionLoading}>
              Hủy bỏ
            </Button>
            <Button size="md" onClick={() => void handleRequestRestore()} isLoading={actionLoading} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Tạo yêu cầu
            </Button>
          </div>
        </div>
      </Modal>

      {/* Critical Confirm Modal for High-Security Restore Approval (GEMINI.md Rule) */}
      {activeRestoreRequest && (
        <CriticalConfirmModal
          isOpen={criticalModalOpen}
          onClose={() => setCriticalModalOpen(false)}
          title={`Xác thực khôi phục dữ liệu (${activeRestoreRequest.target})`}
          warningMessage={`Thao tác khôi phục sẽ GHI ĐÈ dữ liệu hiện tại trên môi trường ${activeRestoreRequest.target} bằng bản snapshot ${activeRestoreRequest.backupJob.snapshotId}. Mọi thay đổi phát sinh sau thời điểm snapshot sẽ bị mất!`}
          confirmPhrase="RESTORE DATABASE"
          actionButtonText="Phê duyệt & Khôi phục ngay"
          reasons={[
            activeRestoreRequest.reason || 'Khôi phục dữ liệu theo sự cố hệ thống',
            'Khôi phục dữ liệu theo kiểm tra định kỳ',
            'Yêu cầu khôi phục thử nghiệm trên Staging',
            'Lý do khác',
          ]}
          onConfirm={handleCriticalConfirmApprove}
        />
      )}
    </main>
  );
}
