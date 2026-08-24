'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  History,
  Plus,
  RefreshCw,
  X,
  LockKeyhole,
  Search,
  Building2,
  BookOpen,
  GraduationCap,
  Sparkles,
  Check,
  RotateCcw,
  Shield,
  Layers,
  ChevronDown,
  LayoutGrid,
  BarChart3,
  FileCheck2,
  Cpu,
} from 'lucide-react';
import api from '../../../lib/api';
import { invalidateCache } from '../../../lib/api-cache';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { SlidingSegmentedControl } from '../../../components/ui/SlidingSegmentedControl';
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
import { TabBar } from '../../../components/ui/TabBar';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { PaginationBar } from '../../../components/ui/PaginationBar';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Toast } from '../../../components/Toast';
import { ScopeTagPicker } from '../../../components/access-control/ScopeTagPicker';
import { ScopeManagerStudio } from '../../../components/access-control/ScopeManagerStudio';
import { PermissionSimulatorModal } from '../../../components/access-control/PermissionSimulatorModal';
import { PermissionFilterPopover } from '../../../components/access-control/PermissionFilterPopover';
import { AccessHistoryFilterPopover, AccessHistoryFilterState } from '../../../components/access-control/AccessHistoryFilterPopover';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
type Tab = 'matrix' | 'users' | 'history';
type Permission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
  sensitive: boolean;
  roles: string[];
};
type Scope = { id?: string; type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number };
type AccessUser = {
  id: number;
  username: string;
  email: string;
  role: Role;
  status: string;
  teacher?: { fullName: string; department?: { id: number; name: string } } | null;
  student?: {
    fullName: string;
    class?: { id: number; name: string; department?: { id: number; name: string } };
  } | null;
  permissionOverrides: Array<{
    id: string;
    effect: 'ALLOW' | 'DENY';
    reason?: string | null;
    permission: { code: string; name: string };
  }>;
  accessScopes: Scope[];
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

const SCOPE_LABEL: Record<Scope['type'], string> = {
  DEPARTMENT: 'Khoa',
  CLASS: 'Lớp',
  SUBJECT: 'Môn',
};

const getModuleIcon = (moduleName: string) => {
  switch (moduleName) {
    case 'Báo cáo':
      return BarChart3;
    case 'Chấm thi':
      return FileCheck2;
    case 'Ngân hàng đề':
      return BookOpen;
    case 'Quản trị hệ thống':
      return Cpu;
    case 'Sinh viên':
      return GraduationCap;
    case 'Tổ chức thi':
      return Building2;
    default:
      return Shield;
  }
};

const ACCESS_TABS: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
  { id: 'matrix', label: 'Quyền theo vai trò', Icon: ShieldCheck },
  { id: 'users', label: 'Tài khoản & phạm vi truy cập', Icon: UsersRound },
  { id: 'history', label: 'Lịch sử thay đổi', Icon: History },
];

