'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Users, School, Mail, Phone, CheckCircle2, MoreVertical, Lock, Unlock } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { Student } from '../../types';

interface StudentTableProps {
 students: Student[];
 selected: number[];
 viewMode?: 'list' | 'grid' | 'compact';
 visibleColumns?: Record<string, boolean>;
 onSelect: (id: number, checked: boolean) => void;
 onSelectAll: (checked: boolean) => void;
 onDetail: (s: Student) => void;
 onEdit: (s: Student) => void;
 onDelete: (id: number) => void;
 onToggleLock?: (s: Student) => void;
 isAdmin: boolean;
}

export function StudentTable({
 students,
 selected,
 viewMode = 'list',
 visibleColumns = {
 studentCode: true,
 fullName: true,
 gender: true,
 class: true,
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
}: StudentTableProps) {
 const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
 const allSelected = students.length > 0 && selected.length === students.length;

 // 1. Dạng Lưới (Grid View Mode)
 if (viewMode === 'grid') {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {students.map((s) => {
 const isChecked = selected.includes(s.id);
 const isLocked = s.user?.status === 'LOCKED';
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
 className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <button
 type="button"
 onClick={() => onDetail(s)}
 className=" tabular-nums text-[15px] leading-[22px] font-medium text-slate-900 hover:text-primary-600 transition cursor-pointer"
 >
 <IdentifierBadge>{s.studentCode}</IdentifierBadge>
 </button>
 </div>

 <StatusBadge status={isLocked ? 'LOCKED' : 'CONFIRMED'} customLabel={isLocked ? 'Đã khóa' : 'Đang học'} />
 </div>

 <div>
 <h4
 onClick={() => onDetail(s)}
 className="text-[18px] font-semibold text-slate-900 leading-snug cursor-pointer hover:text-primary-600 transition"
 >
 {s.fullName}
 </h4>
 <p className="text-[13px] text-slate-500 font-normal mt-0.5">{s.gender || 'Nam'}</p>
 </div>

 <div className="space-y-1.5 text-[14px] text-slate-600 font-normal pt-1">
 <div className="flex items-center gap-1.5">
 <School className="h-4 w-4 text-slate-400 shrink-0" />
 <span className="truncate">{s.class?.name || 'Chưa xếp lớp'}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Mail className="h-4 w-4 text-slate-400 shrink-0" />
 <span className="truncate text-slate-500">{s.email}</span>
 </div>
 {s.phone && (
 <div className="flex items-center gap-1.5">
 <Phone className="h-4 w-4 text-slate-400 shrink-0" />
 <span>{s.phone}</span>
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[14px] font-medium">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className="flex items-center gap-1 text-primary-600 hover:text-blue-700 cursor-pointer"
 >
 <Eye className="h-3.5 w-3.5" />
 <span>Xem hồ sơ</span>
 </button>

 {isAdmin && (
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => onEdit(s)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
 title="Chỉnh sửa"
 >
 <Edit className="h-3.5 w-3.5" />
 </button>
 <button
 type="button"
 onClick={() => onDelete(s.id)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
        {students.map((s) => {
          const isChecked = selected.includes(s.id);
          const isLocked = s.user?.status === 'LOCKED';

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Left: Checkbox + Avatar Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(s.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100/80">
                  {s.studentCode?.slice(0, 3) || 'SV'}
                </div>

                {/* Middle: Name + StudentCode + Meta chips */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="text-[15px] font-semibold text-slate-900 truncate hover:text-primary-600 transition cursor-pointer text-left"
                    >
                      {s.fullName}
                    </button>
                    <IdentifierBadge>
                      {s.studentCode}
                    </IdentifierBadge>
                    <span className="text-xs text-slate-400 font-normal">({s.gender || 'Nam'})</span>
                  </div>

                  <div className="flex items-center gap-3.5 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                    <span className="flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium">{s.class?.name || 'Chưa xếp lớp'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 truncate max-w-[200px]">{s.email}</span>
                    </span>
                    {s.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{s.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Status Badge & Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={isLocked ? 'LOCKED' : 'CONFIRMED'} customLabel={isLocked ? 'Đã khóa' : 'Đang học'} />

                <button
                  type="button"
                  onClick={() => onDetail(s)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
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
                          onClick={() => { closeMenu(); onDetail(s); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700 text-xs font-medium"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                          <span>Xem hồ sơ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { closeMenu(); onEdit(s); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700 text-xs font-medium"
                        >
                          <Edit className="h-4 w-4 text-primary-600" />
                          <span>Chỉnh sửa</span>
                        </button>
                        {onToggleLock && (
                          <button
                            type="button"
                            onClick={() => { closeMenu(); onToggleLock(s); }}
                            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium ${
                              s.user?.status === 'LOCKED' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-amber-50 text-amber-600'
                            }`}
                          >
                            {s.user?.status === 'LOCKED' ? (
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
                        <div className="my-1 border-t border-slate-200" />
                        <button
                          type="button"
                          onClick={() => { closeMenu(); onDelete(s.id); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-danger-50 text-danger-600 text-xs font-medium"
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                          <span>Xóa sinh viên</span>
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
 <th className="p-3.5 pl-4 text-center w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => onSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 {visibleColumns.studentCode !== false && <th className="p-3.5 whitespace-nowrap">Mã sinh viên</th>}
 {visibleColumns.fullName !== false && <th className="p-3.5 min-w-[200px]">Họ và Tên</th>}
 {visibleColumns.gender !== false && <th className="p-3.5 whitespace-nowrap">Giới tính</th>}
 {visibleColumns.class !== false && <th className="p-3.5 min-w-[140px]">Lớp học</th>}
 {visibleColumns.email !== false && <th className="p-3.5 min-w-[200px]">Email Sinh viên</th>}
 {visibleColumns.phone !== false && <th className="p-3.5 whitespace-nowrap">Số điện thoại</th>}
 <th className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {students.map((s, index) => {
 const isChecked = selected.includes(s.id);
 const isLastRow = index >= Math.floor(students.length / 2);

 return (
 <tr
 key={s.id}
 className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''}`}
 >
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(s.id, e.target.checked)}
 className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {visibleColumns.studentCode !== false && (
  <td className="p-3.5 whitespace-nowrap">
  <button
  type="button"
  onClick={() => onDetail(s)}
  className="tabular-nums text-[15px] leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
  >
  <IdentifierBadge>{s.studentCode}</IdentifierBadge>
  </button>
  </td>
 )}

 {visibleColumns.fullName !== false && (
 <td className="p-3.5 min-w-[200px]">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition leading-tight text-[15px]"
 >
 {s.fullName}
 </button>
 </td>
 )}

 {visibleColumns.gender !== false && (
 <td className="p-3.5 whitespace-nowrap text-slate-600">
 {s.gender || 'Nam'}
 </td>
 )}

 {visibleColumns.class !== false && (
 <td className="p-3.5 min-w-[140px]">
 <div className="flex items-center gap-1.5">
 <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="text-slate-700 font-normal">{s.class?.name || 'Chưa xếp lớp'}</span>
 </div>
 </td>
 )}

 {visibleColumns.email !== false && (
 <td className="p-3.5 min-w-[200px]">
 <div className="flex items-center gap-1.5">
 <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="text-slate-500">{s.email}</span>
 </div>
 </td>
 )}

 {visibleColumns.phone !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <div className="flex items-center gap-1.5">
 <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
 <span className="text-slate-600">{s.phone || '---'}</span>
 </div>
 </td>
 )}

 <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 onClick={() => onDetail(s)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
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
 onClick={() => { closeMenu(); onDetail(s); }}
 className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700"
 >
 <Eye className="h-4 w-4 text-slate-500" />
 <span>Xem hồ sơ</span>
 </button>
 <button
 type="button"
 onClick={() => { closeMenu(); onEdit(s); }}
 className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700"
 >
 <Edit className="h-4 w-4 text-primary-600" />
 <span>Chỉnh sửa</span>
 </button>
 {onToggleLock && (
 <button
 type="button"
 onClick={() => { closeMenu(); onToggleLock(s); }}
 className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 ${
 s.user?.status === 'LOCKED' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-amber-50 text-amber-600'
 }`}
 >
 {s.user?.status === 'LOCKED' ? (
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
 <div className="my-1 border-t border-slate-200" />
 <button
 type="button"
 onClick={() => { closeMenu(); onDelete(s.id); }}
 className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-danger-50 text-danger-600"
 >
 <Trash2 className="h-4 w-4 text-danger-600" />
 <span>Xóa sinh viên</span>
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
