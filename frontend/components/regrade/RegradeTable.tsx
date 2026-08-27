'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { StatusBadge } from '../common/StatusBadge';
import { GradeAppealItem } from './RegradeReviewDrawer';
import { Edit3, RefreshCw, BookOpen, Award, FileText, Eye } from 'lucide-react';

interface RegradeTableProps {
  appeals: GradeAppealItem[];
  loading?: boolean;
  visibleColumns?: Record<string, boolean>;
  onReview: (appeal: GradeAppealItem) => void;
  selected?: string[];
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: string, checked: boolean) => void;
}

export function RegradeTable({
  appeals,
  loading = false,
  visibleColumns = {
    student: true,
    subject: true,
    reason: true,
    originalScore: true,
    revisedScore: true,
    status: true,
  },
  onReview,
  selected = [],
  onSelectAll,
  onSelectOne,
}: RegradeTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-2xs font-normal">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
        Đang tải danh sách đơn phúc khảo...
      </div>
    );
  }

  if (appeals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 font-normal shadow-2xs">
        Không tìm thấy đơn phúc khảo nào phù hợp.
      </div>
    );
  }

  const allSelected = appeals.length > 0 && appeals.every((i) => selected.includes(i.id));

  // Default List View Mode (Table)
  return (
    <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="ui-table w-full text-left text-type-body leading-[22px] text-slate-700 dark:text-slate-300 border-collapse">
        <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 select-none">
          <tr>
            <th scope="col" className="py-3 px-4 w-12 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            {visibleColumns.student !== false && <th scope="col" className="p-3.5 font-medium whitespace-nowrap min-w-[200px]">Sinh viên</th>}
            {visibleColumns.subject !== false && <th scope="col" className="p-3.5 font-medium min-w-[200px]">Môn học</th>}
            {visibleColumns.reason !== false && <th scope="col" className="p-3.5 font-medium min-w-[280px]">Nội dung xin phúc khảo</th>}
            {visibleColumns.originalScore !== false && <th scope="col" className="p-3.5 font-medium whitespace-nowrap text-center">Điểm ban đầu</th>}
            {visibleColumns.revisedScore !== false && <th scope="col" className="p-3.5 font-medium whitespace-nowrap text-center">Điểm sau phúc khảo</th>}
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 font-medium whitespace-nowrap text-center">Trạng thái</th>}
            <th scope="col" className="p-3.5 pr-4 font-medium text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
          {appeals.map((item) => {
            const isChecked = selected.includes(item.id);
            const subjectName = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Không xác định';
            const subjectCode = item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectCode || '';
            const badgeStatus = item.status === 'APPROVED_REGRADE' ? 'APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

            return (
              <tr
                key={item.id}
                className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                  isChecked ? 'bg-blue-50/20' : ''
                }`}
              >
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelectOne?.(item.id, e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                {visibleColumns.student !== false && (
                  <td className="p-3.5 whitespace-nowrap min-w-[200px]">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body leading-[22px] truncate">
                        {item.student.fullName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                        <IdentifierBadge tone="blue">{item.student.studentCode}</IdentifierBadge>
                        {item.student.class && (
                          <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 truncate">
                            · {item.student.class.code || item.student.class.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                )}

                {visibleColumns.subject !== false && (
                  <td className="p-3.5 min-w-[200px]">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body leading-[22px] truncate">{subjectName}</p>
                    {subjectCode && (
                      <div className="mt-1">
                        <IdentifierBadge tone="neutral">{subjectCode}</IdentifierBadge>
                      </div>
                    )}
                  </td>
                )}

                {visibleColumns.reason !== false && (
                  <td className="p-3.5 min-w-[280px]">
                    <p className="text-slate-700 dark:text-slate-300 text-type-body leading-[22px] font-normal line-clamp-2 max-w-sm" title={item.reason}>
                      {item.reason}
                    </p>
                    <span className="table-meta text-type-helper font-normal text-slate-400 block mt-0.5">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </td>
                )}

                {visibleColumns.originalScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center font-semibold text-slate-900 dark:text-slate-100 text-type-body">
                    {item.originalScore.toFixed(1)} đ
                  </td>
                )}

                {visibleColumns.revisedScore !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center text-type-body">
                    {item.status === 'APPROVED_REGRADE' && item.revisedScore !== null ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.revisedScore.toFixed(1)} đ</span>
                    ) : (
                      <span className="text-slate-400 font-normal">--</span>
                    )}
                  </td>
                )}

                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={badgeStatus} className="table-badge" />
                    </div>
                  </td>
                )}

                <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                  <Button
                    variant={item.status === 'PENDING' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onReview(item)}
                    leftIcon={item.status === 'PENDING' ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  >
                    {item.status === 'PENDING' ? 'Thẩm định đơn' : 'Xem thẩm định'}
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
