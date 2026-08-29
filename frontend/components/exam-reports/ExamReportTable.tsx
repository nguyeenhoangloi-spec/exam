'use client';

import React, { useState } from 'react';
import { Eye, GraduationCap, AlertTriangle, Clock, CheckCircle2, MoreVertical, Award, FileText } from 'lucide-react';
import { ExamAttemptReviewModal } from './ExamAttemptReviewModal';
import { StatusBadge } from '../common/StatusBadge';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';

export interface CandidateReport {
 studentId: number;
 studentCode: string;
 fullName: string;
 className: string;
 status: 'SUBMITTED' | 'AUTO_SUBMITTED' | 'GRADED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'ABSENT';
 totalScore: number;
 maxScore: number;
 submittedAt: string | null;
 violationCount: number;
 attemptId?: string;
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
 GRADED: { label: 'Đã chấm điểm', className: 'bg-emerald-50 text-emerald-700' },
 SUBMITTED: { label: 'Đã nộp bài', className: 'bg-emerald-50 text-emerald-700' },
 AUTO_SUBMITTED: { label: 'Tự động nộp (Hết giờ)', className: 'bg-emerald-50 text-emerald-700' },
 UNDER_REVIEW: { label: 'Tạm khóa (Vi phạm)', className: 'bg-amber-50 text-amber-700' },
 IN_PROGRESS: { label: 'Đang làm bài', className: 'bg-blue-50 text-blue-700' },
 ABSENT: { label: 'Chưa thi / Vắng thi', className: 'bg-rose-50 text-rose-700' },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

interface ExamReportTableProps {
  candidates: CandidateReport[];
  selected: number[];
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (c: CandidateReport) => void;
}

export function ExamReportTable({
  candidates,
  selected,
  visibleColumns = {
    studentCode: true,
    fullName: true,
    className: true,
    status: true,
    totalScore: true,
    submittedAt: true,
    violationCount: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
}: ExamReportTableProps) {
 const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
 const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
 const allSelected = candidates.length > 0 && selected.length === candidates.length;

 return (
 <>
 <div className="ui-table-wrap min-h-[380px] overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-2xs">
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
 {visibleColumns.studentCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã sinh viên</th>}
 {visibleColumns.fullName !== false && <th scope="col" className="p-3.5 min-w-[200px]">Họ và Tên thí sinh</th>}
 {visibleColumns.className !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Lớp sinh viên</th>}
 {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái nộp bài</th>}
 {visibleColumns.totalScore !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Điểm thi (/10)</th>}
 {visibleColumns.submittedAt !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian nộp</th>}
 {visibleColumns.violationCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Vi phạm</th>}
 <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {candidates.map((c) => {
 const isChecked = selected.includes(c.studentId);
 const badge = statusBadgeMap[c.status] || { label: c.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };

 return (
 <tr
 key={c.studentId}
 className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''
 }`}
 >
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => onSelect(c.studentId, e.target.checked)}
 className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {visibleColumns.studentCode !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <IdentifierBadge>{c.studentCode}</IdentifierBadge>
 </td>
 )}

 {visibleColumns.fullName !== false && (
 <td className="p-3.5 min-w-[200px]">
 <button
 type="button"
 onClick={() => onDetail(c)}
 className="font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition"
 >
 {c.fullName}
 </button>
 </td>
 )}

 {visibleColumns.className !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-700">
 {c.className}
 </td>
 )}

 {visibleColumns.status !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <StatusBadge status={c.status} />
 </td>
 )}

 {visibleColumns.totalScore !== false && (
 <td className="p-3.5 whitespace-nowrap text-center font-medium">
 {c.status === 'ABSENT' ? (
 <StatusBadge status="ABSENT" customLabel="Vắng thi" />
 ) : (
 <span
 className={`text-type-body ${c.totalScore >= 5 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'
 }`}
 >
 {c.totalScore}
 </span>
 )}
 </td>
 )}

 {visibleColumns.submittedAt !== false && (
 <td className="p-3.5 whitespace-nowrap font-medium text-slate-600">
 {c.submittedAt ? (
 <span className="inline-flex items-center gap-1 text-slate-700">
 <Clock className="h-3.5 w-3.5 text-slate-400" />
 {new Date(c.submittedAt).toLocaleTimeString('vi-VN')}
 </span>
 ) : (
 '—'
 )}
 </td>
 )}

 {visibleColumns.violationCount !== false && (
 <td className="p-3.5 whitespace-nowrap text-center">
 {c.violationCount > 0 ? (
 <span className="table-badge inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-type-body leading-[18px] font-medium text-rose-700 border border-rose-200">
 <AlertTriangle className="h-3 w-3 text-rose-600" /> {c.violationCount}
 </span>
 ) : (
 <span className="text-slate-400 font-medium">0</span>
 )}
 </td>
 )}

 <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
 <div className="flex items-center justify-end gap-1">
 <ActionDropdownPortal>
 {(closeMenu) => (
 <>
                          {c.attemptId && (
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                setReviewAttemptId(c.attemptId!);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                            >
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span>Xem bài làm</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onDetail(c);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-body font-medium transition cursor-pointer select-none"
                          >
                            <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>Xem chi tiết</span>
                          </button>
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

 {reviewAttemptId && (
 <ExamAttemptReviewModal
 attemptId={reviewAttemptId}
 onClose={() => setReviewAttemptId(null)}
 />
 )}
 </>
 );
}
