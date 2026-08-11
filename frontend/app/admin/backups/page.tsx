'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  Copy,
  Database,
  DatabaseBackup,
  FileCode,
  FileText,
  Filter,
  HardDrive,
  Info,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User as UserIcon,
  X,
  XCircle,
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

type BackupJobType = 'FULL' | 'DATABASE' | 'UPLOADS' | 'SAFETY';
type BackupStatus = 'QUEUED' | 'RUNNING' | 'VERIFYING' | 'SUCCEEDED' | 'FAILED' | 'VERIFY_FAILED' | 'CANCELLED';
type RestoreTarget = 'STAGING' | 'PRODUCTION';

interface BackupJob {
  id: string;
  snapshotId: string;
  type: BackupJobType;
  status: BackupStatus;
  storageKey?: string | null;
  manifestKey?: string | null;
  checksum?: string | null;
  sizeBytes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  appCommit?: string | null;
  migration?: string | null;
  errorMessage?: string | null;
  retained?: boolean;
  createdAt: string;
  initiatedBy?: { id: number; username: string } | null;
}

interface Overview {
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  timezone: string;
  schedule: string;
  retention: { daily: number; weekly: number; monthly: number };
  worker: {
    enabled: boolean;
    schedule: string;
    lastError: string | null;
    lastErrorAt: string | null;
  };
  storage: {
    provider: 'LOCAL' | 'S3';
    isLocal: boolean;
    bucketName: string | null;
    warning: string | null;
  };
  tools: {
    pgDumpAvailable: boolean;
    pgRestoreAvailable: boolean;
  };
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
  confirmationPhrase?: string;
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

const calculateDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '—';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 1000) return `${diffMs} ms`;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs} giây`;
  const mins = Math.floor(secs / 60);
  return `${mins} phút ${secs % 60} giây`;
};

export default function BackupsPage() {
  usePageTitle('Sao lưu & khôi phục');
  const router = useRouter();
  const currentUser = getAuthUser();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [restoreRequests, setRestoreRequests] = useState<RestoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>(''); // 'ALL' | 'MANUAL' | 'SCHEDULED'
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Drawer Detail State
  const [detailJob, setDetailJob] = useState<BackupJob | null>(null);
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  // Restore Modal State
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);
  const [target, setTarget] = useState<RestoreTarget>('STAGING');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Critical Approval Modal State
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [activeRestoreRequest, setActiveRestoreRequest] = useState<RestoreRequest | null>(null);
  const [dynamicPhrase, setDynamicPhrase] = useState<string>('RESTORE DATABASE');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [overviewResponse, jobsResponse, restoreResponse] = await Promise.all([
        api.get<Overview>('/backups/overview', { params: { noCache: true } }),
        api.get<{ items: BackupJob[] }>('/backups/jobs', {
          params: {
            page: 1,
            limit: 100,
            noCache: true,
            type: filterType || undefined,
            status: filterStatus || undefined,
            isScheduled: filterMode === 'SCHEDULED' ? 'true' : filterMode === 'MANUAL' ? 'false' : undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            search: search.trim() || undefined,
          },
        }),
        api.get<RestoreRequest[]>('/backups/restore-requests', { params: { noCache: true } }),
      ]);
      setOverview(overviewResponse.data);
      setJobs(jobsResponse.data.items || []);
      setRestoreRequests(restoreResponse.data || []);
    } catch (error: any) {
      if (error?.response?.status === 403) router.replace('/dashboard');
      else if (!silent) setToast({ message: error?.message || 'Không thể tải dữ liệu quản lý backup.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, filterType, filterStatus, filterMode, fromDate, toDate, search]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    void fetchData();
  }, [fetchData, router, currentUser]);

  useEffect(() => {
    if (!overview?.running) return;
    const timer = window.setInterval(() => void fetchData(true), 5000);
    return () => window.clearInterval(timer);
  }, [overview?.running, fetchData]);

  const verifiedJobs = useMemo(() => jobs.filter((job) => job.status === 'SUCCEEDED' && job.retained !== false), [jobs]);

  const createBackup = async (type: BackupJobType = 'FULL') => {
    setActionLoading(true);
    try {
      await api.post('/backups/jobs', { type, reason: 'Tạo thủ công từ trang quản trị' });
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
    // Use confirmation phrase from backend if available, or fall back
    setDynamicPhrase(request.confirmationPhrase || 'RESTORE DATABASE');
    setCriticalModalOpen(true);
  };

  const handleRequestRestore = async () => {
    if (!selectedJob || !reason.trim()) {
      setToast({ message: 'Vui lòng nhập lý do khôi phục.', type: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await api.post('/backups/restore-requests', {
        backupJobId: selectedJob.id,
        target,
        reason: reason.trim(),
      });
      setToast({ message: 'Đã tạo yêu cầu khôi phục. Vui lòng xác nhận phê duyệt.', type: 'success' });
      setRestoreOpen(false);

      if (response.data?.id) {
        const createdReq: RestoreRequest = {
          id: response.data.id,
          target,
          status: 'PENDING_APPROVAL',
          reason: reason.trim(),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          backupJob: selectedJob,
          requestedBy: { id: currentUser?.id || 0, username: currentUser?.username || 'admin' },
          confirmationPhrase: response.data.confirmationPhrase,
        };
        setActiveRestoreRequest(createdReq);
        setDynamicPhrase(response.data.confirmationPhrase || 'RESTORE DATABASE');
        setCriticalModalOpen(true);
      }
      await fetchData(true);
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể tạo yêu cầu khôi phục.', type: 'error' });
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
      setToast({ message: 'Phê duyệt khôi phục dữ liệu thành công! Tiến trình đang chạy.', type: 'success' });
      setCriticalModalOpen(false);
      setActiveRestoreRequest(null);
      await fetchData(true);
    } catch (error: any) {
      throw error;
    }
  };

  const handleCopyChecksum = (text?: string | null) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  const getBackupStatusBadge = (jobStatus: BackupStatus) => {
    switch (jobStatus) {
      case 'SUCCEEDED':
        return <StatusBadge status="COMPLETED" customLabel="Thành công" />;
      case 'RUNNING':
        return <StatusBadge status="ONGOING" customLabel="Đang chạy" />;
      case 'VERIFYING':
        return <StatusBadge status="UNDER_REVIEW" customLabel="Đang verify" />;
      case 'QUEUED':
        return <StatusBadge status="PENDING" customLabel="Đang chờ" />;
      case 'FAILED':
      case 'VERIFY_FAILED':
        return <StatusBadge status="CANCELLED" customLabel="Thất bại" />;
      default:
        return <StatusBadge status="DRAFT" customLabel={jobStatus} />;
    }
  };

  const isSelfApprovalBlocked = (request: RestoreRequest) => {
    return request.target === 'PRODUCTION' && request.requestedBy?.id === currentUser?.id;
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
            Màn hình vận hành an toàn database, file upload và các snapshot hệ thống khảo thí
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
            onClick={() => void createBackup('FULL')}
            isLoading={actionLoading}
            leftIcon={<DatabaseBackup className="h-4 w-4" />}
          >
            Backup ngay
          </Button>
        </div>
      </div>

      {/* Local Storage Warning Banner */}
      {overview?.storage?.isLocal && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold leading-snug">{overview.storage.warning}</p>
              <p className="text-xs font-medium text-amber-800/90 mt-0.5">
                Các bản snapshot được lưu ở thư mục cục bộ của máy chủ backend. Khuyên dùng Amazon S3 / MinIO đối với môi trường Production chính thức.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-xl bg-amber-200/70 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300/80">
            LOCAL STORAGE
          </span>
        </div>
      )}

      {/* Operational System Cards (Worker, Storage, System Tools, KPI) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Worker Status */}
        <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[#64748B] tracking-wider block truncate">
                Backup Worker
              </span>
              <p className="text-[20px] xl:text-[22px] font-bold text-[#0F172A] leading-[28px] truncate flex items-center gap-2">
                {overview?.worker?.enabled ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Đang hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 font-bold">
                    <XCircle className="h-4 w-4" /> Chưa kích hoạt
                  </span>
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100/80 text-[13px] font-normal text-[#64748B]">
            Lịch chạy: <strong>{overview?.worker?.schedule || '02:00'}</strong> ({overview?.timezone || 'Asia/Ho_Chi_Minh'})
          </div>
        </div>

        {/* Card 2: Storage Connection */}
        <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[#64748B] tracking-wider block truncate">
                Nơi lưu trữ (Storage)
              </span>
              <p className="text-[20px] xl:text-[22px] font-bold text-[#0F172A] leading-[28px] truncate">
                {overview?.storage?.provider === 'S3' ? 'Amazon S3 / MinIO' : 'Ổ đĩa Local'}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100/80 text-[13px] font-normal text-[#64748B] truncate">
            {overview?.storage?.bucketName ? `Bucket: ${overview.storage.bucketName}` : 'Thư mục máy chủ cục bộ'}
          </div>
        </div>

        {/* Card 3: System Tools pg_dump/pg_restore */}
        <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[#64748B] tracking-wider block truncate">
                Công cụ Database CLI
              </span>
              <div className="flex items-center gap-3 text-xs font-bold pt-1">
                <span className={`inline-flex items-center gap-1 ${overview?.tools?.pgDumpAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {overview?.tools?.pgDumpAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} pg_dump
                </span>
                <span className={`inline-flex items-center gap-1 ${overview?.tools?.pgRestoreAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {overview?.tools?.pgRestoreAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} pg_restore
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition">
              <Terminal className="h-5 w-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100/80 text-[13px] font-normal text-[#64748B]">
            {overview?.tools?.pgDumpAvailable && overview?.tools?.pgRestoreAvailable ? 'Sẵn sàng sao lưu & phục hồi' : 'Thiếu công cụ PostgreSQL CLI'}
          </div>
        </div>

        {/* Card 4: Total Capacity & Health */}
        <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[#64748B] tracking-wider block truncate">
                Dung lượng tổng
              </span>
              <p className="text-[24px] xl:text-[26px] font-bold text-[#0F172A] leading-[32px] truncate">
                {formatBytes(overview?.totalBytes)}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100/80 text-[13px] font-normal text-[#64748B] truncate">
            {verifiedJobs.length} bản hợp lệ · {overview?.failed24h || 0} lỗi 24h
          </div>
        </div>
      </div>

      {/* Advanced Filter Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
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
          {/* Filter Type */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Loại:</span>
            <FilterSelect
              size="sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="FULL">Sao lưu Toàn bộ (FULL)</option>
              <option value="DATABASE">Chỉ Cơ sở dữ liệu (DATABASE)</option>
              <option value="UPLOADS">Chỉ Tập tin tải lên (UPLOADS)</option>
              <option value="SAFETY">Snapshot An toàn (SAFETY)</option>
            </FilterSelect>
          </div>

          {/* Filter Status */}
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

          {/* Filter Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Phương thức:</span>
            <FilterSelect
              size="sm"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="">Tất cả phương thức</option>
              <option value="MANUAL">Thủ công</option>
              <option value="SCHEDULED">Tự động (Cron)</option>
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <span className="text-xs font-semibold text-slate-600">
          Hiển thị <span className="font-bold text-slate-900">{jobs.length.toLocaleString('vi-VN')}</span> bản snapshot
        </span>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Thời gian lưu trữ: <strong>{overview?.retention?.daily || 14} ngày / {overview?.retention?.weekly || 8} tuần / {overview?.retention?.monthly || 12} tháng</strong></span>
          <span>·</span>
          <span className="font-bold text-slate-800">{verifiedJobs.length} bản hợp lệ</span>
        </div>
      </div>

      {/* Main Snapshot Table */}
      {jobs.length === 0 ? (
        /* Empty State with Configuration Guide per Requirement 3 */
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-2xs text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <DatabaseBackup className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900">Chưa có bản sao lưu snapshot nào</h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Hệ thống chưa ghi nhận bản snapshot nào. Nguyên nhân có thể do Worker chưa được kích hoạt (`BACKUP_WORKER_ENABLED="true"`) hoặc chưa đến khung giờ chạy tự động ({overview?.schedule || '02:00'}).
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void createBackup('FULL')}
              isLoading={actionLoading}
              leftIcon={<DatabaseBackup className="h-4 w-4" />}
            >
              Tạo bản Backup ngay
            </Button>
          </div>

          {/* Local Configuration Guide Box */}
          <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileCode className="h-4 w-4 text-blue-600" />
              <span>Cấu hình file môi trường `backend/.env` mẫu:</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto">
{`BACKUP_WORKER_ENABLED="true"
BACKUP_SCHEDULE="02:00"
BACKUP_TIMEZONE="Asia/Ho_Chi_Minh"
BACKUP_RETENTION_DAILY="14"
BACKUP_RETENTION_WEEKLY="8"
BACKUP_RETENTION_MONTHLY="12"
BACKUP_LOCAL_ROOT="./backup-runtime"
DATABASE_URL="postgresql://postgres:password@localhost:5432/exam_db"`}
            </pre>
            <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Lưu ý: Backup trên local chưa phải là offsite backup. Cần sao lưu định kỳ ra thiết bị lưu trữ bên ngoài.
            </p>
          </div>
        </div>
      ) : (
        /* Data Grid Table */
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full text-left border-collapse text-[15px] text-[#334155]">
            <thead className="bg-slate-50 text-[14px] font-semibold uppercase tracking-wider text-[#475569] border-b border-slate-200">
              <tr>
                <th scope="col" className="p-3.5 pl-4 min-w-[200px]">Snapshot ID</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Loại</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Phương thức</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian hoàn thành</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Dung lượng</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>
                <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {jobs.map((job) => (
                <tr key={job.id} className="transition hover:bg-blue-50/40">
                  <td className="p-3.5 pl-4 min-w-[200px]">
                    <div className="font-mono text-xs font-extrabold text-slate-900">{job.snapshotId}</div>
                    {job.checksum && (
                      <div className="mt-0.5 text-[11px] font-mono text-slate-500">
                        SHA-256: {job.checksum.slice(0, 12)}…
                      </div>
                    )}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {job.type}
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-xs font-semibold text-slate-700">
                    {job.initiatedBy ? (
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                        <UserIcon className="h-3 w-3" /> {job.initiatedBy.username}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 font-bold">
                        <Clock className="h-3 w-3 text-slate-400" /> Tự động (Cron)
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-xs font-semibold text-slate-700">
                    {formatDate(job.completedAt || job.createdAt)}
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Thời lượng: {calculateDuration(job.startedAt || job.createdAt, job.completedAt)}
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-900 text-xs">
                    {formatBytes(job.sizeBytes)}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">{getBackupStatusBadge(job.status)}</td>

                  <td className="p-3.5 pr-4 text-right whitespace-nowrap space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDetailJob(job)}
                      leftIcon={<Info className="h-3.5 w-3.5 text-slate-600" />}
                    >
                      Chi tiết
                    </Button>

                    {job.status === 'SUCCEEDED' && job.retained !== false ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRestoreModal(job)}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Khôi phục
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        {job.status === 'SUCCEEDED' ? 'Hết retention' : 'Không khả dụng'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Restore Requests Table */}
      {restoreRequests.length > 0 && (
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Yêu cầu khôi phục đang chờ xử lý ({restoreRequests.length})</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-amber-200/90 bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-[15px] text-[#334155]">
              <thead className="bg-amber-50/70 text-[14px] font-semibold uppercase tracking-wider text-amber-950 border-b border-amber-200">
                <tr>
                  <th scope="col" className="p-3.5 pl-4">Snapshot ID</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap">Môi trường</th>
                  <th scope="col" className="p-3.5">Lý do khôi phục</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap">Người tạo yêu cầu</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap">Thời hạn</th>
                  <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium">
                {restoreRequests.map((request) => {
                  const selfBlocked = isSelfApprovalBlocked(request);
                  return (
                    <tr key={request.id} className="transition hover:bg-amber-50/40">
                      <td className="p-3.5 pl-4 font-mono text-xs font-extrabold text-slate-900">{request.backupJob.snapshotId}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${request.target === 'PRODUCTION' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                          {request.target}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs font-semibold text-slate-700">{request.reason}</td>
                      <td className="p-3.5 whitespace-nowrap text-xs font-bold text-slate-800">{request.requestedBy?.username || 'admin'}</td>
                      <td className="p-3.5 whitespace-nowrap text-xs font-semibold text-slate-600">{formatDate(request.expiresAt)}</td>
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        {request.status === 'PENDING_APPROVAL' ? (
                          selfBlocked ? (
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 inline-block" title="Cần Admin thứ 2 phê duyệt">
                              Cần Admin khác phê duyệt
                            </span>
                          ) : (
                            <Button size="sm" variant="warning" onClick={() => openCriticalApproveModal(request)} leftIcon={<LockKeyhole className="h-3.5 w-3.5" />}>
                              Phê duyệt an toàn
                            </Button>
                          )
                        ) : (
                          getBackupStatusBadge(request.status as any)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Snapshot Details Drawer (Requirement 5) */}
      {detailJob && (
        <Modal
          isOpen={Boolean(detailJob)}
          onClose={() => setDetailJob(null)}
          title={`Chi tiết Snapshot (${detailJob.snapshotId})`}
          size="lg"
        >
          <div className="space-y-4 pt-1 text-xs font-semibold text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Snapshot ID</p>
                <p className="font-mono font-extrabold text-slate-900 mt-0.5 text-xs">{detailJob.snapshotId}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Loại Backup</p>
                <p className="font-bold text-slate-900 mt-0.5">{detailJob.type}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dung lượng tổng</p>
                <p className="font-bold text-slate-900 mt-0.5">{formatBytes(detailJob.sizeBytes)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Người khởi tạo</p>
                <p className="font-bold text-slate-900 mt-0.5">{detailJob.initiatedBy ? detailJob.initiatedBy.username : 'Hệ thống (Cron)'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thời gian khởi tạo</p>
                <p className="font-medium text-slate-700 mt-0.5">{formatDate(detailJob.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thời gian hoàn thành</p>
                <p className="font-medium text-slate-700 mt-0.5">{formatDate(detailJob.completedAt)}</p>
              </div>
            </div>

            {/* Checksum & Migration Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Mã băm SHA-256 Checksum:</span>
                {detailJob.checksum && (
                  <button
                    type="button"
                    onClick={() => handleCopyChecksum(detailJob.checksum)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> {copiedChecksum ? 'Đã sao chép!' : 'Sao chép hash'}
                  </button>
                )}
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] break-all leading-relaxed">
                {detailJob.checksum || 'Chưa có checksum'}
              </pre>
            </div>

            {/* Additional Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Prisma Migration Version:</span>
                <p className="font-mono text-xs font-bold text-slate-800 truncate">{detailJob.migration || 'Không xác định'}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">App Commit Hash:</span>
                <p className="font-mono text-xs font-bold text-slate-800 truncate">{detailJob.appCommit || 'Latest HEAD'}</p>
              </div>
            </div>

            {detailJob.errorMessage && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 space-y-1">
                <span className="font-bold text-xs">Chi tiết nhật ký lỗi:</span>
                <pre className="text-[11px] font-mono whitespace-pre-wrap">{detailJob.errorMessage}</pre>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" size="md" onClick={() => setDetailJob(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Initial Restore Creation Modal */}
      <Modal isOpen={restoreOpen} onClose={() => !actionLoading && setRestoreOpen(false)} title="Tạo yêu cầu khôi phục dữ liệu" size="md">
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Khôi phục dữ liệu sẽ ghi đè dữ liệu trên môi trường được chọn. Hãy chọn đúng môi trường và nhập lý do rõ ràng.</span>
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
              <option value="PRODUCTION">Production — Môi trường vận hành thực tế (Cần Admin 2 phê duyệt)</option>
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
          warningMessage={`Thao tác khôi phục sẽ GHI ĐÈ toàn bộ dữ liệu trên môi trường ${activeRestoreRequest.target} bằng bản snapshot ${activeRestoreRequest.backupJob.snapshotId}. Hãy nhập chính xác cụm từ xác nhận động bên dưới!`}
          confirmPhrase={dynamicPhrase}
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
