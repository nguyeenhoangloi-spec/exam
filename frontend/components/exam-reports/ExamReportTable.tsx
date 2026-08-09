'use client';

import React, { useState } from 'react';
import { Eye, GraduationCap, AlertTriangle, Clock, CheckCircle2, MoreVertical } from 'lucide-react';
import { ExamAttemptReviewModal } from './ExamAttemptReviewModal';
import { StatusBadge } from '../common/StatusBadge';
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

interface ExamReportTableProps {
  candidates: CandidateReport[];
  selected: number[];
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (c: CandidateReport) => void;
}

export function ExamReportTable({
  candidates,
  selected,
  viewMode = 'list',
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

  // 1. Dạng Lưới (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => {
            const isChecked = selected.includes(c.studentId);
            const badge = statusBadgeMap[c.status] || { label: c.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
            const isPassed = c.status !== 'ABSENT' && c.totalScore >= 5;

            return (
              <div
                key={c.studentId}
                className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                  }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onSelect(c.studentId, e.target.checked)}
                        className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200">
                        {c.studentCode}
                      </span>
                    </div>

                    <StatusBadge status={c.status} />
                  </div>

                  <div>
                    <h4
                      onClick={() => onDetail(c)}
                      className="text-sm font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                    >
                      {c.fullName}
                    </h4>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> {c.className}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Điểm số thi</span>
                      <span className={`text-lg font-black ${c.status === 'ABSENT' ? 'text-rose-600' : isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {c.status === 'ABSENT' ? 'Vắng thi' : `${c.totalScore} / 10`}
                      </span>
                    </div>

                    {c.violationCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> {c.violationCount} vi phạm
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => onDetail(c)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem hồ sơ thi</span>
                  </button>
                </div>
              </div>
            );
          })}
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

  // 2. Dạng Thu Gọn (Compact View Mode)
  if (viewMode === 'compact') {
    return (
      <>
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
                <th scope="col" className="p-2 whitespace-nowrap">Mã SV</th>
                <th scope="col" className="p-2 min-w-[180px]">Họ và Tên</th>
                <th scope="col" className="p-2 whitespace-nowrap">Lớp</th>
                <th scope="col" className="p-2 whitespace-nowrap">Trạng thái</th>
                <th scope="col" className="p-2 whitespace-nowrap text-center">Điểm số</th>
                <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {candidates.map((c) => {
                const isChecked = selected.includes(c.studentId);
                const badge = statusBadgeMap[c.status] || { label: c.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };

                return (
                  <tr key={c.studentId} className={`transition hover:bg-slate-50/60 ${isChecked ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-2 pl-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onSelect(c.studentId, e.target.checked)}
                        className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className="font-mono font-bold text-[14px] text-[#0F172A]">
                        {c.studentCode}
                      </span>
                    </td>
                    <td className="p-2 min-w-[180px]">
                      <p className="truncate font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB]" onClick={() => onDetail(c)}>
                        {c.fullName}
                      </p>
                    </td>
                    <td className="p-2 whitespace-nowrap font-normal text-[#334155]">{c.className}</td>
                    <td className="p-2 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[13px] font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className={`p-2 whitespace-nowrap text-center font-bold ${c.status === 'ABSENT' ? 'text-rose-600' : c.totalScore >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {c.status === 'ABSENT' ? 'Vắng' : c.totalScore}
                    </td>
                    <td className="p-2 pr-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {c.attemptId && (
                          <button
                            type="button"
                            onClick={() => setReviewAttemptId(c.attemptId!)}
                            className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-[13px] font-medium transition cursor-pointer"
                            title="Xem chi tiết bài làm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button type="button" onClick={() => onDetail(c)} className="p-1 text-slate-500 hover:text-[#2563EB] cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </button>
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

  // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
  return (
    <>
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
              {visibleColumns.studentCode !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã Sinh viên</th>}
              {visibleColumns.fullName !== false && <th scope="col" className="p-3.5 min-w-[200px]">Họ và Tên thí sinh</th>}
              {visibleColumns.className !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Lớp sinh viên</th>}
              {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái nộp bài</th>}
              {visibleColumns.totalScore !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Điểm thi (/10)</th>}
              {visibleColumns.submittedAt !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Thời gian nộp</th>}
              {visibleColumns.violationCount !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Vi phạm</th>}
              <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
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
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {visibleColumns.studentCode !== false && (
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {c.studentCode}
                      </span>
                    </td>
                  )}

                  {visibleColumns.fullName !== false && (
                    <td className="p-3.5 min-w-[200px]">
                      <span
                        onClick={() => onDetail(c)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                      >
                        {c.fullName}
                      </span>
                    </td>
                  )}

                  {visibleColumns.className !== false && (
                    <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                      {c.className}
                    </td>
                  )}

                  {visibleColumns.status !== false && (
                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                  )}

                  {visibleColumns.totalScore !== false && (
                    <td className="p-3.5 whitespace-nowrap text-center font-black">
                      {c.status === 'ABSENT' ? (
                        <StatusBadge status="ABSENT" customLabel="Vắng thi" />
                      ) : (
                        <span
                          className={`text-sm ${c.totalScore >= 5 ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'
                            }`}
                        >
                          {c.totalScore}
                        </span>
                      )}
                    </td>
                  )}

                  {visibleColumns.submittedAt !== false && (
                    <td className="p-3.5 whitespace-nowrap font-semibold text-slate-600">
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-extrabold text-rose-700 border border-rose-200">
                          <AlertTriangle className="h-3 w-3 text-rose-600" /> {c.violationCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0</span>
                      )}
                    </td>
                  )}

                  <td className="p-3.5 pr-4 text-right whitespace-nowrap relative">
                    <div className="flex items-center justify-end gap-1">
                      {c.attemptId && (
                        <button
                          type="button"
                          onClick={() => setReviewAttemptId(c.attemptId!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10.5px] font-bold transition cursor-pointer"
                          title="Xem chi tiết bài làm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Bài làm</span>
                        </button>
                      )}
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
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-blue-50 text-blue-700"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-600" />
                                <span>Xem bài làm</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onDetail(c);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span>Hồ sơ thí sinh</span>
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
