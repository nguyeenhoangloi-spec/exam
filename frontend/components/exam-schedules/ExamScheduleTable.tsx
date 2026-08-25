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

    const [startH, startM] = (s.startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (s.endTime || '23:59').split(':').map(Number);

    const startDateTime = new Date(y, m - 1, d, startH || 0, startM || 0);
    const endDateTime = new Date(y, m - 1, d, endH || 23, endM || 59);

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

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {schedules.map((s) => {
          const isChecked = selected.includes(s.id);
          const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
          const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ';
          const shiftName = computeShiftName(s.startTime, s.shiftName);
          const roomName = s.roomName || 'P.101';
          const studentCount = s.studentCount || 45;
          const supervisorCount = s.supervisorCount || '2/2';

          return (
            <div
              key={s.id}
              className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : ''
              }`}
            >
              {/* Header Top row */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(s.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="tabular-nums text-type-helper font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                    >
                      <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                    </button>
                  </div>
                  {getStatusBadge(s.statusBadge || s.status, s)}
                </div>

                {/* Subject & Period Title */}
                <div>
                  <h4
                    onClick={() => onDetail(s)}
                    className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {s.subjectName || s.subject?.name || `Môn học mã #${s.subjectId || s.id}`}
                  </h4>
                  <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {periodName}
                  </p>
                </div>

                {/* Key metadata grid */}
                <div className="grid grid-cols-2 gap-2 text-type-helper font-medium text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700/60">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{formatDate(s.examDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700/60">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{s.startTime || '07:00'} - {s.endTime || '09:00'}</span>
                  </div>
                </div>

                {/* Room & Capacity info */}
                <div className="text-type-helper font-normal text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>Phòng: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{roomName}</strong> ({shiftName})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{studentCount} TS ({supervisorCount} GT)</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons at Bottom */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-type-helper font-semibold">
                <button
                  type="button"
                  onClick={() => onDetail(s)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    {onReschedule && (
                      <button
                        type="button"
                        onClick={() => onReschedule(s)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                        title="Dời lịch thi"
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onCancel && s.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => onCancel(s)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Hủy ca thi"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. Dạng Thẻ Thanh Ngang Thu Gọn (Compact Card Row Mode)
  if (viewMode === 'compact') {
    return (
      <div className="space-y-2.5">
        {schedules.map((s) => {
          const isChecked = selected.includes(s.id);
          const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
          const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ';
          const shiftName = computeShiftName(s.startTime, s.shiftName);
          const roomName = s.roomName || 'P.101';
          const studentCount = s.studentCount || 45;
          const supervisorCount = s.supervisorCount || '2/2';

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : ''
              }`}
            >
              {/* Left: Checkbox + Code + Subject Title */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(s.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => onDetail(s)}
                  className="tabular-nums text-type-helper font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition shrink-0"
                >
                  <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                </button>
                <div className="min-w-0">
                  <h4
                    onClick={() => onDetail(s)}
                    className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition truncate"
                  >
                    {s.subjectName || s.subject?.name || `Môn học #${s.subjectId || s.id}`}
                  </h4>
                  <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 truncate">
                    {periodName} • {roomName} • {shiftName}
                  </p>
                </div>
              </div>

              {/* Middle: Date + Time */}
              <div className="hidden lg:flex items-center gap-4 text-type-helper font-medium text-slate-600 dark:text-slate-400 shrink-0">
                <span>{formatDate(s.examDate)}</span>
                <span>{s.startTime || '07:00'} - {s.endTime || '09:00'}</span>
                <span>{studentCount} TS</span>
              </div>

              {/* Right: Status & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {getStatusBadge(s.statusBadge || s.status, s)}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetail(s)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <>
                      {onReschedule && (
                        <button
                          type="button"
                          onClick={() => onReschedule(s)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                          title="Dời lịch thi"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </button>
                      )}
                      {onCancel && s.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => onCancel(s)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Hủy ca thi"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="ui-table w-full text-left text-type-body-sm text-slate-700 dark:text-slate-300 border-collapse">
        <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-type-helper font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800">
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
                      className="cursor-pointer"
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
                    {getStatusBadge(s.statusBadge || s.status, s)}
                  </td>
                )}

                {/* Thao tác */}
                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

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
                                  {onReschedule && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closeMenu();
                                        onReschedule(s);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 cursor-pointer text-type-body font-medium transition select-none"
                                    >
                                      <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                      <span>Dời lịch thi</span>
                                    </button>
                                  )}
                                  {onCancel && s.status !== 'CANCELLED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closeMenu();
                                        onCancel(s);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 cursor-pointer text-type-body font-medium transition select-none"
                                    >
                                      <Ban className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                      <span>Hủy ca thi</span>
                                    </button>
                                  )}
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
