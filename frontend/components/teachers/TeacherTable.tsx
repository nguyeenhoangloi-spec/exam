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
  viewMode?: 'list' | 'grid' | 'compact';
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
  viewMode = 'list',
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

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.map((t) => {
          const isChecked = selected.includes(t.id);
          const isLocked = t.user?.status === 'LOCKED';

          return (
            <div
              key={t.id}
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
                      onChange={(e) => onSelect(t.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(t)}
                      className="tabular-nums text-[15px] leading-[22px] font-medium text-slate-900 hover:text-primary-600 transition cursor-pointer"
                    >
                      <IdentifierBadge>{t.teacherCode}</IdentifierBadge>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLocked && <StatusBadge status="LOCKED" customLabel="Đã khóa" />}
                    <Badge tone="blue" leftIcon={<GraduationCap className="h-3.5 w-3.5" />}>
                      {t.degree || 'TS'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(t)}
                    className="text-[18px] font-semibold text-slate-900 leading-snug cursor-pointer hover:text-primary-600 transition"
                  >
                    {t.fullName}
                  </h4>
                </div>

                <div className="space-y-1.5 text-[14px] text-slate-600 font-normal pt-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{t.department?.name || '---'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-500">{t.email}</span>
                  </div>
                  {t.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[14px] font-medium">
                <button
                  type="button"
                  onClick={() => onDetail(t)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
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
        {teachers.map((t) => {
          const isChecked = selected.includes(t.id);
          const isLocked = t.user?.status === 'LOCKED';

          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Left: Checkbox + Identifier Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(t.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <button
                  type="button"
                  onClick={() => onDetail(t)}
                  className="tabular-nums text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                >
                  <IdentifierBadge tone="blue">{t.teacherCode}</IdentifierBadge>
                </button>

                {/* Middle: Name + Degree + Meta chips */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      onClick={() => onDetail(t)}
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                    >
                      {t.fullName}
                    </h4>
                    {t.degree && (
                      <Badge tone="blue" leftIcon={<GraduationCap className="h-3 w-3" />}>
                        {t.degree}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{t.department?.name || 'Chưa phân khoa'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 truncate max-w-[200px]">{t.email}</span>
                    </span>
                    {t.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400">{t.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Status Badge & Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isLocked && <StatusBadge status="LOCKED" customLabel="Đã khóa" />}

                <button
                  type="button"
                  onClick={() => onDetail(t)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                  title="Xem hồ sơ"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {onToggleLock && (
                      <button
                        type="button"
                        onClick={() => onToggleLock(t)}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          t.user?.status === 'LOCKED'
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                        title={t.user?.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {t.user?.status === 'LOCKED' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa giảng viên"
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
                      className="tabular-nums text-[15px] leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
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
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition leading-tight text-[15px]"
                    >
                      {t.fullName}
                    </button>
                  </td>
                )}

                {visibleColumns.degree !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px] font-medium text-slate-800">
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
                    <button
                      type="button"
                      onClick={() => onDetail(t)}
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
                              onClick={() => { closeMenu(); onDetail(t); }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700"
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                              <span>Xem hồ sơ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { closeMenu(); onEdit(t); }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700"
                            >
                              <Edit className="h-4 w-4 text-primary-600" />
                              <span>Chỉnh sửa</span>
                            </button>
                            {onToggleLock && (
                              <button
                                type="button"
                                onClick={() => { closeMenu(); onToggleLock(t); }}
                                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 ${
                                  t.user?.status === 'LOCKED' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-amber-50 text-amber-600'
                                }`}
                              >
                                {t.user?.status === 'LOCKED' ? (
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
                              onClick={() => { closeMenu(); onDelete(t.id); }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-danger-50 text-danger-600"
                            >
                              <Trash2 className="h-4 w-4 text-danger-600" />
                              <span>Xóa giảng viên</span>
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
