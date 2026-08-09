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
  /** Màu trạng thái chỉ đặt trên icon; chữ luôn giữ màu trung tính. */
  iconClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Màu chữ trung tính dùng chung cho toàn bộ nhãn trạng thái. */
const LABEL_CLASS = 'text-[#334155] dark:text-slate-200 font-medium';

const statusConfigs: Record<string, StatusConfig> = {
  // 1. Nhóm Xanh Lá (Emerald / Success) — Đã hoàn thành, đã duyệt...
  PUBLISHED: { label: 'Đã công bố', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  APPROVED: { label: 'Đã duyệt', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  CONFIRMED: { label: 'Đã xác nhận', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  COMPLETED: { label: 'Đã hoàn thành', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  READY: { label: 'Sẵn sàng', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  GRADED: { label: 'Đã chấm điểm', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckSquare },
  SUBMITTED: { label: 'Đã nộp bài', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  ROOM_COMPUTER: { label: 'Phòng Máy tính', iconClass: 'text-emerald-600 dark:text-emerald-400', icon: Monitor },

  // 2. Nhóm Xanh Dương (Blue / Brand) — trạng thái đang diễn ra, thông tin
  DRAFT: { label: 'Bản nháp', iconClass: 'text-slate-400 dark:text-slate-500', icon: FileEdit },
  SCHEDULED: { label: 'Đã xếp lịch', iconClass: 'text-blue-600 dark:text-blue-400', icon: Clock },
  UPCOMING: { label: 'Sắp diễn ra', iconClass: 'text-blue-600 dark:text-blue-400', icon: Clock },
  IN_PROGRESS: { label: 'Đang diễn ra', iconClass: 'text-blue-600 dark:text-blue-400', icon: PlayCircle },
  ONGOING: { label: 'Đang diễn ra', iconClass: 'text-blue-600 dark:text-blue-400', icon: PlayCircle },
  ROOM_THEORY: { label: 'Phòng Lý thuyết', iconClass: 'text-blue-600 dark:text-blue-400', icon: BookOpen },

  // 3. Nhóm Cam/Vàng (Amber / Warning) — Chờ xử lý
  WAITING_APPROVAL: { label: 'Chờ phê duyệt', iconClass: 'text-amber-600 dark:text-amber-400', icon: Clock },
  PENDING: { label: 'Chờ duyệt', iconClass: 'text-amber-600 dark:text-amber-400', icon: Clock },
  CHANGE_REQUESTED: { label: 'Yêu cầu sửa', iconClass: 'text-amber-600 dark:text-amber-400', icon: AlertCircle },
  GRADING: { label: 'Đang chấm thi', iconClass: 'text-amber-600 dark:text-amber-400', icon: Clock },
  UNDER_REVIEW: { label: 'Đang xem xét', iconClass: 'text-amber-600 dark:text-amber-400', icon: Eye },
  MAINTENANCE: { label: 'Bảo trì', iconClass: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  BUSY: { label: 'Bận', iconClass: 'text-amber-600 dark:text-amber-400', icon: Clock },

  // 4. Nhóm Đỏ (Rose / Danger) — Đã hủy / Lỗi
  CANCELLED: { label: 'Đã hủy', iconClass: 'text-rose-600 dark:text-rose-400', icon: XCircle },
  REJECTED: { label: 'Từ chối', iconClass: 'text-rose-600 dark:text-rose-400', icon: XCircle },
  ABSENT: { label: 'Vắng thi', iconClass: 'text-rose-600 dark:text-rose-400', icon: XCircle },

  // 5. Nhóm Xám (Slate / Neutral)
  ARCHIVED: { label: 'Lưu trữ', iconClass: 'text-slate-400 dark:text-slate-500', icon: Archive },
  LOCKED: { label: 'Đã khóa', iconClass: 'text-slate-400 dark:text-slate-500', icon: Lock },
  NOT_STARTED: { label: 'Chưa bắt đầu', iconClass: 'text-slate-400 dark:text-slate-500', icon: Clock },
  IN_USE: { label: 'Đang sử dụng', iconClass: 'text-blue-600 dark:text-blue-400', icon: UserCheck },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

/**
 * Frameless Status Badge — Icon + Text:
 * - Màu trạng thái (xanh lá / cam / đỏ / xanh dương) chỉ đặt trên ICON.
 * - Phần chữ luôn giữ màu trung tính (#334155 / slate-700) để không phá
 *   bảng màu 4 tầng chung của toàn hệ thống.
 */
export function StatusBadge({ status, customLabel, className = '' }: StatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: customLabel || status,
    iconClass: 'text-slate-400 dark:text-slate-500',
    icon: HelpCircle,
  };

  const IconComponent = config.icon;
  const labelText = customLabel || config.label;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-[14px] whitespace-nowrap select-none',
        LABEL_CLASS,
        className,
      ].join(' ')}
    >
      <IconComponent className={`h-4 w-4 shrink-0 ${config.iconClass}`} />
      <span>{labelText}</span>
    </span>
  );
}
