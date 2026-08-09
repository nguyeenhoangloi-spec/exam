'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, GraduationCap, Building2, Users, MoreVertical } from 'lucide-react';
import { ClassItem } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

interface ClassTableProps {
  classes: ClassItem[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (c: ClassItem) => void;
  onEdit: (c: ClassItem) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}

export function ClassTable({
  classes,
  selected,
  viewMode = 'list',
  visibleColumns = {
    code: true,
    name: true,
    department: true,
    studentCount: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
  onEdit,
  onDelete,
  isAdmin,
}: ClassTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = classes.length > 0 && selected.length === classes.length;

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map((c) => {
          const isChecked = selected.includes(c.id);
          const deptName = c.department?.name || (c as any).departmentName || 'Chưa gán Khoa';
          const studentCount = (c as any)._count?.students ?? (c as any).studentsCount ?? ((c as any).students?.length || 0);

          return (
            <div
              key={c.id}
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
                      onChange={(e) => onSelect(c.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {c.code}
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-[8px] bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                    <Users className="h-3 w-3 text-slate-600" /> {studentCount} SV
                  </span>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(c)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {c.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pt-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{deptName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(c)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
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
          <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="p-2 whitespace-nowrap">Mã lớp</th>
              <th scope="col" className="p-2 min-w-[200px]">Tên lớp học</th>
              <th scope="col" className="p-2 min-w-[180px]">Khoa trực thuộc</th>
              <th scope="col" className="p-2 whitespace-nowrap">Sĩ số SV</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {classes.map((c) => {
              const isChecked = selected.includes(c.id);
              const deptName = c.department?.name || (c as any).departmentName || 'Chưa gán Khoa';
              const studentCount = (c as any)._count?.students ?? (c as any).studentsCount ?? ((c as any).students?.length || 0);

              return (
                <tr key={c.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(c.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">
                    <button type="button" onClick={() => onDetail(c)} className="rounded px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100">
                      {c.code}
                    </button>
                  </td>
                  <td className="p-2 min-w-[200px]">
                    <p className="truncate font-extrabold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(c)}>
                      {c.name}
                    </p>
                  </td>
                  <td className="p-2 min-w-[180px] font-semibold text-slate-700">{deptName}</td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-600">{studentCount} SV</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(c)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
            <th scope="col" className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã Lớp</th>}
            {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên Lớp học</th>}
            {visibleColumns.department !== false && <th scope="col" className="p-3.5 min-w-[200px]">Khoa trực thuộc</th>}
            {visibleColumns.studentCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Sĩ số Sinh viên</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {classes.map((c, index) => {
            const isChecked = selected.includes(c.id);
            const deptName = c.department?.name || (c as any).departmentName || 'Chưa gán Khoa';
            const studentCount = (c as any)._count?.students ?? (c as any).studentsCount ?? ((c as any).students?.length || 0);
            const isLastRow = index >= Math.floor(classes.length / 2);

            return (
              <tr
                key={c.id}
                className={`transition hover:bg-slate-50/60 ${
                  isChecked ? 'bg-blue-50/50' : ''
                }`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(c.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
                      className="font-mono text-[14px] font-bold text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
                    >
                      {c.code}
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <span
                      onClick={() => onDetail(c)}
                      className="font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB] transition text-[15px]"
                    >
                      {c.name}
                    </span>
                  </td>
                )}

                {visibleColumns.department !== false && (
                  <td className="p-3.5 min-w-[200px] text-[15px] font-normal text-[#334155]">
                    {deptName}
                  </td>
                )}

                {visibleColumns.studentCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-[#0F172A]">{studentCount} sinh viên</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
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
                              onDetail(c);
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
                                  onEdit(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
                              >
                                <Edit className="h-4 w-4 text-[#2563EB]" />
                                <span>Chỉnh sửa Lớp</span>
                              </button>

                              <div className="my-1 border-t border-[#E2E8F0]" />

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onDelete(c.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626]"
                              >
                                <Trash2 className="h-4 w-4 text-[#DC2626]" />
                                <span>Xóa Lớp học</span>
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
