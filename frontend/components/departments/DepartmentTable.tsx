'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Building2, BookOpen, GraduationCap, Users, Sparkles, MoreVertical } from 'lucide-react';
import { Department } from '../../types';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

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
              className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(d.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="font-sans tabular-nums text-[14px] font-bold text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
                    >
                      {d.code}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCurriculum(d)}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[13px] font-medium text-[#2563EB] hover:bg-blue-100 transition border border-blue-200 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span>Khung CTDT</span>
                  </button>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(d)}
                    className="text-[18px] font-semibold text-[#0F172A] leading-snug cursor-pointer hover:text-[#2563EB] transition"
                  >
                    {d.name}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[14px] font-normal text-[#475569] pt-1">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[12px] text-[#64748B] uppercase font-semibold">Môn học</span>
                    <span className="text-[16px] font-bold text-[#0F172A]">{subjectsCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[12px] text-[#64748B] uppercase font-semibold">Lớp học</span>
                    <span className="text-[16px] font-bold text-[#0F172A]">{classesCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[12px] text-[#64748B] uppercase font-semibold">Giảng viên</span>
                    <span className="text-[16px] font-bold text-[#0F172A]">{teachersCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[14px] font-medium">
                <button
                  type="button"
                  onClick={() => onDetail(d)}
                  className="flex items-center gap-1 text-[#2563EB] hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(d)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(d.id)}
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
        <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
          <thead className="bg-slate-50 text-[14px] font-semibold uppercase tracking-wider text-[#475569] border-b border-slate-200">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="p-2 whitespace-nowrap">Mã Khoa</th>
              <th scope="col" className="p-2 min-w-[200px]">Tên Khoa đào tạo</th>
              <th scope="col" className="p-2 whitespace-nowrap">Số môn</th>
              <th scope="col" className="p-2 whitespace-nowrap">Số lớp</th>
              <th scope="col" className="p-2 whitespace-nowrap">Số giảng viên</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {departments.map((d) => {
              const isChecked = selected.includes(d.id);
              const subjectsCount = Math.max((d as any).subjectsCount || 0, (d as any)._count?.majorSubjects || 0, (d as any)._count?.subjects || 0, (d as any).subjects?.length || 0);
              const classesCount = (d as any).classesCount ?? (d as any)._count?.classes ?? ((d as any).classes?.length || 0);
              const teachersCount = (d as any).teachersCount ?? (d as any)._count?.teachers ?? ((d as any).teachers?.length || 0);

              return (
                <tr key={d.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(d.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap font-sans tabular-nums font-black text-slate-900">
                    <button type="button" onClick={() => onDetail(d)} className="hover:text-blue-600">
                      {d.code}
                    </button>
                  </td>
                  <td className="p-2 min-w-[200px]">
                    <p className="truncate font-extrabold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(d)}>
                      {d.name}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{subjectsCount} môn</td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-800">{classesCount} lớp</td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-800">{teachersCount} GV</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(d)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
            {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã Khoa</th>}
            {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên Khoa đào tạo</th>}
            {visibleColumns.subjectsCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số môn học</th>}
            {visibleColumns.classesCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số lớp học</th>}
            {visibleColumns.teachersCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số giảng viên</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {departments.map((d, index) => {
            const isChecked = selected.includes(d.id);
            const subjectsCount = Math.max((d as any).subjectsCount || 0, (d as any)._count?.majorSubjects || 0, (d as any)._count?.subjects || 0, (d as any).subjects?.length || 0);
            const classesCount = (d as any).classesCount ?? (d as any)._count?.classes ?? ((d as any).classes?.length || 0);
            const teachersCount = (d as any).teachersCount ?? (d as any)._count?.teachers ?? ((d as any).teachers?.length || 0);
            const isLastRow = index >= Math.floor(departments.length / 2);

            return (
              <tr
                key={d.id}
                className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''
                  }`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(d.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.code !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="font-sans tabular-nums text-[14px] font-bold text-[#0F172A] hover:text-[#2563EB] transition cursor-pointer"
                    >
                      {d.code}
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <span
                      onClick={() => onDetail(d)}
                      className="font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB] transition text-[15px]"
                    >
                      {d.name}
                    </span>
                  </td>
                )}

                {visibleColumns.subjectsCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-[#0F172A]">{subjectsCount} môn</span>
                  </td>
                )}

                {visibleColumns.classesCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-[#0F172A]">{classesCount} lớp</span>
                  </td>
                )}

                {visibleColumns.teachersCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-[#0F172A]">{teachersCount} giảng viên</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    {/* Curriculum Button - Clean Monochrome */}
                    <button
                      type="button"
                      onClick={() => onOpenCurriculum(d)}
                      className="flex items-center gap-1 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1 text-xs font-bold transition cursor-pointer shadow-2xs"
                      title="Quản lý Khung Chương trình Đào tạo"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                      <span>Khung CTDT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDetail(d)}
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
                              onOpenCurriculum(d);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#2563EB] font-medium"
                          >
                            <Sparkles className="h-4 w-4 text-[#2563EB]" />
                            <span>Khung CTDT</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(d);
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
                                  onEdit(d);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155]"
                              >
                                <Edit className="h-4 w-4 text-[#2563EB]" />
                                <span>Chỉnh sửa Khoa</span>
                              </button>

                              <div className="my-1 border-t border-[#E2E8F0]" />

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onDelete(d.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626]"
                              >
                                <Trash2 className="h-4 w-4 text-[#DC2626]" />
                                <span>Xóa Khoa</span>
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
