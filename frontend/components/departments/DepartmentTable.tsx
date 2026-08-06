'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Building2, BookOpen, GraduationCap, Users, Sparkles, MoreVertical } from 'lucide-react';
import { Department } from '../../types';

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
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {d.code}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCurriculum(d)}
                    className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-100 transition border border-sky-200 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-sky-600" />
                    <span>Khung CTDT</span>
                  </button>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(d)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {d.name}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Môn học</span>
                    <span className="text-sm font-black text-slate-900">{subjectsCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Lớp học</span>
                    <span className="text-sm font-black text-slate-900">{classesCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Giảng viên</span>
                    <span className="text-sm font-black text-slate-900">{teachersCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(d)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
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
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">
                    <button type="button" onClick={() => onDetail(d)} className="rounded px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100">
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
      <table className="w-full text-left text-xs text-slate-700 border-collapse">
        <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
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
        <tbody className="divide-y divide-slate-100 font-medium">
          {departments.map((d) => {
            const isChecked = selected.includes(d.id);
          const subjectsCount = Math.max((d as any).subjectsCount || 0, (d as any)._count?.majorSubjects || 0, (d as any)._count?.subjects || 0, (d as any).subjects?.length || 0);
          const classesCount = (d as any).classesCount ?? (d as any)._count?.classes ?? ((d as any).classes?.length || 0);
          const teachersCount = (d as any).teachersCount ?? (d as any)._count?.teachers ?? ((d as any).teachers?.length || 0);

            return (
              <tr
                key={d.id}
                className={`transition hover:bg-blue-50/40 ${
                  isChecked ? 'bg-blue-50/60' : ''
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
                  <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {d.code}
                    </button>
                  </td>
                )}

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span
                        onClick={() => onDetail(d)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                      >
                        {d.name}
                      </span>
                    </div>
                  </td>
                )}

                {visibleColumns.subjectsCount !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" /> {subjectsCount} môn
                    </span>
                  </td>
                )}

                {visibleColumns.classesCount !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                      <GraduationCap className="h-3.5 w-3.5 text-purple-600" /> {classesCount} lớp
                    </span>
                  </td>
                )}

                {visibleColumns.teachersCount !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                      <Users className="h-3.5 w-3.5 text-blue-600" /> {teachersCount} giảng viên
                    </span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    {/* Curriculum Button */}
                    <button
                      type="button"
                      onClick={() => onOpenCurriculum(d)}
                      className="flex items-center gap-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                      title="Quản lý Khung Chương trình Đào tạo"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                      <span>Khung CTDT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDetail(d)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === d.id ? null : d.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === d.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenCurriculum(d);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sky-50 text-sky-700"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                            <span>Khung CTDT</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDetail(d);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xem chi tiết</span>
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(d);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-blue-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Chỉnh sửa Khoa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(d.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa Khoa</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
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
