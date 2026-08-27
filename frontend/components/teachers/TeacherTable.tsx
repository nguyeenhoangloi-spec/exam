'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, GraduationCap, Building2, Mail, Phone, MoreVertical, Lock, Unlock } from 'lucide-react';
import { Teacher } from '../../types';
import { Badge } from '../ui/Badge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

const DEGREE_BADGE: Record<string, string> = {
  'GS.TS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
  'PGS.TS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
  'TS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
  'ThS': 'border-l-blue-600 bg-blue-50/60 text-blue-900 border-slate-200/80',
};

interface TeacherTableProps {
  teachers: Teacher[];
  selected: number[];
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (t: Teacher) => void;
  onEdit: (t: Teacher) => void;
  onDelete: (id: number) => void;
  onToggleLock?: (t: Teacher) => void;
  isAdmin: boolean;
}

export function TeacherTable({
  teachers,
  selected,
  visibleColumns = {
    teacherCode: true,
    fullName: true,
    degree: true,
    department: true,
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
}: TeacherTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = teachers.length > 0 && selected.length === teachers.length;

  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
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
            {visibleColumns.teacherCode !== false && <th className="p-3.5 whitespace-nowrap">Mã giảng viên</th>}
            {visibleColumns.fullName !== false && <th className="p-3.5 min-w-[200px]">Họ và Tên</th>}
            {visibleColumns.degree !== false && <th className="p-3.5 whitespace-nowrap">Học vị</th>}
            {visibleColumns.department !== false && <th className="p-3.5 min-w-[160px]">Khoa trực thuộc</th>}
            {visibleColumns.email !== false && <th className="p-3.5 min-w-[200px]">Email công vụ</th>}
            {visibleColumns.phone !== false && <th className="p-3.5 whitespace-nowrap">Số điện thoại</th>}
            <th className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {teachers.map((t) => {
            const isChecked = selected.includes(t.id);

            return (
              <tr
                key={t.id}
                className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''}`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(t.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.teacherCode !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(t)}
                      className="tabular-nums text-type-body leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
                    >
                      <IdentifierBadge>{t.teacherCode}</IdentifierBadge>
                    </button>
                  </td>
                )}

                {visibleColumns.fullName !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => onDetail(t)}
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition leading-tight text-type-body"
                    >
                      {t.fullName}
                    </button>
                  </td>
                )}

                {visibleColumns.degree !== false && (
                  <td className="p-3.5 whitespace-nowrap text-type-body font-medium text-slate-800">
                    {t.degree || 'TS'}
                  </td>
                )}

                {visibleColumns.department !== false && (
                  <td className="p-3.5 min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-normal">{t.department?.name || '---'}</span>
                    </div>
                  </td>
                )}

                {visibleColumns.email !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">{t.email}</span>
                    </div>
                  </td>
                )}

                {visibleColumns.phone !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{t.phone || '---'}</span>
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
                            onClick={() => { closeMenu(); onDetail(t); }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                          >
                            <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>Xem chi tiết</span>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => { closeMenu(); onEdit(t); }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                              >
                                <Edit className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Chỉnh sửa</span>
                              </button>
                              {onToggleLock && (
                                <button
                                  type="button"
                                  onClick={() => { closeMenu(); onToggleLock(t); }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium transition cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  {t.user?.status === 'LOCKED' ? (
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
                                onClick={() => { closeMenu(); onDelete(t.id); }}
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
