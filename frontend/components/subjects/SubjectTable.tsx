'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { Subject } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { IdentifierBadge } from '../ui/IdentifierBadge';

interface SubjectTableProps {
  subjects: Subject[];
  selected: number[];
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
            {visibleColumns.subjectCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã môn học</th>}
            {visibleColumns.subjectName !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên môn học</th>}
            {visibleColumns.credits !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số Tín chỉ</th>}
            {visibleColumns.department !== false && <th scope="col" className="p-3.5 min-w-[200px]">Khoa đào tạo</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {subjects.map((s) => {
            const isChecked = selected.includes(s.id);
            const deptName = s.department?.name || (s as any).departmentName || 'Chưa gán Khoa';

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
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.subjectCode !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="tabular-nums text-type-body leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
                    >
                      <IdentifierBadge>{s.subjectCode}</IdentifierBadge>
                    </button>
                  </td>
                )}

                {visibleColumns.subjectName !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition text-type-body"
                    >
                      {s.subjectName}
                    </button>
                  </td>
                )}

                {visibleColumns.credits !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    <span className="font-medium text-slate-900">{s.credits} tín chỉ</span>
                  </td>
                )}

                {visibleColumns.department !== false && (
                  <td className="p-3.5 min-w-[200px] text-type-body font-normal text-slate-700">
                    {deptName}
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEnroll(s)}
                      className="flex items-center gap-1 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1 text-type-body leading-[22px] font-medium transition cursor-pointer shadow-2xs"
                      title="Gán Sinh viên đăng ký môn học"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                      <span>Gán SV</span>
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
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 text-type-body font-medium transition cursor-pointer select-none"
                          >
                            <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span>Gán sinh viên</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(s);
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
                                  onEdit(s);
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
                                  onDelete(s.id);
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
