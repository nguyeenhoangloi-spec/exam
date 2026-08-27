'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Building,
  Users,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { ExamScheduleItemExtended, computeScheduleStatus } from './ExamScheduleTable';
import { StatusBadge } from '../common/StatusBadge';

interface ExamScheduleCalendarViewProps {
  schedules: ExamScheduleItemExtended[];
  onDetail: (s: ExamScheduleItemExtended) => void;
  onEdit?: (s: ExamScheduleItemExtended) => void;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
}

interface ShiftDef {
  id: number;
  name: string;
  timeRange: string;
}

const SHIFT_DEFINITIONS: ShiftDef[] = [
  { id: 1, name: 'Ca 1 (Sáng)', timeRange: '07:30 – 09:30' },
  { id: 2, name: 'Ca 2 (Sáng)', timeRange: '09:45 – 11:45' },
  { id: 3, name: 'Ca 3 (Chiều)', timeRange: '13:30 – 15:30' },
  { id: 4, name: 'Ca 4 (Chiều)', timeRange: '15:45 – 17:45' },
  { id: 5, name: 'Ca 5 (Tối)', timeRange: '18:00 – 20:00' },
];

const DAY_NAMES = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMondayOfCurrentWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // day 0 is Sunday, so if Sunday (0), offset by -6 to get Monday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getShiftIdFromSchedule(s: ExamScheduleItemExtended): number {
  if (s.shiftName) {
    if (s.shiftName.includes('1')) return 1;
    if (s.shiftName.includes('2')) return 2;
    if (s.shiftName.includes('3')) return 3;
    if (s.shiftName.includes('4')) return 4;
    if (s.shiftName.includes('5')) return 5;
  }

  if (s.startTime) {
    const [h, m] = s.startTime.split(':').map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0);

    if (totalMinutes < 9 * 60 + 35) return 1; // < 09:35 -> Ca 1
    if (totalMinutes < 12 * 60 + 30) return 2; // < 12:30 -> Ca 2
    if (totalMinutes < 15 * 60 + 35) return 3; // < 15:35 -> Ca 3
    if (totalMinutes < 17 * 60 + 50) return 4; // < 17:50 -> Ca 4
    return 5; // >= 17:50 -> Ca 5
  }

  return 1;
}

