'use client';

import React, { useState } from 'react';
import { Eye, MoreVertical, Edit, Trash2, RotateCcw, Clock, Calendar, Users, Building } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { ExamSchedule } from '../../types';

import { StatusBadge } from '../common/StatusBadge';
import { formatExamType } from '../../lib/enum-labels';

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
 const m = parseInt(parts[1], 10);
 if (isNaN(h)) return fallbackShiftName || 'Ca 1 - Sáng';
 const totalMins = h * 60 + (isNaN(m) ? 0 : m);

 if (totalMins < 555) {
 return 'Ca 1 - Sáng';
 } else if (totalMins < 720) {
 return 'Ca 2 - Sáng';
 } else if (totalMins < 900) {
 return 'Ca 1 - Chiều';
 } else if (totalMins < 1080) {
 return 'Ca 2 - Chiều';
 } else {
 return 'Ca Tối';
 }
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

 const getStatusBadge = (st?: string, sched?: ExamScheduleItemExtended) => {
 const s = (sched ? computeScheduleStatus(sched) : st?.toUpperCase()) || 'UPCOMING';
 return <StatusBadge status={s} />;
 };

 // 1. Dạng Lưới (Grid View Mode)
 if (viewMode === 'grid') {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {schedules.map((s) => {
 const isChecked = selected.includes(s.id);
 const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
 const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ II 2023-2024';
 const shiftName = computeShiftName(s.startTime, s.shiftName);
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
 className=" tabular-nums text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
 >
 {codeText}
 </button>
 </div>
 {getStatusBadge(s.statusBadge || s.status, s)}
 </div>

 {/* Period & Shift Info */}
 <div>
 <span className="text-[13px] font-semibold text-blue-600">{shiftName}</span>
 <h4
 onClick={() => onDetail(s)}
 className="text-[15px] font-semibold text-[#0F172A] leading-snug cursor-pointer hover:text-blue-600 transition line-clamp-2"
 >
 {periodName}
 </h4>
 </div>

 {/* Details */}
 <div className="grid grid-cols-2 gap-2 text-[15px] font-medium text-[#334155] pt-1">
 <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
 <Building className="h-4 w-4 text-blue-500 shrink-0" />
 <span>Phòng {roomName}</span>
 </div>
 <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
 <Users className="h-4 w-4 text-slate-500 shrink-0" />
 <span>{studentCount} TS ({supervisorCount} GT)</span>
 </div>
 </div>

 {/* Date & Time */}
 <div className="text-[14px] font-normal text-[#64748B] flex items-center justify-between pt-1">
 <span>Ngày: <strong className="text-[#0F172A] font-semibold">{formatDate(s.examDate)}</strong></span>
 <span>{s.startTime || '07:00'} - {s.endTime || '09:00'}</span>
 </div>
 </div>

 {/* Actions Footer */}
 <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
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
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] dark:text-slate-200 border-collapse">
 <thead className="bg-slate-50 dark:bg-slate-800/90 text-[14px] font-semibold tracking-wider text-[#475569] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th scope="col" className="p-2 pl-3 text-center w-8">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-normal">
 {schedules.map((s) => {
 const isChecked = selected.includes(s.id);
 const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
 const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ II 2023-2024';
 const shiftName = computeShiftName(s.startTime, s.shiftName);
 const roomName = s.roomName || 'P.101';

 return (
 <tr key={s.id} className={`transition hover:bg-slate-50/60 dark:hover:bg-slate-800/90 ${isChecked ? 'bg-blue-50/50 dark:bg-blue-950/60' : ''}`}>
 <td className="p-2 pl-3 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(s.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>
 <td className="p-2 whitespace-nowrap">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className=" tabular-nums text-[15px] leading-[22px] font-semibold text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
 >
 {codeText}
 </button>
 </td>
 <td className="p-2 min-w-[200px]">
 <button type="button" className="block truncate font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB]" onClick={() => onDetail(s)}>
 {periodName}
 </button>
 </td>
 <td className="p-2 whitespace-nowrap font-normal text-[#334155]">{shiftName}</td>
 <td className="p-2 whitespace-nowrap font-medium text-[#0F172A]">{roomName}</td>
 <td className="p-2 whitespace-nowrap font-normal text-[#334155]">{formatDate(s.examDate)}</td>
 <td className="p-2 whitespace-nowrap">{getStatusBadge(s.statusBadge || s.status, s)}</td>
 <td className="p-2 pr-3 text-right whitespace-nowrap">
 <button type="button" onClick={() => onDetail(s)} className="p-1 text-slate-500 hover:text-[#2563EB] cursor-pointer">
 <Eye className="h-4 w-4" />
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
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] dark:text-slate-200 border-collapse">
 <thead className="bg-slate-50 dark:bg-slate-800/90 text-[14px] font-semibold tracking-wider text-[#475569] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
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
 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
 {schedules.map((s, index) => {
 const isChecked = selected.includes(s.id);
 const codeText = s.code || `LCT${String(s.id + 120).padStart(6, '0')}`;
 const periodName = s.periodName || s.examPeriod?.name || 'Thi học kỳ II 2023-2024';
 const shiftName = computeShiftName(s.startTime, s.shiftName);
 const roomName = s.roomName || 'P.101';
 const studentCount = s.studentCount || 45;
 const supervisorCount = s.supervisorCount || '2/2';
 const isLastRow = index >= Math.floor(schedules.length / 2);

 return (
 <tr
 key={s.id}
 className={`transition hover:bg-blue-50/40 dark:hover:bg-slate-800/90 ${
 isChecked ? 'bg-blue-50/60 dark:bg-blue-950/60' : ''
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
 <td className="p-3.5 whitespace-nowrap">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className=" tabular-nums text-[15px] leading-[22px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
 >
 {codeText}
 </button>
 </td>
 )}

 {/* Kỳ thi */}
 {visibleColumns.period !== false && (
 <td className="p-3.5 min-w-[200px]">
 <div className="space-y-0.5">
 <button
 type="button"
 className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition text-[15px] leading-[22px]"
 onClick={() => onDetail(s)}
 >
 {periodName}
 </button>
 <p className="text-[15px] leading-[22px] font-normal text-[#64748B]">
 {formatExamType(s.examType)}
 </p>
 </div>
 </td>
 )}

 {/* Ca thi */}
 {visibleColumns.shift !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-700 text-[15px]">
 {shiftName}
 </td>
 )}

 {/* Phòng thi */}
 {visibleColumns.room !== false && (
 <td className="p-3.5 whitespace-nowrap text-[15px]">
 {roomName === 'Chưa xếp phòng' || !roomName ? (
 <span className="font-medium text-slate-500">Chưa xếp phòng</span>
 ) : (
 <span className="font-semibold text-slate-900">{roomName}</span>
 )}
 </td>
 )}

 {/* Ngày thi */}
 {visibleColumns.date !== false && (
 <td className="p-3.5 whitespace-nowrap font-semibold text-slate-900 text-[15px]">
 {formatDate(s.examDate)}
 </td>
 )}

 {/* Giờ bắt đầu */}
 {visibleColumns.startTime !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-600 text-[15px]">
 {s.startTime || '07:00'}
 </td>
 )}

 {/* Giờ kết thúc */}
 {visibleColumns.endTime !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-600 text-[15px]">
 {s.endTime || '09:00'}
 </td>
 )}

 {/* Số TS */}
 {visibleColumns.students !== false && (
 <td className="p-3.5 whitespace-nowrap font-semibold text-slate-900 text-[15px]">
 {studentCount}
 </td>
 )}

 {/* Giám thị */}
 {visibleColumns.supervisors !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-500 text-[15px]">
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
 className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition cursor-pointer"
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
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155] cursor-pointer"
 >
 <Eye className="h-4 w-4 text-[#64748B]" />
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
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#2563EB] cursor-pointer"
 >
 <RotateCcw className="h-4 w-4 text-[#2563EB]" />
 <span>Khôi phục lịch thi</span>
 </button>
 <div className="my-1 border-t border-[#E2E8F0]" />
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onHardDelete?.(s.id);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626] cursor-pointer"
 >
 <Trash2 className="h-4 w-4 text-[#DC2626]" />
 <span>Xóa vĩnh viễn</span>
 </button>
 </>
 ) : (
 <>
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onEdit(s);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155] cursor-pointer"
 >
 <Edit className="h-4 w-4 text-[#2563EB]" />
 <span>Chỉnh sửa ca thi</span>
 </button>
 <div className="my-1 border-t border-[#E2E8F0]" />
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onDelete(s.id);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626] cursor-pointer"
 >
 <Trash2 className="h-4 w-4 text-[#DC2626]" />
 <span>Xóa ca thi</span>
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
