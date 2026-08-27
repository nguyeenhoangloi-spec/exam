'use client';

import React from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Building2,
  Users,
  Award,
  GraduationCap,
  FileSpreadsheet,
  Printer,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { SummaryScheduleRow } from './ExamReportSummaryTab';

interface SummaryScheduleDrawerProps {
  schedule: SummaryScheduleRow | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetailedSchedule: (scheduleId: number) => void;
  onExportSingleExcel?: (schedule: SummaryScheduleRow) => void;
  onPrintSingle?: (schedule: SummaryScheduleRow) => void;
}

export function SummaryScheduleDrawer({
  schedule,
  isOpen,
  onClose,
  onViewDetailedSchedule,
  onExportSingleExcel,
  onPrintSingle,
}: SummaryScheduleDrawerProps) {
  if (!isOpen || !schedule) return null;

  const passRate =
    schedule.graded > 0 ? Math.round((schedule.passCount / schedule.graded) * 100) : 0;
  const participationRate =
    schedule.assigned > 0 ? Math.round((schedule.submitted / schedule.assigned) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-drawer-title"
      className="fixed inset-0 z-[100] flex justify-end animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className="relative z-[101] w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200/60 dark:border-slate-800 animate-in slide-in-from-right duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Header ── */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <IdentifierBadge>{schedule.subjectCode}</IdentifierBadge>
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                {schedule.periodName}
              </span>
            </div>
            <h2
              id="summary-drawer-title"
              className="text-type-section font-semibold text-slate-900 dark:text-slate-100 truncate pt-0.5"
            >
              {schedule.subjectName}
            </h2>
            <div className="flex items-center gap-3 text-type-helper text-slate-600 dark:text-slate-400 font-normal pt-1">
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{schedule.departmentName}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{new Date(schedule.examDate).toLocaleDateString('vi-VN')}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng chi tiết"
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── 2. Scrollable Body Content ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* KPI 4 Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Số sinh viên */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-1">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Số SV dự thi</span>
              </span>
              <div className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                {schedule.submitted} / {schedule.assigned}
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                Đạt {participationRate}% ({schedule.absent} vắng)
              </p>
            </div>

            {/* Card 2: Điểm trung bình */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-1">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Điểm trung bình</span>
              </span>
              <div className="text-type-section font-semibold text-blue-600 dark:text-blue-400">
                {schedule.avgScore ? schedule.avgScore.toFixed(2) : '0.00'} / 10
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                Thang điểm 10.0
              </p>
            </div>

            {/* Card 3: Tỷ lệ đạt */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-1">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tỷ lệ đạt</span>
              </span>
              <div className="text-type-section font-semibold text-emerald-600 dark:text-emerald-400">
                {passRate}%
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                {schedule.passCount} bài đạt từ 5.0 trở lên
              </p>
            </div>

            {/* Card 4: Tình trạng chấm */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-1">
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Đã chấm</span>
              </span>
              <div className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                {schedule.graded} / {schedule.submitted}
              </div>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                {schedule.ungraded ? `${schedule.ungraded} bài chưa chấm` : 'Đã chấm 100%'}
              </p>
            </div>
          </div>

          {/* Cảnh báo bất thường nếu có */}
          {schedule.flagged > 0 && (
            <div className="rounded-2xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-type-body font-semibold text-rose-900 dark:text-rose-200">
                  Phát hiện {schedule.flagged} lượt vi phạm quy chế
                </h4>
                <p className="text-type-helper text-rose-700 dark:text-rose-300 font-normal">
                  Có bài thi bị tạm khóa hoặc nghi vấn gian lận trong ca thi này cần hậu kiểm.
                </p>
              </div>
            </div>
          )}

          {/* Progress overview */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <h3 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Tỷ lệ hoàn thành môn thi
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-type-helper font-medium">
                <span className="text-slate-600 dark:text-slate-400">Tỷ lệ bài thi Đạt chuẩn (&gt;= 5.0)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{passRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-type-helper font-medium">
                <span className="text-slate-600 dark:text-slate-400">Tỷ lệ sinh viên có mặt</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{participationRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${participationRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Footer Action Buttons ── */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onExportSingleExcel && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => onExportSingleExcel(schedule)}
                leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
              >
                Xuất Excel
              </Button>
            )}
            {onPrintSingle && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => onPrintSingle(schedule)}
                leftIcon={<Printer className="h-4 w-4 text-blue-600" />}
              >
                In báo cáo
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              onViewDetailedSchedule(schedule.id);
              onClose();
            }}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Xem bảng điểm chi tiết
          </Button>
        </div>
      </div>
    </div>
  );
}
