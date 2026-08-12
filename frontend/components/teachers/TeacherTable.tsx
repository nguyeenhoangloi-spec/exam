'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, GraduationCap, Building2, Mail, Phone, MoreVertical, Lock, Unlock } from 'lucide-react';
import { Teacher } from '../../types';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../common/StatusBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

const DEGREE_BADGE: Record<string, string> = {
 'GS.TS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
 'PGS.TS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
 'TS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
 'ThS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
};

interface TeacherTableProps {
 teachers: Teacher[];
 selected: number[];
 viewMode?: 'list' | 'grid' | 'compact';
 visibleColumns?: Record<string, boolean>;
 onSelect: (id: number, checked: boolean) => void;
 onSelectAll: (checked: boolean) => void;
 onDetail: (t: Teacher) => void;
 onEdit: (t: Teacher) => void;
 onDelete: (id: number) => void;
 onToggleLock?: (t: Teacher) => void;
 isAdmin: boolean;
}

export function TeacherTable({
 teachers,
 selected,
 viewMode = 'list',
 visibleColumns = {
 teacherCode: true,
 fullName: true,
 degree: true,
 department: true,
 email: true,
 phone: true,
 },
 onSelect,
 onSelectAll,
 onDetail,
 onEdit,
 onDelete,
 onToggleLock,
 isAdmin,
}: TeacherTableProps) {
 const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
 const allSelected = teachers.length > 0 && selected.length === teachers.length;

 // 1. Dạng Lưới (Grid View Mode)
 if (viewMode === 'grid') {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {teachers.map((t) => {
 const isChecked = selected.includes(t.id);
 const degreeBadge = DEGREE_BADGE[t.degree] || 'bg-slate-50 text-slate-600 border-slate-200';
 const isLocked = t.user?.status === 'LOCKED';

 return (
 <div
 key={t.id}
 className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
 }`}
 >
 <div className="space-y-2.5">
 <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(t.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <button
 type="button"
 onClick={() => onDetail(t)}
 className=" tabular-nums text-[14px] font-medium text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
 >
 {t.teacherCode}
 </button>
 </div>

 <div className="flex items-center gap-1.5">
 {isLocked && <StatusBadge status="LOCKED" customLabel="Đã khóa" />}
 <Badge tone="blue" leftIcon={<GraduationCap className="h-3.5 w-3.5" />}>
 {t.degree || 'TS'}
 </Badge>
 </div>
 </div>

 <div>
 <h4
 onClick={() => onDetail(t)}
 className="text-[18px] font-semibold text-[#0F172A] leading-snug cursor-pointer hover:text-[#2563EB] transition"
 >
 {t.fullName}
 </h4>
 </div>

 <div className="space-y-1.5 text-[14px] text-[#475569] font-normal pt-1">
 <div className="flex items-center gap-1.5">
 <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
 <span className="truncate">{t.department?.name || '---'}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Mail className="h-4 w-4 text-slate-400 shrink-0" />
 <span className="truncate text-[#64748B]">{t.email}</span>
 </div>
 {t.phone && (
 <div className="flex items-center gap-1.5">
 <Phone className="h-4 w-4 text-slate-400 shrink-0" />
 <span>{t.phone}</span>
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[14px] font-medium">
 <button
 type="button"
 onClick={() => onDetail(t)}
 className="flex items-center gap-1 text-[#2563EB] hover:text-blue-700 cursor-pointer"
 >
 <Eye className="h-3.5 w-3.5" />
 <span>Xem hồ sơ</span>
 </button>

 {isAdmin && (
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => onEdit(t)}
 className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
 title="Chỉnh sửa"
 >
 <Edit className="h-3.5 w-3.5" />
 </button>
 <button
 type="button"
 onClick={() => onDelete(t.id)}
 className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th className="p-2 pl-3 text-center w-8">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 <th className="p-2 whitespace-nowrap">Mã GV</th>
 <th className="p-2 min-w-[160px]">Họ và tên</th>
 <th className="p-2 whitespace-nowrap">Học vị</th>
 <th className="p-2 min-w-[140px]">Khoa</th>
 <th className="p-2 min-w-[170px]">Email</th>
 <th className="p-2 whitespace-nowrap">SĐT</th>
 <th className="p-2 pr-3 text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {teachers.map((t) => {
 const isChecked = selected.includes(t.id);
 const degreeBadge = DEGREE_BADGE[t.degree] || 'bg-slate-50 text-slate-600 border-slate-200';
 return (
 <tr key={t.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
 <td className="p-2 pl-3 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(t.id, e.target.checked)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>
 <td className="p-2 font-medium text-slate-700 tabular-nums whitespace-nowrap">{t.teacherCode}</td>
 <td className="p-2 min-w-[160px]">
 <button
 type="button"
 onClick={() => onDetail(t)}
 className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition"
 >
 {t.fullName}
 </button>
 </td>
 <td className="p-2 whitespace-nowrap">
 <Badge tone="blue" leftIcon={<GraduationCap className="h-3.5 w-3.5" />}>
 {t.degree || 'TS'}
 </Badge>
 </td>
 <td className="p-2 text-slate-700 min-w-[140px]">{t.department?.name || '---'}</td>
 <td className="p-2 text-slate-500 min-w-[170px]">{t.email}</td>
 <td className="p-2 whitespace-nowrap text-slate-600">{t.phone || '---'}</td>
 <td className="p-2 pr-3 text-right whitespace-nowrap">
 <button type="button" onClick={() => onDetail(t)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th className="p-3.5 pl-4 text-center w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 {visibleColumns.teacherCode !== false && <th className="p-3.5 whitespace-nowrap">Mã giảng viên</th>}
 {visibleColumns.fullName !== false && <th className="p-3.5 min-w-[200px]">Họ và Tên</th>}
 {visibleColumns.degree !== false && <th className="p-3.5 whitespace-nowrap">Học vị</th>}
 {visibleColumns.department !== false && <th className="p-3.5 min-w-[160px]">Khoa trực thuộc</th>}
 {visibleColumns.email !== false && <th className="p-3.5 min-w-[200px]">Email công vụ</th>}
 {visibleColumns.phone !== false && <th className="p-3.5 whitespace-nowrap">Số điện thoại</th>}
 <th className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {teachers.map((t, index) => {
 const isChecked = selected.includes(t.id);
 const degreeBadge = DEGREE_BADGE[t.degree] || 'bg-slate-50 text-slate-600 border-slate-200';
 const isLastRow = index >= Math.floor(teachers.length / 2);

 return (
 <tr
 key={t.id}
 className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''}`}
 >
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(t.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {visibleColumns.teacherCode !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <button
 type="button"
 onClick={() => onDetail(t)}
 className=" tabular-nums text-[14px] font-medium text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
 >
 {t.teacherCode}
 </button>
 </td>
 )}

 {visibleColumns.fullName !== false && (
 <td className="p-3.5 min-w-[200px]">
 <button
 type="button"
 onClick={() => onDetail(t)}
 className="font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB] transition leading-tight text-[15px]"
 >
 {t.fullName}
 </button>
 </td>
 )}

 {visibleColumns.degree !== false && (
 <td className="p-3.5 whitespace-nowrap text-[15px] font-medium text-slate-800">
 {t.degree || 'TS'}
 </td>
 )}

 {visibleColumns.department !== false && (
 <td className="p-3.5 min-w-[160px]">
 <div className="flex items-center gap-1.5">
 <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="text-slate-700 font-normal">{t.department?.name || '---'}</span>
 </div>
 </td>
 )}

 {visibleColumns.email !== false && (
 <td className="p-3.5 min-w-[200px]">
 <div className="flex items-center gap-1.5">
 <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="text-slate-500">{t.email}</span>
 </div>
 </td>
 )}

 {visibleColumns.phone !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <div className="flex items-center gap-1.5">
 <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="text-slate-600">{t.phone || '---'}</span>
 </div>
 </td>
 )}

 <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 onClick={() => onDetail(t)}
 className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition cursor-pointer"
 title="Xem hồ sơ"
 >
 <Eye className="h-4 w-4" />
 </button>

 {isAdmin && (
 <ActionDropdownPortal>
 {(closeMenu) => (
 <>
 <button
 type="button"
 onClick={() => { closeMenu(); onDetail(t); }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
 >
 <Eye className="h-4 w-4 text-[#64748B]" />
 <span>Xem hồ sơ</span>
 </button>
 <button
 type="button"
 onClick={() => { closeMenu(); onEdit(t); }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
 >
 <Edit className="h-4 w-4 text-[#2563EB]" />
 <span>Chỉnh sửa</span>
 </button>
 {onToggleLock && (
 <button
 type="button"
 onClick={() => { closeMenu(); onToggleLock(t); }}
 className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 ${
 t.user?.status === 'LOCKED' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-amber-50 text-amber-600'
 }`}
 >
 {t.user?.status === 'LOCKED' ? (
 <>
 <Unlock className="h-4 w-4 text-emerald-600" />
 <span>Mở khóa tài khoản</span>
 </>
 ) : (
 <>
 <Lock className="h-4 w-4 text-amber-600" />
 <span>Khóa đăng nhập</span>
 </>
 )}
 </button>
 )}
 <div className="my-1 border-t border-[#E2E8F0]" />
 <button
 type="button"
 onClick={() => { closeMenu(); onDelete(t.id); }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626]"
 >
 <Trash2 className="h-4 w-4 text-[#DC2626]" />
 <span>Xóa giảng viên</span>
 </button>
 </>
 )}
 </ActionDropdownPortal>
 )}
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
