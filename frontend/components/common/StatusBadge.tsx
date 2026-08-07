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
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  READY: {
    label: 'Sẵn sàng',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  GRADED: {
    label: 'Đã chấm điểm',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckSquare,
  },
  SUBMITTED: {
    label: 'Đã nộp bài',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: CheckCircle2,
  },
  ROOM_COMPUTER: {
    label: 'Phòng Máy tính',
    className: 'text-emerald-600 dark:text-emerald-400 font-bold',
    icon: Monitor,
  },

  // 2. Nhóm Xanh Dương (Blue / Info)
  DRAFT: {
    label: 'Bản nháp',
    className: 'text-slate-500 dark:text-slate-400 font-semibold',
    icon: FileEdit,
  },
  SCHEDULED: {
    label: 'Đã xếp lịch',
    className: 'text-blue-600 dark:text-blue-400 font-bold',
    icon: Clock,
  },
  UPCOMING: {
    label: 'Sắp diễn ra',
    className: 'text-blue-600 dark:text-blue-400 font-bold',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'Đang diễn ra',
    className: 'text-blue-600 dark:text-blue-400 font-bold',
    icon: PlayCircle,
  },
  ONGOING: {
    label: 'Đang diễn ra',
    className: 'text-blue-600 dark:text-blue-400 font-bold',
    icon: PlayCircle,
  },
  ROOM_THEORY: {
    label: 'Phòng Lý thuyết',
    className: 'text-blue-600 dark:text-blue-400 font-bold',
    icon: BookOpen,
  },

  // 3. Nhóm Cam/Vàng (Amber / Warning)
  WAITING_APPROVAL: {
    label: 'Chờ phê duyệt',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: Clock,
  },
  PENDING: {
    label: 'Chờ duyệt',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: Clock,
  },
  CHANGE_REQUESTED: {
    label: 'Yêu cầu sửa',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: AlertCircle,
  },
  GRADING: {
    label: 'Đang chấm thi',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Đang xem xét',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: Eye,
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: AlertTriangle,
  },
  BUSY: {
    label: 'Bận',
    className: 'text-amber-600 dark:text-amber-400 font-bold',
    icon: Clock,
  },

  // 4. Nhóm Đỏ (Rose / Danger)
  CANCELLED: {
    label: 'Đã hủy',
    className: 'text-rose-600 dark:text-rose-400 font-bold',
    icon: XCircle,
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'text-rose-600 dark:text-rose-400 font-bold',
    icon: XCircle,
  },
  ABSENT: {
    label: 'Vắng thi',
    className: 'text-rose-600 dark:text-rose-400 font-bold',
    icon: XCircle,
  },

  // 5. Nhóm Xám (Slate / Neutral)
  ARCHIVED: {
    label: 'Lưu trữ',
    className: 'text-slate-500 dark:text-slate-400 font-medium',
    icon: Archive,
  },
  LOCKED: {
    label: 'Đã khóa',
    className: 'text-slate-500 dark:text-slate-400 font-medium',
    icon: Lock,
  },
  NOT_STARTED: {
    label: 'Chưa bắt đầu',
    className: 'text-slate-500 dark:text-slate-400 font-medium',
    icon: Clock,
  },
  IN_USE: {
    label: 'Đang sử dụng',
    className: 'text-blue-600 dark:text-blue-400 font-bold',
    icon: UserCheck,
  },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

/**
 * Frameless Status Badge Component matching user request:
 * - No border, no pill background, no shadow
 * - Displays Icon + Text in matching status colors
 */
export function StatusBadge({ status, customLabel, className = '' }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: customLabel || status,
    className: 'text-slate-600 dark:text-slate-400 font-bold',
    icon: HelpCircle,
  };

  const IconComponent = config.icon;
  const labelText = customLabel || config.label;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap select-none',
        config.className,
        className,
      ].join(' ')}
    >
      <IconComponent className="h-4 w-4 shrink-0" />
      <span>{labelText}</span>
    </span>
  );
}
