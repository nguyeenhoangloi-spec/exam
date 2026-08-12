'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
 AlertCircle,
 AlertTriangle,
 BookOpen,
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
 // Keep this dependency primitive. getAuthUser() creates a new object on
 // every render, which otherwise causes the data-loading effect to loop.
 const currentUserRole = currentUser?.role;

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
 const [filterTimeRange, setFilterTimeRange] = useState<string>('');
 const [fromDate, setFromDate] = useState<string>('');
 const [toDate, setToDate] = useState<string>('');

 // Drawer Detail State
 const [detailJob, setDetailJob] = useState<BackupJob | null>(null);
 const [copiedChecksum, setCopiedChecksum] = useState(false);

 // Modal & Policy States
 const [policyOpen, setPolicyOpen] = useState(false);
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
 if (currentUserRole !== 'ADMIN') {
 router.replace('/dashboard');
 return;
 }
 void fetchData();
 }, [fetchData, router, currentUserRole]);

 useEffect(() => {
 if (!overview?.running) return;
 const timer = window.setInterval(() => void fetchData(true), 5000);
 return () => window.clearInterval(timer);
 }, [overview?.running, fetchData]);

 const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

 const verifiedJobs = useMemo(() => jobs.filter((job) => job.status === 'SUCCEEDED' && job.retained !== false), [jobs]);

 const sortedJobs = useMemo(() => {
 return [...jobs].sort((a, b) => {
 const tA = new Date(a.createdAt).getTime();
 const tB = new Date(b.createdAt).getTime();
 return sortOrder === 'newest' ? tB - tA : tA - tB;
 });
 }, [jobs, sortOrder]);

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
 <div className="w-full px-6 py-6 space-y-5">
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* Header matching standard page header across all management pages */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
 <div className="space-y-1">
 <div className="flex flex-wrap items-center gap-2.5">
 <h1 className="text-[28px] font-semibold leading-[36px] text-[#0F172A] tracking-tight">
 Sao lưu & khôi phục dữ liệu
 </h1>
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-xs">
 <ShieldCheck className="h-3.5 w-3.5" /> Hệ thống bảo vệ
 </span>
 </div>
 <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
 Màn hình vận hành an toàn database, file upload và các snapshot hệ thống khảo thí
 </p>
 </div>

 <div className="flex items-center gap-2.5">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => setPolicyOpen(true)}
 leftIcon={<BookOpen className="h-4 w-4 text-slate-600" />}
 >
 Chính sách & Hướng dẫn
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

 <button
 type="button"
 onClick={() => void fetchData(true)}
 disabled={refreshing}
 className="flex h-9 w-9 items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer select-none disabled:opacity-50"
 title="Làm mới dữ liệu"
 >
 <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
 </button>
 </div>
 </div>

 {/* Local Storage Notice (Frameless) */}
 {overview?.storage?.isLocal && (
 <div className="flex items-center gap-2 text-xs font-medium text-amber-700 py-0.5">
 <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
 <span>
 <strong className="font-semibold">{overview.storage.warning}</strong> — Các bản snapshot được lưu ở thư mục cục bộ. Khuyên dùng Amazon S3 / MinIO đối với môi trường Production chính thức.
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
 <p className="text-[20px] xl:text-[22px] font-semibold text-[#0F172A] leading-[28px] truncate flex items-center gap-2">
 {overview?.worker?.enabled ? (
 <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
 <CheckCircle2 className="h-4 w-4" /> Đang hoạt động
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
 <XCircle className="h-4 w-4" /> Chưa kích hoạt
 </span>
 )}
 </p>
 </div>
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
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
 <p className="text-[20px] xl:text-[22px] font-semibold text-[#0F172A] leading-[28px] truncate">
 {overview?.storage?.provider === 'S3' ? 'Amazon S3 / MinIO' : 'Ổ đĩa Local'}
 </p>
 </div>
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
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
 <div className="flex items-center gap-3 text-xs font-semibold pt-1">
 <span className={`inline-flex items-center gap-1 ${overview?.tools?.pgDumpAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
 {overview?.tools?.pgDumpAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} pg_dump
 </span>
 <span className={`inline-flex items-center gap-1 ${overview?.tools?.pgRestoreAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
 {overview?.tools?.pgRestoreAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} pg_restore
 </span>
 </div>
 </div>
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
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
 <p className="text-[24px] xl:text-[26px] font-semibold text-[#0F172A] leading-[32px] truncate">
 {formatBytes(overview?.totalBytes)}
 </p>
 </div>
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563EB] transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
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
 <span className="text-xs font-semibold text-slate-500">Loại:</span>
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
 <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
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
 <span className="text-xs font-semibold text-slate-500">Phương thức:</span>
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

 {/* Filter Time Range */}
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-slate-500">Khoảng thời gian:</span>
 <FilterSelect
 size="sm"
 value={filterTimeRange}
 onChange={(e) => {
 const val = e.target.value;
 setFilterTimeRange(val);
 if (!val) {
 setFromDate('');
 } else if (val === '24h') {
 setFromDate(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
 } else if (val === '7d') {
 setFromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
 } else if (val === '30d') {
 setFromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
 } else if (val === '90d') {
 setFromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
 }
 }}
 >
 <option value="">Tất cả thời gian</option>
 <option value="24h">24 giờ qua</option>
 <option value="7d">7 ngày qua</option>
 <option value="30d">30 ngày qua</option>
 <option value="90d">90 ngày qua</option>
 </FilterSelect>
 </div>
 </div>
 </div>

 {/* Table Toolbar */}
 <div className="flex flex-wrap items-center justify-between gap-3 py-1">
 <span className="text-xs font-semibold text-slate-600">
 Hiển thị <span className="font-semibold text-slate-900">{sortedJobs.length.toLocaleString('vi-VN')}</span> bản snapshot
 </span>

 <div className="flex items-center gap-2">
 <FilterSelect
 size="sm"
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
 >
 <option value="newest">Sắp xếp: Mới nhất</option>
 <option value="oldest">Sắp xếp: Cũ nhất</option>
 </FilterSelect>

 <button
 type="button"
 onClick={() => void fetchData(true)}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs select-none"
 title="Làm mới dữ liệu"
 >
 <RefreshCw className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>

 {/* Main Snapshot Table */}
 {sortedJobs.length === 0 ? (
 /* Empty State */
 <div className="rounded-2xl border border-slate-200/90 bg-white p-12 shadow-2xs text-center space-y-5">
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
 <DatabaseBackup className="h-8 w-8" />
 </div>

 <div className="max-w-md mx-auto space-y-1.5">
 <h3 className="text-lg font-semibold text-slate-900">Chưa có bản sao lưu snapshot nào</h3>
 <p className="text-xs font-medium text-slate-600 leading-relaxed">
 Hệ thống chưa ghi nhận bản snapshot nào. Bạn có thể bấm nút tạo bên dưới để thực hiện sao lưu dữ liệu ngay lập tức.
 </p>
 </div>

 <div className="flex justify-center pt-1">
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
 </div>
 ) : (
 /* Data Grid Table */
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left border-collapse text-[15px] text-[#334155]">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
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
 {sortedJobs.map((job) => (
 <tr key={job.id} className="transition hover:bg-slate-50/60">
 <td className="p-3.5 pl-4 min-w-[200px]">
 <button
 type="button"
 onClick={() => setDetailJob(job)}
 className=" tabular-nums text-xs font-semibold text-blue-700 hover:text-blue-900 transition text-left cursor-pointer"
 >
 {job.snapshotId}
 </button>
 {job.checksum && (
 <div className="mt-0.5 text-[12px] tabular-nums text-slate-500">
 SHA-256: {job.checksum.slice(0, 12)}…
 </div>
 )}
 </td>

 <td className="p-3.5 whitespace-nowrap">
 <span
 className={`font-semibold text-xs px-2.5 py-1 rounded-lg ${job.type === 'FULL'
 ? 'bg-blue-600 text-white shadow-2xs'
 : job.type === 'DATABASE'
 ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
 : job.type === 'UPLOADS'
 ? 'bg-sky-50 text-sky-700 border border-sky-200/80'
 : 'bg-amber-50 text-amber-700 border border-amber-200/80'
 }`}
 >
 {job.type}
 </span>
 </td>

 <td className="p-3.5 whitespace-nowrap text-xs font-semibold text-slate-700">
 {job.initiatedBy ? (
 <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
 <UserIcon className="h-3 w-3" /> {job.initiatedBy.username}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
 <Clock className="h-3 w-3 text-slate-400" /> Tự động (Cron)
 </span>
 )}
 </td>

 <td className="p-3.5 whitespace-nowrap text-xs font-semibold text-slate-700">
 {formatDate(job.completedAt || job.createdAt)}
 <span className="block text-[12px] text-slate-400 mt-0.5">
 Thời lượng: {calculateDuration(job.startedAt || job.createdAt, job.completedAt)}
 </span>
 </td>

 <td className="p-3.5 whitespace-nowrap font-semibold text-slate-900 text-xs">
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
 <div className="space-y-3 pt-2">
 {/* Section header — edu-section-title với warning indicator */}
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2.5 flex-1 min-w-0">
 <h2 className="edu-section-title text-[#0F172A]">
 Yêu cầu khôi phục đang chờ xử lý
 </h2>
 <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-warning-600 text-white text-[12px] font-semibold leading-none">
 {restoreRequests.length}
 </span>
 </div>
 <p className="edu-helper text-[#64748B] hidden sm:block shrink-0">
 Các yêu cầu chờ Admin thứ hai phê duyệt
 </p>
 </div>

 {/* Table */}
 <div className="ui-table-wrap border-warning-200/80">
 <table className="ui-table">
 <thead>
 <tr className="bg-warning-50 border-b border-warning-200/70">
 <th scope="col" className="px-4 py-3.5 text-[14px] font-semibold tracking-wide text-[#1F2937] whitespace-nowrap">Snapshot ID</th>
 <th scope="col" className="px-4 py-3.5 text-[14px] font-semibold tracking-wide text-[#1F2937] whitespace-nowrap">Môi trường</th>
 <th scope="col" className="px-4 py-3.5 text-[14px] font-semibold tracking-wide text-[#1F2937]">Lý do khôi phục</th>
 <th scope="col" className="px-4 py-3.5 text-[14px] font-semibold tracking-wide text-[#1F2937] whitespace-nowrap">Người tạo yêu cầu</th>
 <th scope="col" className="px-4 py-3.5 text-[14px] font-semibold tracking-wide text-[#1F2937] whitespace-nowrap">Thời hạn</th>
 <th scope="col" className="px-4 py-3.5 text-[14px] font-semibold tracking-wide text-[#1F2937] text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody>
 {restoreRequests.map((request) => {
 const selfBlocked = isSelfApprovalBlocked(request);
 return (
 <tr key={request.id} className="border-t border-slate-100 transition-colors hover:bg-primary-50/30 dark:border-slate-800 dark:hover:bg-slate-800/40">
 {/* Snapshot ID */}
 <td className="px-4 py-3.5 tabular-nums text-[15px] font-semibold text-[#0F172A] whitespace-nowrap">
 {request.backupJob.snapshotId}
 </td>

 {/* Environment badge */}
 <td className="px-4 py-3.5 whitespace-nowrap">
 {request.target === 'PRODUCTION' ? (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-danger-50 border border-danger-200 text-danger-600 text-[12px] font-semibold">
 <ShieldAlert className="h-3 w-3 shrink-0" />
 PRODUCTION
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning-50 border border-warning-200 text-warning-600 text-[12px] font-semibold">
 <Server className="h-3 w-3 shrink-0" />
 STAGING
 </span>
 )}
 </td>

 {/* Reason */}
 <td className="px-4 py-3.5">
 <p className="edu-secondary text-[#1F2937] max-w-[240px] line-clamp-2">{request.reason}</p>
 </td>

 {/* Requested by */}
 <td className="px-4 py-3.5 whitespace-nowrap">
 <span className="inline-flex items-center gap-1.5 edu-secondary font-semibold text-[#1F2937]">
 <UserIcon className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
 {request.requestedBy?.username || 'admin'}
 </span>
 </td>

 {/* Expires at */}
 <td className="px-4 py-3.5 whitespace-nowrap edu-secondary text-[#475569]">
 {formatDate(request.expiresAt)}
 </td>

 {/* Actions */}
 <td className="px-4 py-3.5 text-right whitespace-nowrap">
 {request.status === 'PENDING_APPROVAL' ? (
 selfBlocked ? (
 <span
 title="Cần Admin thứ 2 phê duyệt — người tạo yêu cầu không được tự phê duyệt"
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[#475569] text-[12px] font-semibold cursor-default select-none"
 >
 <LockKeyhole className="h-3 w-3 shrink-0" />
 Cần Admin khác phê duyệt
 </span>
 ) : (
 <Button
 size="sm"
 variant="warning"
 onClick={() => openCriticalApproveModal(request)}
 leftIcon={<LockKeyhole className="h-3.5 w-3.5" />}
 >
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

 {/* Snapshot Details Modal */}
 {detailJob && (
 <Modal
 isOpen={Boolean(detailJob)}
 onClose={() => setDetailJob(null)}
 title={`Chi tiết Snapshot (${detailJob.snapshotId})`}
 size="lg"
 >
 <div className="space-y-4 text-sm font-medium text-slate-800">
 {/* Overview Metadata Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pb-3 border-b border-slate-100">
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">Loại Backup</span>
 <span className="text-sm font-semibold text-[#0F172A] block">{detailJob.type}</span>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">Dung lượng tổng</span>
 <span className="text-sm font-semibold text-[#0F172A] block">{formatBytes(detailJob.sizeBytes)}</span>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">Người khởi tạo</span>
 <span className="text-sm font-semibold text-[#0F172A] block">
 {detailJob.initiatedBy ? detailJob.initiatedBy.username : 'Hệ thống (Cron)'}
 </span>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">Thời gian khởi tạo</span>
 <span className="text-sm font-semibold text-[#0F172A] block">{formatDate(detailJob.createdAt)}</span>
 </div>
 <div className="space-y-0.5 sm:col-span-2">
 <span className="text-xs font-semibold text-[#64748B] block">Thời gian hoàn thành</span>
 <span className="text-sm font-semibold text-[#0F172A] block">{formatDate(detailJob.completedAt)}</span>
 </div>
 </div>

 {/* Long Technical Identifiers */}
 <div className="space-y-3 pb-3 border-b border-slate-100">
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">Mã Snapshot ID</span>
 <span className=" tabular-nums text-sm font-semibold text-[#0F172A] break-all block">{detailJob.snapshotId}</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">Prisma Migration Version</span>
 <span className=" tabular-nums text-sm font-semibold text-[#0F172A] break-all block">{detailJob.migration || 'Không xác định'}</span>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-[#64748B] block">App Commit Hash</span>
 <span className=" tabular-nums text-xs font-semibold text-[#0F172A] break-all block">{detailJob.appCommit || 'Latest HEAD'}</span>
 </div>
 </div>
 </div>

 {/* SHA-256 Checksum */}
 <div className="space-y-1 pt-1">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-[#64748B]">Mã băm SHA-256 Checksum</span>
 {detailJob.checksum && (
 <button
 type="button"
 onClick={() => handleCopyChecksum(detailJob.checksum)}
 className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
 >
 <Copy className="h-3.5 w-3.5" /> {copiedChecksum ? 'Đã sao chép!' : 'Sao chép hash'}
 </button>
 )}
 </div>
 <p className=" tabular-nums text-xs font-semibold text-slate-800 break-all leading-relaxed pt-0.5">
 {detailJob.checksum || 'Chưa có checksum'}
 </p>
 </div>

 {detailJob.errorMessage && (
 <div className="pt-2 space-y-1 text-rose-700">
 <span className="text-xs font-semibold text-rose-900 block">Chi tiết nhật ký lỗi:</span>
 <p className=" tabular-nums text-xs leading-relaxed whitespace-pre-wrap">{detailJob.errorMessage}</p>
 </div>
 )}

 <div className="flex justify-end pt-4 border-t border-slate-100">
 <Button variant="secondary" size="md" onClick={() => setDetailJob(null)}>
 Đóng
 </Button>
 </div>
 </div>
 </Modal>
 )}

 {/* Initial Restore Creation Modal */}
 <Modal isOpen={restoreOpen} onClose={() => !actionLoading && setRestoreOpen(false)} title="Tạo yêu cầu khôi phục dữ liệu" size="md">
 <div className="space-y-4 py-1">
 {/* Frameless Notice */}
 <div className="flex items-start gap-2 text-xs font-medium text-amber-800 pb-1 border-b border-slate-100">
 <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
 <span>
 <strong className="font-semibold text-amber-900">Lưu ý an toàn:</strong> Khôi phục dữ liệu sẽ ghi đè dữ liệu trên môi trường được chọn. Hãy chọn đúng môi trường và nhập lý do rõ ràng.
 </span>
 </div>

 {/* Frameless Selected Snapshot Info */}
 <div className="space-y-0.5 pb-2 border-b border-slate-100">
 <span className="text-xs font-semibold text-[#64748B] block">Snapshot đã chọn</span>
 <p className=" tabular-nums text-sm font-semibold text-[#0F172A] break-all">{selectedJob?.snapshotId}</p>
 <p className="text-xs font-semibold text-slate-500 mt-0.5">
 {formatDate(selectedJob?.completedAt)} · {formatBytes(selectedJob?.sizeBytes)}
 </p>
 </div>

 <div className="space-y-1.5">
 <label className="block text-sm font-semibold text-[#64748B]">Môi trường đích:</label>
 <FilterSelect
 size="md"
 className="w-full text-sm font-semibold text-slate-900"
 containerClassName="w-full"
 value={target}
 onChange={(e) => setTarget(e.target.value as RestoreTarget)}
 >
 <option value="STAGING">Staging — Môi trường kiểm thử an toàn</option>
 <option value="PRODUCTION">Production — Môi trường vận hành thực tế (Cần Admin 2 phê duyệt)</option>
 </FilterSelect>
 </div>

 <div className="space-y-1.5">
 <label className="block text-sm font-semibold text-[#64748B]">
 Lý do khôi phục <span className="text-rose-500">*</span>
 </label>
 <textarea
 rows={3}
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 maxLength={500}
 placeholder="Mô tả cụ thể sự cố cần phục hồi hoặc mục đích thử nghiệm..."
 className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
 />
 </div>

 <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
 passwordRequired
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
 {/* Backup Policy & Operating Guidelines Modal */}
 <Modal
 isOpen={policyOpen}
 onClose={() => setPolicyOpen(false)}
 title="Chính sách Sao lưu & Hướng dẫn Vận hành"
 >
 <div className="space-y-5 py-2 text-slate-700">

 {/* Section 1: Retention Policy */}
 <div className="space-y-2">
 <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Clock className="h-4 w-4 text-blue-600 shrink-0" />
 <span>Thời gian lưu trữ dữ liệu (Retention Policy)</span>
 </h4>
 <p className="text-xs text-slate-600 leading-relaxed pl-6">
 Hệ thống tự động thực hiện sao lưu định kỳ và dọn dẹp các bản ghi snapshot cũ theo chính sách:
 </p>
 <ul className="text-xs space-y-1.5 list-disc pl-11 font-medium text-slate-700 leading-relaxed">
 <li><strong>Bản sao lưu Hàng ngày (Daily):</strong> Lưu trữ <strong>{overview?.retention?.daily || 14} ngày</strong> gần nhất.</li>
 <li><strong>Bản sao lưu Hàng tuần (Weekly):</strong> Lưu trữ <strong>{overview?.retention?.weekly || 8} tuần</strong> liên tiếp.</li>
 <li><strong>Bản sao lưu Hàng tháng (Monthly):</strong> Lưu trữ <strong>{overview?.retention?.monthly || 12} tháng</strong> chính thức.</li>
 </ul>
 </div>

 {/* Section 2: Restore Security Policy */}
 <div className="space-y-2">
 <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
 <span>Quy định An toàn & Khôi phục (Security Policy)</span>
 </h4>
 <ul className="text-xs space-y-2 list-disc pl-11 font-medium text-slate-700 leading-relaxed">
 <li>
 <strong>Phê duyệt kép (Dual-Admin Approval):</strong> Thao tác khôi phục trên môi trường Production yêu cầu phê duyệt độc lập từ Quản trị viên thứ hai để đảm bảo an toàn tuyệt đối.
 </li>
 <li>
 <strong>Snapshot An toàn (Safety Snapshot):</strong> Ngay trước khi tiến hành ghi đè dữ liệu, hệ thống sẽ tự động tạo một bản snapshot an toàn phòng trường hợp cần khôi phục lại trạng thái trước đó.
 </li>
 <li>
 <strong>Xác nhận Cụm từ ngẫu nhiên:</strong> Mỗi lượt khôi phục yêu cầu nhập đúng cụm từ xác minh tĩnh/động được cấp để loại bỏ rủi ro bấm nhầm nút.
 </li>
 </ul>
 </div>

 {/* Section 3: Configuration Guide */}
 <div className="space-y-2">
 <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <FileCode className="h-4 w-4 text-blue-600 shrink-0" />
 <span>Tham chiếu Cấu hình Hệ thống (`backend/.env`)</span>
 </h4>
 <p className="text-xs text-slate-600 leading-relaxed pl-6">
 Các thông số thiết lập trong tập tin cấu hình môi trường server:
 </p>
 <div className="pl-6 pt-1">
 <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 tabular-nums text-[12px] leading-relaxed overflow-x-auto border-l-4 border-blue-500">
 {`BACKUP_WORKER_ENABLED="true" # Bật/tắt tiến trình tự động
BACKUP_SCHEDULE="02:00" # Khung giờ chạy sao lưu hàng ngày
BACKUP_TIMEZONE="Asia/Ho_Chi_Minh" # Múi giờ hệ thống
BACKUP_RETENTION_DAILY="14" # Số ngày lưu trữ
BACKUP_RETENTION_WEEKLY="8" # Số tuần lưu trữ
BACKUP_RETENTION_MONTHLY="12" # Số tháng lưu trữ
DATABASE_URL="postgresql://..." # Chuỗi kết nối cơ sở dữ liệu`}
 </pre>
 </div>
 </div>

 {/* Footer actions */}
 <div className="flex justify-end pt-3 border-t border-slate-100">
 <Button variant="primary" size="md" onClick={() => setPolicyOpen(false)}>
 Đã hiểu
 </Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
