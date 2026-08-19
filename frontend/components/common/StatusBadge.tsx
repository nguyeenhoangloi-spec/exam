'use client';

import React from 'react';
import {
  AlertCircle, AlertTriangle, Archive, BookOpen, CheckCircle2, CheckSquare,
  Clock, Eye, FileEdit, HelpCircle, Lock, Monitor, PlayCircle, ShieldCheck,
  UserCheck, XCircle, RefreshCw, Zap,
} from 'lucide-react';

export type StatusType =
  | 'PUBLISHED' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'READY' | 'DRAFT'
  | 'CHANGE_REQUESTED' | 'WAITING_APPROVAL' | 'PENDING' | 'GRADING'
  | 'IN_PROGRESS' | 'SCHEDULED' | 'UPCOMING' | 'ONGOING' | 'CANCELLED'
  | 'REJECTED' | 'ABSENT' | 'ARCHIVED' | 'LOCKED' | 'SUBMITTED' | 'GRADED'
  | 'UNDER_REVIEW' | 'AUTO_SUBMITTED' | 'NOT_STARTED' | 'MAINTENANCE' | 'BUSY'
  | 'IN_USE' | 'ROOM_COMPUTER' | 'ROOM_THEORY' | 'DISCONNECTED' | 'DEVICE_CHECK'
  | 'RUNNING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'ACTIVE' | 'PENDING_VERIFY'
  | 'INACTIVE' | 'NEW' | 'ACCEPTED' | 'PASSED' | 'NOT_PASSED' | 'UNPUBLISHED';

export type StatusCategory = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

interface StatusConfig {
  label: string;
  category: StatusCategory;
  icon: React.ComponentType<{ className?: string }>;
}

export const categoryStyles: Record<StatusCategory, {
  textClass: string;
  pillClass: string;
  solidClass: string;
  dotBg: string;
}> = {
  neutral: {
    textClass: 'text-slate-700 dark:text-slate-300',
    pillClass: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    solidClass: 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200',
    dotBg: 'bg-slate-400',
  },
  info: {
    textClass: 'text-blue-700 dark:text-blue-400',
    pillClass: 'bg-transparent text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
    solidClass: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500',
    dotBg: 'bg-blue-500',
  },
  warning: {
    textClass: 'text-amber-700 dark:text-amber-400',
    pillClass: 'bg-transparent text-amber-700 dark:text-amber-400 border-amber-400 dark:border-amber-700',
    solidClass: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500',
    dotBg: 'bg-amber-500',
  },
  success: {
    textClass: 'text-emerald-700 dark:text-emerald-400',
    pillClass: 'bg-transparent text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-700',
    solidClass: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500',
    dotBg: 'bg-emerald-500',
  },
  danger: {
    textClass: 'text-rose-700 dark:text-rose-400',
    pillClass: 'bg-transparent text-rose-700 dark:text-rose-400 border-rose-400 dark:border-rose-700',
    solidClass: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:border-rose-500',
    dotBg: 'bg-rose-500',
  },
};

