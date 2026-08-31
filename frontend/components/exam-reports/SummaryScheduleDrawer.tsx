'use client';

import React from 'react';
import {
  Building2,
  Users,
  Award,
  GraduationCap,
  FileSpreadsheet,
  Printer,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { DetailDrawer } from '../ui/DetailDrawer';
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
  const passRate =
    schedule && schedule.graded > 0 ? Math.round((schedule.passCount / schedule.graded) * 100) : 0;
  const participationRate =
    schedule && schedule.assigned > 0 ? Math.round((schedule.submitted / schedule.assigned) * 100) : 0;

  return (
    <DetailDrawer
      isOpen={isOpen && Boolean(schedule)}
      onClose={onClose}
      title={schedule?.subjectName || ''}
      subtitle={
        schedule
          ? `${schedule.periodName} — ${schedule.departmentName} — ${new Date(schedule.examDate).toLocaleDateString('vi-VN')}`
          : undefined
      }
      badge={
        schedule?.subjectCode ? (
          <IdentifierBadge tone="neutral">{schedule.subjectCode}</IdentifierBadge>
        ) : undefined
      }
      avatarText={schedule?.subjectCode?.substring(0, 3)?.toUpperCase() || 'MH'}
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
          <div className="flex items-center gap-2">
            {onExportSingleExcel && schedule && (
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
            {onPrintSingle && schedule && (
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

          {schedule && (
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
          )}
        </div>
      }
    >
      {schedule && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-2 text-type-helper font-medium text-blue-700 dark:text-blue-300 mb-1">
                <Users className="h-4 w-4" />
                <span>Tổng thí sinh</span>
              </div>
              <p className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                {schedule.assigned}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-2 text-type-helper font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Đã nộp bài</span>
              </div>
              <p className="text-type-section font-semibold text-emerald-600 dark:text-emerald-400">
                {schedule.submitted}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 text-type-helper font-medium text-amber-700 dark:text-amber-300 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Vắng thi</span>
              </div>
              <p className="text-type-section font-semibold text-amber-600 dark:text-amber-400">
                {schedule.absent}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2 text-type-helper font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Award className="h-4 w-4" />
                <span>Điểm TB</span>
              </div>
              <p className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                {schedule.avgScore > 0 ? schedule.avgScore.toFixed(1) : '—'}
              </p>
            </div>
          </div>

          {/* Detailed Specifications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
              <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                Thông số đợt thi
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {[
                { label: 'Khoa phụ trách', value: schedule.departmentName, icon: Building2 },
                { label: 'Học phần / Môn học', value: `${schedule.subjectName} (${schedule.subjectCode})`, icon: BookOpen },
                { label: 'Kỳ thi áp dụng', value: schedule.periodName, icon: GraduationCap },
                { label: 'Số lượng bài đã chấm', value: `${schedule.graded} / ${schedule.submitted} bài`, icon: Award },
                { label: 'Số sinh viên Đạt (>= 4.0)', value: `${schedule.passCount} sinh viên (${passRate}%)`, icon: CheckCircle2 },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.label}
                    className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group"
                  >
                    <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-type-body font-semibold shrink-0">
                      {Icon && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <span>{r.label}</span>
                    </span>

                    <span className="font-semibold text-slate-900 dark:text-white text-right text-type-body leading-snug break-words max-w-[62%]">
                      {r.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <div className="flex justify-between text-type-body-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Tỷ lệ Đạt học phần</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{passRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-type-body-sm font-medium">
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
      )}
    </DetailDrawer>
  );
}
