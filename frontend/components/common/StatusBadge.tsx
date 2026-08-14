'use client';

import React from 'react';
import {
  AlertCircle, AlertTriangle, Archive, BookOpen, CheckCircle2, CheckSquare,
  Clock, Eye, FileEdit, HelpCircle, Lock, Monitor, PlayCircle, UserCheck, XCircle,
} from 'lucide-react';

export type StatusType =
  | 'PUBLISHED' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'READY' | 'DRAFT'
  | 'CHANGE_REQUESTED' | 'WAITING_APPROVAL' | 'PENDING' | 'GRADING'
  | 'IN_PROGRESS' | 'SCHEDULED' | 'UPCOMING' | 'ONGOING' | 'CANCELLED'
  | 'REJECTED' | 'ABSENT' | 'ARCHIVED' | 'LOCKED' | 'SUBMITTED' | 'GRADED'
  | 'UNDER_REVIEW' | 'AUTO_SUBMITTED' | 'NOT_STARTED' | 'MAINTENANCE' | 'BUSY'
  | 'IN_USE' | 'ROOM_COMPUTER' | 'ROOM_THEORY' | 'DISCONNECTED' | 'DEVICE_CHECK';

interface StatusConfig {
  label: string;
  textClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const success = 'text-success-600 dark:text-emerald-400';
const active = 'text-primary-600 dark:text-blue-400';
const pending = 'text-warning-600 dark:text-amber-400';
const danger = 'text-danger-600 dark:text-rose-400';
const neutral = 'text-slate-600 dark:text-slate-400';

const statusConfigs: Record<string, StatusConfig> = {
  PUBLISHED: { label: 'Đã công bố', textClass: success, icon: CheckCircle2 },
  APPROVED: { label: 'Đã duyệt', textClass: success, icon: CheckCircle2 },
  CONFIRMED: { label: 'Đã xác nhận', textClass: success, icon: CheckCircle2 },
  COMPLETED: { label: 'Đã hoàn thành', textClass: success, icon: CheckCircle2 },
  READY: { label: 'Sẵn sàng', textClass: success, icon: CheckCircle2 },
  GRADED: { label: 'Đã chấm điểm', textClass: success, icon: CheckSquare },
  SUBMITTED: { label: 'Đã nộp bài', textClass: success, icon: CheckCircle2 },
  AUTO_SUBMITTED: { label: 'Nộp tự động', textClass: success, icon: CheckCircle2 },

  DRAFT: { label: 'Bản nháp', textClass: neutral, icon: FileEdit },
  SCHEDULED: { label: 'Đã xếp lịch', textClass: active, icon: Clock },
  UPCOMING: { label: 'Sắp diễn ra', textClass: active, icon: Clock },
  IN_PROGRESS: { label: 'Đang diễn ra', textClass: active, icon: PlayCircle },
  ONGOING: { label: 'Đang diễn ra', textClass: active, icon: PlayCircle },
  IN_USE: { label: 'Đang sử dụng', textClass: active, icon: UserCheck },
  DEVICE_CHECK: { label: 'Đang kiểm tra thiết bị', textClass: active, icon: Monitor },

  WAITING_APPROVAL: { label: 'Chờ phê duyệt', textClass: pending, icon: Clock },
  PENDING: { label: 'Chờ duyệt', textClass: pending, icon: Clock },
  CHANGE_REQUESTED: { label: 'Yêu cầu sửa', textClass: pending, icon: AlertCircle },
  GRADING: { label: 'Đang chấm thi', textClass: active, icon: Clock },
  UNDER_REVIEW: { label: 'Đang xem xét', textClass: pending, icon: Eye },
  MAINTENANCE: { label: 'Bảo trì', textClass: pending, icon: AlertTriangle },
  BUSY: { label: 'Bận', textClass: pending, icon: Clock },
  DISCONNECTED: { label: 'Mất kết nối', textClass: pending, icon: AlertTriangle },

  CANCELLED: { label: 'Đã hủy', textClass: danger, icon: XCircle },
  REJECTED: { label: 'Từ chối', textClass: danger, icon: XCircle },
  ABSENT: { label: 'Vắng thi', textClass: danger, icon: XCircle },

  ARCHIVED: { label: 'Lưu trữ', textClass: neutral, icon: Archive },
  LOCKED: { label: 'Đã khóa', textClass: neutral, icon: Lock },
  NOT_STARTED: { label: 'Chưa bắt đầu', textClass: neutral, icon: Clock },
  ROOM_COMPUTER: { label: 'Phòng máy tính', textClass: neutral, icon: Monitor },
  ROOM_THEORY: { label: 'Phòng lý thuyết', textClass: neutral, icon: BookOpen },
};

const dotBgConfigs: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500', APPROVED: 'bg-emerald-500', CONFIRMED: 'bg-emerald-500', COMPLETED: 'bg-emerald-500', READY: 'bg-emerald-500', GRADED: 'bg-emerald-500', SUBMITTED: 'bg-emerald-500', AUTO_SUBMITTED: 'bg-emerald-500',
  SCHEDULED: 'bg-blue-500', UPCOMING: 'bg-blue-500', IN_PROGRESS: 'bg-blue-500', ONGOING: 'bg-blue-500', IN_USE: 'bg-blue-500', DEVICE_CHECK: 'bg-blue-500', GRADING: 'bg-blue-500',
  WAITING_APPROVAL: 'bg-amber-500', PENDING: 'bg-amber-500', CHANGE_REQUESTED: 'bg-amber-500', UNDER_REVIEW: 'bg-amber-500', MAINTENANCE: 'bg-amber-500', BUSY: 'bg-amber-500', DISCONNECTED: 'bg-amber-500',
  CANCELLED: 'bg-rose-500', REJECTED: 'bg-rose-500', ABSENT: 'bg-rose-500',
  DRAFT: 'bg-slate-400', ARCHIVED: 'bg-slate-400', LOCKED: 'bg-slate-400', NOT_STARTED: 'bg-slate-400', ROOM_COMPUTER: 'bg-slate-400', ROOM_THEORY: 'bg-slate-400',
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
  variant?: 'dot' | 'icon';
}

/** Inline semantic status: Dot + Text or Icon + Text without container box. */
export function StatusBadge({ status, customLabel, className = '', variant = 'dot' }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: customLabel || status,
    textClass: neutral,
    icon: HelpCircle,
  };
  const IconComponent = config.icon;
  const dotBg = dotBgConfigs[status] || 'bg-slate-400';

  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] text-xs font-semibold leading-5 whitespace-nowrap select-none',
        config.textClass,
        className,
      ].join(' ')}
    >
      {variant === 'icon' ? (
        <IconComponent className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <span className={`h-2 w-2 rounded-full ${dotBg} shrink-0`} />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
}
