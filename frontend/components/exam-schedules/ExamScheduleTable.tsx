'use client';

import React, { useState } from 'react';
import { Eye, MoreVertical, Edit, Trash2, RotateCcw, Clock, Calendar, Users, Building, CalendarClock, Ban } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { ExamSchedule } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { formatExamType } from '../../lib/enum-labels';
import { ViewMode } from '../ui/ViewModeSegmentedControl';
import { ExamScheduleCalendarView } from './ExamScheduleCalendarView';

export interface ExamScheduleItemExtended {
  id: number;
  examPeriodId?: number;
  subjectId?: number;
  examType?: string;
  status?: string;
  mode?: string;
  note?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  code?: string;
  periodName?: string;
  shiftName?: string;
  roomName?: string;
  studentCount?: number;
  supervisorCount?: string;
  statusBadge?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | string;
  subjectName?: string;
  subjectCode?: string;
  subject?: any;
  examPeriod?: any;
  examScheduleRooms?: any[];
}

interface ExamScheduleTableProps {
  schedules: ExamScheduleItemExtended[];
  selected: number[];
  viewMode?: ViewMode;
  visibleColumns?: Record<string, boolean>;
  isTrash?: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (s: ExamScheduleItemExtended) => void;
  onEdit: (s: ExamScheduleItemExtended) => void;
  onDelete: (id: number) => void;
  onReschedule?: (s: ExamScheduleItemExtended) => void;
  onCancel?: (s: ExamScheduleItemExtended) => void;
  onRestore?: (id: number) => void;
  onHardDelete?: (id: number) => void;
  isAdmin: boolean;
}

export function computeScheduleStatus(s: {
  status?: string;
  statusBadge?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
}): 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' {
  const rawStatus = (s.statusBadge || s.status || '').toUpperCase();
  if (rawStatus === 'CANCELLED' || rawStatus === 'REJECTED') {
    return 'CANCELLED';
  }

  if (!s.examDate) {
    return (rawStatus as any) || 'UPCOMING';
  }

  try {
    const now = new Date();

    let dateStr = s.examDate;
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return (rawStatus as any) || 'UPCOMING';
    const [y, m, d] = parts;

    const startParts = (s.startTime || '00:00').split(':').map((v) => parseInt(v, 10));
    const endParts = (s.endTime || '23:59').split(':').map((v) => parseInt(v, 10));

    const startH = Number.isFinite(startParts[0]) ? startParts[0] : 0;
    const startM = Number.isFinite(startParts[1]) ? startParts[1] : 0;
    const endH = Number.isFinite(endParts[0]) ? endParts[0] : 23;
    const endM = Number.isFinite(endParts[1]) ? endParts[1] : 59;

    const startDateTime = new Date(y, m - 1, d, startH, startM, 0, 0);
    const endDateTime = new Date(y, m - 1, d, endH, endM, 0, 0);

    if (now < startDateTime) {
      return 'UPCOMING';
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'ONGOING';
    } else {
      return 'COMPLETED';
    }
  } catch {
    return (rawStatus as any) || 'UPCOMING';
  }
}

export function computeShiftName(startTime?: string, fallbackShiftName?: string): string {
  if (!startTime) return fallbackShiftName || 'Ca 1 - Sáng';
  const parts = startTime.split(':');
  if (parts.length < 2) return fallbackShiftName || 'Ca 1 - Sáng';
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return fallbackShiftName || 'Ca 1 - Sáng';

  if (h >= 6 && h < 9) return 'Ca 1 - Sáng';
  if (h >= 9 && h < 12) return 'Ca 2 - Sáng';
  if (h >= 12 && h < 15) return 'Ca 3 - Chiều';
  if (h >= 15 && h < 18) return 'Ca 4 - Chiều';
  if (h >= 18) return 'Ca 5 - Tối';
  return fallbackShiftName || 'Ca 1 - Sáng';
}

