'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { getCachedData } from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { DetailDrawer } from '../../../components/ui/DetailDrawer';
import { TabBar, TabItem } from '../../../components/ui/TabBar';
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
import { PaginationBar } from '../../../components/ui/PaginationBar';
import { ActivityFilterPopover } from '../../../components/activity-logs/ActivityFilterPopover';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { PageSkeleton } from '../../../components/ui/Skeleton';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import { USER_ROLE_LABELS } from '../../../lib/enum-labels';
import {
    getActionLabel,
    getEntityLabel,
    formatShortId,
    formatDateTime2Tier,
    formatDetailedAuditDescription,
    formatDetailedSecurityDescription,
    translateMetadataKey,
    secCategoryLabel,
    secOutcomeLabel,
    secActionLabel,
} from '../../../lib/audit-helpers';
import {
    Search,
    X,
    Copy,
    Check,
    ArrowUpRight,
    Lock,
    ShieldCheck,
    Shield,
    Info,
    Calendar,
    User,
    Layers,
    FileText,
    Globe,
} from 'lucide-react';

/* =========================================================================
   1. TYPES & DATA INTERFACES
========================================================================= */

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

type SecurityOutcome = 'SUCCESS' | 'DENIED' | 'FAILURE';

interface SecurityEvent {
    id: string;
    occurredAt: string;
    category: string;
    action: string;
    outcome: SecurityOutcome;
    entityType?: string;
    entityId?: string;
    route?: string;
    ipAddress?: string;
    requestId?: string;
    legalHold: boolean;
    metadata?: any;
    actor?: { username: string; email: string; role: string } | null;
}

