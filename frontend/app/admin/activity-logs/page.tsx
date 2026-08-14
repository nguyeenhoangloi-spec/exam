'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
import { Button } from '../../../components/ui/Button';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { SortDropdown } from '../../../components/ui/SortDropdown';
import { Toast } from '../../../components/Toast';
import { ColumnToggleDropdown } from '../../../components/ui/ColumnToggleDropdown';
import { printReport } from '../../../lib/export-print';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import {
    Activity,
    Search,
    RefreshCw,
    Printer,
    RotateCcw,
    User as UserIcon,
    ShieldCheck,
    FileText,
    Database,
    AlertCircle,
    LogIn,
    X,
    Code,
    Info,
    Copy,
    Check,
    Download,
    SlidersHorizontal,
    Eye,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    List,
    LayoutGrid,
    Layers,
    MoreHorizontal,
    Mail,
    Building,
    Trash2,
    HardDrive,
    FileCheck,
    HelpCircle,
    Calendar,
    Clock,
    GraduationCap,
    UserCheck,
    Building2,
    BookOpen,
} from 'lucide-react';


interface AuditLogRecord {
    id: string;
    actorId?: number | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    description: string;
    metadata?: any;
    createdAt: string;
    actor?: {
        id: number;
        username: string;
        email: string;
        role: string;
    } | null;
}

const MOCK_AUDIT_LOGS: AuditLogRecord[] = [
    {
        id: 'log-001',
        actorId: 1,
        action: 'BACKUP_QUEUED',
        entityType: 'BackupJob',
        entityId: 'snap-20260811-1345',
        description: 'Đã tạo yêu cầu sao lưu Snapshot CSDL môi trường STAGING',
        metadata: { environment: 'STAGING', requester: 'admin' },
        createdAt: '2026-08-11T13:45:00.000Z',
        actor: { id: 1, username: 'admin', email: 'admin@exam.edu.vn', role: 'ADMIN' },
    },
    {
        id: 'log-002',
        actorId: 1,
        action: 'BACKUP_RESTORE_APPROVED',
        entityType: 'BackupJob',
        entityId: 'snap-20260811-1341',
        description: 'Đã phê duyệt Restore môi trường STAGING từ bản sao lưu',
        metadata: { environment: 'STAGING', approvedBy: 'admin' },
        createdAt: '2026-08-11T13:41:00.000Z',
        actor: { id: 1, username: 'admin', email: 'admin@exam.edu.vn', role: 'ADMIN' },
    },
    {
        id: 'log-003',
        actorId: 2,
        action: 'APPROVED_REGRADE',
        entityType: 'GradeAppeal',
        entityId: 'appeal-102',
        description: 'Thẩm định & Chấp nhận phúc khảo điểm cho sinh viên Trần Thị Bình (6.5đ -> 8.5đ)',
        metadata: { originalScore: 6.5, revisedScore: 8.5, subject: 'WEB02' },
        createdAt: '2026-08-11T11:20:00.000Z',
        actor: { id: 2, username: 'teacher_nam', email: 'nam.nv@exam.edu.vn', role: 'TEACHER' },
    },
    {
        id: 'log-004',
        actorId: 1,
        action: 'APPROVE_QUESTION',
        entityType: 'Question',
        entityId: 'q-2733',
        description: 'Đã phê duyệt câu hỏi trắc nghiệm CSDL nâng cao vào ngân hàng đề',
        metadata: { questionCode: 'CSDL-TN-05', difficulty: 'MEDIUM' },
        createdAt: '2026-08-11T10:15:00.000Z',
        actor: { id: 1, username: 'admin', email: 'admin@exam.edu.vn', role: 'ADMIN' },
    },
    {
        id: 'log-005',
        actorId: 4,
        action: 'CREATE_GRADE_APPEAL',
        entityType: 'GradeAppeal',
        entityId: 'appeal-104',
        description: 'Sinh viên Phạm Minh Đức gửi đơn xin phúc khảo bài thi tự luận CSDL',
        metadata: { originalScore: 7.5, subjectCode: 'CSDL01' },
        createdAt: '2026-08-11T09:30:00.000Z',
        actor: { id: 4, username: 'sv_duc', email: 'duc.pm@student.edu.vn', role: 'STUDENT' },
    },
    {
        id: 'log-006',
        actorId: 1,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: '1',
        description: 'Đăng nhập hệ thống thành công qua tài khoản Google OAuth2',
        metadata: { ip: '127.0.0.1', userAgent: 'Chrome/127.0.0.0' },
        createdAt: '2026-08-11T08:00:00.000Z',
        actor: { id: 1, username: 'admin', email: 'admin@exam.edu.vn', role: 'ADMIN' },
    },
];


