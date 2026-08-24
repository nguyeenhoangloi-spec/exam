'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  ShieldCheck,
  ShieldAlert,
  User,
  KeyRound,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api';

interface PermissionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Array<{
    id: number;
    username: string;
    role: string;
    teacher?: { fullName: string } | null;
    student?: { fullName: string } | null;
    permissionOverrides: Array<{
      permission: { code: string; name: string };
      effect: 'ALLOW' | 'DENY';
      reason?: string | null;
    }>;
    accessScopes: Array<{
      type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT';
      resourceId: number;
    }>;
  }>;
  permissions: Array<{
    code: string;
    name: string;
    module: string;
    description?: string;
    sensitive: boolean;
    roles: string[];
  }>;
  scopeOptions: {
    departments: Array<{ id: number; name: string; code?: string }>;
    classes: Array<{ id: number; name: string; code?: string }>;
    subjects: Array<{ id: number; name: string; code?: string; subjectCode?: string }>;
  };
}

export function PermissionSimulatorModal({
  isOpen,
  onClose,
  users,
  permissions,
  scopeOptions,
}: PermissionSimulatorModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermissionCode, setSelectedPermissionCode] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  const [simulating, setSimulating] = useState(false);
  const [authoritativeResult, setAuthoritativeResult] = useState<any>(null);
  const [simulationError, setSimulationError] = useState('');

  const currentUser = useMemo(() => {
    return users.find((u) => String(u.id) === selectedUserId) || null;
  }, [users, selectedUserId]);

  const currentPermission = useMemo(() => {
    return permissions.find((p) => p.code === selectedPermissionCode) || null;
  }, [permissions, selectedPermissionCode]);

  React.useEffect(() => {
    setHasSimulated(false);
    setAuthoritativeResult(null);
    setSimulationError('');
  }, [selectedUserId, selectedPermissionCode, selectedDepartmentId, selectedClassId, selectedSubjectId]);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    if (!selectedUserId || !selectedPermissionCode) return;
    setSimulating(true);
    setSimulationError('');
    try {
      const response = await api.post('/access-control/simulate', {
        userId: Number(selectedUserId),
        permissionCode: selectedPermissionCode,
        context: {
          ...(selectedDepartmentId ? { departmentId: Number(selectedDepartmentId) } : {}),
          ...(selectedClassId ? { classId: Number(selectedClassId) } : {}),
          ...(selectedSubjectId ? { subjectId: Number(selectedSubjectId) } : {}),
        },
      });
      const decision = response.data;
      setAuthoritativeResult({
        isAllowed: decision.allowed,
        finalVerdictReason: decision.reason,
        steps: [
          {
            title: 'Nguồn quyền chức năng',
            status: decision.permissionSource === 'USER_DENY' || decision.permissionSource === 'NONE' ? 'FAIL' : 'PASS',
            detail:
              decision.permissionSource === 'ROLE'
                ? 'Quyền được cấp bởi vai trò hiện tại.'
                : decision.permissionSource === 'USER_ALLOW'
                  ? 'Quyền được cấp bằng ngoại lệ riêng của tài khoản.'
                  : decision.permissionSource === 'USER_DENY'
                    ? 'Quyền bị chặn bằng ngoại lệ riêng của tài khoản.'
                    : 'Không tìm thấy nguồn cấp quyền hợp lệ.',
          },
          {
            title: 'Kết quả kiểm tra phạm vi dữ liệu',
            status: decision.scopeSource === 'CUSTOM_MISMATCH' ? 'FAIL' : 'PASS',
            detail: decision.reason,
          },
        ],
      });
      setHasSimulated(true);
    } catch (error: any) {
      setSimulationError(error?.response?.data?.message || error?.message || 'Không chạy được mô phỏng quyền.');
      setHasSimulated(false);
    } finally {
      setSimulating(false);
    }
  };

  const simulationResult = authoritativeResult;

  const getDisplayName = (u: any) => u.teacher?.fullName || u.student?.fullName || u.username;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulator-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div
        className="relative z-[101] w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h3 id="simulator-modal-title" className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                Mô phỏng quyền truy cập
              </h3>
              <p className="text-type-helper text-slate-500 font-normal">
                Kiểm tra quyết định thực tế từ máy chủ theo vai trò, quyền riêng và phạm vi dữ liệu
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

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Controls Grid */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
            <h4 className="text-type-body font-medium text-slate-900 dark:text-slate-100">
              1. Thiết lập ngữ cảnh kiểm tra
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select User */}
              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Tài khoản người dùng
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setHasSimulated(false);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getDisplayName(u)} ({u.username} · {u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Permission */}
              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Quyền / Chức năng cần thử
                </label>
                <select
                  value={selectedPermissionCode}
                  onChange={(e) => {
                    setSelectedPermissionCode(e.target.value);
                    setHasSimulated(false);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Chọn chức năng --</option>
                  {permissions.map((p) => (
                    <option key={p.code} value={p.code}>
                      [{p.module}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Scope: Department */}
              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Khoa / Viện (Tùy chọn)
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setHasSimulated(false);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Bất kỳ khoa nào --</option>
                  {scopeOptions.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `[${d.code}] ` : ''}{d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Scope: Subject */}
              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Lớp sinh viên (Tùy chọn)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Bất kỳ lớp nào --</option>
                  {scopeOptions.classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `[${item.code}] ` : ''}{item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Scope: Subject */}
              <div className="space-y-1">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Môn học (Tùy chọn)
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setHasSimulated(false);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Bất kỳ môn nào --</option>
                  {scopeOptions.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code || s.subjectCode ? `[${s.code || s.subjectCode}] ` : ''}{s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleRunSimulation}
                disabled={!selectedUserId || !selectedPermissionCode || simulating}
                isLoading={simulating}
                leftIcon={<Play className="h-4 w-4 fill-current" />}
              >
                Chạy mô phỏng kiểm tra
              </Button>
            </div>
            {simulationError && (
              <p className="text-type-helper font-medium text-rose-600 dark:text-rose-400">
                {simulationError}
              </p>
            )}
          </div>

          {/* Result Area */}
          {hasSimulated && simulationResult && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              {/* Verdict Banner */}
              <div
                className={`rounded-2xl p-4.5 border flex items-start gap-3.5 shadow-2xs ${
                  simulationResult.isAllowed
                    ? 'border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100'
                    : 'border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100'
                }`}
              >
                {simulationResult.isAllowed ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <h4 className="text-type-section font-semibold">
                    {simulationResult.isAllowed
                      ? '✅ KẾT QUẢ: ĐƯỢC PHÉP THAO TÁC (ACCESS GRANTED)'
                      : '❌ KẾT QUẢ: BỊ TỪ CHỐI TRUY CẬP (ACCESS DENIED)'}
                  </h4>
                  <p className="text-type-body font-normal opacity-90">
                    {simulationResult.finalVerdictReason}
                  </p>
                </div>
              </div>

              {/* Step-by-step Evaluation Trace */}
              <div className="space-y-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <h5 className="text-type-body font-medium text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800">
                  Chi tiết chuỗi đánh giá quyền hạn (Evaluation Trace)
                </h5>

                <div className="space-y-3 pt-2">
                  {simulationResult.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-type-body">
                      {step.status === 'PASS' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : step.status === 'FAIL' ? (
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      )}

                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {step.title}
                        </p>
                        <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Đóng trình mô phỏng
          </Button>
        </div>
      </div>
    </div>
  );
}
