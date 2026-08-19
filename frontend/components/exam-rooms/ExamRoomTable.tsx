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
  viewMode?: 'list' | 'grid' | 'compact';
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
  viewMode = 'list',
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

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((r) => {
          const isChecked = selected.includes(r.id);
          const codeText = r.roomCode || r.code || '';
          const nameText = r.roomName || r.name || '';
          const locText = r.building || r.location || 'Chưa cập nhật';

          return (
            <div
              key={r.id}
              className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(r.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
                      className="tabular-nums text-type-helper font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                    >
                      <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
                    </button>
                  </div>

                  {getStatusBadge(r.status)}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h4
                    onClick={() => onDetail(r)}
                    className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition truncate"
                  >
                    {nameText}
                  </h4>
                  {getTypeBadge(r.roomType)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-type-helper font-medium text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700/60">
                    <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Sức chứa: <strong className="font-semibold text-slate-800 dark:text-slate-200">{r.capacity} chỗ</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700/60">
                    <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{locText}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-type-helper font-semibold">
                <button
                  type="button"
                  onClick={() => onDetail(r)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
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
        {rooms.map((r) => {
          const isChecked = selected.includes(r.id);
          const codeText = r.roomCode || r.code || '';
          const nameText = r.roomName || r.name || '';
          const locText = r.building || r.location || 'Chưa cập nhật';

          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(r.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => onDetail(r)}
                  className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition truncate text-left"
                >
                  {nameText}
                </button>
                <IdentifierBadge tone="neutral">{codeText}</IdentifierBadge>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-type-helper text-slate-500 dark:text-slate-400">
                <span>{r.capacity} chỗ</span>
                <span className="hidden sm:inline-block">{locText}</span>
                {getTypeBadge(r.roomType)}
                {getStatusBadge(r.status)}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetail(r)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
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

  // 3. Dạng Bảng Chuẩn (List View Mode)
  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
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
                      className="cursor-pointer"
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
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
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
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer text-type-body font-medium transition select-none"
                              >
                                <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
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
