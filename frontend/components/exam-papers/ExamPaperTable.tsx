'use client';

import React, { useState } from 'react';
import { Eye, Send, Archive, RotateCcw, Trash2, Download, Clock, BookOpen, HelpCircle, Award, MoreVertical, Calendar, KeyRound } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { StatusBadge } from '../common/StatusBadge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { formatExamType } from '../../lib/enum-labels';
import { ExamPaper } from '../../types';

export function getPaperCodeRange(paper: any): { rangeText: string; isVariant: boolean; variantCount: number } {
  const match = (paper.title || '').match(/Bộ\s*(\d+)\s*mã/i);
  const variantCount = match ? parseInt(match[1], 10) : (paper.variantCount || 1);
  const baseNum = parseInt((paper.paperCode || '').replace(/\D/g, ''), 10);
  if (!isNaN(baseNum) && variantCount > 1) {
    const endNum = baseNum + variantCount - 1;
    return { rangeText: `${baseNum} – ${endNum}`, isVariant: true, variantCount };
  }
  return { rangeText: paper.paperCode, isVariant: false, variantCount: 1 };
}

interface ExamPaperTableProps {
  papers: ExamPaper[];
  selected: number[];
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (id: number) => void;
  onExportWord: (paper: ExamPaper) => void;
  onAction: (paper: ExamPaper, action: 'publish' | 'archive' | 'restore' | 'delete') => void;
  onChangePassword?: (paper: ExamPaper) => void;
  busyId: number | null;
  isAdmin: boolean;
  canPublishMock?: boolean;
}

export function ExamPaperTable({
  papers,
  selected,
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
  canPublishMock = false,
}: ExamPaperTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const allSelected = papers.length > 0 && selected.length === papers.length;
  const canPublishPaper = (paper: ExamPaper) => isAdmin || (
    canPublishMock && (paper as any).examSchedule?.mode === 'MOCK'
  );

  // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="ui-table w-full text-left text-type-body text-slate-700 border-collapse">
        <thead className="bg-slate-50 text-type-body-sm font-medium tracking-wider text-slate-600 border-b border-slate-200">
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
                        className="tabular-nums text-type-body leading-[22px] font-medium text-slate-900 hover:text-blue-600 transition cursor-pointer"
                      >
                        <IdentifierBadge tone="blue">{getPaperCodeRange(p).rangeText}</IdentifierBadge>
                      </button>
                      <p className="text-type-body leading-[22px] font-medium text-slate-400">
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
                          <span className="tabular-nums font-medium text-slate-900 text-type-body leading-[22px]">
                            [{subCode}]
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDetail(p.id)}
                          className="font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition text-type-body leading-[22px] whitespace-nowrap"
                        >
                          {subName}
                        </button>
                      </div>
                      {periodName && (
                        <p className="text-type-body leading-[22px] font-medium text-slate-400 mt-0.5 whitespace-nowrap block">
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
                  <td className="p-3.5 whitespace-nowrap text-type-body">
                    <span className="font-medium text-slate-900">{qCount} câu</span>
                  </td>
                )}

                {visibleColumns.durationMinutes !== false && (
                  <td className="p-3.5 whitespace-nowrap text-slate-700">
                    <div className="space-y-0.5">
                      {dateStr ? (
                        <p className="text-type-body leading-[22px]">
                          <span className="font-medium text-slate-900">{dateStr}</span>
                          {timeStr && <span className="text-slate-500 ml-1.5 font-medium">({timeStr})</span>}
                        </p>
                      ) : (
                        <p className="text-type-body leading-[22px] font-medium text-slate-400">
                          Chưa xếp lịch thi
                        </p>
                      )}
                      <p className="text-type-body leading-[22px] font-medium text-slate-400">
                        Làm bài: <span className="font-medium text-slate-700">{p.durationMinutes} phút</span>
                      </p>
                    </div>
                  </td>
                )}

                {visibleColumns.totalScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center text-type-body">
                    <span className="font-medium text-slate-900">{p.totalScore}đ</span>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                  <div className="flex items-center justify-end gap-1">
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
                              <KeyRound className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Đổi mật khẩu</span>
                            </button>
                          )}

                          {p.status === 'DRAFT' && canPublishPaper(p) && (
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onAction(p, 'publish');
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap text-type-body font-medium select-none"
                            >
                              <Send className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Phát hành</span>
                            </button>
                          )}

                          {isAdmin && (
                            <>

                              {p.status === 'PUBLISHED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'archive');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap text-type-body font-medium select-none"
                                >
                                  <Archive className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                  <span>Lưu trữ</span>
                                </button>
                              )}

                              {p.status === 'ARCHIVED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(p, 'restore');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer whitespace-nowrap text-type-body font-medium select-none"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Khôi phục</span>
                                </button>
                              )}

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onAction(p, 'delete');
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer whitespace-nowrap text-type-body font-medium select-none"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
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
