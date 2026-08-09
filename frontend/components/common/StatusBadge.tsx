'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Clock,
  Eye,
  FileEdit,
  HelpCircle,
  Lock,
  Monitor,
  PlayCircle,
  UserCheck,
  XCircle,
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
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const success = 'bg-[#F0FDF4] text-[#15803D] dark:bg-emerald-950/40 dark:text-emerald-300';
const active = 'bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-300';
const pending = 'bg-[#FFF7ED] text-[#D97706] dark:bg-amber-950/40 dark:text-amber-300';
const danger = 'bg-[#FEF2F2] text-[#DC2626] dark:bg-rose-950/40 dark:text-rose-300';
const neutral = 'bg-[#F8FAFC] text-[#475569] dark:bg-slate-800 dark:text-slate-300';

const statusConfigs: Record<string, StatusConfig> = {
  PUBLISHED: { label: 'Đã công bố', badgeClass: success, icon: CheckCircle2 },
  APPROVED: { label: 'Đã duyệt', badgeClass: success, icon: CheckCircle2 },
  CONFIRMED: { label: 'Đã xác nhận', badgeClass: success, icon: CheckCircle2 },
  COMPLETED: { label: 'Đã hoàn thành', badgeClass: success, icon: CheckCircle2 },
  READY: { label: 'Sẵn sàng', badgeClass: success, icon: CheckCircle2 },
  GRADED: { label: 'Đã chấm điểm', badgeClass: success, icon: CheckSquare },
  SUBMITTED: { label: 'Đã nộp bài', badgeClass: success, icon: CheckCircle2 },

  DRAFT: { label: 'Bản nháp', badgeClass: neutral, icon: FileEdit },
  SCHEDULED: { label: 'Đã xếp lịch', badgeClass: active, icon: Clock },
  UPCOMING: { label: 'Sắp diễn ra', badgeClass: active, icon: Clock },
  IN_PROGRESS: { label: 'Đang diễn ra', badgeClass: active, icon: PlayCircle },
  ONGOING: { label: 'Đang diễn ra', badgeClass: active, icon: PlayCircle },
  IN_USE: { label: 'Đang sử dụng', badgeClass: active, icon: UserCheck },
  DEVICE_CHECK: { label: 'Đang kiểm tra thiết bị', badgeClass: active, icon: Monitor },
  DISCONNECTED: { label: 'Mất kết nối', badgeClass: pending, icon: AlertTriangle },

  WAITING_APPROVAL: { label: 'Chờ phê duyệt', badgeClass: pending, icon: Clock },
  PENDING: { label: 'Chờ duyệt', badgeClass: pending, icon: Clock },
  CHANGE_REQUESTED: { label: 'Yêu cầu sửa', badgeClass: pending, icon: AlertCircle },
  GRADING: { label: 'Đang chấm thi', badgeClass: active, icon: Clock },
  UNDER_REVIEW: { label: 'Đang xem xét', badgeClass: pending, icon: Eye },
  MAINTENANCE: { label: 'Bảo trì', badgeClass: pending, icon: AlertTriangle },
  BUSY: { label: 'Bận', badgeClass: pending, icon: Clock },

  CANCELLED: { label: 'Đã hủy', badgeClass: danger, icon: XCircle },
  REJECTED: { label: 'Từ chối', badgeClass: danger, icon: XCircle },
  ABSENT: { label: 'Vắng thi', badgeClass: danger, icon: XCircle },

  ARCHIVED: { label: 'Lưu trữ', badgeClass: neutral, icon: Archive },
  LOCKED: { label: 'Đã khóa', badgeClass: neutral, icon: Lock },
  NOT_STARTED: { label: 'Chưa bắt đầu', badgeClass: neutral, icon: Clock },
  AUTO_SUBMITTED: { label: 'Nộp tự động', badgeClass: success, icon: CheckCircle2 },
  ROOM_COMPUTER: { label: 'Phòng Máy tính', badgeClass: neutral, icon: Monitor },
  ROOM_THEORY: { label: 'Phòng Lý thuyết', badgeClass: neutral, icon: BookOpen },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

/** Soft semantic badge dành riêng cho trạng thái và nhãn phân loại. */
export function StatusBadge({ status, customLabel, className = '' }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: customLabel || status,
    badgeClass: neutral,
    icon: HelpCircle,
  };
  const IconComponent = config.icon;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[13px] font-semibold whitespace-nowrap select-none',
        config.badgeClass,
        className,
      ].join(' ')}
    >
      <IconComponent className="h-4 w-4 shrink-0" />
      <span>{customLabel || config.label}</span>
    </span>
  );
}