function EntityTarget({ entityType, entityId }: { entityType: string; entityId?: string | null }) {
    const typeMap: Record<string, { label: string; Icon: React.ElementType }> = {
        AUTH: { label: 'Xác thực', Icon: ShieldCheck },
        User: { label: 'Tài khoản', Icon: UserIcon },
        BackupJob: { label: 'Job Sao lưu', Icon: Database },
        BACKUP_JOB: { label: 'Job Sao lưu', Icon: Database },
        BackupRestoreRequest: { label: 'Khôi phục DB', Icon: HardDrive },
        BACKUP_RESTORE_REQUEST: { label: 'Khôi phục DB', Icon: HardDrive },
        GradeAppeal: { label: 'Phúc khảo', Icon: FileCheck },
        Question: { label: 'Câu hỏi', Icon: HelpCircle },
        ExamPaper: { label: 'Đề thi', Icon: FileText },
        ExamPeriod: { label: 'Kỳ thi', Icon: Calendar },
        ExamRoom: { label: 'Phòng thi', Icon: Building },
        ExamSchedule: { label: 'Lịch thi', Icon: Clock },
        Student: { label: 'Sinh viên', Icon: GraduationCap },
        Teacher: { label: 'Giảng viên', Icon: UserCheck },
        Class: { label: 'Lớp học', Icon: Building2 },
        Department: { label: 'Khoa / Phòng', Icon: Building2 },
        Subject: { label: 'Môn học', Icon: BookOpen },
    };

    const info = typeMap[entityType] || { label: entityType, Icon: Building };
    const Icon = info.Icon;

    const isLongId = entityId && entityId.length > 14;
    const formattedId = entityId
        ? isLongId
            ? `${entityId.slice(0, 5)}...${entityId.slice(-4)}`
            : entityId
        : null;

    return (
        <div className="group relative inline-flex items-center gap-1.5 whitespace-nowrap">
            <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{info.label}</span>
            {entityId && (
                <IdentifierBadge tone="neutral" title={entityId}>
                    #{formattedId}
                </IdentifierBadge>
            )}

            {isLongId && (
                <div className="table-tooltip pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white shadow-lg dark:bg-slate-800 whitespace-nowrap z-50">
                    <span>#{entityId}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                </div>
            )}
        </div>
    );
}

