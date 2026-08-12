'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Monitor, DoorOpen, Users, Building, MoreVertical } from 'lucide-react';
import { ExamRoom } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
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
 const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
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
 className=" tabular-nums text-xs font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer"
 >
 {codeText}
 </button>
 </div>

 {getStatusBadge(r.status)}
 </div>

 <div className="flex items-center justify-between gap-2">
 <h4
 onClick={() => onDetail(r)}
 className="text-sm font-semibold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
 >
 {nameText}
 </h4>

 {getTypeBadge(r.roomType)}
 </div>

 <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-1">
 <div className="flex items-center gap-1.5">
 <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="truncate">{locText}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span>Sức chứa: <strong className="font-semibold text-slate-900">{r.capacity} thí sinh</strong></span>
 </div>
 </div>
 </div>

 {/* Action Toolbar */}
 <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
 <button
 type="button"
 onClick={() => onDetail(r)}
 className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
 >
 <Eye className="h-3.5 w-3.5" /> Chi tiết
 </button>

 {isAdmin && (
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => onEdit(r)}
 className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
 title="Sửa phòng thi"
 >
 <Edit className="h-3.5 w-3.5" />
 </button>
 <button
 type="button"
 onClick={() => onDelete(r.id)}
 className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
 title="Xóa phòng thi"
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

 // 2. Dạng Bảng Chuẩn (List View Mode)
 return (
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th className="p-3.5 pl-4 text-center whitespace-nowrap w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
 <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
 {rooms.map((r, index) => {
 const isChecked = selected.includes(r.id);
 const isLastRow = index >= Math.floor(rooms.length / 2);
 const codeText = r.roomCode || r.code || '';
 const nameText = r.roomName || r.name || '';
 const locText = r.building || r.location || 'Chưa cập nhật';

 return (
 <tr
 key={r.id}
 className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}
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
 <td className="p-3.5 whitespace-nowrap">
 <button
 type="button"
 onClick={() => onDetail(r)}
 className=" tabular-nums text-[14px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
 >
 {codeText}
 </button>
 </td>
 )}

 {visibleColumns.name !== false && (
 <td className="p-3.5 min-w-[180px]">
 <button
 type="button"
 onClick={() => onDetail(r)}
 className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition leading-tight text-xs"
 >
 {nameText}
 </button>
 </td>
 )}

 {visibleColumns.capacity !== false && (
 <td className="p-3.5 whitespace-nowrap text-center text-[15px]">
 <span className="font-semibold text-slate-900">{r.capacity} chỗ</span>
 </td>
 )}

 {visibleColumns.building !== false && (
 <td className="p-3.5 min-w-[140px] text-[15px] font-semibold text-slate-700">
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

 {/* Actions dropdown / buttons */}
 <td className="p-3.5 pr-4 text-right whitespace-nowrap">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 onClick={() => onDetail(r)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
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
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
 >
 <Eye className="h-3.5 w-3.5 text-slate-500" /> Xem chi tiết
 </button>

 {isAdmin && (
 <>
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onEdit(r);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-blue-600"
 >
 <Edit className="h-3.5 w-3.5" /> Chỉnh sửa
 </button>
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onDelete(r.id);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
 >
 <Trash2 className="h-3.5 w-3.5" /> Xóa phòng
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
