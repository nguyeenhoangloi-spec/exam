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

const success = 'text-[#15803D] dark:text-emerald-400';
const active = 'text-[#2563EB] dark:text-blue-400';
const pending = 'text-[#D97706] dark:text-amber-400';
const danger = 'text-[#DC2626] dark:text-rose-400';
const neutral = 'text-[#475569] dark:text-slate-400';

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

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

/** Inline semantic status: icon + colored text only, without a badge container. */
export function StatusBadge({ status, customLabel, className = '' }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: customLabel || status,
    textClass: neutral,
    icon: HelpCircle,
  };
  const IconComponent = config.icon;

  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] text-[14px] font-semibold leading-5 whitespace-nowrap select-none',
        config.textClass,
        className,
      ].join(' ')}
    >
      <IconComponent className="h-4 w-4 shrink-0" />
      <span>{customLabel || config.label}</span>
    </span>
  );
}