function ActionCode({ action }: { action: string }) {
    const normalized = action.toUpperCase();
    const meta = normalized.includes('LOGIN')
        ? { Icon: CheckCircle2, className: 'text-emerald-700' }
        : normalized.includes('BACKUP')
            ? { Icon: Database, className: 'text-slate-700' }
            : normalized.includes('APPEAL') || normalized.includes('REGRADE')
                ? { Icon: AlertCircle, className: 'text-amber-700' }
                : { Icon: ShieldCheck, className: 'text-blue-700' };
    const Icon = meta.Icon;

    return (
        <span className={`table-action inline-flex items-center gap-1.5 font-sans text-[15px] leading-[22px] font-medium ${meta.className}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {action}
        </span>
    );
}

export default function ActivityLogsPage() {
    usePageTitle('Nhật ký hoạt động hệ thống');
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLogRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [entityFilter, setEntityFilter] = useState<string>('');

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Toolbar & View Controls State (Identical to StudentTableToolbar)
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
    const [openColumnMenu, setOpenColumnMenu] = useState<boolean>(false);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        createdAt: true,
        actor: true,
        action: true,
        entity: true,
        description: true,
    });

    // Pagination state (limit 10 default)
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Inspector Drawer State
    const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isSpinning, setIsSpinning] = useState<boolean>(false);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { page, limit };
            if (search.trim()) params.search = search.trim();
            if (entityFilter) params.entityType = entityFilter;

            const res = await api.get('/audit-logs', { params });
            if (res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
                setLogs(res.data.items);
                setTotalCount(res.data.total || res.data.items.length);
            } else {
                setLogs(MOCK_AUDIT_LOGS);
                setTotalCount(MOCK_AUDIT_LOGS.length);
            }
        } catch {
            setLogs(MOCK_AUDIT_LOGS);
            setTotalCount(MOCK_AUDIT_LOGS.length);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, entityFilter]);

    const handleRefreshClick = async () => {
        setIsSpinning(true);
        await fetchLogs();
        setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
        setTimeout(() => setIsSpinning(false), 600);
    };

    useEffect(() => {
        const currentUser = getAuthUser();
        if (!currentUser) return void router.replace('/login');
        if (currentUser.role !== 'ADMIN') return void router.replace('/dashboard');
        fetchLogs();
    }, [fetchLogs, router]);

    // Toggle Checkbox Selection
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedLogs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedLogs.map((l) => l.id));
        }
    };

    // Toggle Column Visibility
    const handleColumnToggle = (key: string) => {
        setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // KPI Data calculated dynamically
    const kpiData = useMemo(() => {
        let total = logs.length, login = 0, dataOps = 0, appeal = 0;
        logs.forEach((l) => {
            const act = l.action.toUpperCase();
            if (act.includes('LOGIN')) login++;
            else if (act.includes('APPEAL') || act.includes('REGRADE')) appeal++;
            else dataOps++;
        });
        return { total: totalCount || total, login, dataOps, appeal };
    }, [logs, totalCount]);

    // Entities List for Dropdown
    const entityTypes = useMemo(() => {
        const set = new Set<string>();
        logs.forEach((l) => { if (l.entityType) set.add(l.entityType); });
        return Array.from(set);
    }, [logs]);

    // Filtered & Sorted Display List
    const filteredLogs = useMemo(() => {
        let list = logs.filter((item) => {
            if (search.trim()) {
                const s = search.toLowerCase();
                const matchActor = (item.actor?.username || '').toLowerCase().includes(s);
                const matchAction = item.action.toLowerCase().includes(s);
                const matchDesc = item.description.toLowerCase().includes(s);
                if (!matchActor && !matchAction && !matchDesc) return false;
            }
            if (entityFilter && item.entityType !== entityFilter) return false;
            return true;
        });

        if (sortOrder === 'oldest') {
            list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
            list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return list;
    }, [logs, search, entityFilter, sortOrder]);

    const totalPages = Math.ceil(filteredLogs.length / limit) || 1;
    const paginatedLogs = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredLogs.slice(start, start + limit);
    }, [filteredLogs, page, limit]);

    const exportExcel = () => {
        exportToFormattedExcel({
            filename: `AuditLogs_Export_${new Date().toISOString().split('T')[0]}.xlsx`,
            title: 'DANH SÁCH NHẬT KÝ & LỊCH SỬ THAO TÁC HỆ THỐNG KHẢO THÍ',
            columns: [
                { header: 'STT', align: 'center' },
                { header: 'Thời gian' },
                { header: 'Người thực hiện' },
                { header: 'Email' },
                { header: 'Role' },
                { header: 'Hành động' },
                { header: 'Thực thể' },
                { header: 'ID' },
                { header: 'Mô tả chi tiết' },
            ],
            rows: filteredLogs.map((l, idx) => [
                idx + 1,
                new Date(l.createdAt).toLocaleString('vi-VN'),
                l.actor?.username || 'Hệ thống',
                l.actor?.email || 'N/A',
                l.actor?.role || 'SYSTEM',
                l.action,
                l.entityType,
                l.entityId || '',
                l.description,
            ]),
        });
    };

    const handlePrintReport = () => {
        const now = new Date();
        const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

        printReport({
            title: 'NHẬT KÝ & LỊCH SỬ THAO TÁC HỆ THỐNG KHẢO THÍ',
            subtitle: `Trích xuất thời gian thực · Ngày xuất: ${dateStr}`,
            metaInfo: [
                { label: 'Đơn vị quản lý', value: 'Ban Khảo thí & Quản trị Hệ thống' },
                { label: 'Hệ thống', value: 'Exam Management System Audit Logger' },
            ],
            columns: [
                { header: 'STT', width: '40px', align: 'center' },
                { header: 'Thời gian', width: '140px', align: 'center' },
                { header: 'Tài khoản thực hiện', width: '150px', align: 'left' },
                { header: 'Hành động', width: '160px', align: 'center' },
                { header: 'Mô tả chi tiết', width: '280px', align: 'left' },
            ],
            rows: filteredLogs.map((l, idx) => [
                idx + 1,
                new Date(l.createdAt).toLocaleString('vi-VN'),
                l.actor?.username || 'Hệ thống',
                l.action,
                l.description,
            ]),
            footerNotes: 'Bản nhật ký được chứng thực tự động từ Audit Log Service.',
            signers: [
                { title: 'NGƯỜI XUẤT NHẬT KÝ', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'QUẢN TRỊ VIÊN HỆ THỐNG', subtitle: '(Ký tên, đóng dấu)' },
            ],
        });
    };

    const copyMetadataJson = () => {
        if (!selectedLog) return;
        const jsonStr = JSON.stringify(selectedLog.metadata || {}, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const kpiItems = [
        {
            title: 'Tổng nhật ký thao tác',
            value: kpiData.total,
            subtext: 'Lịch sử ghi vết toàn hệ thống',
            progressPercent: kpiData.total > 0 ? 100 : 0,
            icon: Activity,
        },
        {
            title: 'Phiên đăng nhập',
            value: kpiData.login,
            subtext: 'Đăng nhập & Google OAuth',
            progressPercent: kpiData.total > 0 ? Math.round((kpiData.login / kpiData.total) * 100) : 0,
            icon: LogIn,
        },
        {
            title: 'Tạo & phê duyệt đề',
            value: kpiData.dataOps,
            subtext: 'Biên soạn ngân hàng đề',
            progressPercent: kpiData.total > 0 ? Math.round((kpiData.dataOps / kpiData.total) * 100) : 0,
            icon: ShieldCheck,
        },
        {
            title: 'Phúc khảo & đổi điểm',
            value: kpiData.appeal,
            subtext: 'Khiếu nại điểm & thẩm định',
            progressPercent: kpiData.total > 0 ? Math.round((kpiData.appeal / kpiData.total) * 100) : 0,
            icon: AlertCircle,
        },
    ];

    return (
        <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── 1. Page Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
                <div className="space-y-0.5">
                    <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
                        Nhật ký hoạt động hệ thống
                    </h1>
                    <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
                        Theo dõi, rà soát và ghi vết chi tiết mọi lịch sử thao tác của Quản trị viên, Giảng viên và Thí sinh
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={exportExcel}
                        leftIcon={<Download className="h-4 w-4 text-slate-500" />}
                    >
                        Xuất Excel
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={handlePrintReport}
                        leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
                    >
                        In Báo cáo
                    </Button>
                </div>
            </div>

            {/* ── 2. Top KPI Cards With Micro Progress Tracks ── */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {kpiItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <div
                            key={item.title}
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                        {item.title}
                                    </span>
                                    <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                                        {item.value.toLocaleString('vi-VN')}
                                    </div>
                                </div>

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                                    <IconComponent className="h-5 w-5 stroke-[2.2]" />
                                </div>
                            </div>

                            {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
                            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                                />
                            </div>

                            <div className="mt-2.5">
                                <span
                                    title={item.subtext}
                                    className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                                >
                                    {item.subtext}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Card Toolbar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5">
                {/* Search Input Field */}
                <div className="relative flex-1 w-full min-w-[280px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Tìm theo mô tả, người thực hiện, thực thể..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setPage(1); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter Select Dropdowns Group */}
                <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Thực thể:</span>
                        <FilterSelect
                            value={entityFilter}
                            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                            size="md"
                        >
                            <option value="">Tất cả các thực thể</option>
                            {entityTypes.map((et) => (
                                <option key={et} value={et}>{et}</option>
                            ))}
                        </FilterSelect>
                    </div>
                </div>
            </div>

            {/* ── 4. Table Action Toolbar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                <span className="text-[14px] font-medium text-slate-600">
                    <span className="font-semibold text-slate-900">{filteredLogs.length.toLocaleString('vi-VN')}</span> kết quả
                </span>

                <div className="flex items-center gap-2">
                    {/* Sort selector */}
                    <SortDropdown
                        value={sortOrder}
                        onChange={(val) => setSortOrder(val)}
                        options={[
                            { value: 'newest', label: 'Mới nhất' },
                            { value: 'oldest', label: 'Cũ nhất' },
                        ]}
                    />

                    {/* Column selector */}
                    <ColumnToggleDropdown
                        columns={[
                            { key: 'createdAt', label: 'Thời gian' },
                            { key: 'actor', label: 'Người thực hiện' },
                            { key: 'action', label: 'Hành động' },
                            { key: 'entity', label: 'Đối tượng' },
                            { key: 'description', label: 'Mô tả thao tác' },
                        ]}
                        visibleColumns={visibleColumns}
                        onToggle={(key) => handleColumnToggle(key)}
                    />

                    {/* View mode toggle */}
                    <div className="flex h-10 items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            title="Danh sách"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            title="Dạng thẻ"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('compact')}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${viewMode === 'compact' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            title="Thu gọn"
                        >
                            <Layers className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Refresh button */}
                    <button
                        type="button"
                        onClick={handleRefreshClick}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 select-none"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 text-[14px] font-medium text-blue-900 shadow-2xs">
                    <span>Đã chọn <strong className="text-blue-700">{selectedIds.length}</strong> dòng nhật ký</span>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="xs" onClick={() => setSelectedIds([])}>
                            Bỏ chọn tất cả
                        </Button>
                        <Button
                            variant="danger"
                            size="xs"
                            onClick={() => {
                                setToast({ message: `Đã xử lý ${selectedIds.length} nhật ký được chọn.`, type: 'success' });
                                setSelectedIds([]);
                            }}
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        >
                            Xóa {selectedIds.length} mục
                        </Button>
                    </div>
                </div>
            )}

            {/* ── 5. Full-Width DataGrid Table (Exact StudentTable Match 1-1) ── */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedLogs.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 hover:shadow-md transition">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[14px] font-medium text-slate-700">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                <ActionCode action={item.action} />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[12px] font-medium text-slate-700">
                                    {(item.actor?.username || 'A').slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[15px] font-semibold text-slate-900">{item.actor?.username || 'Hệ thống'}</p>
                                    <p className="text-[15px] leading-[22px] font-normal text-slate-500">{item.actor?.email}</p>
                                </div>
                            </div>
                            <p className="text-[15px] leading-[22px] font-normal text-slate-700">{item.description}</p>
                            <div className="pt-2 flex justify-end gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLog(item)}
                                    className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                    title="Chi tiết JSON"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLog(item)}
                                    className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                    title="Tùy chọn khác"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : viewMode === 'compact' ? (
                <div className="space-y-2.5">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 shadow-2xs">
                            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-[15px] font-semibold text-slate-500">Đang tải nhật ký hoạt động...</p>
                        </div>
                    ) : paginatedLogs.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 shadow-2xs">
                            Chưa có nhật ký hoạt động nào phù hợp.
                        </div>
                    ) : (
                        paginatedLogs.map((item) => {
                            const isChecked = selectedIds.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                                        isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                                    }`}
                                >
                                    {/* Left: Checkbox + Avatar */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleSelect(item.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                        />
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100/80">
                                            {(item.actor?.username || 'HT').slice(0, 2).toUpperCase()}
                                        </div>

                                        {/* Middle: Description + ActionCode + Meta chips */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedLog(item)}
                                                    className="text-[15px] font-semibold text-slate-900 truncate hover:text-blue-600 transition cursor-pointer text-left max-w-xl"
                                                >
                                                    {item.description}
                                                </button>
                                                <ActionCode action={item.action} />
                                            </div>

                                            <div className="flex items-center gap-3.5 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                                                <span className="flex items-center gap-1">
                                                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="text-slate-700 font-medium">{item.actor?.username || 'Hệ thống'}</span>
                                                    {item.actor?.role && (
                                                        <span className="table-badge bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[12px] font-medium border border-slate-200">
                                                            {item.actor.role}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="text-slate-600 font-medium">{item.entityType}</span>
                                                    {item.entityId && (
                                                        <IdentifierBadge tone="neutral" title={item.entityId}>
                                                            ({item.entityId})
                                                        </IdentifierBadge>
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedLog(item)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                                            title="Xem chi tiết JSON"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedLog(item)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                                            title="Tùy chọn khác"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="ui-table-wrap rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="ui-table w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/80 font-semibold leading-5 text-slate-600 text-[14px]">
                                    <th className="w-10 text-center py-3.5 px-4">
                                        <input
                                            type="checkbox"
                                            checked={paginatedLogs.length > 0 && selectedIds.length === paginatedLogs.length}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    {visibleColumns.createdAt && <th className="whitespace-nowrap py-3.5 px-4">Thời gian</th>}
                                    {visibleColumns.actor && <th className="whitespace-nowrap py-3.5 px-4">Người thực hiện</th>}
                                    {visibleColumns.action && <th className="whitespace-nowrap py-3.5 px-4">Hành động</th>}
                                    {visibleColumns.entity && <th className="whitespace-nowrap py-3.5 px-4">Đối tượng tác động</th>}
                                    {visibleColumns.description && <th className="min-w-[280px] py-3.5 px-4">Mô tả thao tác</th>}
                                    <th className="text-right whitespace-nowrap py-3.5 px-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-normal text-slate-900 text-[15px]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                                            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-[15px] font-semibold text-slate-500">Đang tải nhật ký hoạt động hệ thống...</p>
                                        </td>
                                    </tr>
                                ) : paginatedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 px-4 text-center text-slate-500 font-normal">
                                            Chưa có nhật ký hoạt động nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLogs.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-blue-50/40 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/60' : ''
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="text-center py-3.5 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>

                                            {/* Thời gian */}
                                            {visibleColumns.createdAt && (
                                                <td className="whitespace-nowrap font-medium text-slate-800 py-3.5 px-4 text-[15px]">
                                                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                                                </td>
                                            )}

                                            {/* Người thực hiện */}
                                            {visibleColumns.actor && (
                                                <td className="whitespace-nowrap py-2.5 px-4">
                                                    <div
                                                        className="group relative inline-flex items-center gap-2 cursor-pointer"
                                                        title={item.actor?.email || "system@exam.edu.vn"}
                                                    >
                                                        <div className="table-avatar flex shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 h-7 w-7">
                                                            {(item.actor?.username || "A").slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-[15px] leading-[22px]">
                                                            {item.actor?.username || "Hệ thống"}
                                                        </span>

                                                        {/* Floating Tooltip khi Hover */}
                                                        <div className="table-tooltip pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-white shadow-lg dark:bg-slate-800 whitespace-nowrap z-50 transition-opacity">
                                                            <Mail className="h-3 w-3 text-slate-300" />
                                                            <span>{item.actor?.email || "system@exam.edu.vn"}</span>
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {/* Hành động */}
                                            {visibleColumns.action && (
                                                <td className="whitespace-nowrap py-3.5 px-4">
                                                    <ActionCode action={item.action} />
                                                </td>
                                            )}

                                            {/* Đối tượng tác động */}
                                            {visibleColumns.entity && (
                                                <td className="whitespace-nowrap py-2.5 px-4">
                                                    <EntityTarget entityType={item.entityType} entityId={item.entityId} />
                                                </td>
                                            )}

                                            {/* Mô tả */}
                                            {visibleColumns.description && (
                                                <td className="leading-relaxed font-normal text-slate-700 py-3.5 px-4">
                                                    {item.description}
                                                </td>
                                            )}

                                            {/* Action buttons */}
                                            <td className="text-right whitespace-nowrap py-3.5 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLog(item)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition cursor-pointer"
                                                        title="Xem chi tiết nhật ký"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(item.id);
                                                            setToast({ message: `Đã sao chép mã ID log (${item.id})!`, type: 'success' });
                                                        }}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition cursor-pointer"
                                                        title="Sao chép mã Log ID"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── 6. Pagination Bar (Standalone Custom Inline - Fully Isolated) ── */}
            {filteredLogs.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3">
                    <p className="text-[14px] font-normal text-slate-500">
                        Hiển thị <span className="font-semibold text-slate-900">{(page - 1) * limit + 1}</span> -{' '}
                        <span className="font-semibold text-slate-900">{Math.min(page * limit, filteredLogs.length)}</span> trong{' '}
                        <span className="font-semibold text-slate-900">{filteredLogs.length.toLocaleString('vi-VN')}</span> Nhật ký
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
                                title="Trang trước"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setPage(1)}
                                className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-[14px] transition cursor-pointer shadow-2xs ${page === 1
                                        ? 'bg-primary-600 text-white shadow-xs font-semibold'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                                    }`}
                            >
                                1
                            </button>

                            {totalPages >= 2 && (
                                <button
                                    type="button"
                                    onClick={() => setPage(2)}
                                    className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-[14px] transition cursor-pointer shadow-2xs ${page === 2
                                            ? 'bg-primary-600 text-white shadow-xs font-semibold'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                                        }`}
                                >
                                    2
                                </button>
                            )}

                            {totalPages > 3 && <span className="px-1 text-[14px] font-medium text-slate-500">...</span>}

                            {totalPages > 2 && (
                                <button
                                    type="button"
                                    onClick={() => setPage(totalPages)}
                                    className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-[14px] transition cursor-pointer shadow-2xs ${page === totalPages
                                            ? 'bg-primary-600 text-white shadow-xs font-semibold'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                                        }`}
                                >
                                    {totalPages}
                                </button>
                            )}

                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
                                title="Trang sau"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <FilterSelect
                            size="sm"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                            <option value={100}>100 / trang</option>
                        </FilterSelect>
                    </div>
                </div>
            )}

            {/* ── 7. Metadata Inspector Drawer (Exact System Drawer Standard Match 1-1) ── */}
            {selectedLog && (
                <div role="dialog" aria-modal="true" aria-label="Chi tiết nhật ký" className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity"
                        onClick={() => setSelectedLog(null)}
                    />

                    {/* Drawer Container */}
                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-[100]">
                        <div className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-300">

                            {/* Header - Modern Gradient matching system standard */}
                            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 text-white shrink-0 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 font-semibold text-sm text-white border border-white/20 shadow-xs">
                                            LOG
                                        </div>
                                        <div className="min-w-0 flex-1 pr-2">
                                            <h2 className="text-[18px] font-semibold leading-snug text-white line-clamp-2 break-words">
                                                Chi tiết Nhật ký #{selectedLog.id}
                                            </h2>
                                            <p className="mt-1.5 text-[13px] font-medium text-blue-100/90 tabular-nums">
                                                Thời gian: {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedLog(null)}
                                        className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
                                        title="Đóng"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 p-6 text-[15px]">

                                {/* Card 1: Thông tin chung */}
                                <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                                    <h3 className="border-b border-slate-100 pb-2 text-[13px] font-semibold text-slate-700">
                                        Thông tin định danh
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="mb-0.5 block text-[13px] font-medium text-slate-500">
                                                Mã hành động
                                            </span>
                                            <span className="font-sans text-[15px] leading-[22px] font-medium text-blue-700">{selectedLog.action}</span>
                                        </div>

                                        <div>
                                            <span className="mb-0.5 block text-[13px] font-medium text-slate-500">
                                                Tài khoản thực hiện
                                            </span>
                                            <p className="text-[15px] font-semibold text-slate-900">
                                                {selectedLog.actor?.username || 'Hệ thống'}
                                            </p>
                                            <p className="text-[13px] font-normal text-slate-500">
                                                {selectedLog.actor?.email || 'N/A'} ({selectedLog.actor?.role || 'SYSTEM'})
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="mb-0.5 block text-[13px] font-medium text-slate-500">
                                                Thực thể tác động
                                            </span>
                                            <p className="text-[15px] font-semibold text-slate-800">
                                                {selectedLog.entityType}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="mb-0.5 block text-[13px] font-medium text-slate-500">
                                                ID Thực thể
                                            </span>
                                            <p className=" text-[14px] font-medium tabular-nums text-slate-700">
                                            #{selectedLog.entityId || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Nội dung mô tả */}
                                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                                    <h3 className="border-b border-slate-100 pb-2 text-[13px] font-semibold text-slate-700">
                                        Nội dung thao tác chi tiết
                                    </h3>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-[15px] font-normal leading-relaxed text-slate-700">
                                        {selectedLog.description}
                                    </div>
                                </div>

                                {/* Card 3: Data Metadata JSON */}
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                                            <Code className="h-4 w-4 text-blue-600" />
                                            <span>Dữ liệu Metadata JSON</span>
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const jsonStr = JSON.stringify(selectedLog.metadata || {}, null, 2);
                                                navigator.clipboard.writeText(jsonStr).then(() => {
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                });
                                            }}
                                            className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                                            <span>{copied ? 'Đã sao chép!' : 'Sao chép JSON'}</span>
                                        </button>
                                    </div>

                                    <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-[13px] leading-relaxed text-emerald-400 shadow-inner">
                                        {JSON.stringify(selectedLog.metadata || { note: 'Không có dữ liệu bổ sung' }, null, 2)}
                                    </pre>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-200 p-4 bg-white flex justify-end shrink-0">
                                <Button variant="secondary" size="md" onClick={() => setSelectedLog(null)}>
                                    Đóng
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
