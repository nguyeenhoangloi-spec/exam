'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Calendar, Clock, Award, MoreVertical } from 'lucide-react';
import { ExamPeriod } from '../../types';

import { StatusBadge } from '../common/StatusBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

interface ExamPeriodTableProps {
 periods: ExamPeriod[];
 selected: number[];
 viewMode?: 'list' | 'grid' | 'compact';
 visibleColumns?: Record<string, boolean>;
 onSelect: (id: number, checked: boolean) => void;
 onSelectAll: (checked: boolean) => void;
 onDetail: (p: ExamPeriod) => void;
 onEdit: (p: ExamPeriod) => void;
 onDelete: (id: number) => void;
 isAdmin: boolean;
}

export function computePeriodStatus(p: { status?: string; startDate?: string; endDate?: string }): 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' {
 if (p.status === 'CANCELLED') return 'CANCELLED';
 if (!p.startDate || !p.endDate) return (p.status as any) || 'UPCOMING';

 try {
 const now = new Date();
 now.setHours(0, 0, 0, 0);

 let startStr = p.startDate;
 if (startStr.includes('T')) startStr = startStr.split('T')[0];
 const [sy, sm, sd] = startStr.split('-').map(Number);

 let endStr = p.endDate;
 if (endStr.includes('T')) endStr = endStr.split('T')[0];
 const [ey, em, ed] = endStr.split('-').map(Number);

 const start = new Date(sy, sm - 1, sd, 0, 0, 0);
 const end = new Date(ey, em - 1, ed, 23, 59, 59);

 if (now < start) return 'UPCOMING';
 if (now >= start && now <= end) return 'ONGOING';
 return 'COMPLETED';
 } catch {
 return (p.status as any) || 'UPCOMING';
 }
}

