'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Ticket,
  Eye,
  ArrowRight,
  Award,
} from 'lucide-react';
import { PersonalScheduleItem } from '../../types';
import { IdentifierBadge } from '../ui/IdentifierBadge';

interface StudentScheduleCalendarViewProps {
  schedules: PersonalScheduleItem[];
  onDetail: (schedule: PersonalScheduleItem) => void;
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
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getShiftIdFromSchedule(s: PersonalScheduleItem): number {
  if (s.periodName) {
    if (s.periodName.includes('Ca 1')) return 1;
    if (s.periodName.includes('Ca 2')) return 2;
    if (s.periodName.includes('Ca 3')) return 3;
    if (s.periodName.includes('Ca 4')) return 4;
    if (s.periodName.includes('Ca 5')) return 5;
  }

  if (s.startTime) {
    const [h, m] = s.startTime.split(':').map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0);

    if (totalMinutes < 9 * 60 + 35) return 1;
    if (totalMinutes < 12 * 60 + 30) return 2;
    if (totalMinutes < 15 * 60 + 35) return 3;
    if (totalMinutes < 17 * 60 + 50) return 4;
    return 5;
  }

  return 1;
}

export function StudentScheduleCalendarView({
  schedules,
  onDetail,
}: StudentScheduleCalendarViewProps) {
  const router = useRouter();

  const initialMonday = useMemo(() => {
    if (schedules.length > 0) {
      const firstDate = new Date(schedules[0].examDate);
      if (!isNaN(firstDate.getTime())) {
        return getMondayOfCurrentWeek(firstDate);
      }
    }
    return getMondayOfCurrentWeek(new Date());
  }, [schedules]);

  const [currentDate, setCurrentDate] = useState<Date>(initialMonday);

  const weekMonday = useMemo(() => getMondayOfCurrentWeek(currentDate), [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);
      return d;
    });
  }, [weekMonday]);

  const weekRangeLabel = useMemo(() => {
    const sunday = weekDays[6];
    const formatDayMonth = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `${formatDayMonth(weekMonday)} – ${formatDayMonth(sunday)}`;
  }, [weekDays, weekMonday]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, PersonalScheduleItem[]>();
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card">
      {/* ── 1. Weekly Timetable Header Toolbar ── */}
      <div className="flex flex-col gap-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
            <CalendarIcon className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-type-card font-semibold text-slate-900 dark:text-white">
              {weekRangeLabel}
            </h2>
            <p className="text-type-helper font-normal text-slate-400 dark:text-slate-500">
              Thời khóa biểu lịch thi cá nhân theo tuần
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
          {/* Header Row: Ngày trong tuần */}
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

          {/* Grid Rows: 5 Ca thi */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {SHIFT_DEFINITIONS.map((shift) => (
              <div
                key={shift.id}
                className="grid grid-cols-[140px_repeat(7,minmax(145px,1fr))] transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
              >
                {/* Cột trái: Thông tin Ca */}
                <div className="border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 p-3 flex flex-col justify-center">
                  <div className="text-type-body font-semibold text-slate-900 dark:text-white truncate">
                    {shift.name}
                  </div>
                  <div className="mt-1 text-type-helper text-slate-500 dark:text-slate-400 tabular-nums flex items-center gap-1.5 font-normal whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{shift.timeRange}</span>
                  </div>
                </div>

                {/* 7 Cột ngày */}
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
                          {cellSchedules.map((item) => {
                            const isMock = item.mode === 'MOCK';
                            const examNumberDisplay = item.examNumber || item.registrationNumber || (isMock ? 'Tự do' : 'Chưa cấp');

                            return (
                              <div
                                key={item.id}
                                onClick={() => onDetail(item)}
                                className="group relative rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-850 p-2.5 shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer space-y-1.5"
                              >
                                {/* Top row: Mã môn và Badge Hình thức gọn */}
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <IdentifierBadge tone="neutral" size="sm" title={item.subjectCode}>
                                    {item.subjectCode}
                                  </IdentifierBadge>
                                  <div className="flex items-center gap-1.5 text-type-helper font-semibold shrink-0">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMock ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                    <span className={isMock ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                      {isMock ? 'Thi thử' : 'Chính thức'}
                                    </span>
                                  </div>
                                </div>

                                {/* Subject Title */}
                                <h5
                                  className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 break-words line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 leading-snug"
                                  title={item.subjectName}
                                >
                                  {item.subjectName}
                                </h5>

                                {/* Room */}
                                <div
                                  className="flex items-start gap-1.5 text-type-helper text-slate-700 dark:text-slate-300 font-medium break-words leading-tight"
                                  title={item.roomName || item.roomCode}
                                >
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                                  <span className="break-words truncate">
                                    {item.roomName || item.roomCode || 'Tự do'} {item.building ? `(${item.building})` : ''}
                                  </span>
                                </div>

                                {/* SBD / Seat & Time */}
                                <div className="flex items-center justify-between gap-1 text-type-helper text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                                  <span className="flex items-center gap-1 font-medium truncate max-w-[90px]" title={`SBD: ${examNumberDisplay}`}>
                                    <Ticket className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{examNumberDisplay}</span>
                                  </span>
                                  <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                    {item.startTime || '07:30'}
                                  </span>
                                </div>

                                {/* Action Buttons - Nút CTA rõ ràng, click vào card để xem chi tiết */}
                                <div
                                  className="pt-1.5 border-t border-slate-100 dark:border-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {(item as any).attempt?.hasPublishedResult ? (
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/student/online-exam/${(item as any).attempt.id}/result`)}
                                      className="w-full inline-flex items-center justify-center px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-type-helper font-semibold whitespace-nowrap transition cursor-pointer"
                                    >
                                      Điểm thi
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/student/online-exam/${item.examScheduleId || item.scheduleId || item.id}/lobby`)}
                                      className={`group relative overflow-hidden w-full inline-flex items-center justify-center px-2.5 py-1.5 rounded-xl text-type-helper font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${
                                        isMock
                                          ? 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5'
                                      }`}
                                    >
                                      {/* Shimmer / Glass light sweep effect on hover */}
                                      {!isMock && (
                                        <span className="absolute inset-0 w-1/2 h-full bg-white/25 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out pointer-events-none" />
                                      )}
                                      <span className="relative z-10">{isMock ? 'Thi thử' : 'Vào thi'}</span>
                                    </button>
                                  )}
                                </div>
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
