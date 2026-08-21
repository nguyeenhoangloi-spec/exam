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
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl';

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
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');

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

  // Month label
  const monthLabel = useMemo(() => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    return `Tháng ${String(month).padStart(2, '0')}/${year}`;
  }, [currentDate]);

  // Month days matrix (6 weeks x 7 days)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startMonday = getMondayOfCurrentWeek(firstDayOfMonth);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

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
    if (calendarMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (calendarMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const todayKey = formatDateKey(new Date());

  return (
    <div className="space-y-4">
      {/* ── 1. Calendar Header Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Navigation Buttons + Date Label */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Kỳ trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-type-body font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Kỳ kế tiếp"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <CalendarIcon className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              {calendarMode === 'week' ? weekRangeLabel : monthLabel}
            </span>
          </div>
        </div>

        {/* Right: Sub-mode (Tuần / Tháng) */}
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline-block text-type-helper font-medium text-slate-500 dark:text-slate-400">
            Tổng cộng: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{schedules.length}</strong> ca thi
          </span>

          <SlidingSegmentedControl
            size="sm"
            variant="default"
            value={calendarMode}
            onChange={(val) => setCalendarMode(val as 'week' | 'month')}
            options={[
              { value: 'week', label: 'Thời khóa biểu tuần' },
              { value: 'month', label: 'Lưới tháng' },
            ]}
          />
        </div>
      </div>

      {/* ── 2. View Mode: WEEKLY TIMETABLE MATRIX (CSS Grid Based) ── */}
      {calendarMode === 'week' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              {/* Header Row: 1 Shift Header + 7 Day Headers */}
              <div className="grid grid-cols-[130px_repeat(7,minmax(120px,1fr))] border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                <div className="border-r border-slate-200/80 dark:border-slate-800 p-3 text-center text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Ca thi / Giờ
                </div>

                {weekDays.map((d, index) => {
                  const dateKey = formatDateKey(d);
                  const isToday = dateKey === todayKey;
                  const dayName = DAY_NAMES[index];
                  const dayNum = d.getDate();
                  const monthNum = d.getMonth() + 1;

                  return (
                    <div
                      key={dateKey}
                      className={`p-3 text-center border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 transition-colors ${
                        isToday
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                          {dayName}
                        </span>
                        <span
                          className={`inline-flex items-center justify-center text-type-body font-semibold px-2 py-0.5 rounded-xl ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {String(dayNum).padStart(2, '0')}/{String(monthNum).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Body Rows: 5 Shifts */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {SHIFT_DEFINITIONS.map((shift) => (
                  <div
                    key={shift.id}
                    className="grid grid-cols-[130px_repeat(7,minmax(120px,1fr))] transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
                  >
                    {/* Shift Label Column */}
                    <div className="border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 p-3 flex flex-col justify-start">
                      <span className="inline-block rounded-xl bg-blue-100/70 dark:bg-blue-950/60 px-2 py-1 text-type-body font-semibold text-blue-700 dark:text-blue-300">
                        {shift.name}
                      </span>
                      <p className="mt-1 text-type-helper text-slate-500 dark:text-slate-400 tabular-nums flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{shift.timeRange}</span>
                      </p>
                    </div>

                    {/* 7 Day Column Cells */}
                    {weekDays.map((d) => {
                      const dateKey = formatDateKey(d);
                      const isToday = dateKey === todayKey;
                      const daySchedules = scheduleMap.get(dateKey) || [];
                      const cellSchedules = daySchedules.filter((s) => getShiftIdFromSchedule(s) === shift.id);

                      return (
                        <div
                          key={dateKey}
                          className={`p-2.5 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 min-h-[110px] transition-colors ${
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
                                const roomName = s.roomName || 'P.101';
                                const studentCount = s.studentCount || 45;
                                const status = computeScheduleStatus(s);

                                return (
                                  <div
                                    key={s.id}
                                    onClick={() => onDetail(s)}
                                    className="group relative rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-850 p-2.5 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-150 cursor-pointer space-y-1.5 active:scale-[0.99]"
                                  >
                                    {/* Top Row: Code & Status */}
                                    <div className="flex items-center justify-between gap-1">
                                      <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                                      <StatusBadge status={status} />
                                    </div>

                                    {/* Subject Title */}
                                    <h5 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                                      {s.subjectName || s.subject?.name || `Môn học #${s.subjectId || s.id}`}
                                    </h5>

                                    {/* Room & Student Count Meta */}
                                    <div className="flex flex-wrap items-center justify-between gap-1 text-type-body text-slate-600 dark:text-slate-400 pt-0.5">
                                      <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                                        <Building className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{roomName}</span>
                                      </span>
                                      <span className="flex items-center gap-1 font-medium">
                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{studentCount} TS</span>
                                      </span>
                                    </div>

                                    {/* Quick Admin Actions on Hover */}
                                    {isAdmin && (
                                      <div
                                        className="hidden group-hover:flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => onDetail(s)}
                                          className="p-1 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                          title="Chi tiết"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        {onEdit && (
                                          <button
                                            type="button"
                                            onClick={() => onEdit(s)}
                                            className="p-1 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                            title="Sửa"
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        {onDelete && (
                                          <button
                                            type="button"
                                            onClick={() => onDelete(s.id)}
                                            className="p-1 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                            title="Xóa"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
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
      )}

      {/* ── 3. View Mode: MONTHLY CALENDAR GRID ── */}
      {calendarMode === 'month' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-center text-type-body font-medium text-slate-700 dark:text-slate-300">
            {DAY_NAMES.map((name) => (
              <div key={name} className="py-3 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0">
                {name}
              </div>
            ))}
          </div>

          {/* Month 42 Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {monthDays.map((d) => {
              const dateKey = formatDateKey(d);
              const isCurrentMonth = d.getMonth() === currentDate.getMonth();
              const isToday = dateKey === todayKey;
              const daySchedules = scheduleMap.get(dateKey) || [];

              return (
                <div
                  key={dateKey}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'bg-blue-50/30 dark:bg-blue-950/20'
                      : isCurrentMonth
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-type-body font-semibold ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : isCurrentMonth
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {d.getDate()}
                    </span>

                    {daySchedules.length > 0 && (
                      <span className="rounded-xl bg-blue-50 px-1.5 py-0.5 text-type-body font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {daySchedules.length} ca
                      </span>
                    )}
                  </div>

                  {/* List of Schedules (Max 3 visible) */}
                  <div className="space-y-1 flex-1">
                    {daySchedules.slice(0, 3).map((s) => {
                      const room = s.roomName || 'P.101';
                      return (
                        <div
                          key={s.id}
                          onClick={() => onDetail(s)}
                          className="truncate rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 px-1.5 py-1 text-type-body font-medium text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                          title={`${s.startTime || '07:30'} · ${s.subjectName || 'Môn học'} · ${room}`}
                        >
                          <span className="font-semibold text-blue-600 dark:text-blue-400 mr-1">
                            {s.startTime || '07:30'}
                          </span>
                          <span>{s.subjectName || s.subject?.name || 'Môn học'}</span>
                        </div>
                      );
                    })}

                    {daySchedules.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentDate(d);
                          setCalendarMode('week');
                        }}
                        className="w-full text-left text-type-body font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1 pt-0.5 cursor-pointer rounded-xl"
                      >
                        +{daySchedules.length - 3} ca khác →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
