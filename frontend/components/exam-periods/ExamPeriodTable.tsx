'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Calendar, Clock, Award, MoreVertical } from 'lucide-react';
import { ExamPeriod } from '../../types';

import { StatusBadge } from '../common/StatusBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

interface ExamPeriodTableProps {
  periods: ExamPeriod[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (p: ExamPeriod) => void;
  onEdit: (p: ExamPeriod) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}

export function computePeriodStatus(p: { status?: string; startDate?: string; endDate?: string }): 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' {
  if (p.status === 'CANCELLED') return 'CANCELLED';
  if (!p.startDate || !p.endDate) return (p.status as any) || 'UPCOMING';

  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let startStr = p.startDate;
    if (startStr.includes('T')) startStr = startStr.split('T')[0];
    const [sy, sm, sd] = startStr.split('-').map(Number);

    let endStr = p.endDate;
    if (endStr.includes('T')) endStr = endStr.split('T')[0];
    const [ey, em, ed] = endStr.split('-').map(Number);

    const start = new Date(sy, sm - 1, sd, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 23, 59, 59);

    if (now < start) return 'UPCOMING';
    if (now >= start && now <= end) return 'ONGOING';
    return 'COMPLETED';
  } catch {
    return (p.status as any) || 'UPCOMING';
  }
}

export function ExamPeriodTable({
  periods,
  selected,
  viewMode = 'list',
  visibleColumns = {
    name: true,
    semester: true,
    schoolYear: true,
    dateRange: true,
    status: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
  onEdit,
  onDelete,
  isAdmin,
}: ExamPeriodTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = periods.length > 0 && selected.length === periods.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string, period?: ExamPeriod) => {
    const s = (period ? computePeriodStatus(period) : status?.toUpperCase()) || 'UPCOMING';
    return <StatusBadge status={s} />;
  };

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {periods.map((p) => {
          const isChecked = selected.includes(p.id);
          const codeText = `KTI${String(p.id).padStart(4, '0')}`;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(p.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(p)}
                      className="font-mono text-xs font-black text-slate-900 hover:text-blue-600 transition cursor-pointer"
                    >
                      {codeText}
                    </button>
                  </div>
                  {getStatusBadge(p.status)}
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(p)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {p.name}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Học kỳ: <strong>{p.semester}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Năm: <strong>{p.schoolYear}</strong></span>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between pt-1">
                  <span>Thời gian: <strong className="text-slate-800">{formatDate(p.startDate)} - {formatDate(p.endDate)}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(p)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem chi tiết</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
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
          <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="p-2 min-w-[200px]">Tên kỳ thi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Học kỳ</th>
              <th scope="col" className="p-2 whitespace-nowrap">Năm học</th>
              <th scope="col" className="p-2 whitespace-nowrap">Thời gian tổ chức</th>
              <th scope="col" className="p-2 whitespace-nowrap">Trạng thái</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {periods.map((p) => {
              const isChecked = selected.includes(p.id);

              return (
                <tr key={p.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(p.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 min-w-[200px]">
                    <p className="truncate font-extrabold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(p)}>
                      {p.name}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{p.semester}</td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-800">{p.schoolYear}</td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{formatDate(p.startDate)} - {formatDate(p.endDate)}</td>
                  <td className="p-2 whitespace-nowrap">{getStatusBadge(p.status, p)}</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(p)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
        <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
          <tr>
            <th scope="col" className="p-3.5 pl-4 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên kỳ thi</th>}
            {visibleColumns.semester !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Học kỳ</th>}
            {visibleColumns.schoolYear !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Năm học</th>}
            {visibleColumns.dateRange !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian tổ chức</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {periods.map((p, index) => {
            const isChecked = selected.includes(p.id);
            const isLastRow = index >= Math.floor(periods.length / 2);

            return (
              <tr
                key={p.id}
                className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''
                  }`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(p.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.name !== false && (
                  <td className="p-3.5 min-w-[220px]">
                    <p
                      onClick={() => onDetail(p)}
                      className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                    >
                      {p.name}
                    </p>
                  </td>
                )}

                {visibleColumns.semester !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {p.semester}
                    </span>
                  </td>
                )}

                {visibleColumns.schoolYear !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-900">
                    {p.schoolYear}
                  </td>
                )}

                {visibleColumns.dateRange !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    {formatDate(p.startDate)} - {formatDate(p.endDate)}
                  </td>
                )}

                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    {getStatusBadge(p.status, p)}
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onDetail(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
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
                              onDetail(p);
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
                                  closeMenu();
                                  onEdit(p);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-blue-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Chỉnh sửa kỳ thi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onDelete(p.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa kỳ thi</span>
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
