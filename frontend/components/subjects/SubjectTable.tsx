'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, BookOpen, Building2, Award, UserPlus, MoreVertical } from 'lucide-react';
import { Subject } from '../../types';

interface SubjectTableProps {
  subjects: Subject[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
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
  viewMode = 'list',
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

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {subjects.map((s) => {
          const isChecked = selected.includes(s.id);
          const deptName = s.department?.name || (s as any).departmentName || 'Chưa gán Khoa';

          return (
            <div
              key={s.id}
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
                      onChange={(e) => onSelect(s.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {s.subjectCode}
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <Award className="h-3 w-3 text-emerald-600" /> {s.credits} Tín chỉ
                  </span>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(s)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {s.subjectName}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pt-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{deptName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onEnroll(s)}
                  className="flex items-center gap-1 text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Gán sinh viên</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
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
              <th scope="col" className="p-2 whitespace-nowrap">Mã môn</th>
              <th scope="col" className="p-2 min-w-[200px]">Tên môn học</th>
              <th scope="col" className="p-2 whitespace-nowrap">Tín chỉ</th>
              <th scope="col" className="p-2 min-w-[180px]">Khoa đào tạo</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {subjects.map((s) => {
              const isChecked = selected.includes(s.id);
              const deptName = s.department?.name || (s as any).departmentName || '---';

              return (
                <tr key={s.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(s.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">
                    <button type="button" onClick={() => onDetail(s)} className="rounded px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100">
                      {s.subjectCode}
                    </button>
                  </td>
                  <td className="p-2 min-w-[200px]">
                    <p className="truncate font-extrabold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(s)}>
                      {s.subjectName}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-emerald-600">{s.credits} TC</td>
                  <td className="p-2 min-w-[180px] font-semibold text-slate-700">{deptName}</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(s)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
            {visibleColumns.subjectCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã Môn học</th>}
            {visibleColumns.subjectName !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên Môn học</th>}
            {visibleColumns.credits !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số Tín chỉ</th>}
            {visibleColumns.department !== false && <th scope="col" className="p-3.5 min-w-[200px]">Khoa đào tạo</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {subjects.map((s) => {
            const isChecked = selected.includes(s.id);
            const deptName = s.department?.name || (s as any).departmentName || 'Chưa gán Khoa';

            return (
              <tr
                key={s.id}
                className={`transition hover:bg-blue-50/40 ${
                  isChecked ? 'bg-blue-50/60' : ''
                }`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(s.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.subjectCode !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {s.subjectCode}
                    </button>
                  </td>
                )}

                {visibleColumns.subjectName !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span
                        onClick={() => onDetail(s)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                      >
                        {s.subjectName}
                      </span>
                    </div>
                  </td>
                )}

                {visibleColumns.credits !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <Award className="h-3.5 w-3.5 text-emerald-600" /> {s.credits} Tín chỉ
                    </span>
                  </td>
                )}

                {visibleColumns.department !== false && (
                  <td className="p-3.5 min-w-[200px] font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" /> {deptName}
                    </span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    {/* Enroll Student Button */}
                    <button
                      type="button"
                      onClick={() => onEnroll(s)}
                      className="flex items-center gap-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                      title="Gán Sinh viên đăng ký môn học"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-sky-600" />
                      <span>Gán SV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDetail(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === s.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEnroll(s);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sky-50 text-sky-700"
                          >
                            <UserPlus className="h-3.5 w-3.5 text-sky-600" />
                            <span>Gán Sinh viên</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDetail(s);
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
                                  onEdit(s);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-blue-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Chỉnh sửa môn</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(s.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa môn học</span>
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
