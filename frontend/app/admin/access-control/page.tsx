'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, KeyRound, ShieldAlert, ShieldCheck, UsersRound, History, Plus, RefreshCw, X, LockKeyhole } from 'lucide-react';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { SlidingSegmentedControl } from '../../../components/ui/SlidingSegmentedControl';
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Toast } from '../../../components/Toast';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
type Tab = 'matrix' | 'users' | 'history';
type Permission = { id: string; code: string; name: string; module: string; description?: string; sensitive: boolean; roles: string[] };
type Scope = { id?: string; type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number };
type AccessUser = {
  id: number; username: string; email: string; role: Role; status: string;
  teacher?: { fullName: string; department?: { id: number; name: string } } | null;
  student?: { fullName: string; class?: { id: number; name: string; department?: { id: number; name: string } } } | null;
  permissionOverrides: Array<{ id: string; effect: 'ALLOW' | 'DENY'; reason?: string | null; permission: { code: string; name: string } }>;
  accessScopes: Scope[];
};

const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Quản trị viên', TEACHER: 'Giảng viên', STUDENT: 'Sinh viên' };
const SCOPE_LABEL: Record<Scope['type'], string> = { DEPARTMENT: 'Khoa', CLASS: 'Lớp', SUBJECT: 'Môn học' };
const ACCESS_TABS: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
  { id: 'matrix', label: 'Ma trận vai trò', Icon: ShieldCheck },
  { id: 'users', label: 'Tài khoản & phạm vi', Icon: UsersRound },
  { id: 'history', label: 'Lịch sử thay đổi', Icon: History },
];

