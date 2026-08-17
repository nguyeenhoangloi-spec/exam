'use client';

import React, { useState } from 'react';
import { Eye, Send, Archive, RotateCcw, Trash2, Download, Clock, BookOpen, HelpCircle, Award, MoreVertical, Calendar, KeyRound } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { StatusBadge } from '../common/StatusBadge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { formatExamType } from '../../lib/enum-labels';
import { ExamPaper } from '../../types';

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
  onChangePassword?: (paper: ExamPaper) => void;
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
  onChangePassword,
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
          const sched = (p as any).examSchedule || {};
          const subCode = (p as any).subjectCode || sched.subjectCode || sched.subject?.subjectCode || '';
          const subName = (p as any).subjectName || sched.subjectName || sched.subject?.subjectName || 'Môn thi';
          const periodName = sched.periodName || sched.examPeriod?.name || sched.period?.name || '';
          const dateStr = sched.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : null;
          const timeStr = sched.startTime && sched.endTime ? `${sched.startTime} – ${sched.endTime}` : null;
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
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(p.id)}
                      className="tabular-nums text-xs font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer"
                    >
                      <IdentifierBadge>Mã đề: {p.paperCode}</IdentifierBadge>
                    </button>
                  </div>

                  <StatusBadge status={p.status} />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {subCode && (
                      <span className="text-[13px] font-semibold text-slate-600 tabular-nums">
                        {subCode}
                      </span>
                    )}
                    <h4
                      onClick={() => onDetail(p.id)}
                      className="text-[15px] font-semibold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition truncate"
                    >
                      {subName}
                    </h4>
                  </div>
                  {periodName && (
                    <p className="text-[13px] font-normal text-slate-500 mt-0.5 truncate">
                      {periodName}
                    </p>
                  )}

                  <div className="mt-2 space-y-0.5 text-[14px] font-normal text-slate-600">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                      {dateStr ? `${dateStr} (${timeStr || 'Chưa có giờ'})` : 'Chưa xếp lịch thi'}
                    </span>
                    <span className="text-[13px] text-slate-500 font-normal block pl-5">
                      Thời gian làm bài: {p.durationMinutes} phút
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex items-center gap-[6px] text-[13px] text-slate-600">
                    <HelpCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{qCount} câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-[6px] text-[13px] text-slate-600">
                    <Award className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{p.totalScore} điểm</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onDetail(p.id)}
                  disabled={busyId === p.id}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{busyId === p.id ? 'Đang mở...' : 'Xem chi tiết'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onExportWord(p)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                    title="Xuất Word (.doc)"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  {p.status === 'DRAFT' && isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAction(p, 'publish')}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition cursor-pointer"
                      title="Phát hành đề thi"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAction(p, 'delete')}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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

  // 2. Dạng Thẻ Thanh Ngang Thu Gọn (Compact Card Row Mode)
  if (viewMode === 'compact') {
    return (
      <div className="space-y-2.5">
        {papers.map((p) => {
          const isChecked = selected.includes(p.id);
          const sched = (p as any).examSchedule || {};
          const subCode = (p as any).subjectCode || sched.subjectCode || sched.subject?.subjectCode || '';
          const subName = (p as any).subjectName || sched.subjectName || sched.subject?.subjectName || '---';
          const qCount = (p as any)._count?.questions ?? (p as any).questionCount ?? p.questions?.length ?? (p as any).details?.length ?? 0;
          const title = p.title || (subName ? `Đề thi môn ${subName}` : `Đề thi ${p.paperCode}`);

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Left: Checkbox + Avatar Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onSelect(p.id, e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <button
                  type="button"
                  onClick={() => onDetail(p.id)}
                  className="tabular-nums text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                >
                  <IdentifierBadge tone="blue">{p.paperCode}</IdentifierBadge>
                </button>
                <div className="min-w-0">
                  <h4
                    onClick={() => onDetail(p.id)}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition truncate"
                  >
                    {title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    {subCode && <span className="font-medium text-slate-500 dark:text-slate-400">#{subCode}</span>}
                    <span>• {qCount} câu hỏi</span>
                    <span>• {p.durationMinutes} phút</span>
                    <span>• {p.totalScore} điểm</span>
                  </div>
                </div>
              </div>

              {/* Right: Status & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={p.status} />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetail(p.id)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onExportWord(p)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                    title="Xuất Word (.doc)"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  {p.status === 'DRAFT' && isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAction(p, 'publish')}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition cursor-pointer"
                      title="Phát hành đề thi"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAction(p, 'delete')}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="h-4 w-4" />
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
            {visibleColumns.paperCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã đề thi</th>}
            {visibleColumns.subjectName !== false && <th scope="col" className="p-3.5 min-w-[220px]">Tên môn học & kỳ thi</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            {visibleColumns.questionCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Số câu hỏi</th>}
            {visibleColumns.durationMinutes !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Lịch thi & Thời gian</th>}
            {visibleColumns.totalScore !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Tổng điểm</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {papers.map((p) => {
            const isChecked = selected.includes(p.id);
            const sched = (p as any).examSchedule || {};
            const subCode = (p as any).subjectCode || sched.subjectCode || sched.subject?.subjectCode || '';
            const subName = (p as any).subjectName || sched.subjectName || sched.subject?.subjectName || 'Môn thi';
            const periodName = sched.periodName || sched.examPeriod?.name || sched.period?.name || '';
            const dateStr = sched.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : null;
            const timeStr = sched.startTime && sched.endTime ? `${sched.startTime} – ${sched.endTime}` : null;
            const qCount = (p as any)._count?.questions ?? (p as any).questionCount ?? p.questions?.length ?? (p as any).details?.length ?? 0;
            const examType = sched.examType || (p as any).examType || 'TRAC_NGHIEM';

            return (
              <tr
                key={p.id}
                className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}
              >
                <td className="p-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelect(p.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.paperCode !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onDetail(p.id)}
                        className="tabular-nums text-[15px] leading-[22px] font-medium text-slate-900 hover:text-blue-600 transition cursor-pointer"
                      >
                        <IdentifierBadge>{p.paperCode}</IdentifierBadge>
                      </button>
                      <p className="text-[15px] leading-[22px] font-medium text-slate-400">
                        {formatExamType(examType)}
                      </p>
                    </div>
                  </td>
                )}

                {visibleColumns.subjectName !== false && (
                  <td className="p-3.5 min-w-[250px] whitespace-nowrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {subCode && (
                          <span className="tabular-nums font-medium text-slate-900 text-[15px] leading-[22px]">
                            [{subCode}]
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDetail(p.id)}
                          className="font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition text-[15px] leading-[22px] whitespace-nowrap"
                        >
                          {subName}
                        </button>
                      </div>
                      {periodName && (
                        <p className="text-[15px] leading-[22px] font-medium text-slate-400 mt-0.5 whitespace-nowrap block">
                          {periodName}
                        </p>
                      )}
                    </div>
                  </td>
                )}

                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap">
                    <StatusBadge status={p.status} />
                  </td>
                )}

                {visibleColumns.questionCount !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[15px]">
                    <span className="font-medium text-slate-900">{qCount} câu</span>
                  </td>
                )}

                {visibleColumns.durationMinutes !== false && (
                  <td className="p-3.5 whitespace-nowrap text-slate-700">
                    <div className="space-y-0.5">
                      {dateStr ? (
                        <p className="text-[15px] leading-[22px]">
                          <span className="font-medium text-slate-900">{dateStr}</span>
                          {timeStr && <span className="text-slate-500 ml-1.5 font-medium">({timeStr})</span>}
                        </p>
                      ) : (
                        <p className="text-[15px] leading-[22px] font-medium text-slate-400">
                          Chưa xếp lịch thi
                        </p>
                      )}
                      <p className="text-[15px] leading-[22px] font-medium text-slate-400">
                        Làm bài: <span className="font-medium text-slate-700">{p.durationMinutes} phút</span>
                      </p>
                    </div>
                  </td>
                )}

                {visibleColumns.totalScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center text-[15px]">
                    <span className="font-medium text-slate-900">{p.totalScore}đ</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onDetail(p.id)}
                      disabled={busyId === p.id}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
                      title="Xem chi tiết đề"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportWord(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition cursor-pointer"
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
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>Xem chi tiết</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onExportWord(p);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>Xuất Word (.doc)</span>
                          </button>

                          {onChangePassword && (p.examScheduleId || p.examSchedule?.id || sched.id) && (
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onChangePassword(p);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span>Đổi mật khẩu ca thi</span>
                            </button>
                          )}

                          {isAdmin && (
                            <>
                              {p.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'publish');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Send className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>Phát hành đề thi</span>
                                </button>
                              )}

                              {p.status === 'PUBLISHED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'archive');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Archive className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  <span>Lưu trữ đề thi</span>
                                </button>
                              )}

                              {p.status === 'ARCHIVED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'restore');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  <span>Khôi phục đề thi</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onAction(p, 'delete');
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span>Xóa đề thi</span>
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