const statusConfigs: Record<string, StatusConfig> = {
  // ── 1. THÀNH CÔNG (Success - Xanh lá: emerald) ──
  PUBLISHED: { label: 'Đã công bố', category: 'success', icon: CheckCircle2 },
  APPROVED: { label: 'Đã duyệt', category: 'success', icon: CheckCircle2 },
  CONFIRMED: { label: 'Đã xác nhận', category: 'success', icon: CheckCircle2 },
  COMPLETED: { label: 'Đã hoàn thành', category: 'success', icon: CheckCircle2 },
  READY: { label: 'Sẵn sàng', category: 'success', icon: CheckCircle2 },
  GRADED: { label: 'Đã chấm điểm', category: 'success', icon: CheckSquare },
  SUBMITTED: { label: 'Đã nộp bài', category: 'success', icon: CheckCircle2 },
  AUTO_SUBMITTED: { label: 'Nộp tự động', category: 'success', icon: CheckCircle2 },
  SUCCEEDED: { label: 'Thành công', category: 'success', icon: CheckCircle2 },
  ACTIVE: { label: 'Đang hoạt động', category: 'success', icon: ShieldCheck },
  ACCEPTED: { label: 'Đã chấp nhận', category: 'success', icon: CheckCircle2 },
  PASSED: { label: 'Đạt', category: 'success', icon: CheckCircle2 },

  // ── 2. THÔNG TIN / ĐANG XỬ LÝ (Info - Xanh dương: blue) ──
  SCHEDULED: { label: 'Đã lên lịch', category: 'info', icon: Clock },
  UPCOMING: { label: 'Sắp diễn ra', category: 'info', icon: Clock },
  IN_PROGRESS: { label: 'Đang diễn ra', category: 'info', icon: PlayCircle },
  ONGOING: { label: 'Đang diễn ra', category: 'info', icon: PlayCircle },
  IN_USE: { label: 'Đang sử dụng', category: 'info', icon: UserCheck },
  DEVICE_CHECK: { label: 'Đang kiểm tra thiết bị', category: 'info', icon: Monitor },
  GRADING: { label: 'Đang chấm thi', category: 'info', icon: Clock },
  CHANGE_REQUESTED: { label: 'Cần chỉnh sửa', category: 'info', icon: AlertCircle },
  RUNNING: { label: 'Đang chạy', category: 'info', icon: RefreshCw },
  PROCESSING: { label: 'Đang xử lý', category: 'info', icon: RefreshCw },

  // ── 3. CHỜ XỬ LÝ (Warning - Vàng cam: amber) ──
  WAITING_APPROVAL: { label: 'Chờ phê duyệt', category: 'warning', icon: Clock },
  PENDING: { label: 'Chờ duyệt', category: 'warning', icon: Clock },
  PENDING_VERIFY: { label: 'Chờ xác minh', category: 'warning', icon: Clock },
  UNDER_REVIEW: { label: 'Đang xem xét', category: 'warning', icon: Eye },
  NEW: { label: 'Mới gửi', category: 'warning', icon: Zap },
  MAINTENANCE: { label: 'Bảo trì', category: 'warning', icon: AlertTriangle },
  BUSY: { label: 'Bận', category: 'warning', icon: Clock },
  DISCONNECTED: { label: 'Mất kết nối', category: 'warning', icon: AlertTriangle },

  // ── 4. LỖI / NGUY HIỂM (Danger - Đỏ: rose) ──
  CANCELLED: { label: 'Đã hủy', category: 'danger', icon: XCircle },
  REJECTED: { label: 'Bị từ chối', category: 'danger', icon: XCircle },
  ABSENT: { label: 'Vắng thi', category: 'danger', icon: XCircle },
  FAILED: { label: 'Thất bại', category: 'danger', icon: XCircle },
  NOT_PASSED: { label: 'Không đạt', category: 'danger', icon: XCircle },

  // ── 5. TRUNG TÍNH (Neutral - Xám xanh: slate) ──
  DRAFT: { label: 'Bản nháp', category: 'neutral', icon: FileEdit },
  ARCHIVED: { label: 'Lưu trữ', category: 'neutral', icon: Archive },
  LOCKED: { label: 'Đã khóa', category: 'neutral', icon: Lock },
  NOT_STARTED: { label: 'Chưa bắt đầu', category: 'neutral', icon: Clock },
  UNPUBLISHED: { label: 'Chưa công bố', category: 'neutral', icon: Clock },
  INACTIVE: { label: 'Không hoạt động', category: 'neutral', icon: Lock },
  ROOM_COMPUTER: { label: 'Phòng máy tính', category: 'neutral', icon: Monitor },
  ROOM_THEORY: { label: 'Phòng lý thuyết', category: 'neutral', icon: BookOpen },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
  variant?: 'dot' | 'pill' | 'icon';
  emphasis?: 'outline' | 'solid';
}

/**
 * Semantic StatusBadge component supporting:
 * - variant="dot" (default): Dot + text for flat tables & lists
 * - variant="pill": Outline-first; use emphasis="solid" only for the single primary or critical state in a group
 * - variant="icon": Icon + text
 */
export function StatusBadge({
  status,
  customLabel,
  className = '',
  variant = 'dot',
  emphasis = 'outline',
}: StatusBadgeProps) {
  const normalizedKey = (status || '').toUpperCase().trim();
  const config = statusConfigs[normalizedKey] || {
    label: customLabel || status,
    category: 'neutral' as StatusCategory,
    icon: HelpCircle,
  };

  const style = categoryStyles[config.category] || categoryStyles.neutral;
  const IconComponent = config.icon;
  const labelText = customLabel || config.label;

  if (variant === 'pill') {
    return (
      <span
        className={[
          'ui-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-type-helper font-medium whitespace-nowrap select-none',
          emphasis === 'solid' ? `ui-pill-solid ${style.solidClass}` : style.pillClass,
          className,
        ].join(' ')}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dotBg} shrink-0`} />
        <span>{labelText}</span>
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <span
        className={[
          'inline-flex items-center gap-[6px] text-type-badge font-medium whitespace-nowrap select-none',
          style.textClass,
          className,
        ].join(' ')}
      >
        <IconComponent className="h-3.5 w-3.5 shrink-0" />
        <span>{labelText}</span>
      </span>
    );
  }

  // Default: variant="dot"
  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] text-type-badge font-medium whitespace-nowrap select-none',
        style.textClass,
        className,
      ].join(' ')}
    >
      <span className={`h-2 w-2 rounded-full ${style.dotBg} shrink-0`} />
      <span>{labelText}</span>
    </span>
  );
}
