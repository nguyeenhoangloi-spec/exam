'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, GraduationCap, Building2, Mail, Phone, MoreVertical } from 'lucide-react';
import { Teacher } from '../../types';

const DEGREE_BADGE: Record<string, string> = {
  'GS.TS': 'bg-purple-50 text-purple-700 border-purple-200',
  'PGS.TS': 'bg-violet-50 text-violet-700 border-violet-200',
  'TS': 'bg-blue-50 text-blue-700 border-blue-200',
  'ThS': 'bg-sky-50 text-sky-700 border-sky-200',
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
          const degreeBadge = DEGREE_BADGE[t.degree] || 'bg-slate-50 text-slate-600 border-slate-200';

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
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(t)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {t.teacherCode}
                    </button>
                  </div>

                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-black ${degreeBadge}`}>
                    {t.degree || 'TS'}
                  </span>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(t)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {t.fullName}
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.department?.name || '---'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-500">{t.email}</span>
                  </div>
                  {t.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(t)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem hồ sơ</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
              <th className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-2 whitespace-nowrap">Mã GV</th>
              <th className="p-2 min-w-[160px]">Họ và tên</th>
              <th className="p-2 whitespace-nowrap">Học vị</th>
              <th className="p-2 min-w-[140px]">Khoa</th>
              <th className="p-2 min-w-[170px]">Email</th>
              <th className="p-2 whitespace-nowrap">SĐT</th>
              <th className="p-2 pr-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {teachers.map((t) => {
              const isChecked = selected.includes(t.id);
              const degreeBadge = DEGREE_BADGE[t.degree] || 'bg-slate-50 text-slate-600 border-slate-200';
              return (
                <tr key={t.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(t.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 font-bold text-sky-700 font-mono whitespace-nowrap">{t.teacherCode}</td>
                  <td className="p-2 min-w-[160px]">
                    <span
                      onClick={() => onDetail(t)}
                      className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                    >
                      {t.fullName}
                    </span>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${degreeBadge}`}>
                      {t.degree || 'TS'}
                    </span>
                  </td>
                  <td className="p-2 text-slate-700 min-w-[140px]">{t.department?.name || '---'}</td>
                  <td className="p-2 text-slate-500 min-w-[170px]">{t.email}</td>
                  <td className="p-2 whitespace-nowrap text-slate-600">{t.phone || '---'}</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(t)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
            <th className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.teacherCode !== false && <th className="p-3.5 whitespace-nowrap">Mã Giảng viên</th>}
            {visibleColumns.fullName !== false && <th className="p-3.5 min-w-[200px]">Họ và Tên</th>}
            {visibleColumns.degree !== false && <th className="p-3.5 whitespace-nowrap">Học vị</th>}
            {visibleColumns.department !== false && <th className="p-3.5 min-w-[160px]">Khoa trực thuộc</th>}
            {visibleColumns.email !== false && <th className="p-3.5 min-w-[200px]">Email công vụ</th>}
            {visibleColumns.phone !== false && <th className="p-3.5 whitespace-nowrap">Số điện thoại</th>}
            <th className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {teachers.map((t) => {
            const isChecked = selected.includes(t.id);
            const degreeBadge = DEGREE_BADGE[t.degree] || 'bg-slate-50 text-slate-600 border-slate-200';

            return (
              <tr
                key={t.id}
                className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(t.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.teacherCode !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-mono font-black text-sky-700">{t.teacherCode}</span>
                  </td>
                )}

                {visibleColumns.fullName !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span
                        onClick={() => onDetail(t)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition leading-tight"
                      >
                        {t.fullName}
                      </span>
                    </div>
                  </td>
                )}

                {visibleColumns.degree !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-black ${degreeBadge}`}>
                      {t.degree || 'TS'}
                    </span>
                  </td>
                )}

                {visibleColumns.department !== false && (
                  <td className="p-3.5 min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-semibold">{t.department?.name || '---'}</span>
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
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem hồ sơ"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {isAdmin && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === t.id ? null : t.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === t.id && (
                          <div
                            className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                            onMouseLeave={() => setActiveMenuId(null)}
                          >
                            <button
                              type="button"
                              onClick={() => { setActiveMenuId(null); onDetail(t); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span>Xem hồ sơ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveMenuId(null); onEdit(t); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-amber-50 text-amber-700"
                            >
                              <Edit className="h-3.5 w-3.5 text-amber-500" />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveMenuId(null); onDelete(t.id); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xóa Giảng viên</span>
                            </button>
                          </div>
                        )}
                      </div>
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