export function ExamPeriodTable({
 periods,
 selected,
 viewMode = 'list',
 visibleColumns = {
 name: true,
 semester: true,
 schoolYear: true,
 dateRange: true,
 status: true,
 },
 onSelect,
 onSelectAll,
 onDetail,
 onEdit,
 onDelete,
 isAdmin,
}: ExamPeriodTableProps) {
 const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
 const allSelected = periods.length > 0 && selected.length === periods.length;

 const formatDate = (dateStr?: string) => {
 if (!dateStr) return '---';
 try {
 const d = new Date(dateStr);
 if (Number.isNaN(d.getTime())) return '---';
 const dd = String(d.getDate()).padStart(2, '0');
 const mm = String(d.getMonth() + 1).padStart(2, '0');
 const yyyy = d.getFullYear();
 return `${dd}/${mm}/${yyyy}`;
 } catch {
 return dateStr;
 }
 };

 const getStatusBadge = (status?: string, period?: ExamPeriod) => {
 const s = (period ? computePeriodStatus(period) : status?.toUpperCase()) || 'UPCOMING';
 return <StatusBadge status={s} />;
 };

 // 1. Dạng Lưới (Grid View Mode)
 if (viewMode === 'grid') {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {periods.map((p) => {
 const isChecked = selected.includes(p.id);
 const codeText = `KTI${String(p.id).padStart(4, '0')}`;

 return (
 <div
 key={p.id}
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
 onChange={(e) => onSelect(p.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <button
 type="button"
 onClick={() => onDetail(p)}
 className=" tabular-nums text-xs font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer"
 >
 {codeText}
 </button>
 </div>
 {getStatusBadge(p.status, p)}
 </div>

 <div>
 <h4
 onClick={() => onDetail(p)}
 className="text-sm font-semibold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
 >
 {p.name}
 </h4>
 </div>

 <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
 <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
 <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
 <span>Học kỳ: <strong className="font-semibold text-slate-800">{p.semester}</strong></span>
 </div>
 <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
 <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
 <span>Năm: <strong>{p.schoolYear}</strong></span>
 </div>
 </div>

 <div className="text-[14px] font-normal text-slate-500 flex items-center justify-between pt-1">
 <span>Thời gian: <strong className="text-slate-900 font-semibold">{formatDate(p.startDate)} - {formatDate(p.endDate)}</strong></span>
 </div>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
 <button
 type="button"
 onClick={() => onDetail(p)}
 className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
 >
 <Eye className="h-3.5 w-3.5" />
 <span>Xem chi tiết</span>
 </button>

 {isAdmin && (
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => onEdit(p)}
 className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100"
 title="Sửa"
 >
 <Edit className="h-3.5 w-3.5" />
 </button>
 <button
 type="button"
 onClick={() => onDelete(p.id)}
 className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50"
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
        {periods.map((p) => {
          const isChecked = selected.includes(p.id);

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Left: Checkbox + Avatar Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(p.id, e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100/80">
                  {p.semester?.slice(0, 3) || 'KT'}
                </div>

                {/* Middle: Name + Meta chips */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onDetail(p)}
                      className="text-[15px] font-semibold text-slate-900 truncate hover:text-primary-600 transition cursor-pointer text-left"
                    >
                      {p.name}
                    </button>
                  </div>

                  <div className="flex items-center gap-3.5 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Học kỳ: <strong className="font-semibold text-slate-800">{p.semester}</strong> ({p.schoolYear})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Status Badge & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(p.status, p)}

                <button
                  type="button"
                  onClick={() => onDetail(p)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
                  title="Xem chi tiết"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {isAdmin && (
                  <ActionDropdownPortal>
                    {(closeMenu) => (
                      <>
                        <button
                          type="button"
                          onClick={() => { closeMenu(); onDetail(p); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700 text-xs font-medium"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                          <span>Xem chi tiết</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { closeMenu(); onEdit(p); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700 text-xs font-medium"
                        >
                          <Edit className="h-4 w-4 text-primary-600" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <div className="my-1 border-t border-slate-200" />
                        <button
                          type="button"
                          onClick={() => { closeMenu(); onDelete(p.id); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-danger-50 text-danger-600 text-xs font-medium"
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                          <span>Xóa kỳ thi</span>
                        </button>
                      </>
                    )}
                  </ActionDropdownPortal>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

 // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
 return (
 <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="ui-table w-full text-left text-[15px] text-slate-700 border-collapse">
 <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
 <tr>
 <th scope="col" className="p-3.5 pl-4 text-center w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[250px] whitespace-nowrap">Tên kỳ thi</th>}
 {visibleColumns.semester !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Học kỳ</th>}
 {visibleColumns.schoolYear !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Năm học</th>}
 {visibleColumns.dateRange !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian tổ chức</th>}
 {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
 <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {periods.map((p, index) => {
 const isChecked = selected.includes(p.id);

 return (
 <tr
 key={p.id}
 className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}
 >
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(p.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {visibleColumns.name !== false && (
 <td className="p-3.5 min-w-[250px] whitespace-nowrap">
 <button
 type="button"
 onClick={() => onDetail(p)}
 className="font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition whitespace-nowrap block"
 >
 {p.name}
 </button>
 </td>
 )}

 {visibleColumns.semester !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">
 {p.semester}
 </td>
 )}


 {visibleColumns.schoolYear !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-900">
 {p.schoolYear}
 </td>
 )}

 {visibleColumns.dateRange !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">
 {formatDate(p.startDate)} - {formatDate(p.endDate)}
 </td>
 )}

 {visibleColumns.status !== false && (
 <td className="p-3.5 whitespace-nowrap">
 {getStatusBadge(p.status, p)}
 </td>
 )}

 <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 onClick={() => onDetail(p)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
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
 onDetail(p);
 }}
 className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700 cursor-pointer"
 >
 <Eye className="h-4 w-4 text-slate-500" />
 <span>Xem chi tiết</span>
 </button>

 {isAdmin && (
 <>
 <button
 type="button"
 onClick={() => {
 closeMenu();
 onEdit(p);
 }}
 className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700 cursor-pointer"
 >
 <Edit className="h-4 w-4 text-primary-600" />
 <span>Chỉnh sửa kỳ thi</span>
 </button>

 <div className="my-1 border-t border-slate-200" />

 <button
 type="button"
 onClick={() => {
 closeMenu();
 onDelete(p.id);
 }}
 className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-danger-50 text-danger-600 cursor-pointer"
 >
 <Trash2 className="h-4 w-4 text-danger-600" />
 <span>Xóa kỳ thi</span>
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