export function ExamScheduleTable({
  schedules,
  selected,
  viewMode = 'list',
  visibleColumns = {
    code: true,
    period: true,
    shift: true,
    room: true,
    date: true,
    time: true,
    students: true,
    supervisors: true,
    status: true,
  },
  isTrash = false,
  onSelect,
  onSelectAll,
  onDetail,
  onEdit,
  onDelete,
  onReschedule,
  onCancel,
  onRestore,
  onHardDelete,
  isAdmin,
}: ExamScheduleTableProps) {
  const allSelected = schedules.length > 0 && selected.length === schedules.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (statusBadge?: string, schedule?: ExamScheduleItemExtended) => {
    const s = (schedule ? computeScheduleStatus(schedule) : statusBadge?.toUpperCase()) || 'UPCOMING';
    return <StatusBadge status={s} />;
  };

  // 0. Dạng Thời khóa biểu / Lịch (Calendar / Timetable View Mode)
  if (viewMode === 'calendar') {
    return (
      <ExamScheduleCalendarView
        schedules={schedules}
        onDetail={onDetail}
        onEdit={onEdit}
        onDelete={onDelete}
        isAdmin={isAdmin}
      />
    );
  }

  // 1. Dạng Danh Sách Chuẩn (List View Mode - Default)
  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="ui-table w-full text-left text-type-body-sm text-slate-700 dark:text-slate-300 border-collapse">
        <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-type-helper font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800">
          <tr>
            <th scope="col" className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã lịch thi</th>}
            {visibleColumns.period !== false && <th scope="col" className="p-3.5 min-w-[240px] whitespace-nowrap">Kỳ thi / Môn thi</th>}
            {visibleColumns.shift !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Ca thi</th>}
            {visibleColumns.room !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Phòng thi</th>}
            {visibleColumns.date !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Ngày thi</th>}
            {visibleColumns.time !== false && visibleColumns.startTime !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian</th>}
            {visibleColumns.students !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số TS</th>}
            {visibleColumns.supervisors !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Giám thị</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
          {schedules.map((s) => {
            const isChecked = selected.includes(s.id);
            const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
            const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ';
            const shiftName = computeShiftName(s.startTime, s.shiftName);
            const roomName = s.roomName || 'P.101';
            const studentCount = s.studentCount || 45;
            const supervisorCount = s.supervisorCount || '2/2';

            const effectiveStatus = computeScheduleStatus(s);

            return (
              <tr
                key={s.id}
                className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                  isChecked ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                }`}
              >
                {/* Checkbox */}
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(s.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {/* Mã lịch thi */}
                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                    </button>
                  </td>
                )}

                {/* Kỳ thi / Môn thi */}
                {visibleColumns.period !== false && (
                  <td className="p-3.5 min-w-[240px] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition text-left block"
                    >
                      {s.subjectName || s.subject?.name || `Môn học #${s.subjectId || s.id}`}
                    </button>
                    <span className="text-type-body font-normal text-slate-500 dark:text-slate-400 block truncate">
                      {periodName}
                    </span>
                  </td>
                )}

                {/* Ca thi */}
                {visibleColumns.shift !== false && (
                  <td className="p-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300 text-type-body">
                    {shiftName}
                  </td>
                )}

                {/* Phòng thi */}
                {visibleColumns.room !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    {roomName === 'Chưa xếp phòng' || !roomName ? (
                      <span className="font-medium text-slate-400">Chưa xếp phòng</span>
                    ) : (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{roomName}</span>
                    )}
                  </td>
                )}

                {/* Ngày thi */}
                {visibleColumns.date !== false && (
                  <td className="p-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100 text-type-body">
                    {formatDate(s.examDate)}
                  </td>
                )}

                {/* Thời gian */}
                {(visibleColumns.time !== false && visibleColumns.startTime !== false) && (
                  <td className="p-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300 text-type-body tabular-nums">
                    {s.startTime || '07:00'} - {s.endTime || '09:00'}
                  </td>
                )}

                {/* Số TS */}
                {visibleColumns.students !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-900 dark:text-slate-100 text-type-body">
                    {studentCount}
                  </td>
                )}

                {/* Giám thị */}
                {visibleColumns.supervisors !== false && (
                  <td className="p-3.5 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400 text-type-body">
                    {supervisorCount}
                  </td>
                )}

                {/* Trạng thái */}
                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    {getStatusBadge(effectiveStatus, s)}
                  </td>
                )}

                {/* Thao tác */}
                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <ActionDropdownPortal>
                      {(closeMenu) => (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(s);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                          >
                            <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>Xem chi tiết</span>
                          </button>

                          {isAdmin && (
                            <>
                              {isTrash ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      closeMenu();
                                      onRestore?.(s.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 cursor-pointer text-type-body font-medium transition select-none"
                                  >
                                    <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>Khôi phục</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      closeMenu();
                                      onHardDelete?.(s.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer text-type-body font-medium transition select-none"
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    <span>Xóa vĩnh viễn</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {onReschedule && effectiveStatus === 'UPCOMING' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closeMenu();
                                        onReschedule(s);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer text-type-body font-medium transition select-none"
                                    >
                                      <CalendarClock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                      <span>Dời lịch thi</span>
                                    </button>
                                  )}
                                  {onCancel && effectiveStatus === 'UPCOMING' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closeMenu();
                                        onCancel(s);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer text-type-body font-medium transition select-none"
                                    >
                                      <Ban className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                      <span>Hủy ca thi</span>
                                    </button>
                                  )}
                                  {effectiveStatus === 'UPCOMING' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closeMenu();
                                        onEdit(s);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer text-type-body font-medium transition select-none"
                                    >
                                      <Edit className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                      <span>Chỉnh sửa</span>
                                    </button>
                                  )}
                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      closeMenu();
                                      onDelete(s.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer text-type-body font-medium transition select-none"
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    <span>Xóa</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </ActionDropdownPortal>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
