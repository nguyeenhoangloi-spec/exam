'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Monitor, DoorOpen, Users, Building, MoreVertical } from 'lucide-react';
import { ExamRoom } from '../../types';

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
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = rooms.length > 0 && selected.length === rooms.length;

  const getTypeBadge = (type?: string) => {
    if (type === 'COMPUTER_LAB') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
          <Monitor className="h-3.5 w-3.5" /> Phòng Máy tính
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-200">
        <DoorOpen className="h-3.5 w-3.5" /> Phòng Lý thuyết
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'MAINTENANCE') {
      return (
        <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
          Bảo trì
        </span>
      );
    }
    if (status === 'BUSY' || status === 'IN_USE') {
      return (
        <span className="inline-flex items-center rounded-lg bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
          Đang thi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
        Sẵn sàng
      </span>
    );
  };

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((r) => {
          const isChecked = selected.includes(r.id);
          const codeText = r.roomCode || r.code || '';
          const nameText = r.roomName || r.name || '';
          const locText = r.building || r.location || 'Tòa nhà A';

          return (
            <div
              key={r.id}
              className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(r.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {codeText}
                    </button>
                  </div>
                  {getTypeBadge(r.roomType)}
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(r)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {nameText}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Sức chứa: <strong>{r.capacity ?? 0} chỗ</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Building className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span>{locText}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(r)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
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
              <th scope="col" className="p-2 whitespace-nowrap">Mã phòng</th>
              <th scope="col" className="p-2 min-w-[180px]">Tên phòng thi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Sức chứa</th>
              <th scope="col" className="p-2 whitespace-nowrap">Tòa nhà</th>
              <th scope="col" className="p-2 whitespace-nowrap">Loại phòng</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rooms.map((r) => {
              const isChecked = selected.includes(r.id);
              const codeText = r.roomCode || r.code || '';
              const nameText = r.roomName || r.name || '';
              const locText = r.building || r.location || 'Tòa nhà A';

              return (
                <tr key={r.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(r.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">
                    <button type="button" onClick={() => onDetail(r)} className="rounded px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100">
                      {codeText}
                    </button>
                  </td>
                  <td className="p-2 min-w-[180px]">
                    <p className="truncate font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(r)}>
                      {nameText}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{r.capacity ?? 0} chỗ</td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-800">{locText}</td>
                  <td className="p-2 whitespace-nowrap">{getTypeBadge(r.roomType)}</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(r)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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

  // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
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
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã phòng</th>}
            {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[200px]">Tên phòng thi</th>}
            {visibleColumns.capacity !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Sức chứa</th>}
            {visibleColumns.building !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Tòa nhà / Vị trí</th>}
            {visibleColumns.roomType !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Loại phòng</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {rooms.map((r) => {
            const isChecked = selected.includes(r.id);
            const codeText = r.roomCode || r.code || '';
            const nameText = r.roomName || r.name || '';
            const locText = r.building || r.location || 'Tòa nhà A';

            return (
              <tr
                key={r.id}
                className={`transition hover:bg-blue-50/40 ${
                  isChecked ? 'bg-blue-50/60' : ''
                }`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(r.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {codeText}
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        {r.roomType === 'COMPUTER_LAB' ? (
                          <Monitor className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <DoorOpen className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                      <span
                        onClick={() => onDetail(r)}
                        className="cursor-pointer hover:text-blue-600 transition"
                      >
                        {nameText}
                      </span>
                    </div>
                  </td>
                )}

                {visibleColumns.capacity !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                      <Users className="h-3.5 w-3.5 text-slate-400" /> {r.capacity ?? 0} Chỗ
                    </span>
                  </td>
                )}

                {visibleColumns.building !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
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

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onDetail(r)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === r.id ? null : r.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === r.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDetail(r);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xem chi tiết</span>
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(r);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-blue-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Chỉnh sửa phòng</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(r.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa phòng thi</span>
                              </button>
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
