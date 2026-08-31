'use client';

import React from 'react';
import { Eye, Edit, Trash2, ShieldCheck, DoorOpen, GraduationCap, User } from 'lucide-react';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { StatusBadge, StatusType } from '../common/StatusBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

interface ExamSupervisorTableProps {
  supervisors: any[];
  selected: number[];
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

  /* Standard List / Table View */
  return (
    <div className="ui-table-wrap overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card">
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
                        className={`text-type-body font-medium ${
                          s.role === 'SUPERVISOR_1'
                            ? 'text-slate-900 dark:text-slate-100 font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
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

                  <td className="px-4 py-3.5 text-right whitespace-nowrap relative">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionDropdownPortal>
                        {(closeMenu) => (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onView(s);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                            >
                              <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <span>Xem chi tiết</span>
                            </button>
                            {isAdmin && (
                              <>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onDelete(s.id, s.teacher?.fullName || 'cán bộ');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-150 cursor-pointer select-none group"
                                >
                                  <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors shrink-0" strokeWidth={1.5} />
                                  <span>Hủy phân công</span>
                                </button>
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
    </div>
  );
}
