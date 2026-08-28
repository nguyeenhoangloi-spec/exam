'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { TabBar, TabItem } from '../../../components/ui/TabBar';
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
import { PaginationBar } from '../../../components/ui/PaginationBar';
import { ActivityFilterPopover } from '../../../components/activity-logs/ActivityFilterPopover';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import { USER_ROLE_LABELS } from '../../../lib/enum-labels';
import {
    Search,
    X,
    Code,
    Copy,
    Check,
    ArrowUpRight,
    Lock,
    ShieldCheck,
} from 'lucide-react';

/* =========================================================================
   1. TYPES & TRANSLATION MAPPINGS (CHUẨN HÓA 100% TIẾNG VIỆT & DESIGN SYSTEM)
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
    actor?: { username: string; email: string; role: string } | null;
}

function formatShortId(id?: string | null): string | null {
    if (!id) return null;
    const trimmed = id.trim();
    if (trimmed.length <= 10) return `#${trimmed}`;
    return `#${trimmed.slice(0, 8)}…`;
}

const TRANSLATED_ACTIONS: Record<string, string> = {
    ARCHIVE: 'Lưu trữ',
    ASSIGN: 'Phân công',
    PASSWORD_RESET: 'Đặt lại mật khẩu',
    BACKUP_QUEUED: 'Xếp hàng sao lưu',
    BACKUP_SUCCEEDED: 'Sao lưu thành công',
    BACKUP_RESTORE_APPROVED: 'Đã duyệt khôi phục',
    BACKUP_RESTORE_FAILED: 'Khôi phục thất bại',
    BACKUP_RESTORE_REJECTED: 'Từ chối khôi phục',
    BACKUP_RESTORE_REQUESTED: 'Yêu cầu khôi phục',
    BACKUP_STORAGE_REORDERED: 'Sắp xếp nơi lưu trữ',
    BACKUP_STORAGE_UPDATED: 'Cập nhật nơi lưu trữ',
    BACKUP_STORAGE_CREATED: 'Thêm nơi lưu trữ',
    BACKUP_STORAGE_DELETED: 'Xóa nơi lưu trữ',
    BACKUP_STORAGE_TEST_FAILED: 'Kiểm tra lưu trữ thất bại',
    BACKUP_STORAGE_TEST_SUCCEEDED: 'Kiểm tra lưu trữ thành công',
    BACKUP_SETTINGS_UPDATED: 'Cập nhật cấu hình sao lưu',
    BACKUP_JOB_CANCELLED: 'Hủy bản sao lưu',
    BACKUP_JOB_DELETED: 'Xóa bản sao lưu',
    BACKUP_JOB_VERIFIED: 'Xác thực bản sao lưu',
    ESSAY_AI_SUGGEST: 'AI đề xuất chấm',
    ESSAY_APPROVE: 'Duyệt bài tự luận',
    ESSAY_GRADING_SUBMIT: 'Gửi chấm bài',
    ESSAY_PUBLISH: 'Công bố điểm',
    ESSAY_REOPEN: 'Mở lại bài chấm',
    ESSAY_RETURN: 'Trả lại bài chấm',
    ESSAY_GRADE: 'Chấm bài tự luận',
    RUBRIC_UPDATE: 'Cập nhật Rubric',
    REOPEN_ENTRY: 'Mở lại lượt nhập',
    REOPEN_EXAM_ATTEMPT: 'Mở lại lượt thi',
    RESET_ARRANGEMENT: 'Đặt lại xếp phòng',
    RESOLVE_EXAM_INCIDENT: 'Xử lý sự cố thi',
    RESTORE_EXAM_PAPER: 'Khôi phục đề thi',
    REVIEW_GRADE_APPEAL: 'Xem xét phúc khảo',
    UPDATE_EXAM_PASSWORD: 'Đổi mật khẩu đề',
    UPDATE_STATUS: 'Cập nhật trạng thái',
    ACCESS_ROLE_PERMISSION_GRANTED: 'Cấp quyền vai trò',
    ACCESS_ROLE_PERMISSION_REVOKED: 'Thu hồi quyền vai trò',
    ACCESS_USER_OVERRIDE_SET: 'Thiết lập quyền riêng',
    ACCESS_USER_OVERRIDE_REMOVED: 'Gỡ quyền riêng',
    ACCESS_SCOPE_REPLACED: 'Cập nhật phạm vi truy cập',
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất',
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    PUBLISH: 'Phát hành đề',
    ARRANGE: 'Xếp phòng thi',
    AUTO_ASSIGN: 'Phân công tự động',
    RESTORE: 'Khôi phục',
    RESTORE_REQUEST: 'Yêu cầu khôi phục',
    REJECT: 'Từ chối',
    APPROVE: 'Phê duyệt',
    BACKUP: 'Sao lưu',
    CREATE_BACKUP: 'Tạo sao lưu',
    APPEAL: 'Phúc khảo',
    REGRADE: 'Chấm phúc khảo',
};

function getActionLabel(action: string): string {
    if (!action) return 'Thao tác';
    const normalized = action.toUpperCase().replace(/[\s-]+/g, '_').trim();
    if (TRANSLATED_ACTIONS[normalized]) {
        return TRANSLATED_ACTIONS[normalized];
    }

    let result = action
        .replace(/Backup Storage Reordered/gi, 'Sắp xếp nơi lưu trữ')
        .replace(/Backup Storage Updated/gi, 'Cập nhật nơi lưu trữ')
        .replace(/Backup Storage Test Failed/gi, 'Kiểm tra lưu trữ thất bại')
        .replace(/Backup Storage Test Succeeded/gi, 'Kiểm tra lưu trữ thành công')
        .replace(/Backup Storage Created/gi, 'Thêm nơi lưu trữ')
        .replace(/Backup Storage Deleted/gi, 'Xóa nơi lưu trữ')
        .replace(/Backup Settings Updated/gi, 'Cập nhật cấu hình sao lưu')
        .replace(/Backup Job Created/gi, 'Tạo bản sao lưu')
        .replace(/Backup Job Succeeded/gi, 'Sao lưu thành công')
        .replace(/Backup Job Failed/gi, 'Sao lưu thất bại')
        .replace(/Password Reset/gi, 'Đặt lại mật khẩu')
        .replace(/Access Role Updated/gi, 'Cập nhật vai trò')
        .replace(/User Login/gi, 'Đăng nhập hệ thống')
        .replace(/User Logout/gi, 'Đăng xuất hệ thống');

    return result;
}

function getEntityLabel(type?: string | null): string {
    if (!type) return 'Hệ thống';
    const normalized = type.toUpperCase().trim();
    const map: Record<string, string> = {
        AUTH: 'Xác thực',
        EXAMPAPER: 'Đề thi',
        EXAM_PAPER: 'Đề thi',
        EXAMARRANGEMENT: 'Xếp phòng thi',
        EXAMSUPERVISOR: 'Cán bộ coi thi',
        EXAMPERIOD: 'Kỳ thi',
        EXAMSCHEDULE: 'Lịch thi',
        EXAM_SCHEDULE: 'Lịch thi',
        EXAM_ATTEMPT: 'Bài làm',
        EXAM_REPORT: 'Báo cáo',
        STUDENT: 'Sinh viên',
        TEACHER: 'Giảng viên',
        DEPARTMENT: 'Khoa / Viện',
        SUBJECT: 'Môn học',
        QUESTION: 'Câu hỏi',
        QUESTION_BANK: 'Ngân hàng câu hỏi',
        QUESTION_RUBRIC: 'Rubric',
        ESSAYREVIEW: 'Bài tự luận',
        GRADEAPPEAL: 'Phúc khảo',
        BACKUP: 'Sao lưu',
        BACKUPOVERVIEW: 'Sao lưu',
        BACKUPSETTINGS: 'Cấu hình sao lưu',
        BACKUP_SETTINGS: 'Cấu hình sao lưu',
        BACKUP_SYSTEM: 'Hệ thống sao lưu',
        BACKUP_STORAGE: 'Lưu trữ sao lưu',
        BACKUP_JOB: 'Bản sao lưu',
        ACCESSCONTROL: 'Phân quyền',
        ACCESS_CONTROL: 'Phân quyền',
        ACCESSROLE: 'Vai trò',
        USERACCESS: 'Quyền người dùng',
        USER: 'Tài khoản',
        PROCTOR_ASSIGNMENT: 'Phân công coi thi',
    };

    return map[normalized] || type;
}

const secCategoryLabel: Record<string, string> = {
    AUTHENTICATION: 'Xác thực',
    AUTHORIZATION: 'Phân quyền',
    DATA_ACCESS: 'Truy cập dữ liệu',
    DATA_EXPORT: 'Xuất dữ liệu',
    EXAMINATION: 'Khảo thí',
    BACKUP_RECOVERY: 'Sao lưu & khôi phục',
    AI_PROCESSING: 'Xử lý AI',
    SYSTEM_SECURITY: 'Bảo mật hệ thống',
};

const secOutcomeLabel: Record<string, string> = {
    SUCCESS: 'Thành công',
    DENIED: 'Bị từ chối',
    FAILURE: 'Thất bại',
};

const secActionLabel: Record<string, string> = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    ARRANGE: 'Xếp lịch',
    AUTO_ASSIGN: 'Tự động phân công',
    EXAM_PAPER_ANSWER_KEY_VIEWED: 'Xem đề & đáp án',
    EXAM_PAPER_EXPORT_REQUESTED: 'Xuất đề thi',
    QUESTION_ANSWER_KEY_VIEWED: 'Xem câu hỏi & đáp án',
    QUESTION_BANK_EXPORTED: 'Xuất ngân hàng câu hỏi',
    RUBRIC_VIEWED: 'Xem rubric',
    RUBRIC_VERSION_HISTORY_VIEWED: 'Xem lịch sử rubric',
    ESSAY_ATTEMPT_ANSWER_VIEWED: 'Xem bài tự luận',
    EXAM_RESULT_VIEWED: 'Xem kết quả',
    EXAM_ATTEMPT_REVIEW_VIEWED: 'Xem bài làm & điểm',
    GRADE_REPORT_VIEWED: 'Xem bảng điểm',
    EXAM_REPORT_SUMMARY_VIEWED: 'Xem báo cáo tổng hợp',
    EXAM_REPORT_PREVIEWED: 'Xem trước báo cáo',
    EXAM_REPORT_EXPORT: 'Xuất báo cáo',
    ATTENDANCE_SHEET_VIEWED: 'Xem điểm danh',
    BACKUP_OVERVIEW_VIEWED: 'Xem tổng quan sao lưu',
    BACKUP_SETTINGS_VIEWED: 'Xem cấu hình sao lưu',
    BACKUP_JOB_VIEWED: 'Xem bản sao lưu',
    ACCESS_CONTROL_OVERVIEW_VIEWED: 'Xem tổng quan phân quyền',
    ACCESS_CONTROL_HISTORY_VIEWED: 'Xem lịch sử phân quyền',
    USER_EFFECTIVE_PERMISSIONS_VIEWED: 'Xem quyền hiệu lực',
    SESSION_ACCESS_DENIED: 'Phiên không hợp lệ',
    PERMISSION_DENIED: 'Thiếu quyền truy cập',
    ROLE_DENIED: 'Sai vai trò truy cập',
    SECURITY_AUDIT_POLICY_UPDATED: 'Cập nhật chính sách',
    SECURITY_AUDIT_LEGAL_HOLD_APPLIED: 'Khóa điều tra pháp lý',
    SECURITY_AUDIT_LEGAL_HOLD_RELEASED: 'Mở khóa điều tra',
};

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

    /* ── Activity State ── */
    const [logs, setLogs] = useState<AuditLogRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [entityFilter, setEntityFilter] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
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
            const timer = setTimeout(() => setDrawerOpenLog(null), 250);
            return () => clearTimeout(timer);
        }
    }, [selectedLog]);

    const fetchLogs = useCallback(async (): Promise<boolean> => {
        try {
            setLoading(true);
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
            { header: 'Thời gian', key: 'createdAt', width: 20 },
            { header: 'Tài khoản', key: 'actor', width: 20 },
            { header: 'Vai trò', key: 'role', width: 15 },
            { header: 'Hành động', key: 'action', width: 25 },
            { header: 'Thực thể', key: 'entityType', width: 20 },
            { header: 'Mã đối tượng', key: 'entityId', width: 25 },
            { header: 'Mô tả chi tiết', key: 'description', width: 45 },
        ];
        const rows = allData.map((l) => [
            l.id,
            new Date(l.createdAt).toLocaleString('vi-VN'),
            l.actor?.username || 'Hệ thống',
            l.actor?.role ? (USER_ROLE_LABELS[l.actor.role] || l.actor.role) : 'Hệ thống',
            getActionLabel(l.action),
            getEntityLabel(l.entityType),
            l.entityId || '',
            l.description,
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
        const headers = ['Mã ID', 'Thời gian', 'Tài khoản', 'Vai trò', 'Hành động', 'Thực thể', 'Mã đối tượng', 'Mô tả'];
        const rows = allData.map((l) => [
            l.id,
            new Date(l.createdAt).toLocaleString('vi-VN'),
            l.actor?.username || 'Hệ thống',
            l.actor?.role ? (USER_ROLE_LABELS[l.actor.role] || l.actor.role) : 'Hệ thống',
            getActionLabel(l.action),
            getEntityLabel(l.entityType),
            l.entityId || '',
            l.description || '',
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
                { header: 'Thời gian', width: '140px' },
                { header: 'Tài khoản', width: '140px' },
                { header: 'Hành động', width: '140px' },
                { header: 'Thực thể', width: '120px' },
                { header: 'Mô tả chi tiết', width: '240px' },
            ],
            rows: allData.map((l, idx) => [
                idx + 1,
                new Date(l.createdAt).toLocaleString('vi-VN'),
                l.actor?.username || 'Hệ thống',
                getActionLabel(l.action),
                getEntityLabel(l.entityType),
                l.description || '—',
            ]),
            signers: [
                { title: 'CÁN BỘ QUẢN TRỊ HỆ THỐNG', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'TRƯỞNG PHÒNG KHẢO THÍ & ĐBCL', subtitle: '(Ký, đóng dấu)' },
            ],
        });
    };

    /* ── Security Audit State ── */
    const [secEvents, setSecEvents] = useState<SecurityEvent[]>([]);
    const [secIntegrity, setSecIntegrity] = useState<{ checked: number; valid: boolean } | null>(null);
    const [secLoading, setSecLoading] = useState<boolean>(true);
    const [secSearch, setSecSearch] = useState<string>('');
    const [secCategory, setSecCategory] = useState<string>('');
    const [secOutcome, setSecOutcome] = useState<string>('');
    const [secPage, setSecPage] = useState<number>(1);
    const [secLimit, setLimitSec] = useState<number>(10);
    const [secTotal, setSecTotal] = useState<number>(0);
    const [legalHoldModalEvent, setLegalHoldModalEvent] = useState<SecurityEvent | null>(null);
    const [legalHoldLoading, setLegalHoldLoading] = useState<boolean>(false);

    const loadSecurityAudit = useCallback(async () => {
        setSecLoading(true);
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

    const secStats = useMemo(() => ({
        total: secTotal,
        denied: secEvents.filter((e) => e.outcome === 'DENIED').length,
        failed: secEvents.filter((e) => e.outcome === 'FAILURE').length,
        held: secEvents.filter((e) => e.legalHold).length,
    }), [secTotal, secEvents]);

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
            { header: 'Thời điểm', key: 'occurredAt', width: 20 },
            { header: 'Tài khoản', key: 'actor', width: 20 },
            { header: 'Nhóm an ninh', key: 'category', width: 20 },
            { header: 'Hành động', key: 'action', width: 25 },
            { header: 'Đối tượng', key: 'entityType', width: 20 },
            { header: 'Kết quả', key: 'outcome', width: 15 },
            { header: 'Địa chỉ IP', key: 'ipAddress', width: 18 },
            { header: 'Đường dẫn Route', key: 'route', width: 30 },
            { header: 'Khóa pháp lý', key: 'legalHold', width: 15 },
        ];
        const rows = allData.map((e) => [
            e.id,
            new Date(e.occurredAt).toLocaleString('vi-VN'),
            e.actor?.username || 'Hệ thống',
            secCategoryLabel[e.category] || e.category,
            secActionLabel[e.action] || getActionLabel(e.action),
            getEntityLabel(e.entityType),
            secOutcomeLabel[e.outcome] || e.outcome,
            e.ipAddress || '—',
            e.route || '—',
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
        const headers = ['Mã sự kiện', 'Thời điểm', 'Tài khoản', 'Nhóm', 'Hành động', 'Đối tượng', 'Kết quả', 'IP', 'Route', 'Khóa pháp lý'];
        const rows = allData.map((e) => [
            e.id,
            new Date(e.occurredAt).toLocaleString('vi-VN'),
            e.actor?.username || 'Hệ thống',
            secCategoryLabel[e.category] || e.category,
            secActionLabel[e.action] || getActionLabel(e.action),
            getEntityLabel(e.entityType),
            secOutcomeLabel[e.outcome] || e.outcome,
            e.ipAddress || '—',
            e.route || '—',
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
                { header: 'Thời điểm', width: '140px' },
                { header: 'Tài khoản', width: '130px' },
                { header: 'Hành động & Đối tượng', width: '200px' },
                { header: 'Kết quả', width: '100px', align: 'center' },
                { header: 'Nguồn IP & Route', width: '160px' },
                { header: 'Khóa', width: '80px', align: 'center' },
            ],
            rows: allData.map((e, idx) => [
                idx + 1,
                new Date(e.occurredAt).toLocaleString('vi-VN'),
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

    /* =========================================================================
       3. RENDER (ĐỒNG BỘ 100% CỠ CHỮ GIỮA 2 TAB)
    ========================================================================= */

    return (
        <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── 1. Page Header (Tiêu đề 28px, Phụ đề 14px) ── */}
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
                    {/* Data actions dropdown 15px */}
                    <DataActionsDropdown
                        onExportExcel={activeTab === 'activity' ? handleExportExcelActivity : handleExportExcelSecurity}
                        onExportCsv={activeTab === 'activity' ? handleExportCsvActivity : handleExportCsvSecurity}
                        onPrint={activeTab === 'activity' ? handlePrintActivity : handlePrintSecurity}
                        exportLabel="Xuất file Excel"
                        exportCsvLabel="Xuất file CSV"
                        printLabel="In biên bản / Xuất PDF"
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
                        className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
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
               TAB 1: BẢNG NHẬT KÝ THAO TÁC (ĐỒNG BỘ 100% CỠ CHỮ)
            ========================================================================= */}
            {activeTab === 'activity' && (
                <div className="space-y-4">
                    <div className="ui-table-wrap rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                        {loading && logs.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                                <p className="text-type-body-sm text-slate-500">Đang tải nhật ký thao tác...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <p className="text-type-body font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy nhật ký phù hợp</p>
                                <p className="text-type-body-sm text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc thực thể</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="ui-table w-full text-left border-collapse min-w-[760px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-semibold text-slate-600 dark:text-slate-400">
                                            <th className="py-3.5 px-5 w-44">Thời gian</th>
                                            <th className="py-3.5 px-5 w-52">Tài khoản</th>
                                            <th className="py-3.5 px-5">Nội dung thao tác</th>
                                            <th className="py-3.5 px-5 w-12 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {logs.map((log) => {
                                            const actionLabel = getActionLabel(log.action);
                                            const entityLabel = getEntityLabel(log.entityType);
                                            const shortId = formatShortId(log.entityId);

                                            return (
                                                <tr
                                                    key={log.id}
                                                    onClick={() => setSelectedLog(log)}
                                                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer"
                                                >
                                                    {/* Cột 1: Thời gian */}
                                                    <td className="py-4 px-5 whitespace-nowrap text-type-body tabular-nums text-slate-500 dark:text-slate-400">
                                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                    </td>

                                                    {/* Cột 2: Tài khoản (Tên 15px font-semibold, Vai trò 13px) */}
                                                    <td className="py-4 px-5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                                                                {log.actor?.username || 'Hệ thống'}
                                                            </span>
                                                            {log.actor?.role && (
                                                                <span className="table-meta text-type-helper text-slate-500 dark:text-slate-400">
                                                                    {USER_ROLE_LABELS[log.actor.role] || log.actor.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Cột 3: Nội dung thao tác (Dòng 1: Hành động & Thực thể 15px, Dòng 2: Mô tả 15px) */}
                                                    <td className="py-4 px-5">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                                                                    {actionLabel}
                                                                </span>
                                                                <span className="text-slate-400 dark:text-slate-600">·</span>
                                                                <span className="font-medium text-type-body text-blue-600 dark:text-blue-400">
                                                                    {entityLabel}
                                                                </span>
                                                                {shortId && (
                                                                    <span
                                                                        title={log.entityId || ''}
                                                                        className="table-meta text-type-helper tabular-nums text-slate-500 dark:text-slate-400"
                                                                    >
                                                                        {shortId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-type-body text-slate-600 dark:text-slate-400">
                                                                {log.description}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Xem chi tiết */}
                                                    <td className="py-4 px-5 text-right whitespace-nowrap">
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
                            limitOptions={[10, 20, 50, 100]}
                        />
                    )}
                </div>
            )}

            {/* =========================================================================
               TAB 2: BẢNG KIỂM TOÁN AN NINH (ĐỒNG BỘ 100% CẤU TRÚC VÀ CỠ CHỮ VỚI TAB 1)
            ========================================================================= */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="ui-table-wrap rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                        {secLoading && secEvents.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                                <p className="text-type-body-sm text-slate-500">Đang tải sự kiện kiểm toán an ninh...</p>
                            </div>
                        ) : secEvents.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <p className="text-type-body font-semibold text-slate-800 dark:text-slate-200">Không có sự kiện an ninh phù hợp</p>
                                <p className="text-type-body-sm text-slate-400 mt-1">Thử nới lỏng các tiêu chí bộ lọc</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="ui-table w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-semibold text-slate-600 dark:text-slate-400">
                                            <th className="py-3.5 px-5 w-44">Thời điểm</th>
                                            <th className="py-3.5 px-5 w-52">Tài khoản</th>
                                            <th className="py-3.5 px-5">Sự kiện & Đối tượng</th>
                                            <th className="py-3.5 px-5 w-36">Kết quả</th>
                                            <th className="py-3.5 px-5 w-48">Nguồn truy cập</th>
                                            <th className="py-3.5 px-5 w-28 text-center">Khóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {secEvents.map((event) => {
                                            const shortId = formatShortId(event.entityId);
                                            const entityName = getEntityLabel(event.entityType);

                                            return (
                                                <tr key={event.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                                                    {/* Cột 1: Thời điểm */}
                                                    <td className="py-4 px-5 whitespace-nowrap text-type-body tabular-nums text-slate-500 dark:text-slate-400">
                                                        {new Date(event.occurredAt).toLocaleString('vi-VN')}
                                                    </td>

                                                    {/* Cột 2: Tài khoản (Tên 15px font-semibold, Vai trò 13px y hệt Tab 1) */}
                                                    <td className="py-4 px-5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                                                                {event.actor?.username || 'Hệ thống'}
                                                            </span>
                                                            {event.actor?.role && (
                                                                <span className="table-meta text-type-helper text-slate-500 dark:text-slate-400">
                                                                    {USER_ROLE_LABELS[event.actor.role] || event.actor.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Cột 3: Sự kiện & Đối tượng (Dòng 1: Sự kiện & Thực thể 15px, Dòng 2: Nhóm an ninh 15px) */}
                                                    <td className="py-4 px-5">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                                                                    {secActionLabel[event.action] || getActionLabel(event.action)}
                                                                </span>
                                                                {event.entityType && (
                                                                    <>
                                                                        <span className="text-slate-400 dark:text-slate-600">·</span>
                                                                        <span className="font-medium text-type-body text-blue-600 dark:text-blue-400">
                                                                            {entityName}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {shortId && (
                                                                    <span
                                                                        title={event.entityId || ''}
                                                                        className="table-meta text-type-helper tabular-nums text-slate-500 dark:text-slate-400"
                                                                    >
                                                                        {shortId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-type-body text-slate-600 dark:text-slate-400">
                                                                {secCategoryLabel[event.category] || event.category}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Cột 4: Kết quả (Dùng chung StatusBadge chuẩn 100% đồng bộ toàn hệ thống) */}
                                                    <td className="py-4 px-5 whitespace-nowrap">
                                                        <StatusBadge
                                                            status={event.outcome === 'SUCCESS' ? 'SUCCEEDED' : event.outcome === 'DENIED' ? 'REJECTED' : 'FAILED'}
                                                            customLabel={secOutcomeLabel[event.outcome] || event.outcome}
                                                        />
                                                    </td>

                                                    {/* Cột 5: Nguồn truy cập */}
                                                    <td className="py-4 px-5 whitespace-nowrap">
                                                        <div className="space-y-0.5">
                                                            <div className="text-type-body text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                <span className="table-badge text-type-badge font-semibold text-slate-400">IP</span>
                                                                <span className="tabular-nums">{event.ipAddress || '—'}</span>
                                                            </div>
                                                            <div className="table-meta text-type-helper text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={event.route || ''}>
                                                                {event.route || '—'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Cột 6: Khóa điều tra */}
                                                    <td className="py-4 px-5 text-center whitespace-nowrap">
                                                        {event.legalHold ? (
                                                            <span
                                                                title="Đang khóa lưu giữ điều tra pháp lý"
                                                                className="table-badge ui-pill font-medium text-type-helper inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800"
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
                            limitOptions={[10, 20, 50, 100]}
                        />
                    )}
                </div>
            )}

            {/* ── 4. Metadata Inspector Drawer ── */}
            {drawerOpenLog && (
                <div role="dialog" aria-modal="true" aria-label="Chi tiết nhật ký" className="fixed inset-0 z-[100] overflow-hidden">
                    <div
                        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-200 ${drawerVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                        onClick={() => setSelectedLog(null)}
                    />

                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                        <div
                            className={`w-screen max-w-[480px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col pointer-events-auto transition-transform duration-250 ease-out will-change-transform ${drawerVisible ? 'translate-x-0' : 'translate-x-full'
                                }`}
                        >
                            {/* Drawer Header (18px) */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className="text-type-card font-semibold text-slate-900 dark:text-white">
                                        Chi tiết nhật ký thao tác
                                    </h2>
                                    <p className="text-type-helper text-slate-400 tabular-nums mt-0.5">
                                        {new Date(drawerOpenLog.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedLog(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    aria-label="Đóng"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 space-y-5 overflow-y-auto p-5 custom-scrollbar">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                        <span className="text-slate-500">Hành động:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {getActionLabel(drawerOpenLog.action)}
                                        </span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                        <span className="text-slate-500">Người thực hiện:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {drawerOpenLog.actor?.username || 'Hệ thống'}
                                            {drawerOpenLog.actor?.role ? ` (${USER_ROLE_LABELS[drawerOpenLog.actor.role] || drawerOpenLog.actor.role})` : ''}
                                        </span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                        <span className="text-slate-500">Thực thể:</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                            {getEntityLabel(drawerOpenLog.entityType)}
                                        </span>
                                    </div>
                                    {drawerOpenLog.entityId && (
                                        <div className="py-2.5 flex items-center justify-between gap-3 text-type-body-sm">
                                            <span className="text-slate-500">Mã ID đối tượng:</span>
                                            <span className="text-type-helper text-slate-900 dark:text-white break-all tabular-nums">
                                                {drawerOpenLog.entityId}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-white mb-1">
                                        Mô tả thao tác
                                    </h3>
                                    <p className="text-type-body-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                        {drawerOpenLog.description || 'Không có mô tả chi tiết'}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                                            Metadata JSON
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const jsonStr = JSON.stringify(drawerOpenLog.metadata || {}, null, 2);
                                                navigator.clipboard.writeText(jsonStr).then(() => {
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                });
                                            }}
                                            className="inline-flex items-center gap-1 text-type-helper font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 cursor-pointer"
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                                        </button>
                                    </div>

                                    <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-type-helper leading-relaxed text-emerald-400 custom-scrollbar">
                                        {JSON.stringify(drawerOpenLog.metadata || { note: 'Không có metadata' }, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <p className="text-type-helper text-slate-500 dark:text-slate-400">
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
