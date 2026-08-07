'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileEdit,
  Eye,
  Lock,
  Archive,
  UserCheck,
  CheckSquare,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Monitor,
  BookOpen,
} from 'lucide-react';

export type StatusType =
  | 'PUBLISHED'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'READY'
  | 'DRAFT'
  | 'CHANGE_REQUESTED'
  | 'WAITING_APPROVAL'
  | 'PENDING'
  | 'GRADING'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | 'UPCOMING'
  | 'ONGOING'
  | 'CANCELLED'
  | 'REJECTED'
  | 'ABSENT'
  | 'ARCHIVED'
  | 'LOCKED'
  | 'SUBMITTED'
  | 'GRADED'
  | 'AUTO_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NOT_STARTED'
  | 'MAINTENANCE'
  | 'BUSY'
  | 'IN_USE'
  | 'ROOM_COMPUTER'
  | 'ROOM_THEORY';

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusConfigs: Record<string, StatusConfig> = {
  // 1. Nhóm Xanh Lá (Emerald / Success)
  PUBLISHED: {
    label: 'Đã công bố',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckCircle2,
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckCircle2,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckCircle2,
  },
  READY: {
    label: 'Sẵn sàng',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckCircle2,
  },
  GRADED: {
    label: 'Đã chấm điểm',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckSquare,
  },
  SUBMITTED: {
    label: 'Đã nộp bài',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: CheckCircle2,
  },
  ROOM_COMPUTER: {
    label: 'Phòng Máy tính',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
    icon: Monitor,
  },

  // 2. Nhóm Xanh Dương (Blue / Info)
  DRAFT: {
    label: 'Bản nháp',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: FileEdit,
  },
  SCHEDULED: {
    label: 'Đã xếp lịch',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: Clock,
  },
  UPCOMING: {
    label: 'Sắp diễn ra',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'Đang diễn ra',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: PlayCircle,
  },
  ONGOING: {
    label: 'Đang diễn ra',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: PlayCircle,
  },
  ROOM_THEORY: {
    label: 'Phòng Lý thuyết',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: BookOpen,
  },

  // 3. Nhóm Cam/Vàng (Amber / Warning)
  WAITING_APPROVAL: {
    label: 'Chờ phê duyệt',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: Clock,
  },
  PENDING: {
    label: 'Chờ duyệt',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: Clock,
  },
  CHANGE_REQUESTED: {
    label: 'Yêu cầu sửa',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: AlertCircle,
  },
  GRADING: {
    label: 'Đang chấm thi',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Đang xem xét',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: Eye,
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: AlertTriangle,
  },
  BUSY: {
    label: 'Bận',
    className: 'bg-amber-50 text-amber-700 border-amber-300/80',
    icon: Clock,
  },

  // 4. Nhóm Đỏ (Rose / Danger)
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border-rose-300/80',
    icon: XCircle,
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'bg-rose-50 text-rose-700 border-rose-300/80',
    icon: XCircle,
  },
  ABSENT: {
    label: 'Vắng thi',
    className: 'bg-rose-50 text-rose-700 border-rose-300/80',
    icon: XCircle,
  },

  // 5. Nhóm Xám (Slate / Neutral)
  ARCHIVED: {
    label: 'Lưu trữ',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Archive,
  },
  LOCKED: {
    label: 'Đã khóa',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Lock,
  },
  NOT_STARTED: {
    label: 'Chưa bắt đầu',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  },
  IN_USE: {
    label: 'Đang sử dụng',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: UserCheck,
  },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

/**
 * Compact Status Badge Component matching user request:
 * - Radius: 8px (`rounded-[8px]`)
 * - Height: 24px (`h-6`)
 * - Font: 11px bold (`text-[11px] font-bold`)
 * - Border: Light 1px border matching theme tone (`border`)
 * - Icon: Lucide icon 13px (`h-3.5 w-3.5`)
 */
export function StatusBadge({ status, customLabel, className = '' }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: customLabel || status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: HelpCircle,
  };

  const IconComponent = config.icon;
  const labelText = customLabel || config.label;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-0.5 text-[11px] font-bold h-6 whitespace-nowrap shadow-2xs select-none',
        config.className,
        className,
      ].join(' ')}
    >
      <IconComponent className="h-3.5 w-3.5 shrink-0" />
      <span>{labelText}</span>
    </span>
  );
}
