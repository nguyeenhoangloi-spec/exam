'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Building2, BookOpen, GraduationCap, Users, Sparkles, MoreVertical } from 'lucide-react';
import { Department } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { IdentifierBadge } from '../ui/IdentifierBadge';

interface DepartmentTableProps {
  departments: Department[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
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
  viewMode = 'list',
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

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((d) => {
          const isChecked = selected.includes(d.id);
          const subjectsCount = Math.max((d as any).subjectsCount || 0, (d as any)._count?.majorSubjects || 0, (d as any)._count?.subjects || 0, (d as any).subjects?.length || 0);
          const classesCount = (d as any).classesCount ?? (d as any)._count?.classes ?? ((d as any).classes?.length || 0);
          const teachersCount = (d as any).teachersCount ?? (d as any)._count?.teachers ?? ((d as any).teachers?.length || 0);

          return (
            <div
              key={d.id}
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
                      onChange={(e) => onSelect(d.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="tabular-nums text-[15px] leading-[22px] font-medium text-slate-900 hover:text-primary-600 transition cursor-pointer"
                    >
                      <IdentifierBadge>{d.code}</IdentifierBadge>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCurriculum(d)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[13px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                    <span>Khung CTDT</span>
                  </button>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(d)}
                    className="text-[18px] font-semibold text-slate-900 leading-snug cursor-pointer hover:text-primary-600 transition"
                  >
                    {d.name}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[14px] font-normal text-slate-600 pt-1 [&>div>span:first-child]:!font-normal">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[12px] text-slate-500 font-semibold">Môn học</span>
                    <span className="text-[18px] leading-[26px] font-semibold text-slate-900">{subjectsCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[12px] text-slate-500 font-semibold">Lớp học</span>
                    <span className="text-[18px] leading-[26px] font-semibold text-slate-900">{classesCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[12px] text-slate-500 font-semibold">Giảng viên</span>
                    <span className="text-[18px] leading-[26px] font-semibold text-slate-900">{teachersCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[14px] font-medium">
                <button
                  type="button"
                  onClick={() => onDetail(d)}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(d)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(d.id)}
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
        {departments.map((d) => {
          const isChecked = selected.includes(d.id);
          const subjectsCount = Math.max((d as any).subjectsCount || 0, (d as any)._count?.majorSubjects || 0, (d as any)._count?.subjects || 0, (d as any).subjects?.length || 0);
          const classesCount = (d as any).classesCount ?? (d as any)._count?.classes ?? ((d as any).classes?.length || 0);
          const teachersCount = (d as any).teachersCount ?? (d as any)._count?.teachers ?? ((d as any).teachers?.length || 0);

          return (
            <div
              key={d.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Left: Checkbox + Identifier Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(d.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <button
                  type="button"
                  onClick={() => onDetail(d)}
                  className="tabular-nums text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                >
                  <IdentifierBadge tone="blue">{d.code}</IdentifierBadge>
                </button>

                {/* Middle: Name + Meta chips */}
                <div className="min-w-0">
                  <h4
                    onClick={() => onDetail(d)}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                  >
                    {d.name}
                  </h4>

                  <div className="flex items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong className="font-semibold text-slate-800 dark:text-slate-200">{subjectsCount}</strong> môn học</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong className="font-semibold text-slate-800 dark:text-slate-200">{classesCount}</strong> lớp</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong className="font-semibold text-slate-800 dark:text-slate-200">{teachersCount}</strong> giảng viên</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenCurriculum(d)}
                  className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>Khung CTĐT</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDetail(d)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                  title="Xem chi tiết"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(d)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                      title="Chỉnh sửa khoa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(d.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa khoa"
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
                      className="tabular-nums text-[15px] leading-[22px] font-semibold text-primary-600 hover:text-primary-700 transition cursor-pointer"
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
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 transition text-[15px]"
                    >
                      {d.name}
                    </button>
                  </td>
                )}

                {visibleColumns.subjectsCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-slate-900">{subjectsCount} môn</span>
                  </td>
                )}

                {visibleColumns.classesCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-slate-900">{classesCount} lớp</span>
                  </td>
                )}

                {visibleColumns.teachersCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-slate-900">{teachersCount} giảng viên</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenCurriculum(d)}
                      className="flex items-center gap-1 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1 text-[15px] leading-[22px] font-medium transition cursor-pointer shadow-2xs"
                      title="Quản lý khung chương trình đào tạo"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                      <span>Khung CTDT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {isAdmin && (
                      <ActionDropdownPortal>
                        {(closeMenu) => (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onOpenCurriculum(d);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-primary-600 font-medium"
                            >
                              <Sparkles className="h-4 w-4 text-primary-600" />
                              <span>Khung CTDT</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onDetail(d);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700"
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                              <span>Xem chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onEdit(d);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-50 text-slate-700"
                            >
                              <Edit className="h-4 w-4 text-primary-600" />
                              <span>Chỉnh sửa khoa</span>
                            </button>

                            <div className="my-1 border-t border-slate-200" />

                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onDelete(d.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-danger-50 text-danger-600"
                            >
                              <Trash2 className="h-4 w-4 text-danger-600" />
                              <span>Xóa khoa</span>
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
