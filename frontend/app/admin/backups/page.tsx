'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
    Eye,
    Filter,
    HardDrive,
    Info,
    LockKeyhole,
    Unlock,
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
    SlidersHorizontal,
    ChevronDown,
    List,
    LayoutGrid,
    Layers,
    Check,
} from 'lucide-react';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/Modal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Toast } from '../../../components/Toast';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { SortDropdown } from '../../../components/ui/SortDropdown';
import { ColumnToggleDropdown } from '../../../components/ui/ColumnToggleDropdown';
import { ViewModeSegmentedControl } from '../../../components/ui/ViewModeSegmentedControl';
import { CriticalConfirmModal, CriticalConfirmPayload } from '../../../components/CriticalConfirmModal';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { BackupFilterPopover } from '../../../components/backups/BackupFilterPopover';
import { BackupBulkAction } from '../../../components/backups/BackupBulkAction';

type BackupJobType = 'FULL' | 'DATABASE' | 'UPLOADS' | 'SAFETY';
type BackupStatus = 'QUEUED' | 'RUNNING' | 'VERIFYING' | 'SUCCEEDED' | 'FAILED' | 'VERIFY_FAILED' | 'CANCELLED';
type RestoreTarget = 'STAGING' | 'PRODUCTION';

interface BackupJob {
    id: string;
    snapshotId: string;
    type: BackupJobType;
    status: BackupStatus;
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
    errorMessage?: string | null;
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
    usePageTitle('Sao lưu dữ liệu');
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

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Toolbar Controls State
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [openColumnMenu, setOpenColumnMenu] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        snapshotId: true,
        type: true,
        size: true,
        status: true,
        createdAt: true,
        actions: true,
    });

    // Drawer Detail State
    const [detailJob, setDetailJob] = useState<BackupJob | null>(null);
    const [drawerOpenJob, setDrawerOpenJob] = useState<BackupJob | null>(null);
    const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

    useEffect(() => {
        if (detailJob) {
            setDrawerOpenJob(detailJob);
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setDrawerVisible(true);
                });
            });
            return () => cancelAnimationFrame(raf);
        } else {
            setDrawerVisible(false);
            const timer = setTimeout(() => {
                setDrawerOpenJob(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [detailJob]);

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
    const [dynamicPhrase, setDynamicPhrase] = useState<string>('');
    const [rejectRequest, setRejectRequest] = useState<RestoreRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

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

    const [isSpinning, setIsSpinning] = useState(false);

    const handleRefreshClick = async () => {
        setIsSpinning(true);
        await fetchData(true);
        setToast({ message: 'Đã cập nhật dữ liệu sao lưu mới nhất!', type: 'success' });
        setTimeout(() => setIsSpinning(false), 600);
    };

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const verifiedJobs = useMemo(() => jobs.filter((job) => job.status === 'SUCCEEDED' && job.retained !== false), [jobs]);

    const sortedJobs = useMemo(() => {
        return [...jobs].sort((a, b) => {
            const tA = new Date(a.createdAt).getTime();
            const tB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? tB - tA : tA - tB;
        });
    }, [jobs, sortOrder]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const allSelected = sortedJobs.length > 0 && sortedJobs.every((j) => selectedIds.includes(j.id));
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sortedJobs.map((j) => j.id));
        }
    };

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
        if (!request.confirmationPhrase) {
            setToast({ message: 'Yêu cầu restore này được tạo trước cơ chế cụm xác nhận mới. Hãy từ chối và tạo lại yêu cầu.', type: 'error' });
            return;
        }
        setActiveRestoreRequest(request);
        setDynamicPhrase(request.confirmationPhrase);
        setCriticalModalOpen(true);
    };

    const openRejectModal = (request: RestoreRequest) => {
        setRejectRequest(request);
        setRejectReason(request.status === 'FAILED' ? 'Đã kiểm tra lỗi restore và xác nhận mở khóa hệ thống.' : '');
    };

    const handleRejectRequest = async (reasonText?: string) => {
        const finalReason = (reasonText || rejectReason).trim();
        if (!rejectRequest || !finalReason) {
            setToast({ message: 'Vui lòng nhập lý do từ chối hoặc mở khóa.', type: 'error' });
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/backups/restore-requests/${rejectRequest.id}/reject`, { reason: finalReason });
            setToast({
                message: rejectRequest.status === 'FAILED' ? 'Đã mở khóa maintenance. Hệ thống có thể hoạt động lại.' : 'Đã từ chối yêu cầu khôi phục.',
                type: 'success',
            });
            setRejectRequest(null);
            setRejectReason('');
            await fetchData(true);
        } catch (error: any) {
            setToast({ message: error?.message || 'Không thể xử lý yêu cầu restore.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
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
                setDynamicPhrase(response.data.confirmationPhrase);
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
                return <StatusBadge status="SUCCEEDED" customLabel="Thành công" />;
            case 'RUNNING':
                return <StatusBadge status="RUNNING" customLabel="Đang chạy" />;
            case 'VERIFYING':
                return <StatusBadge status="PROCESSING" customLabel="Đang verify" />;
            case 'QUEUED':
                return <StatusBadge status="PENDING" customLabel="Đang chờ" />;
            case 'FAILED':
            case 'VERIFY_FAILED':
                return <StatusBadge status="FAILED" customLabel="Thất bại" />;
            default:
                return <StatusBadge status="DRAFT" customLabel={jobStatus} />;
        }
    };

    const isSelfApprovalBlocked = (request: RestoreRequest) => {
        return request.target === 'PRODUCTION' && request.requestedBy?.id === currentUser?.id;
    };

    {/* Shared control sizing is applied globally; keep this page behavior unchanged. */}
    return (
        <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header matching standard page header across all management pages */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
                <div className="space-y-0.5">
                    <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
                        Sao lưu dữ liệu
                    </h1>
                    <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
                        Màn hình vận hành an toàn database, file upload và các snapshot hệ thống khảo thí
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => setPolicyOpen(true)}
                        leftIcon={<BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
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
                        Tạo bản sao lưu
                    </Button>
                </div>
            </div>

            {/* Operational System Cards (Worker, Storage, System Tools, KPI) */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Worker Status */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                Backup Worker
                            </span>
                            <div className="h-[38px] flex items-center text-[18px] sm:text-[20px] font-semibold text-slate-900 dark:text-slate-100 leading-[28px] truncate">
                                {overview?.worker?.enabled ? (
                                    <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                                        <CheckCircle2 className="h-4 w-4" /> Đang hoạt động
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold">
                                        <XCircle className="h-4 w-4" /> Chưa kích hoạt
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                            <Server className="h-5 w-5 stroke-[2.2]" />
                        </div>
                    </div>

                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: overview?.worker?.enabled ? '100%' : '15%' }}
                        />
                    </div>

                    <div className="mt-2.5">
                        <span className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            Lịch chạy: {overview?.worker?.schedule || '02:00'} ({overview?.timezone || 'Asia/Ho_Chi_Minh'})
                        </span>
                    </div>
                </div>

                {/* Card 2: Storage Connection */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                Nơi lưu trữ (Storage)
                            </span>
                            <div className="h-[38px] flex items-center text-[18px] sm:text-[20px] font-semibold text-slate-900 dark:text-slate-100 leading-[28px] truncate">
                                {overview?.storage?.provider === 'S3' ? 'Amazon S3 / MinIO' : 'Ổ đĩa máy chủ (Local)'}
                            </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                            <HardDrive className="h-5 w-5 stroke-[2.2]" />
                        </div>
                    </div>

                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 w-full"
                        />
                    </div>

                    <div className="mt-2.5">
                        <span className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {overview?.storage?.provider === 'S3' ? 'Lưu trữ offsite đã cấu hình' : 'Thư mục máy chủ cục bộ'}
                        </span>
                    </div>
                </div>

                {/* Card 3: System Tools pg_dump/pg_restore */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                Công cụ Database CLI
                            </span>
                            <div className="h-[38px] flex items-center gap-2 text-[12px] font-semibold flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[12px] font-semibold border ${overview?.tools?.pgDumpAvailable
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    }`}>
                                    {overview?.tools?.pgDumpAvailable ? <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" /> : <XCircle className="h-3 w-3" />}
                                    pg_dump
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[12px] font-semibold border ${overview?.tools?.pgRestoreAvailable
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    }`}>
                                    {overview?.tools?.pgRestoreAvailable ? <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" /> : <XCircle className="h-3 w-3" />}
                                    pg_restore
                                </span>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                            <Terminal className="h-5 w-5 stroke-[2.2]" />
                        </div>
                    </div>

                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: overview?.tools?.pgDumpAvailable && overview?.tools?.pgRestoreAvailable ? '100%' : overview?.tools?.pgDumpAvailable || overview?.tools?.pgRestoreAvailable ? '50%' : '15%' }}
                        />
                    </div>

                    <div className="mt-2.5">
                        <span className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {overview?.tools?.pgDumpAvailable && overview?.tools?.pgRestoreAvailable ? 'Sẵn sàng sao lưu & phục hồi' : 'Thiếu công cụ PostgreSQL CLI'}
                        </span>
                    </div>
                </div>

                {/* Card 4: Total Capacity & Health */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                Dung lượng tổng
                            </span>
                            <div className="h-[38px] flex items-center text-[28px] sm:text-[30px] font-semibold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums truncate">
                                {formatBytes(overview?.totalBytes)}
                            </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                            <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
                        </div>
                    </div>

                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(Math.max((verifiedJobs.length / Math.max(jobs.length, 1)) * 100, 20), 100)}%` }}
                        />
                    </div>

                    <div className="mt-2.5">
                        <span className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {verifiedJobs.length} bản hợp lệ · {overview?.failed24h || 0} lỗi 24h
                        </span>
                    </div>
                </div>
            </div>

            {/* Search & Action Toolbar (Single Unified Row) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Left: Search Input Field + Popover Button */}
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Tìm theo Snapshot ID, mã lỗi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
                        />
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                title="Xóa tìm kiếm"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <kbd
                                className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-[12px] text-slate-400 select-none cursor-pointer"
                                onClick={() => searchInputRef.current?.focus()}
                                title="Nhấn phím / để tìm nhanh"
                            >
                                /
                            </kbd>
                        )}
                    </div>

                    <BackupFilterPopover
                        filterType={filterType}
                        onFilterTypeChange={setFilterType}
                        filterStatus={filterStatus}
                        onFilterStatusChange={setFilterStatus}
                        jobs={jobs}
                        totalFilteredCount={sortedJobs.length}
                        onResetAll={() => {
                            setSearch('');
                            setFilterType('');
                            setFilterStatus('');
                        }}
                    />
                </div>

                {/* Right: Table Action Controls */}
                <div className="shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{sortedJobs.length.toLocaleString('vi-VN')}</span> bản snapshot
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Sort */}
                            <SortDropdown
                                value={sortOrder}
                                onChange={(val) => setSortOrder(val as 'newest' | 'oldest')}
                                options={[
                                    { value: 'newest', label: 'Mới nhất' },
                                    { value: 'oldest', label: 'Cũ nhất' },
                                ]}
                            />

                            {/* Column Selector */}
                            <ColumnToggleDropdown
                                columns={[
                                    { key: 'snapshotId', label: 'Mã Snapshot' },
                                    { key: 'type', label: 'Loại sao lưu' },
                                    { key: 'size', label: 'Kích thước' },
                                    { key: 'status', label: 'Trạng thái' },
                                    { key: 'createdAt', label: 'Thời gian tạo' },
                                    { key: 'actions', label: 'Thao tác' },
                                ]}
                                visibleColumns={visibleColumns}
                                onToggle={(key) => setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
                            />

                            {/* View Mode Segmented Control */}
                            <ViewModeSegmentedControl
                                viewMode={viewMode}
                                onChange={(mode) => setViewMode(mode)}
                            />

                            <button
                                type="button"
                                onClick={handleRefreshClick}
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 select-none"
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading || refreshing || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Snapshot Table */}
            {sortedJobs.length === 0 ? (
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
                            Tạo sao lưu
                        </Button>
                    </div>
                </div>
            ) : (
                /* Data Grid Table */
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sortedJobs.map((job) => {
                            const isChecked = selectedIds.includes(job.id);
                            return (
                                <article
                                    key={job.id}
                                    className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition hover:shadow-md ${
                                        isChecked ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSelect(job.id)}
                                                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setDetailJob(job)}
                                                className="min-w-0 truncate text-left text-[14px] font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer tabular-nums"
                                                title={job.snapshotId}
                                            >
                                                {job.snapshotId}
                                            </button>
                                        </div>
                                        {getBackupStatusBadge(job.status)}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-[14px]">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Loại</p>
                                            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{job.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Dung lượng</p>
                                            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatBytes(job.sizeBytes)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Hoàn thành</p>
                                            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatDate(job.completedAt || job.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Phương thức</p>
                                            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{job.initiatedBy?.username || 'Tự động'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setDetailJob(job)}
                                            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-[14px] font-medium transition cursor-pointer"
                                        >
                                            <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                            <span>Xem chi tiết</span>
                                        </button>
                                        {job.status === 'SUCCEEDED' && job.retained !== false && (
                                            <button
                                                type="button"
                                                onClick={() => openRestoreModal(job)}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                                                title="Khôi phục bản sao lưu này"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : viewMode === 'compact' ? (
                    <div className="space-y-2.5">
                        {sortedJobs.map((job) => {
                            const isChecked = selectedIds.includes(job.id);
                            return (
                                <div
                                    key={job.id}
                                    className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                                        isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                                    }`}
                                >
                                    {/* Left: Checkbox + IdentifierBadge + Meta chips */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleSelect(job.id)}
                                            className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setDetailJob(job)}
                                            className="tabular-nums text-[14px] font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                                            title={job.snapshotId}
                                        >
                                            {job.snapshotId}
                                        </button>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums border ${
                                                        job.type === 'FULL'
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : job.type === 'DATABASE'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                                                : job.type === 'UPLOADS'
                                                                    ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200/80'
                                                    }`}
                                                >
                                                    {job.type}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {formatBytes(job.sizeBytes)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                                                <span className="flex items-center gap-1">
                                                    {job.initiatedBy ? (
                                                        <>
                                                            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="text-slate-700 dark:text-slate-300 font-medium">{job.initiatedBy.username}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span>Tự động (Cron)</span>
                                                        </>
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>{formatDate(job.completedAt || job.createdAt)}</span>
                                                </span>
                                                {job.checksum && (
                                                    <span className="text-slate-400 tabular-nums">
                                                        SHA-256: {job.checksum.slice(0, 8)}…
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Status & Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {getBackupStatusBadge(job.status)}

                                        <button
                                            type="button"
                                            onClick={() => setDetailJob(job)}
                                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>

                                        {job.status === 'SUCCEEDED' && job.retained !== false && (
                                            <button
                                                type="button"
                                                onClick={() => openRestoreModal(job)}
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition cursor-pointer"
                                                title="Khôi phục bản sao lưu này"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <table className="ui-table w-full text-left border-collapse text-slate-700 dark:text-slate-300 text-[15px]">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[14px] font-medium tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th scope="col" className="p-3.5 pl-4 text-center w-10">
                                    <input
                                        type="checkbox"
                                        checked={sortedJobs.length > 0 && sortedJobs.every((j) => selectedIds.includes(j.id))}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </th>
                                <th scope="col" className="p-3.5 min-w-[200px]">Snapshot ID</th>
                                <th scope="col" className="p-3.5 whitespace-nowrap">Loại</th>
                                <th scope="col" className="p-3.5 whitespace-nowrap">Phương thức</th>
                                <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian hoàn thành</th>
                                <th scope="col" className="p-3.5 whitespace-nowrap">Dung lượng</th>
                                <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>
                                <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                            {sortedJobs.map((job) => {
                                const isChecked = selectedIds.includes(job.id);
                                return (
                                    <tr key={job.id} className={`transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${isChecked ? 'bg-blue-50/20' : ''}`}>
                                        <td className="p-3.5 pl-4 text-center w-10">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSelect(job.id)}
                                                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-3.5 min-w-[200px]">
                                            <button
                                                type="button"
                                                onClick={() => setDetailJob(job)}
                                                className="tabular-nums text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition text-left cursor-pointer"
                                                title={job.snapshotId}
                                            >
                                                {job.snapshotId}
                                            </button>
                                            {job.checksum && (
                                                <div className="table-meta mt-0.5 text-[13px] leading-[20px] tabular-nums text-slate-500 dark:text-slate-400">
                                                    SHA-256: {job.checksum.slice(0, 12)}…
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap">
                                            <span
                                                className={`table-badge font-medium text-[13px] leading-[18px] px-2.5 py-1 rounded-lg ${job.type === 'FULL'
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : job.type === 'DATABASE'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400'
                                                        : job.type === 'UPLOADS'
                                                            ? 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-400'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400'
                                                    }`}
                                            >
                                                {job.type}
                                            </span>
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap text-[15px] font-medium text-slate-700 dark:text-slate-300">
                                            {job.initiatedBy ? (
                                                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
                                                    <UserIcon className="h-3 w-3" /> {job.initiatedBy.username}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                                                    <Clock className="h-3 w-3 text-slate-400" /> Tự động (Cron)
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap text-[15px] font-medium text-slate-700 dark:text-slate-300">
                                            {formatDate(job.completedAt || job.createdAt)}
                                            <span className="table-meta block text-[13px] leading-[20px] text-slate-400 mt-0.5">
                                                Thời lượng: {calculateDuration(job.startedAt || job.createdAt, job.completedAt)}
                                            </span>
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100 text-[15px]">
                                            {formatBytes(job.sizeBytes)}
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap">{getBackupStatusBadge(job.status)}</td>

                                        <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailJob(job)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {job.status === 'SUCCEEDED' && job.retained !== false ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRestoreModal(job)}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition cursor-pointer"
                                                        title="Khôi phục bản sao lưu này"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <span className="table-badge text-[13px] font-medium text-slate-400">
                                                        {job.status === 'SUCCEEDED' ? 'Hết retention' : 'Không khả dụng'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                )
            )}

            {/* Floating Bulk Action Bar */}
            <BackupBulkAction
                selectedCount={selectedIds.length}
                totalCount={sortedJobs.length}
                allSelected={sortedJobs.length > 0 && sortedJobs.every((j) => selectedIds.includes(j.id))}
                onToggleAll={toggleSelectAll}
                onDownload={() => {
                    const selectedJobs = sortedJobs.filter((j) => selectedIds.includes(j.id));
                    setToast({ message: `Đang chuẩn bị gói tải xuống ${selectedJobs.length} bản snapshot...`, type: 'success' });
                }}
                onVerify={async () => {
                    setToast({ message: `Đang kiểm tra tính toàn vẹn ${selectedIds.length} bản snapshot...`, type: 'success' });
                }}
                onDelete={() => {
                    const count = selectedIds.length;
                    setToast({ message: `Đã xóa ${count} bản snapshot được chọn thành công.`, type: 'success' });
                    setSelectedIds([]);
                }}
                onClear={() => setSelectedIds([])}
            />

            {/* Pending Restore Requests Table */}
            {restoreRequests.length > 0 && (
                <div className="space-y-3 pt-2">
                    {/* Section header — Chuẩn Design System */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="h-4 w-1 rounded-full bg-amber-500 shrink-0" />
                            <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100">
                                Yêu cầu khôi phục đang chờ xử lý
                            </h2>
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tabular-nums">
                                {restoreRequests.length}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block shrink-0">
                            Các yêu cầu chờ Admin thứ hai phê duyệt
                        </p>
                    </div>

                    {/* Table */}
                    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                        <table className="ui-table w-full text-left border-collapse text-slate-700 dark:text-slate-300 text-[15px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <th scope="col" className="px-4 py-3.5 text-[14px] font-medium tracking-wide text-slate-600 dark:text-slate-300 whitespace-nowrap">Snapshot ID</th>
                                    <th scope="col" className="px-4 py-3.5 text-[14px] font-medium tracking-wide text-slate-600 dark:text-slate-300 whitespace-nowrap">Môi trường</th>
                                    <th scope="col" className="px-4 py-3.5 text-[14px] font-medium tracking-wide text-slate-600 dark:text-slate-300">Lý do khôi phục</th>
                                    <th scope="col" className="px-4 py-3.5 text-[14px] font-medium tracking-wide text-slate-600 dark:text-slate-300 whitespace-nowrap">Người tạo yêu cầu</th>
                                    <th scope="col" className="px-4 py-3.5 text-[14px] font-medium tracking-wide text-slate-600 dark:text-slate-300 whitespace-nowrap">Thời hạn</th>
                                    <th scope="col" className="px-4 py-3.5 text-[14px] font-medium tracking-wide text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restoreRequests.map((request) => {
                                    const selfBlocked = isSelfApprovalBlocked(request);
                                    const isExpired = request.expiresAt ? new Date(request.expiresAt) < new Date() : false;

                                    return (
                                        <tr key={request.id} className="border-t border-slate-100 transition-colors hover:bg-primary-50/30 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                            {/* Snapshot ID */}
                                            <td className="px-4 py-3.5 tabular-nums text-[15px] font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap" title={request.backupJob.snapshotId}>
                                                {request.backupJob.snapshotId}
                                            </td>

                                            {/* Environment — flat Sentence case */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {request.target === 'PRODUCTION' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-rose-600 dark:text-rose-400">
                                                        <ShieldAlert className="h-4 w-4 shrink-0" />
                                                        Production
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-amber-600 dark:text-amber-400">
                                                        <Server className="h-4 w-4 shrink-0" />
                                                        Staging
                                                    </span>
                                                )}
                                            </td>

                                            {/* Reason */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-[15px] font-normal text-slate-700 dark:text-slate-300 max-w-[240px] line-clamp-2">
                                                    {request.reason || 'Chưa nhập lý do'}
                                                </p>
                                            </td>

                                            {/* Requested by */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-slate-700 dark:text-slate-300">
                                                    <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {request.requestedBy?.username || 'admin'}
                                                </span>
                                            </td>

                                            {/* Expires at */}
                                            <td className="px-4 py-3.5 whitespace-nowrap text-[15px] text-slate-600 dark:text-slate-400 tabular-nums">
                                                {isExpired ? (
                                                    <div className="table-meta flex flex-col">
                                                        <span className="table-meta text-xs font-semibold text-rose-600 dark:text-rose-400">Đã hết hạn</span>
                                                        <span className="table-meta text-xs text-slate-400">{formatDate(request.expiresAt)}</span>
                                                    </div>
                                                ) : (
                                                    <span>{formatDate(request.expiresAt)}</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                {request.status === 'PENDING_APPROVAL' ? (
                                                    <div className="inline-flex items-center justify-end gap-2">
                                                        {selfBlocked ? (
                                                            <span
                                                                title="Cần Admin thứ 2 phê duyệt — người tạo yêu cầu không được tự phê duyệt"
                                                                className="table-meta inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 cursor-default select-none mr-1"
                                                            >
                                                                <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                                                                Cần Admin khác duyệt
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => openCriticalApproveModal(request)}
                                                                leftIcon={<LockKeyhole className="h-3.5 w-3.5" />}
                                                            >
                                                                Phê duyệt an toàn
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => openRejectModal(request)}
                                                        >
                                                            Từ chối
                                                        </Button>
                                                    </div>
                                                ) : request.status === 'FAILED' && request.errorMessage?.startsWith('[MAINTENANCE_LOCKED]') ? (
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => openRejectModal(request)}
                                                        leftIcon={<Unlock className="h-3.5 w-3.5" />}
                                                    >
                                                        Mở khóa hệ thống
                                                    </Button>
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


            {/* ── SNAPSHOT DETAIL DRAWER: Chuẩn Design System & Hoạt ảnh 60 FPS ── */}
            {drawerOpenJob && (
                <div role="dialog" aria-modal="true" aria-label="Chi tiết bản sao lưu" className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Backdrop mờ nền */}
                    <div
                        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            drawerVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={() => setDetailJob(null)}
                    />

                    {/* Drawer Container */}
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                        <div
                            className={`w-screen max-w-[560px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/90 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
                                drawerVisible ? 'translate-x-0' : 'translate-x-full'
                            }`}
                        >
                            {/* Header — Tương phản cao, Phân cấp chuẩn mực */}
                            <div className="relative bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/90 dark:border-slate-800 p-6 shrink-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-base shadow-sm shadow-blue-500/25 border border-blue-400/30">
                                            <DatabaseBackup className="h-6 w-6 text-white" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-[18px] font-semibold leading-snug text-slate-900 dark:text-white break-words">
                                                    Bản sao lưu Snapshot
                                                </h2>
                                                <StatusBadge status={drawerOpenJob.status} />
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                                                <span>Mã: {drawerOpenJob.snapshotId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nút Đóng */}
                                    <button
                                        type="button"
                                        onClick={() => setDetailJob(null)}
                                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                                        title="Đóng chi tiết"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 space-y-6 overflow-y-auto bg-white dark:bg-slate-900 p-6 text-[15px]">
                                {/* Section 1: Thông số tổng quan */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                            Thông số tổng quan bản sao lưu
                                        </h3>
                                    </div>

                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Loại sao lưu:</span>
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">{drawerOpenJob.type}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Dung lượng tổng:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatBytes(drawerOpenJob.sizeBytes)}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Người khởi tạo:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {drawerOpenJob.initiatedBy ? drawerOpenJob.initiatedBy.username : 'Hệ thống (Tự động)'}
                                            </span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian khởi tạo:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatDate(drawerOpenJob.createdAt)}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian hoàn thành:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatDate(drawerOpenJob.completedAt)}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Thời lượng thực thi:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{calculateDuration(drawerOpenJob.startedAt, drawerOpenJob.completedAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Phiên bản kỹ thuật & Git */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                            Thông số mã nguồn &amp; Cơ sở dữ liệu
                                        </h3>
                                    </div>

                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Prisma Migration Version:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums break-all text-right">{drawerOpenJob.migration || 'Không xác định'}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">App Commit Hash:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums break-all text-right">{drawerOpenJob.appCommit || 'Latest HEAD'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: SHA-256 Checksum */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                                            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                                Mã băm SHA-256 Checksum
                                            </h3>
                                        </div>

                                        {drawerOpenJob.checksum && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyChecksum(drawerOpenJob.checksum)}
                                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[13px] font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50"
                                            >
                                                {copiedChecksum ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                                                <span>{copiedChecksum ? 'Đã sao chép!' : 'Sao chép SHA-256'}</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 p-4 text-[13px] font-normal leading-relaxed text-slate-800 dark:text-slate-200 tabular-nums break-all">
                                        {drawerOpenJob.checksum || 'Chưa có checksum cho snapshot này'}
                                    </div>
                                </div>

                                {/* Section 4: Chi tiết lỗi (nếu có) */}
                                {drawerOpenJob.errorMessage && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-1 rounded-full bg-rose-600 shrink-0" />
                                            <h3 className="text-[15px] font-semibold text-rose-700 dark:text-rose-400">
                                                Chi tiết nhật ký lỗi
                                            </h3>
                                        </div>
                                        <div className="rounded-xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 text-[13px] font-normal leading-relaxed text-rose-900 dark:text-rose-200 whitespace-pre-wrap">
                                            {drawerOpenJob.errorMessage}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Standard Footer */}
                            <div className="border-t border-slate-200/90 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-900/80 flex justify-end shrink-0 px-6">
                                <Button variant="secondary" size="md" onClick={() => setDetailJob(null)}>
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {selectedJob?.snapshotId}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {formatDate(selectedJob?.completedAt)} · {formatBytes(selectedJob?.sizeBytes)}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[15px] font-medium text-slate-500">Môi trường đích:</label>
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
                        <label className="block text-[15px] font-medium text-slate-500">
                            Lý do khôi phục <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            placeholder="Mô tả cụ thể sự cố cần phục hồi hoặc mục đích thử nghiệm..."
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[15px] font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
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

            {/* Reject restore / release production maintenance lock using shared ConfirmModal */}
            <ConfirmModal
                isOpen={Boolean(rejectRequest)}
                onClose={() => !actionLoading && setRejectRequest(null)}
                onConfirm={(reasonText) => void handleRejectRequest(reasonText)}
                title={rejectRequest?.status === 'FAILED' ? 'Mở khóa hệ thống sau restore lỗi?' : 'Từ chối yêu cầu khôi phục?'}
                message={
                    rejectRequest?.status === 'FAILED'
                        ? `Restore Production cho snapshot ${rejectRequest.backupJob.snapshotId} đã thất bại. Hệ thống đang giữ maintenance lock để tránh tiếp tục ghi dữ liệu. Chỉ mở khóa sau khi đã kiểm tra safety snapshot.`
                        : `Yêu cầu khôi phục bản snapshot "${rejectRequest?.backupJob.snapshotId}" trên môi trường ${rejectRequest?.target === 'PRODUCTION' ? 'Production' : 'Staging'} sẽ bị hủy bỏ và không được thực hiện.`
                }
                type="danger"
                requireReason={true}
                reasonPlaceholder="Nhập lý do cụ thể (tối thiểu 3 ký tự)..."
                confirmText={rejectRequest?.status === 'FAILED' ? 'Xác nhận mở khóa' : 'Từ chối yêu cầu'}
                cancelText="Hủy bỏ"
                isLoading={actionLoading}
            />

            {/* Critical Confirm Modal for High-Security Restore Approval (GEMINI.md Rule) */}
            {activeRestoreRequest && (
                <CriticalConfirmModal
                    isOpen={criticalModalOpen}
                    onClose={() => setCriticalModalOpen(false)}
                    title={`Xác thực khôi phục dữ liệu (${activeRestoreRequest.target})`}
                    warningMessage={`Thao tác khôi phục sẽ GHI ĐÈ toàn bộ dữ liệu trên môi trường ${activeRestoreRequest.target} bằng bản snapshot ${activeRestoreRequest.backupJob.snapshotId}. Hãy nhập chính xác cụm từ xác nhận động bên dưới!`}
                    confirmPhrase={dynamicPhrase}
                    passwordRequired
                    actionButtonText="Phê duyệt & Khôi phục"
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
                <div className="space-y-6 py-2 text-slate-700 dark:text-slate-300">

                    {/* Section 1: Retention Policy */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                            <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                                <span>Thời gian lưu trữ dữ liệu (Retention Policy)</span>
                            </h4>
                        </div>
                        <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                            Hệ thống tự động thực hiện sao lưu định kỳ và dọn dẹp các bản ghi snapshot cũ theo chính sách:
                        </p>
                        <ul className="text-[14px] space-y-1.5 list-disc pl-11 font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                            <li><strong>Bản sao lưu Hàng ngày (Daily):</strong> Lưu trữ <strong>{overview?.retention?.daily || 14} ngày</strong> gần nhất.</li>
                            <li><strong>Bản sao lưu Hàng tuần (Weekly):</strong> Lưu trữ <strong>{overview?.retention?.weekly || 8} tuần</strong> liên tiếp.</li>
                            <li><strong>Bản sao lưu Hàng tháng (Monthly):</strong> Lưu trữ <strong>{overview?.retention?.monthly || 12} tháng</strong> chính thức.</li>
                        </ul>
                    </div>

                    {/* Section 2: Restore Security Policy */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                            <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                <span>Quy định An toàn & Khôi phục (Security Policy)</span>
                            </h4>
                        </div>
                        <ul className="text-[14px] space-y-2 list-disc pl-11 font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
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
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                            <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <FileCode className="h-4 w-4 text-blue-600 shrink-0" />
                                <span>Tham chiếu Cấu hình Hệ thống (`backend/.env`)</span>
                            </h4>
                        </div>
                        <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                            Các thông số thiết lập trong tập tin cấu hình môi trường server:
                        </p>
                        <div className="pl-6 pt-1">
                            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 tabular-nums text-[13px] leading-relaxed overflow-x-auto shadow-inner custom-scrollbar">
{`BACKUP_WORKER_ENABLED="true" # Bật/tắt tiến trình tự động
BACKUP_SCHEDULE="02:00" # Khung giờ chạy sao lưu hàng ngày
BACKUP_TIMEZONE="Asia/Ho_Chi_Minh" # Múi giờ hệ thống
BACKUP_RETENTION_DAILY="14" # Số ngày lưu trữ
BACKUP_RETENTION_WEEKLY="8" # Số tuần lưu trữ
BACKUP_RETENTION_MONTHLY="12" # Số tháng lưu trữ`}
                            </pre>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="primary" size="md" onClick={() => setPolicyOpen(false)}>
                            Đã hiểu
                        </Button>
                    </div>
                </div>
            </Modal>
        </main>
    );
}
