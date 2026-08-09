'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Users, School, Mail, Phone, CheckCircle2, MoreVertical } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
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
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {s.studentCode}
                    </button>
                  </div>

                  <StatusBadge status="CONFIRMED" customLabel="Đang học" />
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(s)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {s.fullName}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{s.gender || 'Nam'}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-1">
                  <div className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.class?.name || 'Chưa xếp lớp'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-500">{s.email}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(s)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem hồ sơ</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
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
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
            <tr>
              <th className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-2 whitespace-nowrap">Mã SV</th>
              <th className="p-2 min-w-[160px]">Họ và tên</th>
              <th className="p-2 whitespace-nowrap">Giới tính</th>
              <th className="p-2 min-w-[120px]">Lớp học</th>
              <th className="p-2 min-w-[170px]">Email</th>
              <th className="p-2 whitespace-nowrap">SĐT</th>
              <th className="p-2 pr-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {students.map((s) => {
              const isChecked = selected.includes(s.id);
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
                  <td className="p-2 font-bold text-slate-700 font-mono whitespace-nowrap">{s.studentCode}</td>
                  <td className="p-2 min-w-[160px]">
                    <span
                      onClick={() => onDetail(s)}
                      className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                    >
                      {s.fullName}
                    </span>
                  </td>
                  <td className="p-2 whitespace-nowrap text-slate-600">{s.gender || 'Nam'}</td>
                  <td className="p-2 text-slate-700 min-w-[120px]">{s.class?.name || '---'}</td>
                  <td className="p-2 text-slate-500 min-w-[170px]">{s.email}</td>
                  <td className="p-2 whitespace-nowrap text-slate-600">{s.phone || '---'}</td>
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
        <thead className="bg-slate-50 text-[14px] font-semibold uppercase tracking-wider text-[#475569] border-b border-slate-200">
          <tr>
            <th className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.studentCode !== false && <th className="p-3.5 whitespace-nowrap">Mã Sinh viên</th>}
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
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.studentCode !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="font-mono text-[14px] font-bold text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
                    >
                      {s.studentCode}
                    </button>
                  </td>
                )}

                {visibleColumns.fullName !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <span
                      onClick={() => onDetail(s)}
                      className="font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB] transition leading-tight text-[15px]"
                    >
                      {s.fullName}
                    </span>
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
                      <span className="text-slate-700 font-semibold">{s.class?.name || 'Chưa xếp lớp'}</span>
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
                              onClick={() => { closeMenu(); onDetail(s); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
                            >
                              <Eye className="h-4 w-4 text-[#64748B]" />
                              <span>Xem hồ sơ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { closeMenu(); onEdit(s); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
                            >
                              <Edit className="h-4 w-4 text-[#2563EB]" />
                              <span>Chỉnh sửa</span>
                            </button>
                            <div className="my-1 border-t border-[#E2E8F0]" />
                            <button
                              type="button"
                              onClick={() => { closeMenu(); onDelete(s.id); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626]"
                            >
                              <Trash2 className="h-4 w-4 text-[#DC2626]" />
                              <span>Xóa Sinh viên</span>
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
