'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, BookOpen, Building2, Award, UserPlus, MoreVertical } from 'lucide-react';
import { Subject } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

interface SubjectTableProps {
 subjects: Subject[];
 selected: number[];
 viewMode?: 'list' | 'grid' | 'compact';
 visibleColumns?: Record<string, boolean>;
 onSelect: (id: number, checked: boolean) => void;
 onSelectAll: (checked: boolean) => void;
 onDetail: (s: Subject) => void;
 onEnroll: (s: Subject) => void;
 onEdit: (s: Subject) => void;
 onDelete: (id: number) => void;
 isAdmin: boolean;
}

export function SubjectTable({
 subjects,
 selected,
 viewMode = 'list',
 visibleColumns = {
 subjectCode: true,
 subjectName: true,
 credits: true,
 department: true,
 },
 onSelect,
 onSelectAll,
 onDetail,
 onEnroll,
 onEdit,
 onDelete,
 isAdmin,
}: SubjectTableProps) {
 const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
 const allSelected = subjects.length > 0 && selected.length === subjects.length;

 // 1. Dạng Lưới (Grid View Mode)
 if (viewMode === 'grid') {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {subjects.map((s) => {
 const isChecked = selected.includes(s.id);
 const deptName = s.department?.name || (s as any).departmentName || 'Chưa gán Khoa';

 return (
 <div
 key={s.id}
 className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
 }`}
 >
 <div className="space-y-2.5">
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
 className=" tabular-nums text-[14px] font-medium text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
 >
 {s.subjectCode}
 </button>
 </div>

 <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#64748B]">
 <Award className="h-3.5 w-3.5 text-slate-400" /> {s.credits} Tín chỉ
 </span>
 </div>

 <div>
 <h4
 onClick={() => onDetail(s)}
 className="text-[18px] font-semibold text-[#0F172A] leading-snug cursor-pointer hover:text-[#2563EB] transition"
 >
 {s.subjectName}
 </h4>
 </div>

 <div className="flex items-center gap-1.5 text-[14px] font-normal text-[#475569] pt-1">
 <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
 <span className="truncate">{deptName}</span>
 </div>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[14px] font-medium">
 <button
 type="button"
 onClick={() => onEnroll(s)}
 className="flex items-center gap-1 text-[#2563EB] hover:text-blue-700 cursor-pointer"
 >
 <UserPlus className="h-3.5 w-3.5" />
 <span>Gán sinh viên</span>
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
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th scope="col" className="p-2 pl-3 text-center w-8">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 <th scope="col" className="p-2 whitespace-nowrap">Mã môn</th>
 <th scope="col" className="p-2 min-w-[200px]">Tên môn học</th>
 <th scope="col" className="p-2 whitespace-nowrap">Tín chỉ</th>
 <th scope="col" className="p-2 min-w-[180px]">Khoa đào tạo</th>
 <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {subjects.map((s) => {
 const isChecked = selected.includes(s.id);
 const deptName = s.department?.name || (s as any).departmentName || '---';

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
 <td className="p-2 whitespace-nowrap font-medium text-blue-600">
 <button type="button" onClick={() => onDetail(s)} className=" tabular-nums hover:text-blue-800 hover:underline transition cursor-pointer">
 {s.subjectCode}
 </button>
 </td>
 <td className="p-2 min-w-[200px]">
 <p className="truncate font-semibold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(s)}>
 {s.subjectName}
 </p>
 </td>
 <td className="p-2 whitespace-nowrap font-medium text-slate-700">{s.credits} TC</td>
 <td className="p-2 min-w-[180px] font-normal text-slate-700">{deptName}</td>
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

 // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
 return (
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th scope="col" className="p-3.5 pl-4 text-center w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 {visibleColumns.subjectCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã môn học</th>}
 {visibleColumns.subjectName !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên môn học</th>}
 {visibleColumns.credits !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số Tín chỉ</th>}
 {visibleColumns.department !== false && <th scope="col" className="p-3.5 min-w-[200px]">Khoa đào tạo</th>}
 <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {subjects.map((s, index) => {
 const isChecked = selected.includes(s.id);
 const deptName = s.department?.name || (s as any).departmentName || 'Chưa gán Khoa';
 const isLastRow = index >= Math.floor(subjects.length / 2);

 return (
 <tr
 key={s.id}
 className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''
 }`}
 >
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(s.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {visibleColumns.subjectCode !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className=" tabular-nums text-[14px] font-medium text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
 >
 {s.subjectCode}
 </button>
 </td>
 )}

 {visibleColumns.subjectName !== false && (
 <td className="p-3.5 min-w-[220px]">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className="font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB] transition text-[15px]"
 >
 {s.subjectName}
 </button>
 </td>
 )}

 {visibleColumns.credits !== false && (
 <td className="p-3.5 whitespace-nowrap text-[15px]">
 <span className="font-medium text-[#0F172A]">{s.credits} tín chỉ</span>
 </td>
 )}

 {visibleColumns.department !== false && (
 <td className="p-3.5 min-w-[200px] text-[15px] font-normal text-[#334155]">
 {deptName}
 </td>
 )}

 <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
 <div className="flex items-center justify-end gap-1">
 {/* Enroll Student Button - Clean Monochrome */}
 <button
 type="button"
 onClick={() => onEnroll(s)}
 className="flex items-center gap-1 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1 text-xs font-medium transition cursor-pointer shadow-2xs"
 title="Gán Sinh viên đăng ký môn học"
 >
 <UserPlus className="h-3.5 w-3.5 text-slate-500" />
 <span>Gán SV</span>
 </button>

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
 onEnroll(s);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#2563EB] font-medium"
 >
 <UserPlus className="h-4 w-4 text-[#2563EB]" />
 <span>Gán Sinh viên</span>
 </button>

 <button
 type="button"
 onClick={() => {
 closeMenu();
 onDetail(s);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
 >
 <Eye className="h-4 w-4 text-[#64748B]" />
 <span>Xem chi tiết</span>
 </button>

 {isAdmin && (
 <>
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onEdit(s);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
 >
 <Edit className="h-4 w-4 text-[#2563EB]" />
 <span>Chỉnh sửa môn</span>
 </button>

 <div className="my-1 border-t border-[#E2E8F0]" />

 <button
 type="button"
 onClick={() => {
 closeMenu();
 onDelete(s.id);
 }}
 className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626]"
 >
 <Trash2 className="h-4 w-4 text-[#DC2626]" />
 <span>Xóa môn học</span>
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