export function ExamScheduleCalendarView({
  schedules,
  onDetail,
  onEdit,
  onDelete,
  isAdmin = false,
}: ExamScheduleCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Find Monday of the current week
  const weekMonday = useMemo(() => getMondayOfCurrentWeek(currentDate), [currentDate]);

  // 7 days of current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);
      return d;
    });
  }, [weekMonday]);

  // Week range string
  const weekRangeLabel = useMemo(() => {
    const sunday = weekDays[6];
    const formatDayMonth = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `${formatDayMonth(weekMonday)} – ${formatDayMonth(sunday)}`;
  }, [weekDays, weekMonday]);

  // Schedule lookup map by date key: dateKey -> schedule[]
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ExamScheduleItemExtended[]>();
    for (const s of schedules) {
      if (!s.examDate) continue;
      let dateKey = s.examDate;
      if (dateKey.includes('T')) {
        dateKey = dateKey.split('T')[0];
      }
      const existing = map.get(dateKey) || [];
      existing.push(s);
      map.set(dateKey, existing);
    }
    return map;
  }, [schedules]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const todayKey = formatDateKey(new Date());

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      {/* ── 1. Weekly Timetable Header Toolbar ── */}
      <div className="flex flex-col gap-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
            <CalendarIcon className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-type-card font-semibold text-slate-900 dark:text-white">
                {weekRangeLabel}
              </h2>
            </div>
            <p className="text-type-helper font-normal text-slate-400 dark:text-slate-500">
              Thời khóa biểu lịch thi theo tuần
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-8 px-2.5 text-type-helper font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-type-helper text-slate-600 dark:text-slate-400 font-medium">
            <span>Tổng số:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {schedules.length}
            </span>
            <span>ca thi</span>
          </div>
        </div>
      </div>

      {/* ── 2. Time Grid Table Container ── */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[1160px]">
          <div className="grid grid-cols-[140px_repeat(7,minmax(145px,1fr))] border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60">
            <div className="p-3.5 text-center text-type-helper font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
              Ca thi / Ngày
            </div>
            {weekDays.map((d, index) => {
              const dateKey = formatDateKey(d);
              const isToday = dateKey === todayKey;
              const count = (scheduleMap.get(dateKey) || []).length;
              return (
                <div
                  key={dateKey}
                  className={`p-3 text-center border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 transition-colors ${
                    isToday
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-type-helper font-semibold">
                    {DAY_NAMES[index]}
                  </div>
                  <div
                    className={`text-type-body-sm font-semibold mt-0.5 tabular-nums ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}
                  </div>
                  {count > 0 && (
                    <div className="mt-1">
                      <span
                        className={`ui-pill rounded-full inline-block px-2 py-0.5 text-type-helper font-medium tabular-nums ${
                          isToday
                            ? 'ui-pill-solid bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {count} ca
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {SHIFT_DEFINITIONS.map((shift) => (
              <div
                key={shift.id}
                className="grid grid-cols-[140px_repeat(7,minmax(145px,1fr))] transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
              >
                <div className="border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 p-3 flex flex-col justify-center">
                  <div className="text-type-body font-semibold text-slate-900 dark:text-white truncate">
                    {shift.name}
                  </div>
                  <div className="mt-1 text-type-helper text-slate-500 dark:text-slate-400 tabular-nums flex items-center gap-1.5 font-normal whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{shift.timeRange}</span>
                  </div>
                </div>

                {weekDays.map((d) => {
                  const dateKey = formatDateKey(d);
                  const isToday = dateKey === todayKey;
                  const daySchedules = scheduleMap.get(dateKey) || [];
                  const cellSchedules = daySchedules.filter((s) => getShiftIdFromSchedule(s) === shift.id);
                  return (
                    <div
                      key={dateKey}
                      className={`p-2 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 min-h-[110px] transition-colors ${
                        isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      {cellSchedules.length === 0 ? (
                        <div className="h-full min-h-[90px] flex items-center justify-center rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/80 text-type-body text-slate-400 dark:text-slate-600 font-normal select-none">
                          —
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cellSchedules.map((s) => {
                            const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
                            const roomName = s.roomName || 'Chưa xếp phòng';
                            const studentCount = s.studentCount || 45;
                            const status = computeScheduleStatus(s);
                            return (
                              <div
                                key={s.id}
                                onClick={() => onDetail(s)}
                                className="group relative rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-850 p-2.5 shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer space-y-1.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
                                  <span
                                    className="inline-block px-1.5 py-0.5 rounded-lg text-type-helper font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0"
                                    title={codeText}
                                  >
                                    {codeText}
                                  </span>
                                  <StatusBadge status={status} />
                                </div>
                                <h5
                                  className="text-type-body font-semibold text-slate-900 dark:text-slate-100 break-words line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 leading-snug"
                                  title={s.subjectName || s.subject?.name || `Môn học #${s.subjectId || s.id}`}
                                >
                                  {s.subjectName || s.subject?.name || `Môn học #${s.subjectId || s.id}`}
                                </h5>
                                <div
                                  className="flex items-start gap-1.5 text-type-helper text-slate-700 dark:text-slate-300 font-medium break-words leading-tight"
                                  title={roomName}
                                >
                                  <Building className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                                  <span className="break-words">{roomName}</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-1 text-type-helper text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span>{studentCount} TS</span>
                                  </span>
                                  <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">
                                    {s.startTime || '07:30'}
                                  </span>
                                </div>
                                {isAdmin && (
                                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                                    <div className="overflow-hidden">
                                      <div
                                        className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 mt-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {onEdit && status === 'UPCOMING' && (
                                          <button
                                            type="button"
                                            onClick={() => onEdit(s)}
                                            className="p-1 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            title="Chỉnh sửa ca thi"
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        {onDelete && (
                                          <button
                                            type="button"
                                            onClick={() => onDelete(s.id)}
                                            className="p-1 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                            title="Xóa ca thi"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