export default function AccessControlPage() {
  usePageTitle('Phân quyền & truy cập');
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('matrix');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [scopeOptions, setScopeOptions] = useState<any>({ departments: [], classes: [], subjects: [] });
  const [history, setHistory] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [effective, setEffective] = useState<any>(null);
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideEffect, setOverrideEffect] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [draftScopes, setDraftScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => Promise<void> } | null>(null);

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) || null, [users, selectedUserId]);
  const groupedPermissions = useMemo(() => permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    (groups[permission.module] ||= []).push(permission);
    return groups;
  }, {}), [permissions]);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [overviewResult, usersResult, scopesResult, historyResult] = await Promise.all([
        api.get('/access-control/overview'), api.get('/access-control/users'), api.get('/access-control/scope-options'), api.get('/access-control/history'),
      ]);
      setPermissions(overviewResult.data?.permissions || []);
      setUsers(usersResult.data || []);
      setScopeOptions(scopesResult.data || { departments: [], classes: [], subjects: [] });
      setHistory(historyResult.data || []);
      setSelectedUserId((current) => current ?? usersResult.data?.[0]?.id ?? null);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || error?.message || 'Không tải được dữ liệu phân quyền.' });
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    void load();
  }, [load, router]);

  const loadEffective = useCallback(async (user: AccessUser | null) => {
    if (!user) return;
    try {
      const result = await api.get(`/access-control/users/${user.id}/effective`);
      setEffective(result.data);
      setDraftScopes(result.data?.scopes || user.accessScopes || []);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || error?.message || 'Không tải được quyền hiệu lực.' });
    }
  }, []);

  useEffect(() => { void loadEffective(selectedUser); }, [selectedUser, loadEffective]);

  const mutate = async (work: () => Promise<void>, successMessage: string) => {
    setSaving(true);
    try {
      await work();
      setToast({ type: 'success', message: successMessage });
      await load(false);
      if (selectedUser) await loadEffective(selectedUser);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || error?.message || 'Thao tác không thành công.' });
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const requestRolePermission = (role: Role, permission: Permission) => {
    const granted = !permission.roles.includes(role);
    setConfirm({
      title: granted ? 'Cấp quyền cho vai trò?' : 'Thu hồi quyền khỏi vai trò?',
      message: `${granted ? 'Cấp' : 'Thu hồi'} quyền “${permission.name}” ${granted ? 'cho' : 'khỏi'} ${ROLE_LABEL[role]}. Thay đổi sẽ ảnh hưởng các tài khoản có vai trò này.`,
      onConfirm: () => mutate(() => api.put(`/access-control/roles/${role}/permissions`, { permissionCode: permission.code, granted }), granted ? 'Đã cấp quyền cho vai trò.' : 'Đã thu hồi quyền khỏi vai trò.'),
    });
  };

  const saveOverride = () => {
    if (!selectedUser || !overrideCode) return;
    setConfirm({
      title: 'Lưu quyền riêng?',
      message: `Thiết lập quyền riêng cho tài khoản ${selectedUser.username}. Quyền từ chối sẽ được ưu tiên hơn quyền theo vai trò.`,
      onConfirm: () => mutate(() => api.put(`/access-control/users/${selectedUser.id}/overrides`, { permissionCode: overrideCode, effect: overrideEffect, reason: overrideReason || undefined }), 'Đã lưu quyền riêng.'),
    });
  };

  const removeOverride = (permissionCode: string) => {
    if (!selectedUser) return;
    setConfirm({
      title: 'Gỡ quyền riêng?',
      message: 'Tài khoản sẽ quay về quyền mặc định theo vai trò và phạm vi đang áp dụng.',
      onConfirm: () => mutate(() => api.delete(`/access-control/users/${selectedUser.id}/overrides/${permissionCode}`), 'Đã gỡ quyền riêng.'),
    });
  };

  const saveScopes = () => {
    if (!selectedUser) return;
    setConfirm({
      title: 'Cập nhật phạm vi truy cập?',
      message: `Cập nhật phạm vi khoa, lớp và môn học cho ${selectedUser.username}. Phạm vi mới sẽ thay thế toàn bộ phạm vi cũ.`,
      onConfirm: () => mutate(() => api.put(`/access-control/users/${selectedUser.id}/scopes`, { scopes: draftScopes.map(({ type, resourceId }) => ({ type, resourceId })) }), 'Đã cập nhật phạm vi truy cập.'),
    });
  };

  const resetRole = (role: Role) => {
    setConfirm({
      title: `Khôi phục quyền mặc định cho ${ROLE_LABEL[role]}?`,
      message: 'Mọi thay đổi cấp hoặc thu hồi quyền của vai trò này sẽ bị xóa và thay bằng cấu hình mặc định của hệ thống.',
      onConfirm: () => mutate(() => api.post(`/access-control/roles/${role}/reset`), `Đã khôi phục quyền mặc định cho ${ROLE_LABEL[role]}.`),
    });
  };

  const resetOverrides = () => {
    if (!selectedUser) return;
    setConfirm({
      title: 'Xóa toàn bộ quyền riêng?',
      message: `Tài khoản ${selectedUser.username} sẽ trở về quyền theo vai trò. Mọi quyền cho phép hoặc từ chối riêng sẽ bị xóa.`,
      onConfirm: () => mutate(() => api.delete(`/access-control/users/${selectedUser.id}/overrides`), 'Đã xóa toàn bộ quyền riêng.'),
    });
  };

  const resetScopes = () => {
    if (!selectedUser) return;
    setConfirm({
      title: 'Xóa phạm vi truy cập riêng?',
      message: `Tài khoản ${selectedUser.username} sẽ không còn phạm vi khoa, lớp hoặc môn học riêng.`,
      onConfirm: () => mutate(() => api.delete(`/access-control/users/${selectedUser.id}/scopes`), 'Đã xóa phạm vi truy cập riêng.'),
    });
  };

  const resetUserAccess = () => {
    if (!selectedUser) return;
    setConfirm({
      title: 'Khôi phục toàn bộ quyền tài khoản?',
      message: `Toàn bộ quyền riêng và phạm vi riêng của ${selectedUser.username} sẽ bị xóa. Tài khoản chỉ còn quyền mặc định theo vai trò.`,
      onConfirm: () => mutate(() => api.post(`/access-control/users/${selectedUser.id}/reset`), 'Đã khôi phục quyền tài khoản về mặc định.'),
    });
  };

  const setScopeType = (type: Scope['type'], ids: number[]) => {
    setDraftScopes((current) => [
      ...current.filter((scope) => scope.type !== type),
      ...ids.map((resourceId) => ({ type, resourceId })),
    ]);
  };

  const scopeIds = (type: Scope['type']) => draftScopes.filter((scope) => scope.type === type).map((scope) => String(scope.resourceId));
  const displayName = (user: AccessUser) => user.teacher?.fullName || user.student?.fullName || user.username;

  const handleExportExcel = () => {
    if (tab === 'matrix') {
      const columns = [
        { header: 'STT', width: 8, align: 'center' as const },
        { header: 'Mã quyền', width: 26 },
        { header: 'Tên chức năng', width: 32 },
        { header: 'Mô-đun', width: 22 },
        { header: 'Mô tả quyền', width: 45 },
        { header: 'Nhạy cảm', width: 14, align: 'center' as const },
        { header: 'Quản trị viên', width: 18, align: 'center' as const },
        { header: 'Giảng viên', width: 18, align: 'center' as const },
        { header: 'Sinh viên', width: 18, align: 'center' as const },
      ];
      const rows = permissions.map((p, idx) => [
        idx + 1,
        p.code,
        p.name,
        p.module,
        p.description || '—',
        p.sensitive ? 'Có' : 'Không',
        p.roles.includes('ADMIN') ? 'Cho phép' : 'Từ chối',
        p.roles.includes('TEACHER') ? 'Cho phép' : 'Từ chối',
        p.roles.includes('STUDENT') ? 'Cho phép' : 'Từ chối',
      ]);
      exportToFormattedExcel({
        filename: 'Ma_tran_phan_quyen_vai_tro.xls',
        title: 'MA TRẬN PHÂN QUYỀN HỆ THỐNG THEO VAI TRÒ',
        subtitle: `Hệ thống quản lý khảo thí · Tổng số ${permissions.length} quyền hệ thống`,
        columns,
        rows,
      });
      setToast({ message: 'Đã xuất ma trận phân quyền ra file Excel', type: 'success' });
    } else if (tab === 'users') {
      const columns = [
        { header: 'STT', width: 8, align: 'center' as const },
        { header: 'Tên tài khoản', width: 20 },
        { header: 'Họ và tên', width: 28 },
        { header: 'Email', width: 30 },
        { header: 'Vai trò', width: 18, align: 'center' as const },
        { header: 'Trạng thái', width: 16, align: 'center' as const },
        { header: 'Quyền cấp riêng', width: 18, align: 'center' as const },
        { header: 'Quyền từ chối', width: 18, align: 'center' as const },
        { header: 'Phạm vi dữ liệu', width: 35 },
      ];
      const rows = users.map((u, idx) => {
        const allows = u.permissionOverrides.filter((o) => o.effect === 'ALLOW').length;
        const denies = u.permissionOverrides.filter((o) => o.effect === 'DENY').length;
        const scopesDesc = u.accessScopes.length > 0
          ? u.accessScopes.map((s) => `${SCOPE_LABEL[s.type]} #${s.resourceId}`).join(', ')
          : 'Toàn quyền theo vai trò';
        return [
          idx + 1,
          u.username,
          displayName(u),
          u.email,
          ROLE_LABEL[u.role] || u.role,
          u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa',
          allows,
          denies,
          scopesDesc,
        ];
      });
      exportToFormattedExcel({
        filename: 'Danh_sach_tai_khoan_va_phan_quyen.xls',
        title: 'DANH SÁCH TÀI KHOẢN VÀ PHẠM VI TRUY CẬP',
        subtitle: `Hệ thống quản lý khảo thí · Tổng số ${users.length} tài khoản người dùng`,
        columns,
        rows,
      });
      setToast({ message: `Đã xuất ${users.length} tài khoản ra file Excel`, type: 'success' });
    } else {
      const columns = [
        { header: 'STT', width: 8, align: 'center' as const },
        { header: 'Thời gian', width: 24, align: 'center' as const },
        { header: 'Người thực hiện', width: 22 },
        { header: 'Nội dung thay đổi', width: 55 },
      ];
      const rows = history.map((h, idx) => [
        idx + 1,
        new Date(h.createdAt).toLocaleString('vi-VN'),
        h.actor?.username || 'Hệ thống',
        h.description,
      ]);
      exportToFormattedExcel({
        filename: 'Nhat_ky_thay_doi_phan_quyen.xls',
        title: 'NHẬT KÝ AUDIT TRAIL THAY ĐỔI PHÂN QUYỀN',
        subtitle: `Hệ thống quản lý khảo thí · Ghi nhận ${history.length} thao tác`,
        columns,
        rows,
      });
      setToast({ message: 'Đã xuất nhật ký phân quyền ra file Excel', type: 'success' });
    }
  };

  const handlePrint = () => {
    if (tab === 'matrix') {
      printReport({
        title: 'BÁO CÁO MA TRẬN PHÂN QUYỀN THEO VAI TRÒ',
        subtitle: `Hệ thống quản lý khảo thí · Ngày in: ${new Date().toLocaleDateString('vi-VN')}`,
        metaInfo: [
          { label: 'Tổng số quyền', value: `${permissions.length} quyền` },
          { label: 'Số mô-đun', value: `${Object.keys(groupedPermissions).length} mô-đun` },
          { label: 'Đơn vị quản trị', value: 'Ban Quản trị Hệ thống Khảo thí' },
        ],
        columns: [
          { header: 'STT', width: '40px', align: 'center' },
          { header: 'Mã quyền', width: '150px' },
          { header: 'Tên chức năng', width: '200px' },
          { header: 'Mô-đun', width: '130px' },
          { header: 'Admin', width: '70px', align: 'center' },
          { header: 'Giảng viên', width: '80px', align: 'center' },
          { header: 'Sinh viên', width: '80px', align: 'center' },
        ],
        rows: permissions.map((p, idx) => [
          idx + 1,
          p.code,
          p.name,
          p.module,
          p.roles.includes('ADMIN') ? '✓' : '—',
          p.roles.includes('TEACHER') ? '✓' : '—',
          p.roles.includes('STUDENT') ? '✓' : '—',
        ]),
        footerNotes: 'Văn bản tra cứu quyền hạn được trích xuất từ cơ sở dữ liệu hệ thống khảo thí.',
        signers: [
          { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
          { title: 'QUẢN TRỊ VIÊN HỆ THỐNG', subtitle: '(Ký tên, xác nhận)' },
        ],
      });
    } else if (tab === 'users') {
      printReport({
        title: 'BÁO CÁO PHÂN QUYỀN VÀ PHẠM VI TÀI KHOẢN',
        subtitle: `Hệ thống quản lý khảo thí · Ngày in: ${new Date().toLocaleDateString('vi-VN')}`,
        metaInfo: [
          { label: 'Tổng số tài khoản', value: `${users.length} tài khoản` },
          { label: 'Đơn vị quản lý', value: 'Ban Quản trị Hệ thống' },
        ],
        columns: [
          { header: 'STT', width: '40px', align: 'center' },
          { header: 'Tên tài khoản', width: '110px' },
          { header: 'Họ và tên', width: '180px' },
          { header: 'Vai trò', width: '110px', align: 'center' },
          { header: 'Trạng thái', width: '90px', align: 'center' },
          { header: 'Quyền riêng', width: '90px', align: 'center' },
        ],
        rows: users.map((u, idx) => [
          idx + 1,
          u.username,
          displayName(u),
          ROLE_LABEL[u.role] || u.role,
          u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa',
          u.permissionOverrides.length ? `${u.permissionOverrides.length} quyền` : 'Mặc định',
        ]),
        footerNotes: 'Danh sách tài khoản và quyền hạn truy cập hệ thống khảo thí.',
        signers: [
          { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
          { title: 'QUẢN TRỊ VIÊN HỆ THỐNG', subtitle: '(Ký tên, xác nhận)' },
        ],
      });
    } else {
      printReport({
        title: 'NHẬT KÝ AUDIT TRAIL THAY ĐỔI PHÂN QUYỀN',
        subtitle: `Hệ thống quản lý khảo thí · Ngày in: ${new Date().toLocaleDateString('vi-VN')}`,
        metaInfo: [
          { label: 'Tổng số bản ghi', value: `${history.length} sự kiện` },
        ],
        columns: [
          { header: 'STT', width: '40px', align: 'center' },
          { header: 'Thời gian', width: '140px', align: 'center' },
          { header: 'Người thực hiện', width: '140px' },
          { header: 'Nội dung thay đổi', width: '380px' },
        ],
        rows: history.map((h, idx) => [
          idx + 1,
          new Date(h.createdAt).toLocaleString('vi-VN'),
          h.actor?.username || 'Hệ thống',
          h.description,
        ]),
        footerNotes: 'Nhật ký truy vết bảo mật phân quyền hệ thống.',
        signers: [
          { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
          { title: 'QUẢN TRỊ VIÊN HỆ THỐNG', subtitle: '(Ký tên, xác nhận)' },
        ],
      });
    }
  };

  return (
    <main className="min-h-screen w-full space-y-5 bg-slate-50/50 px-6 py-6 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
            Phân quyền & truy cập
          </h1>
          <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            Kiểm soát quyền theo vai trò, quyền riêng, phạm vi dữ liệu và lịch sử thay đổi
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <DataActionsDropdown
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SlidingSegmentedControl
          variant="primary"
          value={tab}
          onChange={(newTab) => setTab(newTab as Tab)}
          options={ACCESS_TABS.map((t) => ({
            value: t.id,
            label: t.label,
            icon: t.Icon,
          }))}
        />
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`h-4 w-4 text-slate-500 ${loading || saving ? 'animate-spin text-blue-600' : ''}`} />}
          onClick={() => void load()}
          isLoading={loading || saving}
        >
          Làm mới
        </Button>
      </div>

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-type-body text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Đang tải cấu hình phân quyền…</div> : (
        <>
          {tab === 'matrix' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-type-card font-semibold text-slate-900 dark:text-white">Ma trận quyền theo vai trò</h2><p className="mt-1 text-type-helper text-slate-600 dark:text-slate-300">Một thay đổi ở đây ảnh hưởng đến toàn bộ tài khoản thuộc vai trò tương ứng.</p></div><div className="flex flex-wrap gap-2">{(['ADMIN', 'TEACHER', 'STUDENT'] as Role[]).map((role) => <Button key={role} variant="ghost" size="sm" onClick={() => resetRole(role)} disabled={saving}>Đặt lại {ROLE_LABEL[role]}</Button>)}</div></div>
            <div className="ui-table-wrap overflow-x-auto"><table className="ui-table min-w-[980px] w-full text-left"><thead className="bg-slate-50 text-type-helper font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"><tr><th className="px-5 py-3">Chức năng</th><th className="px-4 py-3">Mô-đun</th><th className="px-4 py-3">Mã quyền</th>{(['ADMIN', 'TEACHER', 'STUDENT'] as Role[]).map((role) => <th key={role} className="px-4 py-3 text-center">{ROLE_LABEL[role]}</th>)}</tr></thead><tbody>{Object.entries(groupedPermissions).map(([module, items]) => <React.Fragment key={module}><tr className="border-y border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30"><td colSpan={6} className="px-5 py-2 table-meta font-medium text-blue-700 dark:text-blue-400">{module}</td></tr>{items.map((permission) => <tr key={permission.code} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-5 py-3"><div className="flex items-center gap-2"><span className="text-type-body font-medium text-slate-900 dark:text-white">{permission.name}</span>{permission.sensitive && <LockKeyhole className="h-3.5 w-3.5 text-amber-600" aria-label="Quyền nhạy cảm" />}</div><p className="mt-0.5 table-meta text-slate-600 dark:text-slate-300">{permission.description}</p></td><td className="px-4 py-3 table-meta text-slate-700 dark:text-slate-300">{permission.module}</td><td className="px-4 py-3 table-meta text-slate-500 dark:text-slate-400">{permission.code}</td>{(['ADMIN', 'TEACHER', 'STUDENT'] as Role[]).map((role) => { const enabled = permission.roles.includes(role); return <td key={role} className="px-4 py-3 text-center"><button type="button" disabled={saving || (role === 'ADMIN' && ['ACCESS_CONTROL_VIEW', 'ACCESS_CONTROL_MANAGE'].includes(permission.code))} onClick={() => requestRolePermission(role, permission)} aria-pressed={enabled} className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${enabled ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900'}`}>{enabled ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</button></td>; })}</tr>)}</React.Fragment>)}</tbody></table></div>
          </section>}

          {tab === 'users' && <section className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"><h2 className="text-type-card font-semibold text-slate-900 dark:text-white">Tài khoản</h2></div><div className="max-h-[680px] overflow-y-auto p-2">{users.map((user) => <button key={user.id} type="button" onClick={() => setSelectedUserId(user.id)} className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${selectedUserId === user.id ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-type-body font-semibold">{displayName(user)}</span><span className={`text-type-helper font-medium ${user.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-600'}`}>{user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</span></div><p className="mt-0.5 truncate text-type-helper text-slate-600 dark:text-slate-300">{user.username} · {ROLE_LABEL[user.role]}</p></button>)}</div></div>
             <div className="space-y-5">{selectedUser ? <><div className="flex flex-wrap items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={resetOverrides} disabled={saving || !selectedUser.permissionOverrides.length}>Xóa quyền riêng</Button><Button variant="ghost" size="sm" onClick={resetScopes} disabled={saving || !selectedUser.accessScopes.length}>Đặt lại phạm vi</Button><Button variant="ghost" size="sm" onClick={resetUserAccess} disabled={saving}>Khôi phục mặc định</Button></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><h2 className="text-type-card font-semibold text-slate-900 dark:text-white">{displayName(selectedUser)}</h2><p className="mt-1 text-type-helper text-slate-600 dark:text-slate-300">{selectedUser.email} · {ROLE_LABEL[selectedUser.role]}</p></div><span className="rounded-xl bg-blue-50 px-2.5 py-1 text-type-helper font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{effective?.permissions?.filter((item: any) => item.allowed).length || 0} quyền hiệu lực</span></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{effective?.permissions?.filter((item: any) => item.allowed).map((permission: any) => <div key={permission.code} className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"><p className="text-type-helper font-semibold text-slate-800 dark:text-slate-100">{permission.name}</p><p className="mt-0.5 text-type-helper text-slate-600 dark:text-slate-400">{permission.source === 'ROLE' ? 'Theo vai trò' : permission.source === 'USER_ALLOW' ? 'Cấp riêng' : '—'}</p></div>)}</div></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"><h3 className="text-type-card font-semibold text-slate-900 dark:text-white">Quyền riêng</h3><p className="mt-1 text-type-helper text-slate-600 dark:text-slate-300">Dùng để cho phép hoặc từ chối riêng một quyền, vượt lên trên quyền theo vai trò.</p><div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_auto]"><select value={overrideCode} onChange={(event) => setOverrideCode(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-type-body font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="">Chọn quyền</option>{permissions.map((permission) => <option key={permission.code} value={permission.code}>{permission.name}</option>)}</select><select value={overrideEffect} onChange={(event) => setOverrideEffect(event.target.value as 'ALLOW' | 'DENY')} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-type-body font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="ALLOW">Cho phép</option><option value="DENY">Từ chối</option></select><input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} maxLength={500} placeholder="Lý do (không bắt buộc)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900" /><Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} disabled={!overrideCode || saving} onClick={saveOverride}>Lưu</Button></div><div className="mt-4 space-y-2">{selectedUser.permissionOverrides.length ? selectedUser.permissionOverrides.map((override) => <div key={override.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"><div><p className="text-type-body font-medium text-slate-900 dark:text-white">{override.permission.name} <span className={override.effect === 'ALLOW' ? 'text-emerald-700' : 'text-rose-600'}>· {override.effect === 'ALLOW' ? 'Cho phép' : 'Từ chối'}</span></p>{override.reason && <p className="mt-0.5 text-type-helper text-slate-600 dark:text-slate-300">{override.reason}</p>}</div><button type="button" onClick={() => removeOverride(override.permission.code)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button></div>) : <p className="text-type-helper text-slate-600 dark:text-slate-300">Chưa có quyền riêng; tài khoản đang dùng quyền theo vai trò.</p>}</div></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"><h3 className="text-type-card font-semibold text-slate-900 dark:text-white">Phạm vi thuộc tính</h3><p className="mt-1 text-type-helper text-slate-600 dark:text-slate-300">Khi có phạm vi, các policy ABAC sẽ chỉ cho phép thao tác trên đúng khoa, lớp hoặc môn đã chọn.</p><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">{(['DEPARTMENT', 'CLASS', 'SUBJECT'] as Scope['type'][]).map((type) => { const values = type === 'DEPARTMENT' ? scopeOptions.departments : type === 'CLASS' ? scopeOptions.classes : scopeOptions.subjects; return <label key={type} className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-800 dark:text-slate-100">{SCOPE_LABEL[type]}</span><select multiple value={scopeIds(type)} onChange={(event) => setScopeType(type, Array.from(event.target.selectedOptions, (option) => Number(option.value)))} className="h-36 w-full rounded-xl border border-slate-200 bg-white p-2 text-type-body font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{values.map((item: any) => <option key={item.id} value={item.id}>{item.code || item.subjectCode} — {item.name || item.subjectName}</option>)}</select></label>; })}</div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-type-helper text-slate-600 dark:text-slate-300">Giữ Ctrl/Cmd để chọn nhiều mục. Không chọn phạm vi nghĩa là chưa đặt giới hạn ABAC riêng.</p><Button variant="primary" size="sm" onClick={saveScopes} disabled={saving}>Lưu phạm vi</Button></div></div>
            </> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-type-body text-slate-600 dark:border-slate-800 dark:bg-slate-900">Chọn một tài khoản để cấu hình quyền.</div>}</div>
          </section>}

          {tab === 'history' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="text-type-card font-semibold text-slate-900 dark:text-white">Audit Trail phân quyền</h2><p className="mt-1 text-type-helper text-slate-600 dark:text-slate-300">Các thay đổi quyền và phạm vi đều được ghi lại để truy vết.</p></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{history.length ? history.map((item) => <div key={item.id} className="flex gap-3 px-5 py-4"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><KeyRound className="h-4 w-4" /></div><div className="min-w-0"><p className="text-type-body font-medium text-slate-900 dark:text-white">{item.description}</p><p className="mt-1 text-type-helper text-slate-600 dark:text-slate-300">{item.actor?.username || 'Hệ thống'} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div></div>) : <div className="px-5 py-10 text-center text-type-body text-slate-600 dark:text-slate-300">Chưa có thay đổi phân quyền nào được ghi nhận.</div>}</div></section>}
        </>
      )}

      <ConfirmModal isOpen={Boolean(confirm)} onClose={() => !saving && setConfirm(null)} onConfirm={() => confirm?.onConfirm()} title={confirm?.title || ''} message={confirm?.message || ''} type="warning" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}
