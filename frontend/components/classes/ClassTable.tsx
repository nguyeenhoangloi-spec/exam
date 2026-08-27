'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, GraduationCap, Building2, Users, MoreVertical } from 'lucide-react';
import { ClassItem } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { IdentifierBadge } from '../ui/IdentifierBadge';

interface ClassTableProps {
  classes: ClassItem[];
  selected: number[];
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

  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-2xs">
      <table className="ui-table w-full text-left text-type-body text-slate-700 border-collapse">
        <thead className="bg-slate-50 text-type-body-sm font-medium tracking-wider text-slate-600 border-b border-slate-200">
          <tr>
            <th scope="col" className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã lớp</th>}
            {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên lớp học</th>}
            {visibleColumns.department !== false && <th scope="col" className="p-3.5 min-w-[200px]">Khoa trực thuộc</th>}
            {visibleColumns.studentCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Sĩ số Sinh viên</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {classes.map((c) => {
            const isChecked = selected.includes(c.id);
            const deptName = c.department?.name || (c as any).departmentName || 'Chưa gán Khoa';
            const studentCount = (c as any)._count?.students ?? (c as any).studentsCount ?? ((c as any).students?.length || 0);

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
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
                      className="tabular-nums text-type-body leading-[22px] font-medium text-slate-900 hover:text-primary-600 transition cursor-pointer"
                    >
                      <IdentifierBadge>{c.code}</IdentifierBadge>
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition text-type-body"
                    >
                      {c.name}
                    </button>
                  </td>
                )}

                {visibleColumns.department !== false && (
                  <td className="p-3.5 min-w-[200px] text-type-body font-normal text-slate-700">
                    {deptName}
                  </td>
                )}

                {visibleColumns.studentCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    <span className="font-medium text-slate-900">{studentCount} sinh viên</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <ActionDropdownPortal>
                      {(closeMenu) => (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(c);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
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
                                  onEdit(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                              >
                                <Edit className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Chỉnh sửa</span>
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onDelete(c.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-type-body font-medium transition cursor-pointer select-none"
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
