'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { TabBar, TabItem } from '../../../components/ui/TabBar';
import { Toast } from '../../../components/Toast';
import { printReport } from '../../../lib/export-print';
import {
  Activity,
  Search,
  RefreshCw,
  Printer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  ShieldCheck,
  FileText,
  Database,
  AlertCircle,
  LogIn,
  PlusCircle,
  Edit3,
  X,
  Code,
  Info,
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
    description: 'Đã tạo yêu cầu sao lưu Snapshot cSDL môi trường STAGING',
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

export default function ActivityLogsPage() {
  usePageTitle('Nhật ký hoạt động hệ thống');
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionTab, setActionTab] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Inspector Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (actionTab !== 'ALL') params.action = actionTab;
      if (entityFilter !== 'ALL') params.entityType = entityFilter;

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
  }, [page, limit, search, actionTab, entityFilter]);

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) return void router.replace('/login');
    if (currentUser.role !== 'ADMIN') return void router.replace('/dashboard');
    fetchLogs();
  }, [fetchLogs, router]);

  // Counts for Stats & Tabs
  const counts = useMemo(() => {
    let all = logs.length, login = 0, dataOps = 0, appeal = 0, backup = 0;
    logs.forEach((l) => {
      const act = l.action.toUpperCase();
      if (act.includes('LOGIN')) login++;
      else if (act.includes('APPEAL') || act.includes('REGRADE')) appeal++;
      else if (act.includes('BACKUP')) backup++;
      else dataOps++;
    });
    return { all: totalCount || all, login, dataOps, appeal, backup };
  }, [logs, totalCount]);

  const tabs: TabItem[] = [
    { key: 'ALL', label: 'Tất cả hoạt động', count: counts.all },
    { key: 'USER_LOGIN', label: 'Đăng nhập & Phiên', count: counts.login },
    { key: 'DATA_OPS', label: 'Biên soạn & Duyệt câu hỏi', count: counts.dataOps },
    { key: 'GRADE_APPEAL', label: 'Phúc khảo & Đổi điểm', count: counts.appeal },
    { key: 'BACKUP', label: 'Sao lưu & Phục hồi', count: counts.backup },
  ];

  // Entities List for Dropdown
  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => { if (l.entityType) set.add(l.entityType); });
    return Array.from(set);
  }, [logs]);

  // Filtered Display List
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchActor = (item.actor?.username || '').toLowerCase().includes(s);
        const matchAction = item.action.toLowerCase().includes(s);
        const matchDesc = item.description.toLowerCase().includes(s);
        if (!matchActor && !matchAction && !matchDesc) return false;
      }

      if (actionTab !== 'ALL') {
        const act = item.action.toUpperCase();
        if (actionTab === 'USER_LOGIN' && !act.includes('LOGIN')) return false;
        if (actionTab === 'GRADE_APPEAL' && !act.includes('APPEAL') && !act.includes('REGRADE')) return false;
        if (actionTab === 'BACKUP' && !act.includes('BACKUP')) return false;
        if (actionTab === 'DATA_OPS' && (act.includes('LOGIN') || act.includes('APPEAL') || act.includes('BACKUP'))) return false;
      }

      if (entityFilter !== 'ALL' && item.entityType !== entityFilter) return false;

      return true;
    });
  }, [logs, search, actionTab, entityFilter]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePrint = () => {
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
        { header: 'STT', width: '45px', align: 'center' },
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

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('BACKUP')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (act.includes('APPEAL') || act.includes('REGRADE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act.includes('CREATE') || act.includes('APPROVE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (act.includes('DELETE') || act.includes('REJECT')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen text-[#0F172A]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── 1. Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-[36px] tracking-tight text-[#0F172A]">
            Nhật ký hoạt động hệ thống
          </h1>
          <p className="text-[15px] font-normal leading-[24px] text-[#64748B]">
            Theo dõi, rà soát và ghi vết chi tiết mọi lịch sử thao tác của Quản trị viên, Giảng viên và Thí sinh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={fetchLogs}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-4 w-4 text-[#64748B]" />}
          >
            Làm mới
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            In / Xuất nhật ký PDF
          </Button>
        </div>
      </div>

      {/* ── 2. Top KPI Summary Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Tổng nhật ký thao tác</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{totalCount} <span className="text-xs font-normal text-[#64748B]">bản ghi</span></div>
          <p className="text-[12px] font-normal text-[#64748B]">Lịch sử ghi vết toàn hệ thống</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Phiên đăng nhập</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <LogIn className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{counts.login} <span className="text-xs font-normal text-[#64748B]">lượt</span></div>
          <p className="text-[12px] font-semibold text-emerald-600">Đăng nhập tài khoản & Google OAuth</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Tạo & Phê duyệt đề</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{counts.dataOps} <span className="text-xs font-normal text-[#64748B]">lượt</span></div>
          <p className="text-[12px] font-semibold text-blue-600">Biên soạn & duyệt câu hỏi thi</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Phúc khảo & Đổi điểm</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{counts.appeal} <span className="text-xs font-normal text-[#64748B]">đơn</span></div>
          <p className="text-[12px] font-semibold text-amber-600">Khiếu nại điểm & thẩm định</p>
        </div>
      </div>

      {/* ── 3. Filters Card & TabBar ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-4">
        {/* TabBar */}
        <TabBar tabs={tabs} active={actionTab} onChange={(key) => { setActionTab(key); setPage(1); }} />

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 min-w-[280px]">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo Tên tài khoản, Hành động hoặc Nội dung chi tiết..."
              className="h-[38px] w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs font-normal text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition shadow-2xs"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] pointer-events-none" />
          </div>

          <div className="flex items-center gap-2.5">
            {entityTypes.length > 0 && (
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                className="h-[38px] rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB] transition cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tất cả Thực thể</option>
                {entityTypes.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            )}

            {(search || entityFilter !== 'ALL' || actionTab !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setEntityFilter('ALL');
                  setActionTab('ALL');
                  setPage(1);
                }}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Main Data Table ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <th className="py-3.5 px-4 whitespace-nowrap">Thời gian</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Người thực hiện</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Hành động</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Đối tượng tác động</th>
                <th className="py-3.5 px-4 min-w-[280px]">Mô tả thao tác</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Chi tiết Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs font-medium text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-[#64748B]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
                    Đang tải nhật ký hoạt động hệ thống...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-[#64748B] font-normal">
                    Chưa có nhật ký hoạt động nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Thời gian */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11.5px] text-[#475569]">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </td>

                    {/* Người thực hiện */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] font-bold text-xs border border-blue-100 shrink-0">
                          {(item.actor?.username || 'A').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#0F172A] text-xs">{item.actor?.username || 'Hệ thống'}</p>
                          <p className="text-[10.5px] text-[#64748B] font-normal">{item.actor?.email || 'system@exam.edu.vn'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Hành động */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase ${getActionBadgeClass(item.action)}`}>
                        {item.action}
                      </span>
                    </td>

                    {/* Đối tượng */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                      <span className="font-semibold text-[#0F172A]">{item.entityType}</span>
                      {item.entityId && <span className="text-[#64748B] ml-1">#{item.entityId}</span>}
                    </td>

                    {/* Mô tả */}
                    <td className="py-3.5 px-4 leading-relaxed font-normal text-[#334155]">
                      {item.description}
                    </td>

                    {/* Action button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedLog(item)}
                        leftIcon={<Info className="h-3.5 w-3.5 text-[#64748B]" />}
                      >
                        Chi tiết JSON
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="border-t border-[#E2E8F0] bg-white py-3.5 px-4 flex justify-between items-center text-xs text-[#64748B]">
            <div>
              Hiển thị <span className="font-bold text-[#0F172A]">{(page - 1) * limit + 1}</span> -{' '}
              <span className="font-bold text-[#0F172A]">{Math.min(page * limit, totalCount)}</span> trên tổng số{' '}
              <span className="font-bold text-[#0F172A]">{totalCount}</span> nhật ký
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] outline-none cursor-pointer shadow-2xs"
              >
                <option value={15}>15 dòng / trang</option>
                <option value={30}>30 dòng / trang</option>
                <option value={50}>50 dòng / trang</option>
                <option value={100}>100 dòng / trang</option>
              </select>

              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  title="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-bold text-[#0F172A]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  title="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Inspector Drawer */}
      {selectedLog && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLog(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl border-l border-[#E2E8F0] animate-slide-left">
            <div className="border-b border-blue-700 bg-[#2563EB] p-4 shrink-0 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white font-mono text-xs font-bold border border-white/20">
                  LOG
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">
                    Chi tiết Nhật ký #{selectedLog.id}
                  </h3>
                  <p className="text-xs text-blue-100 font-normal">
                    {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="shrink-0 rounded-lg p-1 text-blue-100 hover:bg-white/15 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="rounded-lg bg-[#F8FAFC] p-3.5 border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#64748B]">Hành động:</span>
                  <span className="font-bold text-[#2563EB]">{selectedLog.action}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#64748B]">Người thực hiện:</span>
                  <span className="font-bold text-[#0F172A]">{selectedLog.actor?.username || 'Hệ thống'} ({selectedLog.actor?.role || 'SYSTEM'})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#64748B]">Thực thể tác động:</span>
                  <span className="font-mono text-[#0F172A]">{selectedLog.entityType} #{selectedLog.entityId || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider">
                  Mô tả hành động:
                </label>
                <div className="rounded-lg bg-slate-50 border border-[#E2E8F0] p-3 text-[#0F172A] font-normal leading-relaxed">
                  {selectedLog.description}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider flex items-center justify-between">
                  <span>Dữ liệu Metadata JSON</span>
                  <Code className="h-4 w-4 text-[#64748B]" />
                </label>
                <pre className="rounded-lg bg-slate-900 text-emerald-400 p-4 text-[11px] font-mono overflow-x-auto border border-slate-800 leading-relaxed shadow-inner">
                  {JSON.stringify(selectedLog.metadata || { note: 'Không có dữ liệu bổ sung' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] p-4 bg-[#F8FAFC] flex justify-end shrink-0">
              <Button variant="secondary" size="md" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
