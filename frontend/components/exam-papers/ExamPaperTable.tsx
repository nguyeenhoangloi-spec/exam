'use client';

import React, { useState } from 'react';
import { Eye, Send, Archive, RotateCcw, Trash2, Download, Clock, BookOpen, HelpCircle, Award, MoreVertical } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { ExamPaper } from '../../types';

const statusStyle: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PUBLISHED: { label: 'Đã phát hành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ARCHIVED: { label: 'Đã lưu trữ', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

interface ExamPaperTableProps {
  papers: ExamPaper[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (id: number) => void;
  onExportWord: (paper: ExamPaper) => void;
  onAction: (paper: ExamPaper, action: 'publish' | 'archive' | 'restore' | 'delete') => void;
  busyId: number | null;
  isAdmin: boolean;
}

export function ExamPaperTable({
  papers,
  selected,
  viewMode = 'list',
  visibleColumns = {
    paperCode: true,
    subjectName: true,
    status: true,
    questionCount: true,
    durationMinutes: true,
    totalScore: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
  onExportWord,
  onAction,
  busyId,
  isAdmin,
}: ExamPaperTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = papers.length > 0 && selected.length === papers.length;

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {papers.map((p) => {
          const isChecked = selected.includes(p.id);
          const badge = statusStyle[p.status] || { label: p.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
          const subjectName = (p as any).subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || 'Môn học';
          const qCount = (p as any)._count?.questions ?? (p as any).questionCount ?? p.questions?.length ?? (p as any).details?.length ?? 0;

          return (
            <div
              key={p.id}
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
                      onChange={(e) => onSelect(p.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(p.id)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      Mã đề: {p.paperCode}
                    </button>
                  </div>

                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div>
                  <h4
                    onClick={() => onDetail(p.id)}
                    className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                  >
                    {subjectName}
                  </h4>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> {p.durationMinutes} phút làm bài
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <HelpCircle className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span>{qCount} câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 border border-slate-100">
                    <Award className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{p.totalScore} điểm</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onDetail(p.id)}
                  disabled={busyId === p.id}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{busyId === p.id ? 'Đang mở...' : 'Xem chi tiết đề'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onExportWord(p)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="Xuất Word (.doc)"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  {p.status === 'DRAFT' && isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAction(p, 'publish')}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Phát hành đề thi"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
              <th scope="col" className="p-2 whitespace-nowrap">Mã Đề</th>
              <th scope="col" className="p-2 min-w-[180px]">Môn học</th>
              <th scope="col" className="p-2 whitespace-nowrap">Trạng thái</th>
              <th scope="col" className="p-2 whitespace-nowrap">Số câu</th>
              <th scope="col" className="p-2 whitespace-nowrap">Thời gian</th>
              <th scope="col" className="p-2 whitespace-nowrap">Tổng điểm</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {papers.map((p) => {
              const isChecked = selected.includes(p.id);
              const badge = statusStyle[p.status] || { label: p.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
              const subjectName = (p as any).subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '---';
              const qCount = (p as any)._count?.questions ?? (p as any).questionCount ?? p.questions?.length ?? (p as any).details?.length ?? 0;

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
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">{p.paperCode}</td>
                  <td className="p-2 min-w-[180px]">
                    <p className="truncate font-extrabold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(p.id)}>
                      {subjectName}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-slate-800">{qCount} câu</td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{p.durationMinutes} phút</td>
                  <td className="p-2 whitespace-nowrap font-bold text-emerald-600">{p.totalScore} đ</td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(p.id)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
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
            {visibleColumns.paperCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã Đề thi</th>}
            {visibleColumns.subjectName !== false && <th scope="col" className="p-3.5 min-w-[200px]">Tên Môn học</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            {visibleColumns.questionCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số câu hỏi</th>}
            {visibleColumns.durationMinutes !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian làm bài</th>}
            {visibleColumns.totalScore !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Tổng điểm</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {papers.map((p, index) => {
            const isChecked = selected.includes(p.id);
            const badge = statusStyle[p.status] || { label: p.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
            const subjectName = (p as any).subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '---';
            const qCount = (p as any)._count?.questions ?? (p as any).questionCount ?? p.questions?.length ?? (p as any).details?.length ?? 0;
            const isLastRow = index >= Math.floor(papers.length / 2);

            return (
              <tr
                key={p.id}
                className={`transition hover:bg-blue-50/40 ${
                  isChecked ? 'bg-blue-50/60' : ''
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

                {visibleColumns.paperCode !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => onDetail(p.id)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono hover:bg-blue-100 transition cursor-pointer"
                    >
                      {p.paperCode}
                    </button>
                  </td>
                )}

                {visibleColumns.subjectName !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span
                        onClick={() => onDetail(p.id)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition truncate"
                      >
                        {subjectName}
                      </span>
                    </div>
                  </td>
                )}

                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                )}

                {visibleColumns.questionCount !== false && (
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                      <HelpCircle className="h-3.5 w-3.5 text-sky-600" /> {qCount} câu
                    </span>
                  </td>
                )}

                {visibleColumns.durationMinutes !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {p.durationMinutes} phút
                    </span>
                  </td>
                )}

                {visibleColumns.totalScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center font-black text-emerald-600">
                    {p.totalScore} đ
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onDetail(p.id)}
                      disabled={busyId === p.id}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết đề"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportWord(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xuất Word (.doc)"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <ActionDropdownPortal>
                      {(closeMenu) => (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(p.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xem chi tiết</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onExportWord(p);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xuất Word (.doc)</span>
                          </button>

                          {isAdmin && (
                            <>
                              {p.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'publish');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                                >
                                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Phát hành Đề thi</span>
                                </button>
                              )}

                              {p.status === 'PUBLISHED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'archive');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                                >
                                  <Archive className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Lưu trữ Đề thi</span>
                                </button>
                              )}

                              {p.status === 'ARCHIVED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'restore');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Khôi phục Đề thi</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onAction(p, 'delete');
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                <span>Xóa Đề thi</span>
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