export default function AccessControlPage() {
  usePageTitle('Phân quyền & truy cập');
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('matrix');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [scopeOptions, setScopeOptions] = useState<any>({
    departments: [],
    classes: [],
    subjects: [],
  });
  const [history, setHistory] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [effective, setEffective] = useState<any>(null);
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [scopeReason, setScopeReason] = useState('');
  const [draftScopes, setDraftScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    requireReason?: boolean;
    reasonPlaceholder?: string;
    onConfirm: (reason?: string) => Promise<void>;
  } | null>(null);

  // Quick Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // User Studio Sub-Tab (Scopes vs Overrides vs Effective)
  const [userStudioTab, setUserStudioTab] = useState<'scopes' | 'overrides' | 'effective'>('scopes');

  // Search & Filter States
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixModuleFilter, setMatrixModuleFilter] = useState('ALL');
  const [onlySensitive, setOnlySensitive] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const resetMenuRef = useRef<HTMLDivElement>(null);

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const roleChipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleSelectRoleFilter = (key: string) => {
    setUserRoleFilter(key);
    const targetEl = roleChipRefs.current[key];
    if (targetEl) {
      targetEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  const [historySearch, setHistorySearch] = useState('');
  const [historyFilters, setHistoryFilters] = useState<AccessHistoryFilterState>({
    actionCategory: 'ALL',
    actor: 'ALL',
    timeframe: 'ALL',
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const matrixSearchInputRef = useRef<HTMLInputElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    setIsSpinning(true);
    try {
      invalidateCache('/access-control/matrix');
      invalidateCache('/access-control/users');
      invalidateCache('/access-control/history');
      await load(false);
      setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: err?.response?.data?.message || err?.message || 'Lỗi khi làm mới dữ liệu', type: 'error' });
    } finally {
      setTimeout(() => setIsSpinning(false), 600);
    }
  };

  // Close reset menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resetMenuRef.current && !resetMenuRef.current.contains(event.target as Node)) {
        setIsResetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick shortcut "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        matrixSearchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  // Stats calculation
  const sensitiveCount = useMemo(() => permissions.filter((p) => p.sensitive).length, [permissions]);
  const usersWithOverridesCount = useMemo(
    () => users.filter((u) => u.permissionOverrides && u.permissionOverrides.length > 0).length,
    [users]
  );
  const usersWithScopesCount = useMemo(
    () => users.filter((u) => u.accessScopes && u.accessScopes.length > 0).length,
    [users]
  );

  // Role Granted Counts
  const roleGrantedCounts = useMemo(() => {
    const counts: Record<Role, number> = { ADMIN: 0, TEACHER: 0, STUDENT: 0 };
    for (const p of permissions) {
      if (p.roles.includes('ADMIN')) counts.ADMIN++;
      if (p.roles.includes('TEACHER')) counts.TEACHER++;
      if (p.roles.includes('STUDENT')) counts.STUDENT++;
    }
    return counts;
  }, [permissions]);

  // Filtered Matrix Permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      if (matrixModuleFilter !== 'ALL' && p.module !== matrixModuleFilter) return false;
      if (onlySensitive && !p.sensitive) return false;
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase().trim();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [permissions, matrixModuleFilter, onlySensitive, matrixSearch]);

  const groupedPermissions = useMemo(
    () =>
      filteredPermissions.reduce<Record<string, Permission[]>>((groups, permission) => {
        (groups[permission.module] ||= []).push(permission);
        return groups;
      }, {}),
    [filteredPermissions]
  );

  const availableModules = useMemo(() => {
    const set = new Set(permissions.map((p) => p.module));
    return Array.from(set);
  }, [permissions]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase().trim();
        const name = (u.teacher?.fullName || u.student?.fullName || '').toLowerCase();
        const username = u.username.toLowerCase();
        const email = u.email.toLowerCase();
        if (!name.includes(q) && !username.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [users, userRoleFilter, userSearch]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      // 1. Search text
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const matchDesc = (h.description || '').toLowerCase().includes(q);
        const matchActor = (h.actor?.username || '').toLowerCase().includes(q);
        if (!matchDesc && !matchActor) return false;
      }

      // 2. Action Category
      if (historyFilters.actionCategory !== 'ALL') {
        const desc = (h.description || '').toLowerCase();
        const action = (h.action || '').toUpperCase();
        if (historyFilters.actionCategory === 'OVERRIDE') {
          if (!action.includes('OVERRIDE') && !desc.includes('quyền riêng')) return false;
        } else if (historyFilters.actionCategory === 'SCOPE') {
          if (!action.includes('SCOPE') && !desc.includes('phạm vi')) return false;
        } else if (historyFilters.actionCategory === 'RESET') {
          if (!action.includes('RESET') && !desc.includes('khôi phục') && !desc.includes('mặc định')) return false;
        }
      }

      // 3. Actor Filter
      if (historyFilters.actor !== 'ALL') {
        const actorName = h.actor?.username || 'Hệ thống';
        if (actorName !== historyFilters.actor) return false;
      }

      // 4. Timeframe Filter
      if (historyFilters.timeframe !== 'ALL') {
        const now = new Date();
        const itemTime = new Date(h.createdAt).getTime();
        if (historyFilters.timeframe === 'TODAY') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          if (itemTime < startOfToday) return false;
        } else if (historyFilters.timeframe === 'WEEK') {
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          if (itemTime < sevenDaysAgo) return false;
        } else if (historyFilters.timeframe === 'MONTH') {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
          if (itemTime < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [history, historySearch, historyFilters]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredHistory.slice(start, start + historyPageSize);
  }, [filteredHistory, historyPage, historyPageSize]);

  const historyTotalPages = Math.ceil(filteredHistory.length / historyPageSize) || 1;

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [overviewResult, usersResult, scopesResult, historyResult] = await Promise.all([
        api.get('/access-control/overview'),
        api.get('/access-control/users'),
        api.get('/access-control/scope-options'),
        api.get('/access-control/history?limit=200'),
      ]);
      setPermissions(overviewResult.data?.permissions || []);
      setUsers(usersResult.data || []);
      setScopeOptions(scopesResult.data || { departments: [], classes: [], subjects: [] });
      setHistory(historyResult.data || []);
      setSelectedUserId((current) => current ?? usersResult.data?.[0]?.id ?? null);
    } catch (error: any) {
      setToast({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Không tải được dữ liệu phân quyền.',
      });
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
      setToast({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Không tải được quyền hiệu lực.',
      });
    }
  }, []);

  useEffect(() => {
    void loadEffective(selectedUser);
  }, [selectedUser, loadEffective]);

  useEffect(() => {
    setOverrideCode('');
    setOverrideReason('');
    setScopeReason('');
  }, [selectedUserId]);

  const mutate = async (work: () => Promise<void>, successMessage: string, onSuccess?: () => void) => {
    setSaving(true);
    setConfirm(null);
    try {
      await work();
      onSuccess?.();
      setToast({ type: 'success', message: successMessage });
      await Promise.all([
        load(false),
        selectedUser ? loadEffective(selectedUser) : Promise.resolve(),
      ]);
    } catch (error: any) {
      setToast({
        type: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Thao tác không thành công.',
      });
    } finally {
      setSaving(false);
    }
  };

  const requestRolePermission = (role: Role, permission: Permission) => {
    const granted = !permission.roles.includes(role);
    setConfirm({
      title: granted ? 'Cấp quyền cho vai trò?' : 'Thu hồi quyền khỏi vai trò?',
      message: `${granted ? 'Cấp' : 'Thu hồi'} quyền “${permission.name}” ${granted ? 'cho' : 'khỏi'} ${ROLE_LABEL[role]}.`,
      type: granted ? 'info' : 'warning',
      requireReason: true,
      reasonPlaceholder: 'Ví dụ: Điều chỉnh theo phân công nhiệm vụ học kỳ II...',
      onConfirm: (reason) =>
        mutate(
          () =>
            api.put(`/access-control/roles/${role}/permissions`, {
              permissionCode: permission.code,
              granted,
              reason: (reason || '').trim(),
            }),
          granted ? 'Đã cấp quyền thành công.' : 'Đã thu hồi quyền thành công.'
        ),
    });
  };

  const requestBulkModulePermission = (role: Role, moduleName: string, grantAll: boolean) => {
    const targetPerms = permissions.filter((p) => p.module === moduleName);
    const changes = targetPerms
      .filter((permission) => permission.roles.includes(role) !== grantAll)
      .map((permission) => ({ permissionCode: permission.code, granted: grantAll }));
    if (!changes.length) {
      setToast({ type: 'success', message: 'Nhóm quyền đã ở đúng trạng thái yêu cầu.' });
      return;
    }
    setConfirm({
      title: grantAll ? `Cấp cả nhóm [${moduleName}]?` : `Thu hồi cả nhóm [${moduleName}]?`,
      message: `${grantAll ? 'Cấp' : 'Thu hồi'} ${targetPerms.length} quyền của nhóm [${moduleName}] cho ${ROLE_LABEL[role]}.`,
      type: grantAll ? 'info' : 'warning',
      requireReason: true,
      reasonPlaceholder: 'Ví dụ: Cấp quyền quản lý ngân hàng câu hỏi theo phân công...',
      onConfirm: (reason) =>
        mutate(
          () =>
            api.put(`/access-control/roles/${role}/permissions/batch`, {
              changes,
              reason: (reason || '').trim(),
            }),
          `Đã ${grantAll ? 'cấp' : 'thu hồi'} nhóm [${moduleName}] cho ${ROLE_LABEL[role]}.`
        ),
    });
  };

  const handleQuickAddOverride = (effect: 'ALLOW' | 'DENY') => {
    if (!selectedUser || !overrideCode) return;
    if (overrideReason.trim().length < 5) {
      setToast({ type: 'error', message: 'Nhập lý do cấp hoặc chặn quyền riêng (tối thiểu 5 ký tự).' });
      return;
    }
    const targetPerm = permissions.find((p) => p.code === overrideCode);
    const permName = targetPerm ? targetPerm.name : overrideCode;
    const isAllow = effect === 'ALLOW';

    setConfirm({
      title: isAllow ? 'Xác nhận cấp thêm quyền riêng?' : 'Xác nhận chặn quyền riêng?',
      message: `Bạn có chắc chắn muốn ${isAllow ? 'cấp thêm quyền' : 'chặn quyền'} “${permName}” cho tài khoản ${displayName(selectedUser)} (${selectedUser.username})? Cấu hình này sẽ ghi đè quyền mặc định của vai trò.`,
      onConfirm: () =>
        mutate(
          () =>
            api.put(`/access-control/users/${selectedUser.id}/overrides`, {
              permissionCode: overrideCode,
              effect,
              reason: overrideReason.trim(),
            }),
          isAllow ? 'Đã cấp quyền riêng thành công.' : 'Đã thiết lập chặn quyền thành công.',
          () => setOverrideReason('')
        ),
    });
    setOverrideCode('');
  };

  const removeOverride = (permissionCode: string) => {
    if (!selectedUser) return;
    const targetPerm = permissions.find((p) => p.code === permissionCode);
    const permName = targetPerm ? targetPerm.name : permissionCode;

    setConfirm({
      title: 'Gỡ ngoại lệ quyền riêng?',
      message: `Bạn có chắc chắn muốn gỡ ngoại lệ của quyền “${permName}” khỏi tài khoản ${displayName(selectedUser)}? Quyền sẽ tự động quay về theo vai trò mặc định.`,
      onConfirm: () =>
        mutate(
          () =>
            api.delete(
              `/access-control/users/${selectedUser.id}/overrides/${permissionCode}`
            ),
          'Đã gỡ quyền riêng thành công.'
        ),
    });
  };

  const saveScopes = () => {
    if (!selectedUser) return;
    if (scopeReason.trim().length < 5) {
      setToast({ type: 'error', message: 'Nhập lý do thay đổi phạm vi dữ liệu (tối thiểu 5 ký tự).' });
      return;
    }
    setConfirm({
      title: 'Lưu cấu hình phạm vi truy cập?',
      message: `Bạn có chắc chắn muốn cập nhật ${draftScopes.length} phạm vi truy cập dữ liệu cho tài khoản ${displayName(selectedUser)}?`,
      onConfirm: () =>
        mutate(
          () =>
            api.put(`/access-control/users/${selectedUser.id}/scopes`, {
              scopes: draftScopes.map(({ type, resourceId }) => ({ type, resourceId })),
              reason: scopeReason.trim(),
            }),
          'Đã lưu phạm vi truy cập thành công.',
          () => setScopeReason('')
        ),
    });
  };

  const resetRole = (role: Role) => {
    setConfirm({
      title: `Khôi phục quyền mặc định cho ${ROLE_LABEL[role]}?`,
      message: `Quay về cấu hình quyền mặc định của vai trò ${ROLE_LABEL[role]}.`,
      onConfirm: () =>
        mutate(
          () => api.post(`/access-control/roles/${role}/reset`),
          `Đã khôi phục quyền mặc định cho ${ROLE_LABEL[role]}.`
        ),
    });
  };

  const resetUserAccess = () => {
    if (!selectedUser) return;
    setConfirm({
      title: 'Khôi phục quyền tài khoản?',
      message: `Xóa toàn bộ quyền riêng và phạm vi của ${selectedUser.username} về mặc định.`,
      onConfirm: () =>
        mutate(
          () => api.post(`/access-control/users/${selectedUser.id}/reset`),
          'Đã khôi phục quyền tài khoản về mặc định.'
        ),
    });
  };

  const displayName = (user: AccessUser) =>
    user.teacher?.fullName || user.student?.fullName || user.username;
  const accountContext = (user: AccessUser) => {
    if (user.role === 'STUDENT') {
      const studentClass = user.student?.class;
      return studentClass
        ? `Lớp ${studentClass.name}${studentClass.department?.name ? ` · ${studentClass.department.name}` : ''}`
        : 'Chưa có lớp/khoa trong hồ sơ';
    }
    if (user.role === 'TEACHER') {
      return user.teacher?.department?.name ? `Khoa ${user.teacher.department.name}` : 'Chưa gán khoa';
    }
    return 'Toàn quyền hệ thống';
  };

  const handleExportExcel = () => {
    if (tab === 'matrix') {
      const columns = [
        { header: 'STT', width: 8, align: 'center' as const },
        { header: 'Mã quyền', width: 26 },
        { header: 'Tên chức năng', width: 32 },
        { header: 'Nhóm', width: 22 },
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
        p.sensitive ? 'Có' : 'Không',
        p.roles.includes('ADMIN') ? 'Cho phép' : 'Từ chối',
        p.roles.includes('TEACHER') ? 'Cho phép' : 'Từ chối',
        p.roles.includes('STUDENT') ? 'Cho phép' : 'Từ chối',
      ]);
      exportToFormattedExcel({
        filename: 'Ma_tran_phan_quyen.xls',
        title: 'MA TRẬN PHÂN QUYỀN HỆ THỐNG',
        subtitle: `Tổng số ${permissions.length} chức năng`,
        columns,
        rows,
      });
      setToast({ message: 'Đã xuất file Excel', type: 'success' });
    } else if (tab === 'users') {
      const columns = [
        { header: 'STT', width: 8, align: 'center' as const },
        { header: 'Tài khoản', width: 20 },
        { header: 'Họ và tên', width: 28 },
        { header: 'Vai trò', width: 18, align: 'center' as const },
        { header: 'Trạng thái', width: 16, align: 'center' as const },
        { header: 'Quyền riêng', width: 16, align: 'center' as const },
        { header: 'Phạm vi truy cập', width: 35 },
      ];
      const rows = users.map((u, idx) => {
        const scopesDesc =
          u.accessScopes.length > 0
            ? u.accessScopes.map((s) => `${SCOPE_LABEL[s.type]} #${s.resourceId}`).join(', ')
            : 'Toàn quyền';
        return [
          idx + 1,
          u.username,
          displayName(u),
          ROLE_LABEL[u.role] || u.role,
          u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa',
          u.permissionOverrides.length ? `${u.permissionOverrides.length} quyền` : '0',
          scopesDesc,
        ];
      });
      exportToFormattedExcel({
        filename: 'Danh_sach_tai_khoan_phan_quyen.xls',
        title: 'DANH SÁCH TÀI KHOẢN & PHẠM VI',
        subtitle: `Tổng số ${users.length} tài khoản`,
        columns,
        rows,
      });
      setToast({ message: `Đã xuất ${users.length} tài khoản`, type: 'success' });
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
        filename: 'Nhat_ky_phan_quyen.xls',
        title: 'NHẬT KÝ TRUY VẾT PHÂN QUYỀN',
        subtitle: `${history.length} thao tác`,
        columns,
        rows,
      });
      setToast({ message: 'Đã xuất nhật ký phân quyền', type: 'success' });
    }
  };

  const handlePrint = () => {
    printReport({
      title: 'BÁO CÁO PHÂN QUYỀN HỆ THỐNG',
      subtitle: `Ngày in: ${new Date().toLocaleDateString('vi-VN')}`,
      columns: [
        { header: 'STT', width: '40px', align: 'center' },
        { header: 'Mã quyền', width: '160px' },
        { header: 'Tên chức năng', width: '220px' },
        { header: 'Nhóm', width: '140px' },
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
    });
  };

  // KPI Items list
  const kpiItems = [
    {
      title: 'Quyền hệ thống',
      value: permissions.length,
      unit: ' quyền',
      subtext: 'Chức năng phân quyền',
      icon: KeyRound,
      progressPercent: 100,
    },
    {
      title: 'Quyền nhạy cảm',
      value: sensitiveCount,
      unit: ' quyền',
      subtext: 'Giám sát an ninh',
      icon: ShieldAlert,
      progressPercent: permissions.length > 0 ? Math.round((sensitiveCount / permissions.length) * 100) : 0,
    },
    {
      title: 'Tài khoản quyền riêng',
      value: usersWithOverridesCount,
      unit: ' tài khoản',
      subtext: 'Ngoại lệ phân quyền',
      icon: Sparkles,
      progressPercent: users.length > 0 ? Math.round((usersWithOverridesCount / users.length) * 100) : 0,
    },
    {
      title: 'Tài khoản có phạm vi riêng',
      value: usersWithScopesCount,
      unit: ' tài khoản',
      subtext: 'Ràng buộc Khoa/Lớp/Môn',
      icon: Building2,
      progressPercent: users.length > 0 ? Math.round((usersWithScopesCount / users.length) * 100) : 0,
    },
    {
      title: 'Nhật ký truy vết',
      value: history.length,
      unit: ' bản ghi',
      subtext: 'Lịch sử thao tác',
      icon: History,
      progressPercent: 100,
    },
  ];

  return (
    <main className="min-h-screen w-full space-y-6 bg-slate-50/50 px-6 py-6 pb-28 dark:bg-slate-950">
      {/* ── 1. Standard Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
            Phân quyền & truy cập
          </h1>
          <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            Quản lý quyền theo vai trò, quyền riêng cá nhân và phạm vi dữ liệu theo tài khoản
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DataActionsDropdown onExportExcel={handleExportExcel} onPrint={handlePrint} />
        </div>
      </div>

      {/* ── Floating Segmented Control Dock (Nằm ở giữa và ở góc dưới màn hình, nổi lên) ── */}
      <div className="fixed bottom-7 left-0 right-0 md:left-[252px] [html.sidebar-collapsed_&]:md:left-[72px] flex justify-center z-30 pointer-events-none px-4 transition-[left] duration-300">
        <div className="pointer-events-auto shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 rounded-full border border-slate-200/90 dark:border-slate-700/90 p-1 ring-1 ring-slate-900/5 dark:ring-white/10 animate-fade-in-up">
          <SlidingSegmentedControl
            variant="primary"
            pillShape="pill"
            size="md"
            value={tab}
            onChange={(newTab) => setTab(newTab as Tab)}
            className="border-none bg-transparent shadow-none"
            options={[
              { value: 'matrix', label: 'Quyền theo vai trò', icon: ShieldCheck },
              { value: 'users', label: 'Tài khoản & phạm vi truy cập', icon: UsersRound },
              { value: 'history', label: 'Lịch sử thay đổi', icon: History },
            ]}
          />
        </div>
      </div>

      {/* ── 2. Standard KPI Cards Grid ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {kpiItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {item.title}
                  </span>
                  <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                    {loading ? '...' : item.value.toLocaleString('vi-VN')}
                    {item.unit || ''}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Progress track */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={item.subtext}
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {item.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Main Tab Contents ── */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-type-body text-slate-500 font-normal dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Đang nạp cấu hình phân quyền hệ thống...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ══════════ TAB 1: MA TRẬN QUYỀN THEO VAI TRÒ ══════════ */}
          {tab === 'matrix' && (
            <section className="space-y-4">
              {/* Search & Filter Toolbar (Single Unified Row with Embedded SlidersHorizontal Popover) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
                <div className="relative flex-1 max-w-xl min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={matrixSearchInputRef}
                    type="text"
                    placeholder="Tìm theo tên chức năng, mã quyền..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
                  />

                  {/* Embedded actions on right edge of search input */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {matrixSearch ? (
                      <button
                        type="button"
                        onClick={() => setMatrixSearch('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                        title="Xóa tìm kiếm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <kbd
                        className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                        onClick={() => matrixSearchInputRef.current?.focus()}
                        title="Nhấn phím / để tìm nhanh"
                      >
                        /
                      </kbd>
                    )}

                    <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

                    <PermissionFilterPopover
                      moduleFilter={matrixModuleFilter}
                      onModuleFilterChange={setMatrixModuleFilter}
                      onlySensitive={onlySensitive}
                      onOnlySensitiveChange={setOnlySensitive}
                      availableModules={availableModules}
                      permissions={permissions}
                      totalFilteredCount={filteredPermissions.length}
                      totalCount={permissions.length}
                      onResetAll={() => {
                        setMatrixSearch('');
                        setMatrixModuleFilter('ALL');
                        setOnlySensitive(false);
                      }}
                    />
                  </div>
                </div>

                {/* Right side: Active Filters summary badge / result count & Refresh button */}
                <div className="flex items-center gap-2">
                  {matrixModuleFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-type-helper font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <span>Nhóm: {matrixModuleFilter}</span>
                      <button
                        type="button"
                        onClick={() => setMatrixModuleFilter('ALL')}
                        className="hover:text-blue-900 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {onlySensitive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-type-helper font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <LockKeyhole className="h-3 w-3" />
                      <span>Chỉ nhạy cảm</span>
                      <button
                        type="button"
                        onClick={() => setOnlySensitive(false)}
                        className="hover:text-amber-950 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <span className="table-meta text-slate-400 font-normal shrink-0">
                    Hiển thị <strong className="font-semibold text-slate-700 dark:text-slate-300">{filteredPermissions.length}</strong>/{permissions.length} quyền
                  </span>

                  <button
                    type="button"
                    onClick={handleRefreshClick}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading || saving || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="ui-table-wrap overflow-x-auto">
                  <table className="ui-table min-w-[900px] w-full text-left">
                    <thead className="bg-slate-50/80 text-type-helper font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5 w-[42%]">Chức năng</th>
                        <th className="px-4 py-3.5 w-[16%]">Nhóm</th>
                        <th className="px-4 py-3.5 w-[18%]">Mã định danh</th>
                        {(['ADMIN', 'TEACHER', 'STUDENT'] as Role[]).map((role) => {
                          const grantedCount = roleGrantedCounts[role];
                          return (
                            <th key={role} className="px-4 py-3 text-center w-[8%]">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {ROLE_LABEL[role]}
                                </span>
                                <span className="table-meta text-slate-400 font-normal">
                                  {grantedCount}/{permissions.length}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(groupedPermissions).length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center table-meta text-slate-400 font-normal"
                          >
                            Không có quyền nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(groupedPermissions).map(([module, items]) => (
                          <React.Fragment key={module}>
                            {/* Module Header Bar (Thanh nhóm phẳng, thanh lịch, không nút thừa) */}
                            <tr className="border-y border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30">
                              <td colSpan={6} className="px-5 py-2.5 table-meta font-medium text-blue-700 dark:text-blue-400">
                                <div className="flex items-center gap-2">
                                  <span className="h-3 w-1 rounded-full bg-blue-600" />
                                  <span className="font-semibold">{module}</span>
                                  <span className="font-normal text-slate-400">
                                    ({items.length} quyền)
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* Permission Rows */}
                            {items.map((permission) => (
                              <tr
                                key={permission.code}
                                className="border-b border-slate-100 last:border-0 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-type-body font-semibold text-slate-900 dark:text-white">
                                      {permission.name}
                                    </span>
                                    {permission.sensitive && (
                                      <span className="table-badge ui-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-type-helper font-medium text-amber-700 dark:text-amber-300">
                                        <LockKeyhole className="h-3 w-3" />
                                        Nhạy cảm
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 table-meta text-slate-700 dark:text-slate-300 font-normal">
                                  {permission.module}
                                </td>
                                <td className="px-4 py-3 table-meta text-slate-400 font-normal">
                                  {permission.code}
                                </td>
                                {(['ADMIN', 'TEACHER', 'STUDENT'] as Role[]).map((role) => {
                                  const enabled = permission.roles.includes(role);
                                  const isLockedAdmin =
                                    role === 'ADMIN' &&
                                    ['ACCESS_CONTROL_VIEW', 'ACCESS_CONTROL_MANAGE'].includes(
                                      permission.code
                                    );

                                  return (
                                    <td key={role} className="px-4 py-3 text-center">
                                      <button
                                        type="button"
                                        disabled={saving || isLockedAdmin}
                                        onClick={() =>
                                          requestRolePermission(role, permission)
                                        }
                                        aria-pressed={enabled}
                                        title={
                                          isLockedAdmin
                                            ? 'Quyền quản trị cốt lõi không thể thu hồi'
                                            : `${enabled ? 'Thu hồi' : 'Cấp'} quyền ${permission.name}`
                                        }
                                        className={`relative inline-flex h-6.5 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${enabled
                                          ? 'bg-blue-600'
                                          : 'bg-slate-200 dark:bg-slate-700'
                                          }`}
                                      >
                                        <span
                                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                                            }`}
                                        />
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ══════════ TAB 2: TÀI KHOẢN & PHẠM VI TRUY CẬP ══════════ */}
          {tab === 'users' && (
            <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] xl:divide-x divide-slate-200/90 dark:divide-slate-800">
                {/* Left Column: User Master List */}
                <div className="flex flex-col bg-slate-50/40 dark:bg-slate-900/40 h-full">
                  <div className="border-b border-slate-200/80 p-4 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h2 className="text-type-card font-semibold text-slate-900 dark:text-white">
                        Danh sách tài khoản
                      </h2>
                      <span className="table-meta text-slate-400 font-normal">
                        {filteredUsers.length} / {users.length}
                      </span>
                    </div>

                    {/* Search box & Refresh */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Tìm tài khoản, họ tên, email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                        />
                        {userSearch && (
                          <button
                            type="button"
                            onClick={() => setUserSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshClick}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
                        title="Làm mới dữ liệu"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading || saving || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
                      </button>
                    </div>

                    {/* Role filter Capsule Chips - Không dùng icon, có badge đếm số lượng, tự động cuộn vào giữa khi chọn */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                      {[
                        { key: 'ALL', label: 'Tất cả', count: users.length },
                        { key: 'TEACHER', label: 'Giảng viên', count: users.filter((u) => u.role === 'TEACHER').length },
                        { key: 'ADMIN', label: 'Quản trị', count: users.filter((u) => u.role === 'ADMIN').length },
                        { key: 'STUDENT', label: 'Sinh viên', count: users.filter((u) => u.role === 'STUDENT').length },
                      ].map((item) => {
                        const isActive = userRoleFilter === item.key;
                        return (
                          <button
                            key={item.key}
                            ref={(el) => {
                              roleChipRefs.current[item.key] = el;
                            }}
                            type="button"
                            onClick={() => handleSelectRoleFilter(item.key)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-type-helper font-semibold transition-all duration-200 shrink-0 cursor-pointer ${isActive
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.02]'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                              }`}
                            title={`${item.label} (${item.count})`}
                          >
                            <span>{item.label}</span>
                            <span
                              className={`ui-pill px-1.5 py-0.2 rounded-full text-type-helper font-medium ${isActive
                                  ? 'ui-pill-solid bg-white/20 text-white'
                                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* User List Items */}
                  <div className="overflow-y-auto p-2 space-y-1 flex-1 max-h-[640px] custom-scrollbar">
                    {filteredUsers.length === 0 ? (
                      <p className="py-8 text-center table-meta text-slate-400 font-normal">
                        Không tìm thấy tài khoản phù hợp.
                      </p>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelected = selectedUserId === user.id;
                        const hasOverrides = user.permissionOverrides.length > 0;
                        const hasScopes = user.accessScopes.length > 0;

                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className={`w-full rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${isSelected
                              ? 'bg-blue-50/90 text-blue-900 border-l-4 border-blue-600 dark:bg-blue-950/60 dark:text-blue-200 shadow-2xs'
                              : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border-l-4 border-transparent'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-type-body font-semibold">
                                {displayName(user)}
                              </span>
                              <span className="table-meta text-slate-400 font-normal shrink-0">
                                {ROLE_LABEL[user.role]}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between table-meta text-slate-500 font-normal">
                              <span className="truncate">{user.username}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {hasOverrides && (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                    title="Có quyền riêng"
                                  />
                                )}
                                {hasScopes && (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-blue-500"
                                    title="Có phạm vi truy cập riêng"
                                  />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: User Control Studio */}
                <div className="flex flex-col bg-white dark:bg-slate-900 min-h-[640px]">
                  {selectedUser ? (
                    <>
                      {/* User Profile Header Bar */}
                      <div className="border-b border-slate-200/80 dark:border-slate-800 p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* User Identity Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 shrink-0 rounded-2xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-type-body border border-blue-200/60 dark:border-blue-800/60">
                              {displayName(selectedUser).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h2 className="text-type-card font-semibold text-slate-900 dark:text-white truncate">
                                  {displayName(selectedUser)}
                                </h2>
                                <span className="ui-pill rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-type-helper font-medium shrink-0">
                                  {ROLE_LABEL[selectedUser.role]}
                                </span>
                              </div>
                              <p className="table-meta text-slate-400 font-normal truncate">
                                {selectedUser.username} · {selectedUser.email} · {accountContext(selectedUser)}
                              </p>
                            </div>
                          </div>

                          {/* Top Right Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={resetUserAccess}
                              disabled={saving}
                              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                            >
                              Khôi phục mặc định
                            </Button>
                            {userStudioTab === 'scopes' && selectedUser.role === 'TEACHER' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={saveScopes}
                                disabled={saving || scopeReason.trim().length < 5}
                              >
                                Lưu phạm vi
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Sub-Tab Navigation Bar with SlidingSegmentedControl */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                          <SlidingSegmentedControl<'scopes' | 'overrides' | 'effective'>
                            value={userStudioTab}
                            onChange={(val) => setUserStudioTab(val)}
                            variant="default"
                            size="md"
                            className="shadow-xs"
                            options={[
                              {
                                value: 'scopes',
                                label: 'Phạm vi dữ liệu',
                                icon: Building2,
                                count: draftScopes.length,
                              },
                              {
                                value: 'overrides',
                                label: 'Quyền riêng cá nhân',
                                icon: Sparkles,
                                count: selectedUser.permissionOverrides.length,
                              },
                              {
                                value: 'effective',
                                label: 'Quyền hiệu lực',
                                icon: ShieldCheck,
                                count: effective?.permissions?.filter((item: any) => item.allowed).length || 0,
                              },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Sub-Tab Body Container */}
                      <div className="p-4 flex-1">
                        {/* Sub-Tab Content 1: Manual data scope for teachers */}
                        {userStudioTab === 'scopes' && (
                          selectedUser.role === 'TEACHER' ? (
                            <div className="space-y-4">
                              <label className="block">
                                <span className="mb-1.5 block text-type-helper font-medium text-slate-700 dark:text-slate-300">
                                  Lý do thay đổi phạm vi
                                </span>
                                <input
                                  type="text"
                                  value={scopeReason}
                                  onChange={(event) => setScopeReason(event.target.value)}
                                  maxLength={500}
                                  placeholder="Ví dụ: Phân công phụ trách khoa và học phần trong học kỳ II"
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                />
                              </label>
                              <ScopeManagerStudio
                                departments={scopeOptions.departments || []}
                                classes={scopeOptions.classes || []}
                                subjects={scopeOptions.subjects || []}
                                draftScopes={draftScopes}
                                onScopesChange={setDraftScopes}
                                onSave={saveScopes}
                                saving={saving}
                              />
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/70 dark:bg-blue-950/30">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                  {selectedUser.role === 'STUDENT' ? <GraduationCap className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-type-card font-semibold text-blue-950 dark:text-blue-100">
                                    {selectedUser.role === 'STUDENT' ? 'Phạm vi sinh viên được xác định tự động' : 'Quản trị viên có toàn quyền'}
                                  </h3>
                                  <p className="mt-1 text-type-body text-blue-900/80 dark:text-blue-200/80">
                                    {selectedUser.role === 'STUDENT'
                                      ? `Tài khoản này sử dụng dữ liệu theo hồ sơ ${accountContext(selectedUser)}. Danh sách Khoa/Lớp/Môn dùng chung không phải là các khoa sinh viên đang thuộc.`
                                      : 'Không cần gán thủ công Khoa, Lớp hoặc Môn học cho tài khoản quản trị viên.'}
                                  </p>
                                  {selectedUser.role === 'STUDENT' && selectedUser.accessScopes.length > 0 && (
                                    <p className="mt-3 text-type-helper font-semibold text-amber-700 dark:text-amber-300">
                                      Tài khoản đang có {selectedUser.accessScopes.length} phạm vi riêng cũ; hãy dùng “Khôi phục mặc định” để xóa cấu hình thừa nếu cần.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}

                        {/* Sub-Tab Content 2: Permission Overrides */}
                        {userStudioTab === 'overrides' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-type-card font-semibold text-slate-900 dark:text-white">
                                  Cấu hình quyền riêng
                                </h3>
                                <p className="text-type-helper text-slate-400 font-normal mt-0.5">
                                  Cấp thêm hoặc chặn từng quyền; cấu hình này ghi đè quyền mặc định theo vai trò
                                </p>
                              </div>
                              <span className="ui-pill rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-type-helper font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {selectedUser.permissionOverrides.length} ngoại lệ
                              </span>
                            </div>

                            <div className="space-y-2">
                              <input
                                type="text"
                                value={overrideReason}
                                onChange={(event) => setOverrideReason(event.target.value)}
                                maxLength={500}
                                placeholder="Lý do cấp hoặc chặn quyền riêng (bắt buộc)"
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                              <div className="flex items-center gap-2">
                              <select
                                value={overrideCode}
                                onChange={(e) => setOverrideCode(e.target.value)}
                                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 shadow-2xs"
                              >
                                <option value="">-- Chọn quyền cần gán ngoại lệ --</option>
                                {permissions.map((p) => (
                                  <option key={p.code} value={p.code}>
                                    [{p.module}] {p.name} ({p.code})
                                  </option>
                                ))}
                              </select>

                              <Button
                                variant="primary"
                                size="md"
                                disabled={!overrideCode || saving || overrideReason.trim().length < 5}
                                onClick={() => handleQuickAddOverride('ALLOW')}
                                leftIcon={<Plus className="h-4 w-4" />}
                              >
                                Cấp quyền
                              </Button>

                              <Button
                                variant="danger"
                                size="md"
                                disabled={!overrideCode || saving || overrideReason.trim().length < 5}
                                onClick={() => handleQuickAddOverride('DENY')}
                                leftIcon={<X className="h-4 w-4" />}
                              >
                                Chặn quyền
                              </Button>
                              </div>
                            </div>

                            {/* Overrides Chips List */}
                            <div className="space-y-2 pt-2">
                              <h4 className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">
                                Danh sách quyền đang được ghi đè:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedUser.permissionOverrides.length ? (
                                  selectedUser.permissionOverrides.map((override) => (
                                    <div
                                      key={override.id}
                                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-type-helper font-medium shadow-2xs transition-all duration-200 ${override.effect === 'ALLOW'
                                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800/80 dark:text-emerald-200'
                                        : 'bg-rose-50/70 border-rose-200/80 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800/80 dark:text-rose-200'
                                        }`}
                                    >
                                      <span className="font-semibold">{override.permission.name}</span>
                                      <span
                                        className={`ui-pill px-2 py-0.5 rounded-full text-type-helper font-medium ${override.effect === 'ALLOW'
                                          ? 'ui-pill-solid bg-emerald-600 text-white'
                                          : 'ui-pill-solid bg-rose-600 text-white'
                                          }`}
                                      >
                                        {override.effect === 'ALLOW' ? 'Cấp quyền' : 'Chặn quyền'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeOverride(override.permission.code)}
                                        className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ml-0.5 shrink-0"
                                        title="Gỡ ngoại lệ quyền này"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-full rounded-xl border border-slate-100 dark:border-slate-800 p-4 text-center text-type-body-sm text-slate-400 font-normal">
                                    Tài khoản này đang sử dụng quyền theo vai trò mặc định, chưa có ngoại lệ nào.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-Tab Content 3: Effective Permissions Matrix */}
                        {userStudioTab === 'effective' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-type-card font-semibold text-slate-900 dark:text-white">
                                  Quyền hiệu lực tổng hợp
                                </h3>
                                <p className="text-type-helper text-slate-400 font-normal mt-0.5">
                                  Tổng hợp quyền cuối cùng của tài khoản sau khi kết hợp vai trò và các ngoại lệ
                                </p>
                              </div>
                              <span className="ui-pill rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-type-helper font-medium text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                                {effective?.permissions?.filter((item: any) => item.allowed).length || 0} quyền hiệu lực
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1 custom-scrollbar">
                              {effective?.permissions
                                ?.filter((item: any) => item.allowed)
                                .map((p: any) => (
                                  <div
                                    key={p.code}
                                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-type-body-sm font-medium text-slate-800 dark:text-slate-200 truncate flex items-center justify-between gap-2 shadow-2xs"
                                    title={p.name}
                                  >
                                    <span className="truncate font-semibold">{p.name}</span>
                                    <span
                                      className={`ui-pill rounded-full text-type-helper font-medium px-2 py-0.5 shrink-0 ${p.source === 'ROLE'
                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        }`}
                                    >
                                      {p.source === 'ROLE' ? 'Vai trò' : 'Quyền riêng'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-16 text-center table-meta text-slate-400 font-normal flex flex-col items-center justify-center h-full min-h-[400px]">
                      <UsersRound className="h-10 w-10 text-slate-300 mb-2" />
                      Chọn một tài khoản từ danh sách bên trái để cấu hình phạm vi truy cập và quyền riêng.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ══════════ TAB 3: NHẬT KÝ THAY ĐỔI ══════════ */}
          {tab === 'history' && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Unified Search Bar with embedded AccessHistoryFilterPopover */}
                <div className="relative flex-1 max-w-xl min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện, người thực hiện..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
                  />

                  {/* Embedded actions on right edge of search input */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {historySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySearch('');
                          setHistoryPage(1);
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                        title="Xóa tìm kiếm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

                    <AccessHistoryFilterPopover
                      filters={historyFilters}
                      onFilterChange={(newFilters) => {
                        setHistoryFilters(newFilters);
                        setHistoryPage(1);
                      }}
                      historyItems={history}
                      totalFilteredCount={filteredHistory.length}
                      totalCount={history.length}
                      onResetAll={() => {
                        setHistoryFilters({ actionCategory: 'ALL', actor: 'ALL', timeframe: 'ALL' });
                        setHistorySearch('');
                        setHistoryPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="table-meta text-slate-400 font-normal">
                    Tổng số {filteredHistory.length} bản ghi truy vết
                  </span>

                  <button
                    type="button"
                    onClick={handleRefreshClick}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading || saving || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Active Filter Chips Banner */}
              {(historyFilters.actionCategory !== 'ALL' || historyFilters.actor !== 'ALL' || historyFilters.timeframe !== 'ALL') && (
                <div className="flex items-center gap-2 flex-wrap text-type-helper">
                  <span className="text-slate-500 font-medium">Bộ lọc đang áp dụng:</span>
                  {historyFilters.actionCategory !== 'ALL' && (
                    <span className="ui-pill rounded-full text-type-helper font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 flex items-center gap-1">
                      <span>
                        Thao tác:{' '}
                        {historyFilters.actionCategory === 'OVERRIDE'
                          ? 'Quyền riêng'
                          : historyFilters.actionCategory === 'SCOPE'
                            ? 'Phạm vi'
                            : 'Khôi phục'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryFilters((prev) => ({ ...prev, actionCategory: 'ALL' }));
                          setHistoryPage(1);
                        }}
                        className="hover:text-rose-500 cursor-pointer ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {historyFilters.actor !== 'ALL' && (
                    <span className="ui-pill rounded-full text-type-helper font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 flex items-center gap-1">
                      <span>Người thực hiện: {historyFilters.actor}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryFilters((prev) => ({ ...prev, actor: 'ALL' }));
                          setHistoryPage(1);
                        }}
                        className="hover:text-rose-500 cursor-pointer ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {historyFilters.timeframe !== 'ALL' && (
                    <span className="ui-pill rounded-full text-type-helper font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 flex items-center gap-1">
                      <span>
                        Thời gian:{' '}
                        {historyFilters.timeframe === 'TODAY'
                          ? 'Hôm nay'
                          : historyFilters.timeframe === 'WEEK'
                            ? '7 ngày qua'
                            : '30 ngày qua'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryFilters((prev) => ({ ...prev, timeframe: 'ALL' }));
                          setHistoryPage(1);
                        }}
                        className="hover:text-rose-500 cursor-pointer ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryFilters({ actionCategory: 'ALL', actor: 'ALL', timeframe: 'ALL' });
                      setHistoryPage(1);
                    }}
                    className="text-type-helper text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium underline cursor-pointer ml-1"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedHistory.length ? (
                    paginatedHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            <KeyRound className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-type-body font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {item.description}
                            </p>
                            <span className="table-meta text-slate-400 font-normal">
                              Người thực hiện:{' '}
                              <strong className="font-semibold text-slate-700 dark:text-slate-300">
                                {item.actor?.username || 'Hệ thống'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <span className="table-meta text-slate-400 font-normal shrink-0 tabular-nums">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-12 text-center table-meta text-slate-400 font-normal">
                      Không tìm thấy thay đổi phân quyền nào phù hợp với bộ lọc.
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination Bar (Outside Card, directly on page canvas matching activity-logs) */}
              {filteredHistory.length > 0 && (
                <PaginationBar
                  page={historyPage}
                  totalPages={historyTotalPages}
                  limit={historyPageSize}
                  totalItems={filteredHistory.length}
                  unit="Nhật ký"
                  onPage={setHistoryPage}
                  onLimit={(l) => {
                    setHistoryPageSize(l);
                    setHistoryPage(1);
                  }}
                />
              )}
            </section>
          )}
        </>
      )}

      {/* Live Simulator Modal */}
      <PermissionSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        users={users}
        permissions={permissions}
        scopeOptions={scopeOptions}
      />

      {/* Confirmation & Toast */}
      <ConfirmModal
        isOpen={Boolean(confirm)}
        isLoading={saving}
        onClose={() => !saving && setConfirm(null)}
        onConfirm={(reason) => confirm?.onConfirm(reason)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        type={confirm?.type || 'warning'}
        requireReason={confirm?.requireReason}
        reasonPlaceholder={confirm?.reasonPlaceholder}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}
