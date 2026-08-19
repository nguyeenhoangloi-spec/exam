'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, GraduationCap, Building2, Users, MoreVertical } from 'lucide-react';
import { ClassItem } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { IdentifierBadge } from '../ui/IdentifierBadge';

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
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
                      className="tabular-nums text-type-body leading-[22px] font-medium text-slate-900 hover:text-primary-600 transition cursor-pointer"
                    >
                      <IdentifierBadge>{c.code}</IdentifierBadge>
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-0.5 text-type-helper font-medium text-slate-600 border border-slate-200">
                    <Users className="h-3.5 w-3.5 text-slate-500" /> {studentCount} SV
                  </span>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(c)}
                    className="text-type-card font-semibold text-slate-900 leading-snug cursor-pointer hover:text-primary-600 transition"
                  >
                    {c.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-type-body-sm font-normal text-slate-600 pt-1">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{deptName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-type-body-sm font-medium">
                <button
                  type="button"
                  onClick={() => onDetail(c)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
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
        {classes.map((c) => {
          const isChecked = selected.includes(c.id);
          const deptName = c.department?.name || (c as any).departmentName || 'Chưa gán Khoa';
          const studentCount = (c as any)._count?.students ?? (c as any).studentsCount ?? ((c as any).students?.length || 0);

          return (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Left: Checkbox + Identifier Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(c.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <button
                  type="button"
                  onClick={() => onDetail(c)}
                  className="tabular-nums text-type-helper font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                >
                  <IdentifierBadge tone="blue">{c.code}</IdentifierBadge>
                </button>

                {/* Middle: Name + Meta chips */}
                <div className="min-w-0">
                  <h4
                    onClick={() => onDetail(c)}
                    className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                  >
                    {c.name}
                  </h4>

                  <div className="flex items-center gap-3.5 text-type-helper text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{deptName}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong className="font-semibold text-slate-800 dark:text-slate-200">{studentCount}</strong> sinh viên</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onDetail(c)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                  title="Xem chi tiết"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                      title="Chỉnh sửa lớp"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa lớp học"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
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
                    <button
                      type="button"
                      onClick={() => onDetail(c)}
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
