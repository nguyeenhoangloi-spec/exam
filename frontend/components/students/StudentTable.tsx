'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, School, Mail, Phone, Lock, Unlock } from 'lucide-react';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { Student } from '../../types';

interface StudentTableProps {
  students: Student[];
  selected: number[];
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

  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card">
      <table className="ui-table w-full text-left text-type-body text-slate-700 border-collapse">
        <thead className="bg-slate-50 text-type-body-sm font-medium tracking-wider text-slate-600 border-b border-slate-200">
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
          {students.map((s) => {
            const isChecked = selected.includes(s.id);

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
                      className="tabular-nums text-type-body leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
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
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition leading-tight text-type-body"
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
                      <span className="text-slate-600">{s.phone || '—'}</span>
                    </div>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <ActionDropdownPortal>
                      {(closeMenu) => (
                        <>
                          <button
                            type="button"
                            onClick={() => { closeMenu(); onDetail(s); }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                          >
                            <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>Xem chi tiết</span>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => { closeMenu(); onEdit(s); }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                              >
                                <Edit className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Chỉnh sửa</span>
                              </button>
                              {onToggleLock && (
                                <button
                                  type="button"
                                  onClick={() => { closeMenu(); onToggleLock(s); }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium transition cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  {s.user?.status === 'LOCKED' ? (
                                    <>
                                      <Unlock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                      <span>Mở khóa tài khoản</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                      <span>Khóa tài khoản</span>
                                    </>
                                  )}
                                </button>
                              )}
                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                              <button
                                type="button"
                                onClick={() => { closeMenu(); onDelete(s.id); }}
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
