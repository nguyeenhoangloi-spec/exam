'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
    Eye,
    Filter,
    HardDrive,
    Info,
    LockKeyhole,
    Unlock,
    RefreshCw,
    ArchiveRestore,
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
    FolderSync,
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
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
import { PaginationBar } from '../../../components/ui/PaginationBar';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { exportCsvData } from '../../../lib/export-csv';
import { printReport } from '../../../lib/export-print';
import { BackupFilterPopover } from '../../../components/backups/BackupFilterPopover';
import { BackupBulkAction } from '../../../components/backups/BackupBulkAction';

type BackupJobType = 'FULL' | 'DATABASE' | 'UPLOADS' | 'SAFETY';
type BackupStatus = 'QUEUED' | 'RUNNING' | 'VERIFYING' | 'SUCCEEDED' | 'FAILED' | 'VERIFY_FAILED' | 'CANCELLED';
type RestoreTarget = 'STAGING' | 'PRODUCTION';

interface StorageEndpointInfo {
    name: string;
    type: string;
    path: string;
    isAvailable: boolean;
    status: 'ONLINE' | 'STANDBY' | 'ERROR';
}

interface BackupSettingsData {
    autoBackupEnabled: boolean;
    intervalDays: number;
    backupTime: string;
    maxRetentionCount: number;
    dualStorageEnabled: boolean;
    primaryPath: string;
    secondaryPath: string;
}

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
    settings?: BackupSettingsData;
    worker: {
        enabled: boolean;
        schedule: string;
        lastError: string | null;
        lastErrorAt: string | null;
    };
    storage: {
        provider: 'LOCAL' | 'S3';
        isLocal: boolean;
        dualStorageEnabled?: boolean;
        primary?: StorageEndpointInfo;
        secondary?: StorageEndpointInfo;
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
    // Modal States
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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const verifiedJobs = useMemo(() => jobs.filter((job) => job.status === 'SUCCEEDED' && job.retained !== false), [jobs]);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            if (search.trim()) {
                const query = search.trim().toLowerCase();
                const matchSnapshot = job.snapshotId?.toLowerCase().includes(query);
                const matchError = job.errorMessage?.toLowerCase().includes(query);
                const matchUser = job.initiatedBy?.username?.toLowerCase().includes(query);
                const matchChecksum = job.checksum?.toLowerCase().includes(query);
                if (!matchSnapshot && !matchError && !matchUser && !matchChecksum) {
                    return false;
                }
            }
            if (filterType && job.type !== filterType) return false;
            if (filterStatus && job.status !== filterStatus) return false;
            return true;
        });
    }, [jobs, search, filterType, filterStatus]);

    const sortedJobs = useMemo(() => {
        return [...filteredJobs].sort((a, b) => {
            const tA = new Date(a.createdAt).getTime();
            const tB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? tB - tA : tA - tB;
        });
    }, [filteredJobs, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [search, filterType, filterStatus, sortOrder]);

    const paginatedJobs = useMemo(() => {
        return sortedJobs.slice((page - 1) * limit, page * limit);
    }, [sortedJobs, page, limit]);

    /* ── CƠ CHẾ XUẤT FILE ĐỒNG BỘ TOÀN HỆ THỐNG ── */
    const handleExportExcel = () => {
        const columns = [
            { header: 'Mã Snapshot', key: 'snapshotId', width: 35 },
            { header: 'Loại sao lưu', key: 'type', width: 15 },
            { header: 'Phương thức', key: 'method', width: 20 },
            { header: 'Thời gian hoàn thành', key: 'completedAt', width: 22 },
            { header: 'Thời lượng', key: 'duration', width: 15 },
            { header: 'Dung lượng', key: 'size', width: 15 },
            { header: 'Trạng thái', key: 'status', width: 18 },
            { header: 'Mã băm SHA-256', key: 'checksum', width: 40 },
        ];
        const rows = sortedJobs.map((j) => [
            j.snapshotId,
            j.type,
            j.initiatedBy?.username ? `Thủ công (${j.initiatedBy.username})` : 'Tự động',
            formatDate(j.completedAt || j.createdAt),
            calculateDuration(j.startedAt || j.createdAt, j.completedAt),
            formatBytes(j.sizeBytes),
            j.status === 'SUCCEEDED' ? 'Thành công' : j.status === 'FAILED' ? 'Thất bại' : j.status,
            j.checksum || '—',
        ]);
        exportToFormattedExcel({
            filename: `Sao_luu_du_lieu_${new Date().toISOString().split('T')[0]}.xls`,
            title: 'BÁO CÁO SAO LƯU & AN TOÀN DỮ LIỆU KHẢO THÍ',
            subtitle: `Tổng số: ${sortedJobs.length} bản snapshot · Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`,
            columns,
            rows,
        });
        setToast({ message: `Đã xuất ${sortedJobs.length} bản ghi Excel thành công`, type: 'success' });
    };

    const handleExportCsv = () => {
        const headers = ['Mã Snapshot', 'Loại', 'Phương thức', 'Thời gian', 'Thời lượng', 'Dung lượng', 'Trạng thái', 'Checksum'];
        const rows = sortedJobs.map((j) => [
            j.snapshotId,
            j.type,
            j.initiatedBy?.username || 'Tự động',
            formatDate(j.completedAt || j.createdAt),
            calculateDuration(j.startedAt || j.createdAt, j.completedAt),
            formatBytes(j.sizeBytes),
            j.status,
            j.checksum || '',
        ]);
        exportCsvData(`Sao_luu_du_lieu_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setToast({ message: `Đã xuất ${sortedJobs.length} bản ghi CSV thành công`, type: 'success' });
    };

    const handlePrint = () => {
        printReport({
            title: 'BÁO CÁO DANH SÁCH BẢN SAO LƯU HỆ THỐNG KHẢO THÍ',
            subtitle: `Tổng số bản snapshot: ${sortedJobs.length} · Dung lượng: ${overview?.totalBytes ? formatBytes(overview.totalBytes) : '—'}`,
            facultyName: 'PHÒNG QUẢN TRỊ HỆ THỐNG & DỮ LIỆU KHẢO THÍ',
            columns: [
                { header: 'STT', width: '40px', align: 'center' },
                { header: 'Mã Snapshot', width: '220px' },
                { header: 'Loại', width: '80px', align: 'center' },
                { header: 'Phương thức', width: '120px' },
                { header: 'Thời gian', width: '150px' },
                { header: 'Dung lượng', width: '100px', align: 'right' },
                { header: 'Trạng thái', width: '100px', align: 'center' },
            ],
            rows: sortedJobs.map((j, idx) => [
                idx + 1,
                j.snapshotId,
                j.type,
                j.initiatedBy?.username || 'Tự động',
                formatDate(j.completedAt || j.createdAt),
                formatBytes(j.sizeBytes),
                j.status === 'SUCCEEDED' ? 'Thành công' : j.status,
            ]),
            signers: [
                { title: 'CÁN BỘ PHỤ TRÁCH SAO LƯU', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, ghi rõ họ tên)' },
            ],
        });
    };

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
                return <StatusBadge status="PROCESSING" customLabel="Đang kiểm tra" />;
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

    {/* Shared control sizing is applied globally; keep this page behavior unchanged. */ }
    return (
        <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header matching standard page header across all management pages */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
                <div className="space-y-0.5">
                    <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
                        Sao lưu dữ liệu
                    </h1>
                    <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
                        Vận hành an toàn database, file upload và {jobs.length} bản snapshot hệ thống {overview?.totalBytes ? `· Dung lượng: ${formatBytes(overview.totalBytes)}` : ''}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* System Status Indicators */}
                    {overview?.worker && (
                        <span className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-emerald-300 dark:border-emerald-700 bg-transparent text-emerald-700 dark:text-emerald-400 text-type-body-sm font-semibold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Worker: {overview.worker.enabled ? 'Bật' : 'Tắt'}</span>
                        </span>
                    )}

                    <DataActionsDropdown
                        onExportExcel={handleExportExcel}
                        onExportCsv={handleExportCsv}
                        onPrint={handlePrint}
                        exportLabel="Xuất file Excel"
                        exportCsvLabel="Xuất file CSV"
                        printLabel="In biên bản / Xuất PDF"
                    />

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


            {/* Search & Action Toolbar (Single Unified Row) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
                <div className="relative flex-1 max-w-xl min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Tìm theo Snapshot ID, mã lỗi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
                    />
                    {/* Embedded actions on right edge of search input */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5"
                                title="Xóa tìm kiếm"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <kbd
                                className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                                onClick={() => searchInputRef.current?.focus()}
                                title="Nhấn phím / để tìm nhanh"
                            >
                                /
                            </kbd>
                        )}

                        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

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
                </div>

                {/* Right: Table Action Controls */}
                <div className="shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-2">
                            <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
                                Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{loading ? '...' : sortedJobs.length.toLocaleString('vi-VN')}</span> bản snapshot
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
            {loading ? (
                <div className="space-y-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-50 dark:bg-slate-800/40" />
                    ))}
                </div>
            ) : sortedJobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 shadow-2xs text-center space-y-5">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                        <DatabaseBackup className="h-8 w-8" />
                    </div>

                    <div className="max-w-md mx-auto space-y-1.5">
                        <h3 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">Chưa có bản sao lưu snapshot nào</h3>
                        <p className="text-type-helper font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
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
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {paginatedJobs.map((job) => {
                        const isChecked = selectedIds.includes(job.id);
                        return (
                            <article
                                key={job.id}
                                className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition hover:shadow-md ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''
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
                                            className="min-w-0 truncate text-left text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer tabular-nums"
                                            title={job.snapshotId}
                                        >
                                            {job.snapshotId}
                                        </button>
                                    </div>
                                    {getBackupStatusBadge(job.status)}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-type-body-sm">
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
                                        className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-type-body-sm font-medium transition cursor-pointer"
                                    >
                                        <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                        <span>Xem chi tiết</span>
                                    </button>
                                    {job.status === 'SUCCEEDED' && job.retained !== false && (
                                        <button
                                            type="button"
                                            onClick={() => openRestoreModal(job)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                            title="Khôi phục bản sao lưu này"
                                        >
                                            <ArchiveRestore className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : viewMode === 'compact' ? (
                <div className="space-y-2.5">
                    {paginatedJobs.map((job) => {
                        const isChecked = selectedIds.includes(job.id);
                        return (
                            <div
                                key={job.id}
                                className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
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
                                        className="tabular-nums text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                                        title={job.snapshotId}
                                    >
                                        {job.snapshotId}
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`ui-pill text-type-helper font-medium px-2 py-0.5 rounded-full tabular-nums border ${job.type === 'FULL'
                                                    ? 'ui-pill-solid bg-blue-600 text-white border-blue-600'
                                                    : job.type === 'DATABASE'
                                                        ? 'text-blue-700 border-blue-300'
                                                        : job.type === 'UPLOADS'
                                                            ? 'text-sky-700 border-sky-300'
                                                            : 'text-amber-700 border-amber-300'
                                                    }`}
                                            >
                                                {job.type}
                                            </span>
                                            <span className="text-type-helper text-slate-500 dark:text-slate-400 font-medium">
                                                {formatBytes(job.sizeBytes)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3.5 text-type-helper text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                                            <span className="flex items-center gap-1">
                                                {job.initiatedBy ? (
                                                    <>
                                                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{job.initiatedBy.username}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>Tự động</span>
                                                    </>
                                                )}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span>{formatDate(job.completedAt || job.createdAt)}</span>
                                            </span>
                                            {job.checksum && (
                                                <span className="text-slate-400 tabular-nums font-mono">
                                                    #{job.checksum.slice(0, 8)}…
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
                                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                                            title="Khôi phục bản sao lưu này"
                                        >
                                            <ArchiveRestore className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <table className="ui-table w-full text-left border-collapse text-slate-700 dark:text-slate-300 text-type-body">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th scope="col" className="p-3.5 pl-4 text-center w-10">
                                    <input
                                        type="checkbox"
                                        checked={paginatedJobs.length > 0 && paginatedJobs.every((j) => selectedIds.includes(j.id))}
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
                            {paginatedJobs.map((job) => {
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
                                                className="tabular-nums text-type-body leading-[22px] font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition text-left cursor-pointer"
                                                title={job.snapshotId}
                                            >
                                                {job.snapshotId}
                                            </button>
                                            {job.checksum && (
                                                <div className="table-meta mt-0.5 text-type-helper leading-[20px] font-mono text-slate-400">
                                                    #{job.checksum.slice(0, 10)}…
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap">
                                            <span
                                                className={`table-badge ui-pill font-medium text-type-helper leading-[18px] px-2.5 py-0.5 rounded-full border ${job.type === 'FULL'
                                                    ? 'ui-pill-solid bg-blue-600 text-white shadow-2xs'
                                                    : job.type === 'DATABASE'
                                                        ? 'text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700'
                                                        : job.type === 'UPLOADS'
                                                            ? 'text-sky-700 border-sky-300 dark:text-sky-400 dark:border-sky-700'
                                                            : 'text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700'
                                                    }`}
                                            >
                                                {job.type}
                                            </span>
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap text-type-body font-medium text-slate-700 dark:text-slate-300">
                                            {job.initiatedBy ? (
                                                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
                                                    <UserIcon className="h-3.5 w-3.5" /> {job.initiatedBy.username}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Tự động
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap text-type-body font-medium text-slate-700 dark:text-slate-300">
                                            {formatDate(job.completedAt || job.createdAt)}
                                            <span className="table-meta block text-type-helper leading-[20px] text-slate-400 mt-0.5">
                                                {calculateDuration(job.startedAt || job.createdAt, job.completedAt)}
                                            </span>
                                        </td>

                                        <td className="p-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100 text-type-body">
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
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                                                        title="Khôi phục dữ liệu từ bản snapshot này"
                                                    >
                                                        <ArchiveRestore className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <span className="table-badge text-type-helper font-medium text-slate-400">
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
            )}

            {/* Phân trang chuẩn toàn hệ thống */}
            {sortedJobs.length > 0 && (
                <PaginationBar
                    page={page}
                    totalPages={Math.max(1, Math.ceil(sortedJobs.length / limit))}
                    limit={limit}
                    totalItems={sortedJobs.length}
                    unit="bản snapshot"
                    onPage={setPage}
                    onLimit={(l) => { setLimit(l); setPage(1); }}
                    limitOptions={[10, 20, 50, 100]}
                />
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

            {/* Pending Restore Requests Table — Thiết kế phẳng hoàn toàn, không khung hộp thừa */}
            {restoreRequests.length > 0 && (
                <section className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <h2 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">
                                Yêu cầu khôi phục chờ phê duyệt
                            </h2>
                            <span className="ui-pill inline-flex items-center justify-center px-2 py-0.5 rounded-full text-type-badge font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 tabular-nums">
                                {restoreRequests.length}
                            </span>
                        </div>
                        <p className="text-type-helper text-slate-500 dark:text-slate-400">
                            Cần Quản trị viên thứ hai phê duyệt độc lập
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                        <table className="ui-table w-full text-left border-collapse text-slate-700 dark:text-slate-300 text-type-body">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                    <th scope="col" className="p-3.5 pl-4 whitespace-nowrap">Snapshot ID</th>
                                    <th scope="col" className="p-3.5 whitespace-nowrap">Môi trường</th>
                                    <th scope="col" className="p-3.5">Lý do khôi phục</th>
                                    <th scope="col" className="p-3.5 whitespace-nowrap">Người yêu cầu</th>
                                    <th scope="col" className="p-3.5 whitespace-nowrap">Thời hạn</th>
                                    <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                                {restoreRequests.map((request) => {
                                    const selfBlocked = isSelfApprovalBlocked(request);
                                    const isExpired = request.expiresAt ? new Date(request.expiresAt) < new Date() : false;

                                    return (
                                        <tr key={request.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                            {/* Snapshot ID */}
                                            <td className="p-3.5 pl-4 tabular-nums text-type-body font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap" title={request.backupJob.snapshotId}>
                                                {request.backupJob.snapshotId}
                                            </td>

                                            {/* Môi trường */}
                                            <td className="p-3.5 whitespace-nowrap">
                                                {request.target === 'PRODUCTION' ? (
                                                    <span className="inline-flex items-center gap-1 text-type-body-sm font-semibold text-rose-600 dark:text-rose-400">
                                                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                                                        Production
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-type-body-sm font-semibold text-amber-600 dark:text-amber-400">
                                                        <Server className="h-3.5 w-3.5 shrink-0" />
                                                        Staging
                                                    </span>
                                                )}
                                            </td>

                                            {/* Lý do */}
                                            <td className="p-3.5">
                                                <p className="text-type-body-sm text-slate-700 dark:text-slate-300 max-w-[240px] line-clamp-2">
                                                    {request.reason || '—'}
                                                </p>
                                            </td>

                                            {/* Người yêu cầu */}
                                            <td className="p-3.5 whitespace-nowrap text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1">
                                                    <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {request.requestedBy?.username || 'admin'}
                                                </span>
                                            </td>

                                            {/* Thời hạn */}
                                            <td className="p-3.5 whitespace-nowrap text-type-body-sm tabular-nums">
                                                {isExpired ? (
                                                    <div className="space-y-0.5">
                                                        <span className="text-type-helper font-semibold text-rose-600 dark:text-rose-400 block">Đã hết hạn</span>
                                                        <span className="text-type-helper text-slate-400 block">{formatDate(request.expiresAt)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 dark:text-slate-400">{formatDate(request.expiresAt)}</span>
                                                )}
                                            </td>

                                            {/* Thao tác (Phẳng, nút không viền thô) */}
                                            <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                                                {request.status === 'PENDING_APPROVAL' ? (
                                                    <div className="inline-flex items-center justify-end gap-2">
                                                        {selfBlocked ? (
                                                            <span
                                                                title="Bạn là người tạo yêu cầu nên cần Admin khác duyệt độc lập"
                                                                className="text-type-helper font-medium text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 cursor-default select-none pr-1"
                                                            >
                                                                <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
                                                                <span>Chờ Admin khác duyệt</span>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => openCriticalApproveModal(request)}
                                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-type-body-sm font-semibold rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                                            >
                                                                <LockKeyhole className="h-3.5 w-3.5" />
                                                                <span>Phê duyệt</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => openRejectModal(request)}
                                                            className="px-2.5 py-1.5 text-type-body-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                ) : request.status === 'FAILED' && request.errorMessage?.startsWith('[MAINTENANCE_LOCKED]') ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRejectModal(request)}
                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-type-body-sm font-semibold rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        <Unlock className="h-3.5 w-3.5" />
                                                        <span>Mở khóa</span>
                                                    </button>
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
                </section>
            )}


            {/* ── SNAPSHOT DETAIL DRAWER: Chuẩn Design System & Hoạt ảnh 60 FPS ── */}
            {drawerOpenJob && (
                <div role="dialog" aria-modal="true" aria-label="Chi tiết bản sao lưu" className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Backdrop mờ nền */}
                    <div
                        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                        onClick={() => setDetailJob(null)}
                    />

                    {/* Drawer Container */}
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                        <div
                            className={`w-screen max-w-[560px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/90 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${drawerVisible ? 'translate-x-0' : 'translate-x-full'
                                }`}
                        >
                            {/* Header — Tương phản cao, Phân cấp chuẩn mực */}
                            <div className="relative bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/90 dark:border-slate-800 p-6 shrink-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-type-body shadow-sm shadow-blue-500/25 border border-blue-400/30">
                                            <DatabaseBackup className="h-6 w-6 text-white" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white break-words">
                                                    Bản sao lưu Snapshot
                                                </h2>
                                                <StatusBadge status={drawerOpenJob.status} />
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 flex-wrap text-type-helper font-medium text-slate-500 dark:text-slate-400 tabular-nums">
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
                            <div className="flex-1 space-y-6 overflow-y-auto bg-white dark:bg-slate-900 p-6 text-type-body">
                                {/* Section 1: Thông số tổng quan */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                                        <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                                            Thông số tổng quan bản sao lưu
                                        </h3>
                                    </div>

                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Loại sao lưu:</span>
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">{drawerOpenJob.type}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Dung lượng tổng:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatBytes(drawerOpenJob.sizeBytes)}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Người khởi tạo:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {drawerOpenJob.initiatedBy ? drawerOpenJob.initiatedBy.username : 'Hệ thống (Tự động)'}
                                            </span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian khởi tạo:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatDate(drawerOpenJob.createdAt)}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian hoàn thành:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatDate(drawerOpenJob.completedAt)}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Thời lượng thực thi:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{calculateDuration(drawerOpenJob.startedAt, drawerOpenJob.completedAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Phiên bản kỹ thuật & Git */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                                        <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                                            Thông số mã nguồn &amp; Cơ sở dữ liệu
                                        </h3>
                                    </div>

                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Prisma Migration Version:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums break-all text-right">{drawerOpenJob.migration || 'Không xác định'}</span>
                                        </div>

                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
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
                                            <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                                                Mã băm SHA-256 Checksum
                                            </h3>
                                        </div>

                                        {drawerOpenJob.checksum && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyChecksum(drawerOpenJob.checksum)}
                                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-type-helper font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50"
                                            >
                                                {copiedChecksum ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                                                <span>{copiedChecksum ? 'Đã sao chép!' : 'Sao chép SHA-256'}</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 p-4 text-type-helper font-normal leading-relaxed text-slate-800 dark:text-slate-200 tabular-nums break-all">
                                        {drawerOpenJob.checksum || 'Chưa có checksum cho snapshot này'}
                                    </div>
                                </div>

                                {/* Section 4: Chi tiết lỗi (nếu có) */}
                                {drawerOpenJob.errorMessage && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-1 rounded-full bg-rose-600 shrink-0" />
                                            <h3 className="text-type-body font-semibold text-rose-700 dark:text-rose-400">
                                                Chi tiết nhật ký lỗi
                                            </h3>
                                        </div>
                                        <div className="rounded-xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 text-type-helper font-normal leading-relaxed text-rose-900 dark:text-rose-200 whitespace-pre-wrap">
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
                    <div className="flex items-start gap-2 text-type-helper font-medium text-amber-800 pb-1 border-b border-slate-100">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>
                            <strong className="font-semibold text-amber-900">Lưu ý an toàn:</strong> Khôi phục dữ liệu sẽ ghi đè dữ liệu trên môi trường được chọn. Hãy chọn đúng môi trường và nhập lý do rõ ràng.
                        </span>
                    </div>

                    {/* Frameless Selected Snapshot Info */}
                    <div className="space-y-0.5 pb-2 border-b border-slate-100">
                        <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {selectedJob?.snapshotId}
                        </p>
                        <p className="text-type-helper font-semibold text-slate-500 mt-0.5">
                            {formatDate(selectedJob?.completedAt)} · {formatBytes(selectedJob?.sizeBytes)}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-type-body font-medium text-slate-500">Môi trường đích:</label>
                        <FilterSelect
                            size="md"
                            className="w-full text-type-body-sm font-semibold text-slate-900"
                            containerClassName="w-full"
                            value={target}
                            onChange={(e) => setTarget(e.target.value as RestoreTarget)}
                        >
                            <option value="STAGING">Staging — Môi trường kiểm thử an toàn</option>
                            <option value="PRODUCTION">Production — Môi trường vận hành thực tế (Cần Admin 2 phê duyệt)</option>
                        </FilterSelect>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-type-body font-medium text-slate-500">
                            Lý do khôi phục <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            placeholder="Mô tả cụ thể sự cố cần phục hồi hoặc mục đích thử nghiệm..."
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-type-body font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button variant="secondary" size="md" onClick={() => setRestoreOpen(false)} disabled={actionLoading}>
                            Hủy bỏ
                        </Button>
                        <Button size="md" onClick={() => void handleRequestRestore()} isLoading={actionLoading} leftIcon={<ArchiveRestore className="h-4 w-4" />}>
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
        </main>
    );
}
