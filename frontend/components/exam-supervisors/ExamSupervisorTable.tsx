'use client';

import React from 'react';
import { Eye, Edit, Trash2, ShieldCheck, DoorOpen, GraduationCap, User } from 'lucide-react';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { StatusBadge, StatusType } from '../common/StatusBadge';

interface ExamSupervisorTableProps {
  supervisors: any[];
  selected: number[];
  viewMode: 'list' | 'grid' | 'compact';
  visibleColumns: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onView: (supervisor: any) => void;
  onDelete: (id: number, teacherName: string) => void;
  isAdmin?: boolean;
}

export function ExamSupervisorTable({
  supervisors,
  selected,
  viewMode,
  visibleColumns,
  onSelect,
  onSelectAll,
  onView,
  onDelete,
  isAdmin = true,
}: ExamSupervisorTableProps) {
  const allSelected = supervisors.length > 0 && supervisors.every((s) => selected.includes(s.id));
  const someSelected = supervisors.some((s) => selected.includes(s.id)) && !allSelected;

  const renderStatusBadge = (status: string) => {
    const validStatuses: StatusType[] = [
      'CONFIRMED',
      'CHANGE_REQUESTED',
      'COMPLETED',
      'ABSENT',
      'REJECTED',
      'PENDING',
    ];
    const normalized = validStatuses.includes(status as StatusType) ? (status as StatusType) : 'PENDING';
    return <StatusBadge status={normalized} />;
  };

  /* 1. Grid View */
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {supervisors.map((s) => {
          const isChecked = selected.includes(s.id);
          const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
          const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;

          return (
            <div
              key={s.id}
              className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-2xs transition-all hover:shadow-md flex flex-col justify-between ${
                isChecked
                  ? 'border-blue-500 bg-blue-50/20 dark:border-blue-500'
                  : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onSelect(s.id, e.target.checked)}
                        className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    )}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                        {s.teacher?.fullName || '—'}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <IdentifierBadge tone="blue">{s.teacher?.teacherCode || 'GV'}</IdentifierBadge>
                        <span className="text-type-helper text-slate-500">{s.teacher?.degree || 'TS'}</span>
                      </div>
                    </div>
                  </div>

                  <div>{renderStatusBadge(s.status)}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-type-helper text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <DoorOpen className="h-3.5 w-3.5" /> Phòng thi:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{rName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Vai trò:
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-type-helper font-semibold ${
                        s.role === 'SUPERVISOR_1'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {s.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2 (Phụ)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-type-helper font-semibold">
                <button
                  type="button"
                  onClick={() => onView(s)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onView(s)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Đổi ca"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id, s.teacher?.fullName || 'cán bộ')}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Hủy phân công"
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

  /* 2. Compact View */
  if (viewMode === 'compact') {
    return (
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {supervisors.map((s) => {
          const isChecked = selected.includes(s.id);
          const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
          const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                isChecked ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isAdmin && (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(s.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                )}
                <IdentifierBadge tone="blue">{s.teacher?.teacherCode || 'GV'}</IdentifierBadge>
                <span className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {s.teacher?.fullName || '—'}
                </span>
                <span className="text-type-helper text-slate-400 truncate">({s.teacher?.degree || 'TS'})</span>
                <span className="text-type-helper font-medium text-slate-600 dark:text-slate-300">· {rName}</span>
                <span className="text-type-helper font-semibold text-blue-600">
                  · {s.role === 'SUPERVISOR_1' ? 'GT1' : 'GT2'}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {renderStatusBadge(s.status)}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onView(s)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => onView(s)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                        title="Đổi ca"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id, s.teacher?.fullName || 'cán bộ')}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Hủy phân công"
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

  /* 3. Standard List / Table View */
  return (
    <div className="ui-table-wrap overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <div className="overflow-x-auto">
        <table className="ui-table w-full text-left text-type-body text-slate-600 dark:text-slate-300">
          <thead className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/75 font-medium text-slate-700 dark:text-slate-200">
            <tr>
              {isAdmin && (
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              {visibleColumns.code && <th className="px-4 py-3.5 whitespace-nowrap">Mã Cán Bộ</th>}
              {visibleColumns.name && <th className="px-4 py-3.5 whitespace-nowrap">Họ và Tên</th>}
              {visibleColumns.room && <th className="px-4 py-3.5 whitespace-nowrap">Phòng Thi</th>}
              {visibleColumns.role && <th className="px-4 py-3.5 whitespace-nowrap">Vai Trò</th>}
              {visibleColumns.status && <th className="px-4 py-3.5 whitespace-nowrap text-center">Trạng Thái</th>}
              {visibleColumns.note && <th className="px-4 py-3.5 whitespace-nowrap">Ghi Chú</th>}
              <th className="px-4 py-3.5 text-right whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {supervisors.map((s) => {
              const isChecked = selected.includes(s.id);
              const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
              const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;

              return (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                    isChecked ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
                  }`}
                >
                  {isAdmin && (
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onSelect(s.id, e.target.checked)}
                        className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}

                  {visibleColumns.code && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <IdentifierBadge tone="blue">{s.teacher?.teacherCode || 'GV'}</IdentifierBadge>
                    </td>
                  )}

                  {visibleColumns.name && (
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {s.teacher?.fullName || '—'}
                      </div>
                      <div className="text-type-body text-slate-400 font-normal">
                        Học vị: {s.teacher?.degree || 'TS'}
                      </div>
                    </td>
                  )}

                  {visibleColumns.room && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                        {rName}
                      </span>
                    </td>
                  )}

                  {visibleColumns.role && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-type-body font-semibold ${
                          s.role === 'SUPERVISOR_1'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {s.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2 (Phụ)'}
                      </span>
                    </td>
                  )}

                  {visibleColumns.status && (
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      {renderStatusBadge(s.status)}
                    </td>
                  )}

                  {visibleColumns.note && (
                    <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-500">
                      {s.note || '—'}
                    </td>
                  )}

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDelete(s.id, s.teacher?.fullName || 'cán bộ')}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Hủy phân công"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
