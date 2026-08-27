'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface SecurityHealthScoreCardProps {
  permissions: Array<{ code: string; roles: string[]; sensitive: boolean; module: string }>;
  users: Array<{
    role: string;
    permissionOverrides: Array<{ effect: 'ALLOW' | 'DENY'; permission: { code: string } }>;
    accessScopes: Array<{ type: string }>;
  }>;
  onOpenSimulator: () => void;
  onOpenPresets?: () => void;
  onOpenCompare?: () => void;
}

export function SecurityHealthScoreCard({
  permissions,
  users,
  onOpenSimulator,
  onOpenPresets,
  onOpenCompare,
}: SecurityHealthScoreCardProps) {
  // Compute Security Health Score
  const { score, checks, statusLabel, statusColor } = useMemo(() => {
    let currentScore = 100;
    const checkList = [];

    // Check 1: Sensitive permissions given to Students
    const studentSensitivePerms = permissions.filter(
      (p) => p.sensitive && p.roles.includes('STUDENT')
    );
    if (studentSensitivePerms.length > 0) {
      currentScore -= 40;
      checkList.push({
        label: `Phát hiện ${studentSensitivePerms.length} quyền nhạy cảm cấp cho vai trò Sinh viên`,
        passed: false,
        severity: 'HIGH',
      });
    } else {
      checkList.push({
        label: 'Vai trò Sinh viên tuân thủ nghiêm ngặt chuẩn bảo mật tối thiểu',
        passed: true,
      });
    }

    // Check 2: High number of overrides (Privilege Drift)
    const usersWithOverrides = users.filter((u) => u.permissionOverrides.length > 0);
    const overrideRatio = users.length > 0 ? (usersWithOverrides.length / users.length) * 100 : 0;
    if (overrideRatio > 25) {
      currentScore -= 15;
      checkList.push({
        label: `Tỷ lệ quyền riêng cao (${overrideRatio.toFixed(0)}%), nguy cơ lệch chuẩn vai trò`,
        passed: false,
        severity: 'MEDIUM',
      });
    } else {
      checkList.push({
        label: 'Cấu hình quyền riêng ở mức an toàn (< 25% tổng tài khoản)',
        passed: true,
      });
    }

    // Check 3: Teachers with ABAC scopes restriction
    const teachers = users.filter((u) => u.role === 'TEACHER');
    const teachersWithoutScopes = teachers.filter((t) => t.accessScopes.length === 0);
    if (teachers.length > 0 && teachersWithoutScopes.length > 0) {
      currentScore -= 10;
      checkList.push({
        label: `Có ${teachersWithoutScopes.length} giảng viên chưa đặt phạm vi Khoa/Môn riêng`,
        passed: false,
        severity: 'LOW',
      });
    } else {
      checkList.push({
        label: '100% tài khoản Giảng viên đã áp dụng chính sách kiểm soát phạm vi ABAC',
        passed: true,
      });
    }

    const finalScore = Math.max(0, Math.min(100, currentScore));
    let label = 'Tối ưu tuyệt đối';
    let color = 'emerald';

    if (finalScore < 70) {
      label = 'Cần rà soát an ninh';
      color = 'rose';
    } else if (finalScore < 90) {
      label = 'Khá an toàn';
      color = 'amber';
    }

    return {
      score: finalScore,
      checks: checkList,
      statusLabel: label,
      statusColor: color,
    };
  }, [permissions, users]);

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* Left: Score Gauge & Health Verdict */}
        <div className="flex items-center gap-4.5">
          <div className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-2">
            <div className="text-center">
              <span className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-[38px]">
                {score}
              </span>
              <span className="block text-type-helper font-medium text-slate-400">
                /100
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`table-badge ui-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-type-helper font-medium ${
                  statusColor === 'emerald'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300'
                    : statusColor === 'amber'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300'
                }`}
              >
                {statusColor === 'emerald' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {statusLabel}
              </span>
              <span className="text-type-helper text-slate-400 font-normal">
                Chỉ số an toàn phân quyền
              </span>
            </div>
            <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
              Đánh Giá Trực Tuyến & Khuyến Nghị An Ninh Hệ Thống
            </h3>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPresets && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenPresets}
              leftIcon={<Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            >
              Hồ sơ mẫu vị trí 📋
            </Button>
          )}

          {onOpenCompare && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenCompare}
              leftIcon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
            >
              So sánh 2 tài khoản ⚖️
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onOpenSimulator}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Thử mô phỏng quyền 🧪
          </Button>
        </div>
      </div>

      {/* Checklist items */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        {checks.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-type-body">
            {item.passed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span className="text-type-helper font-normal text-slate-600 dark:text-slate-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