/** Hàm xuất CSV chuẩn UTF-8 với BOM */
function exportCsvData(filename: string, headers: string[], rows: (string | number)[][]) {
    const processRow = (row: (string | number)[]) =>
        row
            .map((val) => {
                const str = String(val ?? '').replace(/"/g, '""');
                return `"${str}"`;
            })
            .join(',');

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map(processRow)].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/* =========================================================================
   2. MAIN COMPONENT
========================================================================= */

function ActivityLogsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabFromUrl = searchParams.get('tab') === 'security' ? 'security' : 'activity';
    const [activeTab, setActiveTab] = useState<'activity' | 'security'>(tabFromUrl);

    usePageTitle(activeTab === 'security' ? 'Kiểm toán & bảo mật' : 'Nhật ký & kiểm toán');

    useEffect(() => {
        const currentParam = searchParams.get('tab');
        if (currentParam === 'security' && activeTab !== 'security') {
            setActiveTab('security');
        } else if (currentParam !== 'security' && activeTab === 'security' && !currentParam) {
            setActiveTab('activity');
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tab: 'activity' | 'security') => {
        setActiveTab(tab);
        const url = tab === 'security' ? '/admin/activity-logs?tab=security' : '/admin/activity-logs';
        router.replace(url, { scroll: false });
    };

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const cachedLogs = typeof window !== 'undefined' ? getCachedData<{ items: AuditLogRecord[] }>('/audit-logs')?.items : null;
    const [logs, setLogs] = useState<AuditLogRecord[]>(cachedLogs || []);
    const [loading, setLoading] = useState<boolean>(!cachedLogs);
    const [search, setSearch] = useState<string>('');
    const [entityFilter, setEntityFilter] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(15);
    const [totalCount, setTotalCount] = useState<number>(0);

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

    // Inspector Drawer State
    const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
    const [drawerOpenLog, setDrawerOpenLog] = useState<AuditLogRecord | null>(null);
    const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        if (selectedLog) {
            setDrawerOpenLog(selectedLog);
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => setDrawerVisible(true));
            });
            return () => cancelAnimationFrame(raf);
        } else {
            setDrawerVisible(false);
            const timer = setTimeout(() => setDrawerOpenLog(null), 300);
            return () => clearTimeout(timer);
        }
    }, [selectedLog]);

    const fetchLogs = useCallback(async (): Promise<boolean> => {
        try {
            if (!logs.length && !cachedLogs) setLoading(true);
            const params: any = { page, limit, sort: 'newest' };
            if (search.trim()) params.search = search.trim();
            if (entityFilter) params.entityType = entityFilter;

            const res = await api.get('/audit-logs', { params });
            setLogs(Array.isArray(res.data?.items) ? res.data.items : []);
            setTotalCount(Number(res.data?.total) || 0);
            return true;
        } catch (error: any) {
            setLogs([]);
            setTotalCount(0);
            setToast({
                message: error?.response?.data?.message || error?.message || 'Không thể tải nhật ký.',
                type: 'error',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, entityFilter]);

    useEffect(() => {
        if (activeTab === 'activity') {
            void fetchLogs();
        }
    }, [fetchLogs, activeTab]);

    const availableEntities = useMemo(() => {
        const types = new Set<string>();
        logs.forEach((l) => {
            if (l.entityType) types.add(l.entityType);
        });
        return Array.from(types);
    }, [logs]);

    /* ── HÀM LẤY TOÀN BỘ DỮ LIỆU THEO ĐÚNG BỘ LỌC ĐỂ XUẤT FILE ── */
    const fetchAllFilteredActivityLogs = async (): Promise<AuditLogRecord[]> => {
        try {
            const params: any = { page: 1, limit: 5000, sort: 'newest' };
            if (search.trim()) params.search = search.trim();
            if (entityFilter) params.entityType = entityFilter;

            const res = await api.get('/audit-logs', { params });
            return Array.isArray(res.data?.items) ? res.data.items : logs;
        } catch {
            return logs;
        }
    };

    const getActivityFilterSummary = () => {
        const parts: string[] = [];
        if (search.trim()) parts.push(`Từ khóa: "${search.trim()}"`);
        if (entityFilter) parts.push(`Thực thể: "${getEntityLabel(entityFilter)}"`);
        return parts.length > 0 ? parts.join(' | ') : 'Tất cả thao tác';
    };

    /* ── CÁC CƠ CHẾ XUẤT FILE CHO TAB NHẬT KÝ THAO TÁC ── */
    const handleExportExcelActivity = async () => {
        const allData = await fetchAllFilteredActivityLogs();
        const filterDesc = getActivityFilterSummary();

        const columns = [
            { header: 'Mã ID', key: 'id', width: 25 },
            { header: 'Thời gian thực hiện', key: 'createdAt', width: 22 },
            { header: 'Tài khoản', key: 'actor', width: 20 },
            { header: 'Vai trò', key: 'role', width: 18 },
            { header: 'Hành động', key: 'action', width: 28 },
            { header: 'Thực thể', key: 'entityType', width: 22 },
            { header: 'Mã đối tượng', key: 'entityId', width: 22 },
            { header: 'Mô tả chi tiết', key: 'description', width: 50 },
        ];
        const rows = allData.map((l) => [
            l.id,
            formatDateTime2Tier(l.createdAt).absolute,
            l.actor?.username || 'Hệ thống',
            l.actor?.role ? (USER_ROLE_LABELS[l.actor.role] || l.actor.role) : 'Hệ thống',
            getActionLabel(l.action),
            getEntityLabel(l.entityType),
            l.entityId || '',
            formatDetailedAuditDescription(l),
        ]);
        await exportToFormattedExcel({
            filename: `Nhat_ky_he_thong_${new Date().toISOString().split('T')[0]}.xls`,
            templateCode: 'SYSTEM_AUDIT_LOG',
            title: 'NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG',
            subtitle: `Bộ lọc: ${filterDesc} (Tổng số: ${allData.length} thao tác)`,
            columns,
            rows,
        });
        setToast({ message: `Đã xuất ${allData.length} bản ghi Excel theo bộ lọc`, type: 'success' });
    };

    const handleExportCsvActivity = async () => {
        const allData = await fetchAllFilteredActivityLogs();
        const headers = ['Mã ID', 'Thời gian thực hiện', 'Tài khoản', 'Vai trò', 'Hành động', 'Thực thể', 'Mã đối tượng', 'Mô tả chi tiết'];
        const rows = allData.map((l) => [
            l.id,
            formatDateTime2Tier(l.createdAt).absolute,
            l.actor?.username || 'Hệ thống',
            l.actor?.role ? (USER_ROLE_LABELS[l.actor.role] || l.actor.role) : 'Hệ thống',
            getActionLabel(l.action),
            getEntityLabel(l.entityType),
            l.entityId || '',
            formatDetailedAuditDescription(l),
        ]);
        exportCsvData(`Nhat_ky_thao_tac_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setToast({ message: `Đã xuất ${allData.length} bản ghi CSV theo bộ lọc`, type: 'success' });
    };

    const handlePrintActivity = async () => {
        const allData = await fetchAllFilteredActivityLogs();
        const filterDesc = getActivityFilterSummary();

        printReport({
            title: 'BÁO CÁO NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG',
            subtitle: `Bộ lọc: ${filterDesc} (Tổng cộng: ${allData.length} thao tác)`,
            facultyName: 'HỘI ĐỒNG KHẢO THÍ & QUẢN TRỊ HỆ THỐNG',
            columns: [
                { header: 'STT', width: '40px', align: 'center' },
                { header: 'Thời gian', width: '150px' },
                { header: 'Tài khoản', width: '130px' },
                { header: 'Hành động & Phân hệ', width: '160px' },
                { header: 'Diễn giải chi tiết thao tác', width: '300px' },
            ],
            rows: allData.map((l, idx) => [
                idx + 1,
                formatDateTime2Tier(l.createdAt).absolute,
                l.actor?.username || 'Hệ thống',
                `${getActionLabel(l.action)} (${getEntityLabel(l.entityType)})`,
                formatDetailedAuditDescription(l),
            ]),
            signers: [
                { title: 'CÁN BỘ QUẢN TRỊ HỆ THỐNG', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'TRƯỞNG PHÒNG KHẢO THÍ & ĐBCL', subtitle: '(Ký, đóng dấu)' },
            ],
        });
    };

    /* ── Security Audit State ── */
    const cachedSecEvents = typeof window !== 'undefined' ? getCachedData<{ items: SecurityEvent[] }>('/security-audit/events')?.items : null;
    const cachedSecIntegrity = typeof window !== 'undefined' ? getCachedData<any>('/security-audit/integrity') : null;
    const [secEvents, setSecEvents] = useState<SecurityEvent[]>(cachedSecEvents || []);
    const [secIntegrity, setSecIntegrity] = useState<{ checked: number; valid: boolean } | null>(cachedSecIntegrity || null);
    const [secLoading, setSecLoading] = useState<boolean>(!cachedSecEvents);
    const [secSearch, setSecSearch] = useState<string>('');
    const [secCategory, setSecCategory] = useState<string>('');
    const [secOutcome, setSecOutcome] = useState<string>('');
    const [secPage, setSecPage] = useState<number>(1);
    const [secLimit, setLimitSec] = useState<number>(15);
    const [secTotal, setSecTotal] = useState<number>(cachedSecEvents ? cachedSecEvents.length : 0);
    const [legalHoldModalEvent, setLegalHoldModalEvent] = useState<SecurityEvent | null>(null);
    const [legalHoldLoading, setLegalHoldLoading] = useState<boolean>(false);

    const loadSecurityAudit = useCallback(async () => {
        if (!secEvents.length && !cachedSecEvents) setSecLoading(true);
        try {
            const [eventResponse, integrityResponse] = await Promise.all([
                api.get('/security-audit/events', {
                    params: {
                        page: secPage,
                        limit: secLimit,
                        ...(secSearch ? { search: secSearch } : {}),
                        ...(secCategory ? { category: secCategory } : {}),
                        ...(secOutcome ? { outcome: secOutcome } : {}),
                    },
                }),
                api.get('/security-audit/integrity', { params: { limit: 1000 } }),
            ]);
            setSecEvents(eventResponse.data?.items || []);
            setSecTotal(Number(eventResponse.data?.total) || 0);
            setSecIntegrity(integrityResponse.data);
        } catch (error: any) {
            setToast({
                type: 'error',
                message: error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu an ninh.',
            });
        } finally {
            setSecLoading(false);
        }
    }, [secPage, secLimit, secSearch, secCategory, secOutcome]);

    // Tải trước số lượng tổng cho cả 2 tab ngay khi trang khởi tạo
    useEffect(() => {
        const fetchInitialCounts = async () => {
            try {
                const [auditRes, secRes] = await Promise.allSettled([
                    api.get('/audit-logs', { params: { page: 1, limit: 1 } }),
                    api.get('/security-audit/events', { params: { page: 1, limit: 1 } }),
                ]);
                if (auditRes.status === 'fulfilled') {
                    setTotalCount(Number(auditRes.value.data?.total) || 0);
                }
                if (secRes.status === 'fulfilled') {
                    setSecTotal(Number(secRes.value.data?.total) || 0);
                }
            } catch {
                // Ignore silent prefetch failures
            }
        };
        void fetchInitialCounts();
    }, []);

    useEffect(() => {
        if (activeTab === 'security') {
            void loadSecurityAudit();
        }
    }, [loadSecurityAudit, activeTab]);

    const fetchAllFilteredSecurityEvents = async (): Promise<SecurityEvent[]> => {
        try {
            const res = await api.get('/security-audit/events', {
                params: {
                    page: 1,
                    limit: 5000,
                    ...(secSearch.trim() ? { search: secSearch.trim() } : {}),
                    ...(secCategory ? { category: secCategory } : {}),
                    ...(secOutcome ? { outcome: secOutcome } : {}),
                },
            });
            return Array.isArray(res.data?.items) ? res.data.items : secEvents;
        } catch {
            return secEvents;
        }
    };

    const getSecurityFilterSummary = () => {
        const parts: string[] = [];
        if (secSearch.trim()) parts.push(`Từ khóa: "${secSearch.trim()}"`);
        if (secCategory) parts.push(`Nhóm: "${secCategoryLabel[secCategory] || secCategory}"`);
        if (secOutcome) parts.push(`Kết quả: "${secOutcomeLabel[secOutcome] || secOutcome}"`);
        return parts.length > 0 ? parts.join(' | ') : 'Tất cả sự kiện an ninh';
    };

    /* ── CÁC CƠ CHẾ XUẤT FILE CHO TAB KIỂM TOÁN AN NINH ── */
    const handleExportExcelSecurity = async () => {
        const allData = await fetchAllFilteredSecurityEvents();
        const filterDesc = getSecurityFilterSummary();

        const columns = [
            { header: 'Mã sự kiện', key: 'id', width: 25 },
            { header: 'Thời điểm', key: 'occurredAt', width: 22 },
            { header: 'Tài khoản', key: 'actor', width: 20 },
            { header: 'Nhóm an ninh', key: 'category', width: 22 },
            { header: 'Hành động', key: 'action', width: 28 },
            { header: 'Đối tượng', key: 'entityType', width: 22 },
            { header: 'Kết quả', key: 'outcome', width: 18 },
            { header: 'Địa chỉ IP', key: 'ipAddress', width: 18 },
            { header: 'Đường dẫn Route', key: 'route', width: 32 },
            { header: 'Mô tả chi tiết', key: 'description', width: 50 },
            { header: 'Khóa pháp lý', key: 'legalHold', width: 15 },
        ];
        const rows = allData.map((e) => [
            e.id,
            formatDateTime2Tier(e.occurredAt).absolute,
            e.actor?.username || 'Hệ thống',
            secCategoryLabel[e.category] || e.category,
            secActionLabel[e.action] || getActionLabel(e.action),
            getEntityLabel(e.entityType),
            secOutcomeLabel[e.outcome] || e.outcome,
            e.ipAddress || '—',
            e.route || '—',
            formatDetailedSecurityDescription(e),
            e.legalHold ? 'Đã khóa' : 'Không',
        ]);
        await exportToFormattedExcel({
            filename: `Kiem_toan_an_ninh_${new Date().toISOString().split('T')[0]}.xls`,
            templateCode: 'SYSTEM_AUDIT_LOG',
            title: 'BÁO CÁO KIỂM TOÁN AN NINH HỆ THỐNG',
            subtitle: `Bộ lọc: ${filterDesc} (Tổng số: ${allData.length} sự kiện | Chuỗi toàn vẹn: ${secIntegrity?.valid ? 'Hợp lệ' : 'Đang xác thực'})`,
            columns,
            rows,
        });
        setToast({ message: `Đã xuất ${allData.length} bản ghi Excel an ninh theo bộ lọc`, type: 'success' });
    };

    const handleExportCsvSecurity = async () => {
        const allData = await fetchAllFilteredSecurityEvents();
        const headers = ['Mã sự kiện', 'Thời điểm', 'Tài khoản', 'Nhóm', 'Hành động', 'Đối tượng', 'Kết quả', 'IP', 'Route', 'Mô tả chi tiết', 'Khóa pháp lý'];
        const rows = allData.map((e) => [
            e.id,
            formatDateTime2Tier(e.occurredAt).absolute,
            e.actor?.username || 'Hệ thống',
            secCategoryLabel[e.category] || e.category,
            secActionLabel[e.action] || getActionLabel(e.action),
            getEntityLabel(e.entityType),
            secOutcomeLabel[e.outcome] || e.outcome,
            e.ipAddress || '—',
            e.route || '—',
            formatDetailedSecurityDescription(e),
            e.legalHold ? 'Đã khóa' : 'Không',
        ]);
        exportCsvData(`Kiem_toan_an_ninh_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setToast({ message: `Đã xuất ${allData.length} bản ghi CSV an ninh theo bộ lọc`, type: 'success' });
    };

    const handlePrintSecurity = async () => {
        const allData = await fetchAllFilteredSecurityEvents();
        const filterDesc = getSecurityFilterSummary();

        printReport({
            title: 'BÁO CÁO KIỂM TOÁN AN NINH & TOÀN VẸN HỆ THỐNG',
            subtitle: `Bộ lọc: ${filterDesc} (Tổng cộng: ${allData.length} sự kiện | Hash: ${secIntegrity?.valid ? 'Toàn vẹn' : 'Cần kiểm tra'})`,
            facultyName: 'BAN AN TOÀN THÔNG TIN & KIỂM TOÁN HỆ THỐNG',
            columns: [
                { header: 'STT', width: '40px', align: 'center' },
                { header: 'Thời điểm', width: '150px' },
                { header: 'Tài khoản', width: '130px' },
                { header: 'Sự kiện & Đối tượng', width: '220px' },
                { header: 'Kết quả', width: '100px', align: 'center' },
                { header: 'Nguồn IP & Route', width: '160px' },
                { header: 'Khóa', width: '70px', align: 'center' },
            ],
            rows: allData.map((e, idx) => [
                idx + 1,
                formatDateTime2Tier(e.occurredAt).absolute,
                e.actor?.username || 'Hệ thống',
                `${secActionLabel[e.action] || getActionLabel(e.action)} (${getEntityLabel(e.entityType)})`,
                secOutcomeLabel[e.outcome] || e.outcome,
                `IP: ${e.ipAddress || 'Ẩn'}\n${e.route || ''}`,
                e.legalHold ? 'Đã khóa' : '—',
            ]),
            signers: [
                { title: 'CHUYÊN VIÊN KIỂM TOÁN AN NINH', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'TRƯỞNG PHÒNG AN TOÀN THÔNG TIN', subtitle: '(Ký, đóng dấu)' },
            ],
        });
    };

    const handleApplyLegalHold = (event: SecurityEvent) => {
        setLegalHoldModalEvent(event);
    };

    const handleConfirmLegalHold = async (reason?: string) => {
        if (!legalHoldModalEvent) return;
        setLegalHoldLoading(true);
        try {
            await api.post(`/security-audit/events/${legalHoldModalEvent.id}/legal-hold`, {
                reason: reason?.trim() || 'Khóa lưu giữ điều tra pháp lý',
            });
            setToast({ type: 'success', message: 'Đã khóa lưu giữ sự kiện kiểm toán.' });
            setLegalHoldModalEvent(null);
            await loadSecurityAudit();
        } catch (error: any) {
            setToast({ type: 'error', message: error?.response?.data?.message || error?.message || 'Không thể tạo khóa.' });
        } finally {
            setLegalHoldLoading(false);
        }
    };

    const navigationTabs: TabItem<'activity' | 'security'>[] = useMemo(() => [
        {
            key: 'activity',
            label: 'Nhật ký thao tác',
            count: totalCount,
        },
        {
            key: 'security',
            label: 'Kiểm toán an ninh',
            count: secTotal,
        },
    ], [totalCount, secTotal]);

    if ((activeTab === 'activity' ? loading : secLoading) && !logs.length && !secEvents.length) {
        return <PageSkeleton hasKPIs={false} variant="table" />;
    }

    return (
        <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 ">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── 1. Page Header (Tiêu đề H1, Phụ đề chi tiết) ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
                            Nhật ký & kiểm toán
                        </h1>
                        {activeTab === 'security' && secIntegrity && (
                            <span className="ui-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-type-helper font-medium">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>Toàn vẹn ({secIntegrity.checked.toLocaleString('vi-VN')})</span>
                            </span>
                        )}
                    </div>
                    <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
                        {activeTab === 'activity'
                            ? `Ghi nhận chi tiết ${totalCount.toLocaleString('vi-VN')} lượt thao tác vận hành trên toàn hệ thống`
                            : `Kiểm toán an ninh với chuỗi hash độc lập (${secTotal.toLocaleString('vi-VN')} sự kiện)`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <DataActionsDropdown
                        onExportExcel={activeTab === 'activity' ? handleExportExcelActivity : handleExportExcelSecurity}
                        onExportCsv={activeTab === 'activity' ? handleExportCsvActivity : handleExportCsvSecurity}
                        onPrint={activeTab === 'activity' ? handlePrintActivity : handlePrintSecurity}
                    />
                </div>
            </div>

            {/* ── 2. Standard TabBar ── */}
            <TabBar
                tabs={navigationTabs}
                active={activeTab}
                onChange={handleTabChange}
                variant="line"
            />

            {/* ── 3. Unified Embedded Search Bar ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1 max-w-xl min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={activeTab === 'activity' ? "Tìm theo nội dung, người thực hiện, đối tượng..." : "Tìm theo hành động, IP, tài khoản, route..."}
                        value={activeTab === 'activity' ? search : secSearch}
                        onChange={(e) => {
                            if (activeTab === 'activity') {
                                setSearch(e.target.value);
                                setPage(1);
                            } else {
                                setSecSearch(e.target.value);
                                setSecPage(1);
                            }
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    />

                    {/* Embedded actions on right edge of search input */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {(activeTab === 'activity' ? search : secSearch) ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTab === 'activity') {
                                        setSearch('');
                                        setPage(1);
                                    } else {
                                        setSecSearch('');
                                        setSecPage(1);
                                    }
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
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

                        {/* Integrated Filter Popover */}
                        <ActivityFilterPopover
                            activeTab={activeTab}
                            entityFilter={entityFilter}
                            onEntityFilterChange={(val) => {
                                setEntityFilter(val);
                                setPage(1);
                            }}
                            availableEntities={availableEntities}
                            getEntityLabel={getEntityLabel}
                            secCategory={secCategory}
                            onSecCategoryChange={(val) => {
                                setSecCategory(val);
                                setSecPage(1);
                            }}
                            secCategoryLabel={secCategoryLabel}
                            secOutcome={secOutcome}
                            onSecOutcomeChange={(val) => {
                                setSecOutcome(val);
                                setSecPage(1);
                            }}
                            secOutcomeLabel={secOutcomeLabel}
                            onResetAll={() => {
                                if (activeTab === 'activity') {
                                    setSearch('');
                                    setEntityFilter('');
                                    setPage(1);
                                } else {
                                    setSecSearch('');
                                    setSecCategory('');
                                    setSecOutcome('');
                                    setSecPage(1);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* =========================================================================
               TAB 1: BẢNG NHẬT KÝ THAO TÁC (100% TIẾNG VIỆT & DIỄN GIẢI CHI TIẾT)
            ========================================================================= */}
            {activeTab === 'activity' && (
                <div className="space-y-4">
                    <div className="ui-table-wrap min-h-[420px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                        {loading && logs.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                                <p className="text-type-body-sm text-slate-500">Đang tải nhật ký thao tác...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <p className="text-type-body font-semibold text-slate-900 dark:text-slate-100">Không tìm thấy nhật ký phù hợp</p>
                                <p className="text-type-body-sm text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc thực thể</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="ui-table w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-medium text-slate-600 dark:text-slate-300">
                                            <th className="py-3.5 px-5 w-48">Thời gian thực hiện</th>
                                            <th className="py-3.5 px-5 w-44">Tài khoản thao tác</th>
                                            <th className="py-3.5 px-5 w-64">Hành động & Phân hệ</th>
                                            <th className="py-3.5 px-5">Diễn giải nội dung chi tiết</th>
                                            <th className="py-3.5 px-5 w-12 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {logs.map((log) => {
                                            const actionLabel = getActionLabel(log.action);
                                            const entityLabel = getEntityLabel(log.entityType);
                                            const shortId = formatShortId(log.entityId);
                                            const timeInfo = formatDateTime2Tier(log.createdAt);
                                            const detailedDescription = formatDetailedAuditDescription(log);

                                            return (
                                                <tr
                                                    key={log.id}
                                                    onClick={() => setSelectedLog(log)}
                                                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer"
                                                >
                                                    {/* Cột 1: Thời gian thực hiện 2 tầng (Dòng 1 Giờ, Dòng 2 Ngày + Tương đối) */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <div className="flex flex-col" title={timeInfo.fullTooltip}>
                                                            <span className="text-type-body font-medium tabular-nums text-slate-900 dark:text-slate-100">
                                                                {timeInfo.timeOnly}
                                                            </span>
                                                            <span className="table-meta text-type-meta tabular-nums text-slate-500 dark:text-slate-400">
                                                                {timeInfo.dateOnly}{timeInfo.relative ? ` (${timeInfo.relative})` : ''}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Cột 2: Tài khoản thao tác */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-type-body text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                                                                {log.actor?.username || 'Hệ thống'}
                                                            </span>
                                                            {log.actor?.role && (
                                                                <span className="table-meta text-type-meta text-slate-500 dark:text-slate-400">
                                                                    {USER_ROLE_LABELS[log.actor.role] || log.actor.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Cột 3: Hành động & Phân hệ */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <div className="space-y-0.5">
                                                            <div className="font-medium text-type-body text-slate-900 dark:text-slate-100">
                                                                {actionLabel}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="table-meta text-type-meta font-medium text-blue-600 dark:text-blue-400">
                                                                    {entityLabel}
                                                                </span>
                                                                {shortId && (
                                                                    <span
                                                                        title={log.entityId || ''}
                                                                        className="table-meta text-type-meta tabular-nums text-slate-500 dark:text-slate-400"
                                                                    >
                                                                        {shortId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Cột 4: Diễn giải nội dung chi tiết */}
                                                    <td className="py-3.5 px-5">
                                                        <p className="text-type-body text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                                                            {detailedDescription}
                                                        </p>
                                                    </td>

                                                    {/* Cột 5: Xem chi tiết */}
                                                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                                        <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 inline-flex items-center justify-center transition">
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Standard PaginationBar */}
                    {totalCount > 0 && (
                        <PaginationBar
                            page={page}
                            totalPages={Math.max(1, Math.ceil(totalCount / limit))}
                            limit={limit}
                            totalItems={totalCount}
                            unit="bản ghi"
                            onPage={setPage}
                            onLimit={(newLimit) => {
                                setLimit(newLimit);
                                setPage(1);
                            }}
                            limitOptions={[10, 15, 20, 50, 100]}
                        />
                    )}
                </div>
            )}

            {/* =========================================================================
               TAB 2: BẢNG KIỂM TOÁN AN NINH (100% TIẾNG VIỆT & CHUỖI TOÀN VẸN)
            ========================================================================= */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="ui-table-wrap min-h-[420px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                        {secLoading && secEvents.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                                <p className="text-type-body-sm text-slate-500">Đang tải sự kiện kiểm toán an ninh...</p>
                            </div>
                        ) : secEvents.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <p className="text-type-body font-semibold text-slate-900 dark:text-slate-100">Không có sự kiện an ninh phù hợp</p>
                                <p className="text-type-body-sm text-slate-500 dark:text-slate-400 mt-1">Thử nới lỏng các tiêu chí bộ lọc</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="ui-table w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-medium text-slate-600 dark:text-slate-300">
                                            <th className="py-3.5 px-5 w-48">Thời điểm ghi nhận</th>
                                            <th className="py-3.5 px-5 w-52">Tài khoản</th>
                                            <th className="py-3.5 px-5">Sự kiện & Diễn giải chi tiết</th>
                                            <th className="py-3.5 px-5 w-36">Kết quả</th>
                                            <th className="py-3.5 px-5 w-48">Nguồn truy cập</th>
                                            <th className="py-3.5 px-5 w-28 text-center">Khóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {secEvents.map((event) => {
                                            const shortId = formatShortId(event.entityId);
                                            const entityName = getEntityLabel(event.entityType);
                                            const timeInfo = formatDateTime2Tier(event.occurredAt);
                                            const detailedDescription = formatDetailedSecurityDescription(event);

                                            return (
                                                <tr key={event.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                                                    {/* Cột 1: Thời điểm ghi nhận 2 tầng (Dòng 1 Giờ, Dòng 2 Ngày + Tương đối) */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <div className="flex flex-col" title={timeInfo.fullTooltip}>
                                                            <span className="text-type-body font-medium tabular-nums text-slate-900 dark:text-slate-100">
                                                                {timeInfo.timeOnly}
                                                            </span>
                                                            <span className="table-meta text-type-meta tabular-nums text-slate-500 dark:text-slate-400">
                                                                {timeInfo.dateOnly}{timeInfo.relative ? ` (${timeInfo.relative})` : ''}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Cột 2: Tài khoản */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-type-body text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                                                                {event.actor?.username || 'Hệ thống'}
                                                            </span>
                                                            {event.actor?.role && (
                                                                <span className="table-meta text-type-meta text-slate-500 dark:text-slate-400">
                                                                    {USER_ROLE_LABELS[event.actor.role] || event.actor.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Cột 3: Sự kiện & Diễn giải chi tiết */}
                                                    <td className="py-3.5 px-5">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-medium text-type-body text-slate-900 dark:text-slate-100">
                                                                    {secActionLabel[event.action] || getActionLabel(event.action)}
                                                                </span>
                                                                {event.entityType && (
                                                                    <>
                                                                        <span className="text-slate-400 dark:text-slate-600">|</span>
                                                                        <span className="font-medium text-type-body text-blue-600 dark:text-blue-400">
                                                                            {entityName}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {shortId && (
                                                                    <span
                                                                        title={event.entityId || ''}
                                                                        className="table-meta text-type-meta tabular-nums text-slate-500 dark:text-slate-400"
                                                                    >
                                                                        {shortId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-type-body text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                                                                {detailedDescription}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Cột 4: Kết quả */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <StatusBadge
                                                            status={event.outcome === 'SUCCESS' ? 'SUCCEEDED' : event.outcome === 'DENIED' ? 'REJECTED' : 'FAILED'}
                                                            customLabel={secOutcomeLabel[event.outcome] || event.outcome}
                                                        />
                                                    </td>

                                                    {/* Cột 5: Nguồn truy cập */}
                                                    <td className="py-3.5 px-5 whitespace-nowrap">
                                                        <div className="space-y-0.5">
                                                            <div className="text-type-body text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                <span className="table-badge text-type-badge font-semibold text-slate-400">IP</span>
                                                                <span className="tabular-nums font-normal">{event.ipAddress || '—'}</span>
                                                            </div>
                                                            <div className="table-meta text-type-meta text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={event.route || ''}>
                                                                {event.route || '—'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Cột 6: Khóa điều tra */}
                                                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                                                        {event.legalHold ? (
                                                            <span
                                                                title="Đang khóa lưu giữ điều tra pháp lý"
                                                                className="table-badge ui-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-type-helper font-medium"
                                                            >
                                                                <Lock className="h-3 w-3" />
                                                                <span>Đã khóa</span>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleApplyLegalHold(event)}
                                                                title="Khóa lưu giữ điều tra pháp lý"
                                                                className="inline-flex items-center justify-center h-7 w-7 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition cursor-pointer"
                                                            >
                                                                <Lock className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Standard PaginationBar */}
                    {secTotal > 0 && (
                        <PaginationBar
                            page={secPage}
                            totalPages={Math.max(1, Math.ceil(secTotal / secLimit))}
                            limit={secLimit}
                            totalItems={secTotal}
                            unit="sự kiện"
                            onPage={setSecPage}
                            onLimit={(newLimit) => {
                                setLimitSec(newLimit);
                                setSecPage(1);
                            }}
                            limitOptions={[10, 15, 20, 50, 100]}
                        />
                    )}
                </div>
            )}

            {/* ── 4. Metadata Inspector Drawer (100% Tiếng Việt & Diễn giải ngữ cảnh) ── */}
            <DetailDrawer
                isOpen={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
                title="Chi tiết nhật ký thao tác"
                subtitle={
                    selectedLog
                        ? formatDateTime2Tier(selectedLog.createdAt).fullTooltip
                        : undefined
                }
                avatarIcon={<FileText className="h-5 w-5 text-white" />}
                maxWidth="max-w-[500px]"
                footer={
                    <div className="flex justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                            Đóng
                        </Button>
                    </div>
                }
            >
                {selectedLog && (
                    <div className="space-y-5">
                        {/* Khối 1: Tóm tắt ngữ cảnh thao tác */}
                        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2.5">
                            <div className="flex items-center gap-2 text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>Diễn giải thao tác</span>
                            </div>
                            <p className="text-type-body-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                {formatDetailedAuditDescription(selectedLog)}
                            </p>
                        </div>

                        {/* Khối 2: Thông tin định danh & Người thực hiện */}
                        <div>
                            <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Thông tin định danh
                            </h3>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                <div className="py-2.5 px-3.5 flex items-center justify-between gap-3 text-type-body-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Hành động:</span>
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                        {getActionLabel(selectedLog.action)}
                                    </span>
                                </div>
                                <div className="py-2.5 px-3.5 flex items-center justify-between gap-3 text-type-body-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Đối tượng:</span>
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                        {getEntityLabel(selectedLog.entityType)} {selectedLog.entityId ? `(#${selectedLog.entityId})` : ''}
                                    </span>
                                </div>
                                <div className="py-2.5 px-3.5 flex items-center justify-between gap-3 text-type-body-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Người thực hiện:</span>
                                    </span>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedLog.actor?.username || 'Hệ thống'}</p>
                                        <p className="text-type-meta text-slate-500 dark:text-slate-400 font-normal">
                                            {selectedLog.actor?.role ? (USER_ROLE_LABELS[selectedLog.actor.role] || selectedLog.actor.role) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="py-2.5 px-3.5 flex items-center justify-between gap-3 text-type-body-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Địa chỉ IP:</span>
                                    </span>
                                    <span className="text-type-meta font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                        {(selectedLog as any).ipAddress || '127.0.0.1 (Nội bộ)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Khối 3: Bảng biến động dữ liệu chi tiết (Human-friendly Field Diff) */}
                        {selectedLog.metadata && typeof selectedLog.metadata === 'object' && (
                            <div>
                                <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    Chi tiết tham số thay đổi
                                </h3>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-type-body-sm">
                                    {Object.entries(selectedLog.metadata).map(([key, val]) => (
                                        <div key={key} className="py-2.5 px-3.5 flex items-start justify-between gap-3">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 pt-0.5">
                                                {translateMetadataKey(key)}:
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
                                                {typeof val === 'object' && val !== null ? (
                                                    <pre className="text-type-meta bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-left overflow-x-auto">
                                                        {JSON.stringify(val, null, 2)}
                                                    </pre>
                                                ) : typeof val === 'boolean' ? (
                                                    val ? 'Có / Bật' : 'Không / Tắt'
                                                ) : (
                                                    String(val ?? '---')
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Khối 4: Raw JSON Metadata Inspector */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Mã kỹ thuật (Raw JSON)
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata || {}, null, 2)).then(() => {
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        });
                                    }}
                                    className="inline-flex items-center gap-1 text-type-meta font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 cursor-pointer"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span>{copied ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                                </button>
                            </div>

                            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-type-meta leading-relaxed text-emerald-400 custom-scrollbar border border-slate-800">
                                {JSON.stringify(selectedLog.metadata || { ghi_chu: 'Không có dữ liệu metadata' }, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </DetailDrawer>

            {/* Legal Hold Confirmation Modal */}
            {legalHoldModalEvent && (
                <ConfirmModal
                    isOpen={Boolean(legalHoldModalEvent)}
                    onClose={() => setLegalHoldModalEvent(null)}
                    onConfirm={handleConfirmLegalHold}
                    title="Khóa sự kiện kiểm toán"
                    message={
                        <div className="space-y-1.5">
                            <p className="text-type-body-sm text-slate-800 dark:text-slate-200 font-medium">
                                Khóa lưu giữ cho sự kiện: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{secActionLabel[legalHoldModalEvent.action] || getActionLabel(legalHoldModalEvent.action)}&rdquo;</span>
                            </p>
                            <p className="text-type-meta text-slate-500 dark:text-slate-400">
                                Sự kiện này sẽ được bảo vệ và miễn trừ khỏi chính sách xóa tự động định kỳ.
                            </p>
                        </div>
                    }
                    type="info"
                    confirmVariant="primary"
                    requireReason={true}
                    reasonPlaceholder="Nhập lý do khóa sự kiện..."
                    confirmText="Xác nhận khóa"
                    cancelText="Hủy bỏ"
                    isLoading={legalHoldLoading}
                />
            )}
        </main>
    );
}

export default function ActivityLogsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center p-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
            }
        >
            <ActivityLogsContent />
        </Suspense>
    );
}
