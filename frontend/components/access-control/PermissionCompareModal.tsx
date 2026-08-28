'use client';

import React, { useState, useMemo } from 'react';
import { X, ArrowLeftRight, Check, Minus, Search, ShieldAlert, Users, Building2, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface PermissionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Array<{
    id: number;
    username: string;
    email: string;
    role: string;
    teacher?: { fullName: string } | null;
    student?: { fullName: string } | null;
    permissionOverrides: Array<{
      effect: 'ALLOW' | 'DENY';
      permission: { code: string; name: string };
    }>;
    accessScopes: Array<{ type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number }>;
  }>;
  permissions: Array<{
    code: string;
    name: string;
    module: string;
    sensitive: boolean;
    roles: string[];
  }>;
  scopeOptions: {
    departments: Array<{ id: number; name: string; code?: string }>;
    classes: Array<{ id: number; name: string; code?: string }>;
    subjects: Array<{ id: number; name: string; code?: string; subjectCode?: string }>;
  };
}

export function PermissionCompareModal({
  isOpen,
  onClose,
  users,
  permissions,
  scopeOptions,
}: PermissionCompareModalProps) {
  const [userAId, setUserAId] = useState<string>('');
  const [userBId, setUserBId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'DIFF_ONLY'>('ALL');

  const userA = useMemo(() => users.find((u) => String(u.id) === userAId) || null, [users, userAId]);
  const userB = useMemo(() => users.find((u) => String(u.id) === userBId) || null, [users, userBId]);

  const getDisplayName = (u: any) => u.teacher?.fullName || u.student?.fullName || u.username;

  // Compute effective permission list for a user
  const evaluateUserPermissions = React.useCallback(
    (user: any) => {
      if (!user) return new Set<string>();
      const allowed = new Set<string>();

      // From role
      for (const p of permissions) {
        if (p.roles.includes(user.role)) {
          allowed.add(p.code);
        }
      }

      // From personal overrides
      for (const override of user.permissionOverrides || []) {
        if (override.effect === 'ALLOW') {
          allowed.add(override.permission.code);
        } else if (override.effect === 'DENY') {
          allowed.delete(override.permission.code);
        }
      }

      return allowed;
    },
    [permissions]
  );

  const permsA = useMemo(() => evaluateUserPermissions(userA), [userA, evaluateUserPermissions]);
  const permsB = useMemo(() => evaluateUserPermissions(userB), [userB, evaluateUserPermissions]);

  const comparedList = useMemo(() => {
    return permissions.map((p) => {
      const hasA = permsA.has(p.code);
      const hasB = permsB.has(p.code);
      const isDiff = hasA !== hasB;

      return {
        ...p,
        hasA,
        hasB,
        isDiff,
      };
    }).filter((p) => {
      if (filterMode === 'DIFF_ONLY' && !p.isDiff) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.module.toLowerCase().includes(q);
      }
      return true;
    });
  }, [permissions, permsA, permsB, filterMode, search]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div
        className="relative z-[101] w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] animate-in zoom-in-95 duration-200 sm:max-h-[calc(100dvh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <h3 id="compare-modal-title" className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                So Sánh Quyền Hạn Trực Quan Giữa 2 Tài Khoản
              </h3>
              <p className="text-type-helper text-slate-500 font-normal">
                Đối chiếu side-by-side ma trận quyền hiệu lực và phạm vi ABAC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* User Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
            <div className="space-y-1.5">
              <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                👤 Tài khoản thứ nhất (A)
              </label>
              <select
                value={userAId}
                onChange={(e) => setUserAId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">-- Chọn tài khoản A --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getDisplayName(u)} ({u.username} – {u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                👤 Tài khoản thứ hai (B)
              </label>
              <select
                value={userBId}
                onChange={(e) => setUserBId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">-- Chọn tài khoản B --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getDisplayName(u)} ({u.username} – {u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {userA && userB ? (
            <div className="space-y-4">
              {/* Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm trong danh sách so sánh..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-type-helper font-medium transition cursor-pointer ${
                      filterMode === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({permissions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('DIFF_ONLY')}
                    className={`px-3 py-1.5 rounded-xl text-type-helper font-medium transition cursor-pointer ${
                      filterMode === 'DIFF_ONLY'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Chỉ xem điểm khác biệt ⚠️ ({permissions.filter((p) => permsA.has(p.code) !== permsB.has(p.code)).length})
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="ui-table-wrap overflow-x-auto max-h-[400px]">
                  <table className="ui-table min-w-[700px] w-full text-left">
                    <thead className="bg-slate-50 text-type-helper font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 bg-slate-50 dark:bg-slate-800">Chức năng & Nhóm</th>
                        <th className="px-4 py-3 text-center w-40 bg-slate-50 dark:bg-slate-800">
                          {getDisplayName(userA)} (A)
                        </th>
                        <th className="px-4 py-3 text-center w-40 bg-slate-50 dark:bg-slate-800">
                          {getDisplayName(userB)} (B)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {comparedList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-normal">
                            Không có dữ liệu so sánh phù hợp.
                          </td>
                        </tr>
                      ) : (
                        comparedList.map((item) => (
                          <tr
                            key={item.code}
                            className={`transition-colors ${
                              item.isDiff
                                ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-type-body font-medium text-slate-900 dark:text-white">
                                  {item.name}
                                </span>
                                {item.isDiff && (
                                  <span className="table-badge ui-pill px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 text-type-helper font-medium">
                                    Khác biệt
                                  </span>
                                )}
                              </div>
                              <p className="table-meta text-slate-500 font-normal">
                                [{item.module}] {item.code}
                              </p>
                            </td>

                            <td className="px-4 py-3 text-center">
                              {item.hasA ? (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                  <Minus className="h-4 w-4" />
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              {item.hasB ? (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                  <Minus className="h-4 w-4" />
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-type-body text-slate-400 font-normal">
              Vui lòng chọn cả 2 tài khoản phía trên để bắt đầu so sánh quyền hạn.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Đóng bảng so sánh
          </Button>
        </div>
      </div>
    </div>
  );
}
