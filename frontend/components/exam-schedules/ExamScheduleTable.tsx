'use client';

import React, { useState } from 'react';
import { Eye, MoreVertical, Edit, Trash2, RotateCcw, Clock, Calendar, Users, Building } from 'lucide-react';
import { ExamSchedule } from '../../types';

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
  subject?: any;
  examPeriod?: any;
  examScheduleRooms?: any[];
}

interface ExamScheduleTableProps {
  schedules: ExamScheduleItemExtended[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  isTrash?: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (s: ExamScheduleItemExtended) => void;
  onEdit: (s: ExamScheduleItemExtended) => void;
  onDelete: (id: number) => void;
  onRestore?: (id: number) => void;
  onHardDelete?: (id: number) => void;
  isAdmin: boolean;
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
    startTime: true,
    endTime: true,
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
  onRestore,
  onHardDelete,
  isAdmin,
}: ExamScheduleTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = schedules.length > 0 && selected.length === schedules.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (st?: string) => {
    const s = st?.toUpperCase() || 'UPCOMING';
    if (s === 'ONGOING' || s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
          Đang diễn ra
        </span>
      );
    }
    if (s === 'COMPLETED' || s === 'FINISHED') {
      return (
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
          Đã diễn ra
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'REJECTED') {
      return (
        <span className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
          Đã hủy
        </span>
      );
    }
    // Default UPCOMING
    return (
      <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
        Sắp diễn ra
      </span>
    );
  };

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {schedules.map((s) => {
          const isChecked = selected.includes(s.id);
          const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
          const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ II 2023-2024';
          const shiftName = s.shiftName || 'Ca 1 - Sáng';
          const roomName = s.roomName || 'P.101';
          const studentCount = s.studentCount || 45;
          const supervisorCount = s.supervisorCount || '2/2';

          return (
            <div
              key={s.id}
              className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              <div className="space-y-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(s.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {codeText}
                    </button>
                  </div>
                  {getStatusBadge(s.statusBadge || s.status)}
                </div>

                {/* Period & Shift Info */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{shiftName}</span>
                  <h4
                    onClick={() => onDetail(s)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition line-clamp-2"
                  >
                    {periodName}
                  </h4>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Building className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Phòng {roomName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Users className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span>{studentCount} TS ({supervisorCount} GT)</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between pt-1">
                  <span>Ngày: <strong className="text-slate-800">{formatDate(s.examDate)}</strong></span>
                  <span>{s.startTime || '07:00'} - {s.endTime || '09:00'}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(s)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
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

  // 2. Dạng Thu Gọn (Compact View Mode)
  if (viewMode === 'compact') {
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="p-2 whitespace-nowrap">Mã lịch</th>
              <th scope="col" className="p-2 min-w-[200px]">Kỳ thi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Ca thi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Phòng thi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Ngày thi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Trạng thái</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {schedules.map((s) => {
              const isChecked = selected.includes(s.id);
              const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
              const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ II 2023-2024';
              const shiftName = s.shiftName || 'Ca 1 - Sáng';
              const roomName = s.roomName || 'P.101';

              return (
                <tr key={s.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(s.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">
                    <button type="button" onClick={() => onDetail(s)} className="rounded px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100">
                      {codeText}
                    </button>
                  </td>
                  <td className="p-2 min-w-[200px]">
                    <p className="truncate font-semibold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(s)}>
                      {periodName}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{shiftName}</td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-800">{roomName}</td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{formatDate(s.examDate)}</td>
                  <td className="p-2 whitespace-nowrap">{getStatusBadge(s.statusBadge || s.status)}</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(s)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Dạng Danh Sách Chuẩn (List View Mode - Default matching Mockup Image 100%)
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="w-full text-left text-xs text-slate-700 border-collapse">
        <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            <th scope="col" className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã lịch thi</th>}
            {visibleColumns.period !== false && <th scope="col" className="p-3.5 min-w-[200px]">Kỳ thi</th>}
            {visibleColumns.shift !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Ca thi</th>}
            {visibleColumns.room !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Phòng thi</th>}
            {visibleColumns.date !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Ngày thi ↕</th>}
            {visibleColumns.startTime !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Giờ bắt đầu</th>}
            {visibleColumns.endTime !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Giờ kết thúc</th>}
            {visibleColumns.students !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số TS</th>}
            {visibleColumns.supervisors !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Giám thị</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {schedules.map((s) => {
            const isChecked = selected.includes(s.id);
            const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
            const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ II 2023-2024';
            const shiftName = s.shiftName || 'Ca 1 - Sáng';
            const roomName = s.roomName || 'P.101';
            const studentCount = s.studentCount || 45;
            const supervisorCount = s.supervisorCount || '2/2';

            return (
              <tr
                key={s.id}
                className={`transition hover:bg-blue-50/40 ${
                  isChecked ? 'bg-blue-50/60' : ''
                }`}
              >
                {/* Checkbox */}
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(s.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {/* Mã lịch thi */}
                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {codeText}
                    </button>
                  </td>
                )}

                {/* Kỳ thi */}
                {visibleColumns.period !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <p
                      className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                      onClick={() => onDetail(s)}
                    >
                      {periodName}
                    </p>
                  </td>
                )}

                {/* Ca thi */}
                {visibleColumns.shift !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {shiftName}
                  </td>
                )}

                {/* Phòng thi */}
                {visibleColumns.room !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    {roomName}
                  </td>
                )}

                {/* Ngày thi */}
                {visibleColumns.date !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-900">
                    {formatDate(s.examDate)}
                  </td>
                )}

                {/* Giờ bắt đầu */}
                {visibleColumns.startTime !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {s.startTime || '07:00'}
                  </td>
                )}

                {/* Giờ kết thúc */}
                {visibleColumns.endTime !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {s.endTime || '09:00'}
                  </td>
                )}

                {/* Số TS */}
                {visibleColumns.students !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-900">
                    {studentCount}
                  </td>
                )}

                {/* Giám thị */}
                {visibleColumns.supervisors !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {supervisorCount}
                  </td>
                )}

                {/* Trạng thái */}
                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    {getStatusBadge(s.statusBadge || s.status)}
                  </td>
                )}

                {/* Thao tác */}
                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    {/* Detail Eye button */}
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* 3 Dots Menu button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === s.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDetail(s);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xem chi tiết</span>
                          </button>

                          {isAdmin && (
                            <>
                              {isTrash ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onRestore?.(s.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-emerald-50 text-emerald-600"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>Khôi phục lịch thi</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onHardDelete?.(s.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Xóa vĩnh viễn</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onEdit(s);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-blue-600"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                    <span>Chỉnh sửa lịch thi</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onDelete(s.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Xóa lịch thi</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
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
