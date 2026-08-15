'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { StatusBadge } from '../common/StatusBadge';
import { GradeAppealItem } from './RegradeReviewDrawer';
import { Edit3, RefreshCw, BookOpen, Award, FileText } from 'lucide-react';

interface RegradeTableProps {
  appeals: GradeAppealItem[];
  loading?: boolean;
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  onReview: (appeal: GradeAppealItem) => void;
}

export function RegradeTable({
  appeals,
  loading = false,
  viewMode = 'list',
  visibleColumns = {
    student: true,
    subject: true,
    reason: true,
    originalScore: true,
    revisedScore: true,
    status: true,
  },
  onReview,
}: RegradeTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 shadow-2xs font-normal">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
        Đang tải danh sách đơn phúc khảo...
      </div>
    );
  }

  if (appeals.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 font-normal shadow-2xs">
        Không tìm thấy đơn phúc khảo nào phù hợp.
      </div>
    );
  }

  // 1. Grid View Mode
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {appeals.map((item) => {
          const subjectName = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Không xác định';
          const subjectCode = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectCode || '';
          const badgeStatus = item.status === 'APPROVED_REGRADE' ? 'APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between hover:shadow-md hover:border-blue-400 transition-all duration-200 space-y-3.5"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-semibold text-xs border border-blue-100 shrink-0">
                      {item.student.fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm leading-snug">{item.student.fullName}</p>
                      <IdentifierBadge>{item.student.studentCode}</IdentifierBadge>
                    </div>
                  </div>
                  <StatusBadge status={badgeStatus} className="table-badge" />
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-0.5">
                  <p className="font-semibold text-slate-900 text-xs">{subjectName}</p>
                  {subjectCode && <IdentifierBadge>{subjectCode}</IdentifierBadge>}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-normal">{item.reason}</p>
                  <span className="text-xs text-slate-400 block font-normal">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-xs font-normal text-slate-700">
                  <span>Điểm ban đầu: </span>
                  <strong className="text-slate-900 font-semibold">{item.originalScore.toFixed(1)} đ</strong>
                  {item.status === 'APPROVED_REGRADE' && item.revisedScore !== null && (
                    <span className="ml-2 font-semibold text-emerald-600">→ {item.revisedScore.toFixed(1)} đ</span>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => onReview(item)}
                  leftIcon={<Edit3 className="h-3.5 w-3.5 text-blue-600" />}
                  className="h-8 px-3 text-xs font-semibold text-blue-600 bg-white border border-slate-200 hover:bg-blue-50 shadow-2xs"
                >
                  Thẩm định & Chấm lại
                </Button>
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
        {appeals.map((item) => {
          const subjectName = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Không xác định';
          const badgeStatus = item.status === 'APPROVED_REGRADE' ? 'APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5"
            >
              {/* Left: Avatar Code Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100/80">
                  {item.student.studentCode?.slice(0, 3) || 'SV'}
                </div>

                {/* Middle: Student + Subject + Scores + Reason */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-slate-900 truncate">
                      {item.student.fullName}
                    </span>
                    <IdentifierBadge>
                      {item.student.studentCode}
                    </IdentifierBadge>
                    {item.student.class && (
                      <span className="text-xs text-slate-500 font-normal">
                        ({item.student.class.code || item.student.class.name})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium">{subjectName}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Điểm gốc: <strong className="font-semibold text-slate-800">{item.originalScore.toFixed(1)}đ</strong>
                        {item.status === 'APPROVED_REGRADE' && item.revisedScore !== null && (
                      <span className="ml-1 text-emerald-600 font-semibold">➔ Sau PK: {item.revisedScore.toFixed(1)}đ</span>
                        )}
                      </span>
                    </span>
                    <span className="text-slate-500 truncate max-w-[280px]" title={item.reason}>
                      Lý do: &ldquo;{item.reason}&rdquo;
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Status & Action Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <StatusBadge status={badgeStatus} className="table-badge" />

                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => onReview(item)}
                  leftIcon={<Edit3 className="h-3.5 w-3.5 text-blue-600" />}
                  className="h-8 px-3 text-xs font-semibold text-blue-600 border-slate-200 hover:bg-blue-50 shadow-2xs"
                >
                  Chấm lại
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. Default List View Mode (Matching ExamReportTable 100%)
  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="ui-table w-full text-left text-[15px] leading-[22px] text-slate-700 border-collapse">
        <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
          <tr>
            {visibleColumns.student !== false && <th scope="col" className="p-3.5 pl-4 whitespace-nowrap">Sinh viên</th>}
            {visibleColumns.subject !== false && <th scope="col" className="p-3.5 min-w-[200px]">Môn học</th>}
            {visibleColumns.reason !== false && <th scope="col" className="p-3.5 min-w-[280px]">Nội dung xin phúc khảo</th>}
            {visibleColumns.originalScore !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Điểm ban đầu</th>}
            {visibleColumns.revisedScore !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Điểm sau phúc khảo</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Trạng thái</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {appeals.map((item) => {
            const subjectName = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Không xác định';
            const subjectCode = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectCode || '';
            const badgeStatus = item.status === 'APPROVED_REGRADE' ? 'APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

            return (
              <tr key={item.id} className="transition hover:bg-blue-50/40">
                {/* Sinh viên */}
                {visibleColumns.student !== false && (
                  <td className="p-3.5 pl-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="table-avatar flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-medium text-[15px] border border-blue-100 shrink-0">
                        {item.student.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-[15px] leading-[22px]">{item.student.fullName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <IdentifierBadge tone="neutral">{item.student.studentCode}</IdentifierBadge>
                          {item.student.class && <IdentifierBadge tone="neutral">{item.student.class.code}</IdentifierBadge>}
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                {/* Môn học */}
                {visibleColumns.subject !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <p className="font-medium text-slate-900 text-[15px] leading-[22px]">{subjectName}</p>
                    {subjectCode && (
                      <IdentifierBadge tone="neutral">{subjectCode}</IdentifierBadge>
                    )}
                  </td>
                )}

                {/* Nội dung */}
                {visibleColumns.reason !== false && (
                  <td className="p-3.5 min-w-[280px]">
                    <p className="text-slate-700 text-[15px] leading-[22px] font-normal line-clamp-2 max-w-sm" title={item.reason}>
                      {item.reason}
                    </p>
                    <span className="text-[15px] leading-[22px] font-normal text-slate-500 block mt-1">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </td>
                )}

                {/* Điểm ban đầu */}
                {visibleColumns.originalScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center font-medium text-slate-900 text-[15px]">
                    {item.originalScore.toFixed(1)} đ
                  </td>
                )}

                {/* Điểm sau phúc khảo */}
                {visibleColumns.revisedScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center text-[15px]">
                    {item.status === 'APPROVED_REGRADE' && item.revisedScore !== null ? (
                      <span className="font-medium text-emerald-600">{item.revisedScore.toFixed(1)} đ</span>
                    ) : (
                      <span className="text-slate-500 font-normal">--</span>
                    )}
                  </td>
                )}

                {/* Trạng thái */}
                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={badgeStatus} className="table-badge" />
                    </div>
                  </td>
                )}

                {/* Thao tác */}
                <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => onReview(item)}
                    leftIcon={<Edit3 className="h-3.5 w-3.5 text-blue-600" />}
                    className="h-8 px-3 text-[15px] leading-[22px] font-medium text-blue-600 border-slate-200 hover:bg-blue-50 shadow-2xs"
                  >
                    Thẩm định & Chấm lại
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
