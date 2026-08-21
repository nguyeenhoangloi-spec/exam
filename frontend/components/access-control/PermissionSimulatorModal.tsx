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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const currentUser = useMemo(() => {
    return users.find((u) => String(u.id) === selectedUserId) || null;
  }, [users, selectedUserId]);

  const currentPermission = useMemo(() => {
    return permissions.find((p) => p.code === selectedPermissionCode) || null;
  }, [permissions, selectedPermissionCode]);

  // Simulation Evaluation Engine
  const simulationResult = useMemo(() => {
    if (!currentUser || !currentPermission) return null;

    const steps = [];
    let isAllowed = false;
    let finalVerdictReason = '';

    // Step 1: Check User Personal Overrides
    const override = currentUser.permissionOverrides.find(
      (o) => o.permission.code === currentPermission.code
    );

    if (override) {
      if (override.effect === 'DENY') {
        steps.push({
          title: 'Bước 1: Quyền riêng của tài khoản (User Override)',
          status: 'FAIL',
          detail: `Tài khoản bị cài đặt TỪ CHỐI RIÊNG quyền này${override.reason ? ` (Lý do: ${override.reason})` : ''}. Quyền riêng từ chối có mức ưu tiên cao nhất.`,
        });
        isAllowed = false;
        finalVerdictReason = 'Bị từ chối bởi cấu hình quyền riêng của tài khoản.';
        return { isAllowed, steps, finalVerdictReason };
      } else {
        steps.push({
          title: 'Bước 1: Quyền riêng của tài khoản (User Override)',
          status: 'PASS',
          detail: `Tài khoản được CẤP RIÊNG quyền này${override.reason ? ` (Lý do: ${override.reason})` : ''}, vượt qua quyền theo vai trò.`,
        });
        isAllowed = true;
      }
    } else {
      steps.push({
        title: 'Bước 1: Quyền riêng của tài khoản (User Override)',
        status: 'INFO',
        detail: 'Tài khoản không có thiết lập quyền riêng cho chức năng này. Chuyển sang kiểm tra quyền theo vai trò.',
      });

      // Step 2: Check Role Matrix
      const roleAllowed = currentPermission.roles.includes(currentUser.role);
      if (roleAllowed) {
        steps.push({
          title: 'Bước 2: Ma trận quyền theo vai trò (Role-Based Access)',
          status: 'PASS',
          detail: `Vai trò [${currentUser.role}] ĐƯỢC PHÉP thực hiện chức năng [${currentPermission.name}].`,
        });
        isAllowed = true;
      } else {
        steps.push({
          title: 'Bước 2: Ma trận quyền theo vai trò (Role-Based Access)',
          status: 'FAIL',
          detail: `Vai trò [${currentUser.role}] KHÔNG CÓ quyền thực hiện chức năng [${currentPermission.name}] trong ma trận hệ thống.`,
        });
        isAllowed = false;
        finalVerdictReason = `Vai trò ${currentUser.role} không có quyền thực hiện chức năng này.`;
        return { isAllowed, steps, finalVerdictReason };
      }
    }

    // Step 3: Check ABAC Scope Constraints (if user is restricted by scopes)
    if (isAllowed) {
      const userScopes = currentUser.accessScopes || [];
      const deptScopes = userScopes.filter((s) => s.type === 'DEPARTMENT');
      const subjectScopes = userScopes.filter((s) => s.type === 'SUBJECT');

      let scopePass = true;
      let scopeDetail = 'Tài khoản có toàn quyền truy cập dữ liệu không bị giới hạn phạm vi.';

      if (deptScopes.length > 0 && selectedDepartmentId) {
        const allowedDept = deptScopes.some((s) => String(s.resourceId) === selectedDepartmentId);
        if (!allowedDept) {
          scopePass = false;
          scopeDetail = `Khoa đang chọn không nằm trong danh sách ${deptScopes.length} khoa được phân công cho tài khoản này.`;
        }
      }

      if (subjectScopes.length > 0 && selectedSubjectId) {
        const allowedSubject = subjectScopes.some((s) => String(s.resourceId) === selectedSubjectId);
        if (!allowedSubject) {
          scopePass = false;
          scopeDetail = `Môn học đang chọn không nằm trong danh sách ${subjectScopes.length} môn học được phân công cho tài khoản này.`;
        }
      }

      if (userScopes.length > 0) {
        if (scopePass) {
          steps.push({
            title: 'Bước 3: Phạm vi dữ liệu ABAC (Attribute-Based Scope)',
            status: 'PASS',
            detail: 'Ngữ cảnh thao tác hoàn toàn khớp với phạm vi dữ liệu được gán cho tài khoản.',
          });
          finalVerdictReason = 'Tài khoản có đầy đủ quyền hạn và nằm trong đúng phạm vi phân công.';
        } else {
          steps.push({
            title: 'Bước 3: Phạm vi dữ liệu ABAC (Attribute-Based Scope)',
            status: 'FAIL',
            detail: scopeDetail,
          });
          isAllowed = false;
          finalVerdictReason = 'Có quyền chức năng nhưng bị chặn bởi giới hạn phạm vi dữ liệu (Khoa/Môn).';
        }
      } else {
        steps.push({
          title: 'Bước 3: Phạm vi dữ liệu ABAC (Attribute-Based Scope)',
          status: 'PASS',
          detail: 'Tài khoản không bị ràng buộc phạm vi dữ liệu riêng; có quyền trên toàn hệ thống.',
        });
        finalVerdictReason = 'Cho phép truy cập toàn diện theo vai trò.';
      }
    }

    return { isAllowed, steps, finalVerdictReason };
  }, [currentUser, currentPermission, selectedDepartmentId, selectedSubjectId]);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    if (!selectedUserId || !selectedPermissionCode) return;
    setHasSimulated(true);
  };

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
                Mô Phỏng & Kiểm Tra Phân Quyền Trực Tiếp
              </h3>
              <p className="text-type-helper text-slate-500 font-normal">
                Giải lập phán quyết quyền hạn dựa trên RBAC, Quyền riêng và Ràng buộc ABAC
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
                disabled={!selectedUserId || !selectedPermissionCode}
                leftIcon={<Play className="h-4 w-4 fill-current" />}
              >
                Chạy mô phỏng kiểm tra
              </Button>
            </div>
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
