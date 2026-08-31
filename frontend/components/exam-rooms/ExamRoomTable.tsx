'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Monitor, DoorOpen, Users, Building, Building2, MoreVertical } from 'lucide-react';
import { ExamRoom } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

interface ExamRoomTableProps {
  rooms: ExamRoom[];
  selected: number[];
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (r: ExamRoom) => void;
  onEdit: (r: ExamRoom) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}

export function ExamRoomTable({
  rooms,
  selected,
  visibleColumns = {
    code: true,
    name: true,
    capacity: true,
    building: true,
    roomType: true,
    status: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
  onEdit,
  onDelete,
  isAdmin,
}: ExamRoomTableProps) {
  const allSelected = rooms.length > 0 && selected.length === rooms.length;

  const getTypeBadge = (type?: string) => {
    if (type === 'COMPUTER_LAB') {
      return <StatusBadge status="ROOM_COMPUTER" />;
    }
    return <StatusBadge status="ROOM_THEORY" />;
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'MAINTENANCE') {
      return <StatusBadge status="MAINTENANCE" />;
    }
    if (status === 'BUSY' || status === 'IN_USE') {
      return <StatusBadge status="BUSY" customLabel="Đang dùng" />;
    }
    return <StatusBadge status="READY" />;
  };

  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card">
      <table className="ui-table w-full text-left text-type-body-sm text-slate-700 dark:text-slate-300 border-collapse">
        <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-type-helper font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800">
          <tr>
            <th className="p-3.5 pl-4 text-center whitespace-nowrap w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.code !== false && <th className="p-3.5 whitespace-nowrap">Mã phòng</th>}
            {visibleColumns.name !== false && <th className="p-3.5 min-w-[180px]">Tên phòng thi</th>}
            {visibleColumns.capacity !== false && <th className="p-3.5 whitespace-nowrap text-center">Sức chứa</th>}
            {visibleColumns.building !== false && <th className="p-3.5 min-w-[140px]">Tòa nhà / Vị trí</th>}
            {visibleColumns.roomType !== false && <th className="p-3.5 whitespace-nowrap">Loại phòng</th>}
            {visibleColumns.status !== false && <th className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            <th className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
          {rooms.map((r) => {
            const isChecked = selected.includes(r.id);
            const codeText = r.roomCode || r.code || '';
            const nameText = r.roomName || r.name || '';
            const locText = r.building || r.location || 'Chưa cập nhật';

            return (
              <tr
                key={r.id}
                className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${isChecked ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(r.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
                      className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition leading-[22px] text-type-body"
                    >
                      {nameText}
                    </button>
                  </td>
                )}

                {visibleColumns.capacity !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center text-type-body">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{r.capacity} chỗ</span>
                  </td>
                )}

                {visibleColumns.building !== false && (
                  <td className="p-3.5 min-w-[140px] text-type-body font-medium text-slate-700 dark:text-slate-300">
                    {locText}
                  </td>
                )}

                {visibleColumns.roomType !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    {getTypeBadge(r.roomType)}
                  </td>
                )}

                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    {getStatusBadge(r.status)}
                  </td>
                )}

                {/* Actions */}
                <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <ActionDropdownPortal>
                      {(closeMenu) => (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(r);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer text-type-body font-medium transition select-none"
                          >
                            <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>Xem chi tiết</span>
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onEdit(r);
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
                                  onDelete(r.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-150 cursor-pointer select-none group"
                              >
                                <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors shrink-0" strokeWidth={1.5} />
                                <span>Xóa</span>
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
  );
}
