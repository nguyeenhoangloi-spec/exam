'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Building2, BookOpen, GraduationCap, Users, Sparkles, MoreVertical } from 'lucide-react';
import { Department } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { IdentifierBadge } from '../ui/IdentifierBadge';

interface DepartmentTableProps {
  departments: Department[];
  selected: number[];
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (d: Department) => void;
  onOpenCurriculum: (d: Department) => void;
  onEdit: (d: Department) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}

export function DepartmentTable({
  departments,
  selected,
  visibleColumns = {
    code: true,
    name: true,
    subjectsCount: true,
    classesCount: true,
    teachersCount: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
  onOpenCurriculum,
  onEdit,
  onDelete,
  isAdmin,
}: DepartmentTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = departments.length > 0 && selected.length === departments.length;

  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card">
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
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã khoa</th>}
            {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên khoa đào tạo</th>}
            {visibleColumns.subjectsCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số môn học</th>}
            {visibleColumns.classesCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số lớp học</th>}
            {visibleColumns.teachersCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số giảng viên</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {departments.map((d) => {
            const isChecked = selected.includes(d.id);
            const subjectsCount = Math.max((d as any).subjectsCount || 0, (d as any)._count?.majorSubjects || 0, (d as any)._count?.subjects || 0, (d as any).subjects?.length || 0);
            const classesCount = (d as any).classesCount ?? (d as any)._count?.classes ?? ((d as any).classes?.length || 0);
            const teachersCount = (d as any).teachersCount ?? (d as any)._count?.teachers ?? ((d as any).teachers?.length || 0);

            return (
              <tr
                key={d.id}
                className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''}`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(d.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="tabular-nums text-type-body leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
                    >
                      <IdentifierBadge>{d.code}</IdentifierBadge>
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition text-type-body"
                    >
                      {d.name}
                    </button>
                  </td>
                )}

                {visibleColumns.subjectsCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    <span className="font-medium text-slate-900">{subjectsCount} môn</span>
                  </td>
                )}

                {visibleColumns.classesCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    <span className="font-medium text-slate-900">{classesCount} lớp</span>
                  </td>
                )}

                {visibleColumns.teachersCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    <span className="font-medium text-slate-900">{teachersCount} giảng viên</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenCurriculum(d)}
                      className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-type-body leading-[22px] font-medium transition cursor-pointer shadow-2xs"
                      title="Quản lý khung chương trình đào tạo"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Khung đào tạo</span>
                    </button>

                    <ActionDropdownPortal>
                      {(closeMenu) => (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(d);
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
                                  onOpenCurriculum(d);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                              >
                                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span>Chương trình đào tạo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onEdit(d);
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
                                  onDelete(d.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-150 cursor-pointer select-none group"
                              >
                                <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors shrink-0" strokeWidth={1.5} />
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
