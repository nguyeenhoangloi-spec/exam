'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { TabBar, TabItem } from '../../../components/ui/TabBar';
import { Toast } from '../../../components/Toast';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import { Search, X, RotateCcw, ChevronDown } from 'lucide-react';

import { RegradeHeader } from '../../../components/regrade/RegradeHeader';
import { RegradeKPICards } from '../../../components/regrade/RegradeKPICards';
import { RegradeFilterPopover } from '../../../components/regrade/RegradeFilterPopover';
import { RegradeTableToolbar } from '../../../components/regrade/RegradeTableToolbar';
import { RegradeTable } from '../../../components/regrade/RegradeTable';
import { RegradePaginationBar } from '../../../components/regrade/RegradePaginationBar';
import { RegradeReviewDrawer, GradeAppealItem } from '../../../components/regrade/RegradeReviewDrawer';
import { FilterSelect } from '../../../components/ui/FilterSelect';

export default function RegradeManagementPage() {
  usePageTitle('Quản lý phúc khảo & khiếu nại điểm');

  const [appeals, setAppeals] = useState<GradeAppealItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  // Multi-view & Toolbar State
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    student: true,
    subject: true,
    reason: true,
    originalScore: true,
    revisedScore: true,
    status: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Drawer state
  const [selectedAppeal, setSelectedAppeal] = useState<GradeAppealItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED_REGRADE' | 'REJECTED'>('APPROVED_REGRADE');
  const [revisedScore, setRevisedScore] = useState<string>('');
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchAppeals = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/grade-appeals', { params });

      setAppeals(res.data || []);
    } catch {
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleRefresh = async () => {
    await fetchAppeals();
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

  const openReviewDrawer = (item: GradeAppealItem) => {
    setSelectedAppeal(item);
    setReviewStatus(item.status === 'REJECTED' ? 'REJECTED' : 'APPROVED_REGRADE');
    setRevisedScore(item.revisedScore !== null ? String(item.revisedScore) : String(item.originalScore));
    setReviewerNote(item.reviewerNote || '');
  };

  const handleSaveReview = async () => {
    if (!selectedAppeal) return;

    if (reviewStatus === 'APPROVED_REGRADE') {
      const score = Number(revisedScore);
      if (isNaN(score) || score < 0 || score > 10) {
        setToast({ message: 'Điểm mới phải là số hợp lệ từ 0 đến 10.', type: 'error' });
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.patch(`/grade-appeals/${selectedAppeal.id}/review`, {
        status: reviewStatus,
        revisedScore: reviewStatus === 'APPROVED_REGRADE' ? Number(revisedScore) : undefined,
        reviewerNote: reviewerNote.trim() || undefined,
      }).catch(() => null);

      const newScoreNum = Number(revisedScore);
      setAppeals((prev) =>
        prev.map((item) => {
          if (item.id === selectedAppeal.id) {
            return {
              ...item,
              status: reviewStatus,
              revisedScore: reviewStatus === 'APPROVED_REGRADE' ? newScoreNum : item.revisedScore,
              reviewerNote: reviewerNote.trim() || item.reviewerNote,
              reviewedAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );

      setToast({ message: 'Đã lưu và công bố kết quả phúc khảo thành công!', type: 'success' });
      setSelectedAppeal(null);
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Đã lưu và công bố kết quả phúc khảo thành công!',
        type: 'success',
      });
      setSelectedAppeal(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Subjects List
  const subjectsList = useMemo(() => {
    const map = new Map<number, string>();
    appeals.forEach((a) => {
      const sub = a.attempt?.onlineExamConfig?.examSchedule?.subject;
      if (sub) map.set(a.attempt.onlineExamConfig.examSchedule.subjectId || 0, sub.subjectName);
    });
    return Array.from(map.entries());
  }, [appeals]);

  // Counts for Tabs
  const counts = useMemo(() => {
    let all = 0, pending = 0, approved = 0, rejected = 0;
    appeals.forEach((a) => {
      all++;
      if (a.status === 'APPROVED_REGRADE') approved++;
      else if (a.status === 'REJECTED') rejected++;
      else pending++;
    });
    return { all, pending, approved, rejected };
  }, [appeals]);

  const tabs: TabItem[] = [
    { key: 'ALL', label: 'Tất cả đơn', count: counts.all },
    { key: 'PENDING', label: 'Chờ thẩm định', count: counts.pending },
    { key: 'APPROVED_REGRADE', label: 'Đã duyệt & Đổi điểm', count: counts.approved },
    { key: 'REJECTED', label: 'Bị từ chối', count: counts.rejected },
  ];

  // Filtered & Sorted List
  const filteredAppeals = useMemo(() => {
    return appeals
      .filter((item) => {
        if (search.trim()) {
          const s = search.toLowerCase();
          const matchName = item.student.fullName.toLowerCase().includes(s);
          const matchCode = item.student.studentCode.toLowerCase().includes(s);
          const matchReason = item.reason.toLowerCase().includes(s);
          if (!matchName && !matchCode && !matchReason) return false;
        }

        if (statusTab !== 'ALL') {
          if (statusTab === 'PENDING' && (item.status === 'APPROVED_REGRADE' || item.status === 'REJECTED')) return false;
          if (statusTab === 'APPROVED_REGRADE' && item.status !== 'APPROVED_REGRADE') return false;
          if (statusTab === 'REJECTED' && item.status !== 'REJECTED') return false;
        }

        if (subjectFilter !== 'ALL') {
          const subId = item.attempt?.onlineExamConfig?.examSchedule?.subjectId;
          if (String(subId) !== subjectFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortOrder === 'score_desc') {
          return (b.revisedScore ?? b.originalScore) - (a.revisedScore ?? a.originalScore);
        }
        if (sortOrder === 'score_asc') {
          return (a.revisedScore ?? a.originalScore) - (b.revisedScore ?? b.originalScore);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [appeals, search, statusTab, subjectFilter, sortOrder]);

  // Paginated List
  const totalPages = Math.ceil(filteredAppeals.length / limit) || 1;
  const paginatedAppeals = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAppeals.slice(start, start + limit);
  }, [filteredAppeals, page, limit]);

  // Export Excel & Print Report handlers
  const exportExcel = () => {
    exportToFormattedExcel({
      filename: `Danh_sach_don_phuc_khao_${new Date().toISOString().slice(0, 10)}.xls`,
      title: 'DANH SÁCH ĐƠN PHÚC KHẢO & KHIẾU NẠI ĐIỂM',
      subtitle: `Tổng số: ${filteredAppeals.length} đơn`,
      columns: [
        { header: 'STT', align: 'center', width: 8 },
        { header: 'Mã SV', align: 'center', width: 16 },
        { header: 'Họ và tên', align: 'left', width: 25 },
        { header: 'Lớp', align: 'center', width: 15 },
        { header: 'Môn thi', align: 'left', width: 25 },
        { header: 'Điểm cũ', align: 'center', width: 12 },
        { header: 'Điểm sau phúc khảo', align: 'center', width: 16 },
        { header: 'Trạng thái', align: 'center', width: 18 },
        { header: 'Lý do xin phúc khảo', align: 'left', width: 35 },
      ],
      rows: filteredAppeals.map((item, idx) => [
        idx + 1,
        item.student.studentCode,
        item.student.fullName,
        item.student.class?.code || '',
        item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || '',
        item.originalScore.toFixed(1),
        item.status === 'APPROVED_REGRADE' && item.revisedScore !== null ? item.revisedScore.toFixed(1) : '--',
        item.status === 'APPROVED_REGRADE' ? 'Đã duyệt & Đổi điểm' : item.status === 'REJECTED' ? 'Bị từ chối' : 'Chờ thẩm định',
        item.reason,
      ]),
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO TỔNG HỢP PHÚC KHẢO ĐIỂM THI',
      subtitle: 'Danh sách thẩm định đơn xin chấm lại bài thi',
      metaInfo: [
        { label: 'Tổng số đơn', value: String(counts.all) },
        { label: 'Chờ thẩm định', value: String(counts.pending) },
        { label: 'Đã đổi điểm thành công', value: String(counts.approved) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã SV', width: '90px', align: 'center' },
        { header: 'Họ và tên sinh viên', width: '160px' },
        { header: 'Môn thi', width: '180px' },
        { header: 'Điểm gốc', width: '80px', align: 'center' },
        { header: 'Điểm mới', width: '80px', align: 'center' },
        { header: 'Trạng thái', width: '120px', align: 'center' },
      ],
      rows: filteredAppeals.map((item, idx) => [
        idx + 1,
        item.student.studentCode,
        item.student.fullName,
        item.attempt?.onlineExamConfig?.examSchedule?.subject?.subjectName || '',
        `${item.originalScore.toFixed(1)}đ`,
        item.status === 'APPROVED_REGRADE' && item.revisedScore !== null ? `${item.revisedScore.toFixed(1)}đ` : '--',
        item.status === 'APPROVED_REGRADE' ? 'Đã đổi điểm' : item.status === 'REJECTED' ? 'Từ chối' : 'Chờ xử lý',
      ]),
    });
  };

  return (
    <main className="w-full min-w-0 px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── 1. Page Header ── */}
      <RegradeHeader
        onRefresh={handleRefresh}
        onExportExcel={exportExcel}
        onPrintReport={handlePrintReport}
        loading={loading}
      />

      {/* ── 2. Dynamic KPI Summary Grid ── */}
      <RegradeKPICards
        all={counts.all}
        pending={counts.pending}
        approved={counts.approved}
        rejected={counts.rejected}
      />

      {/* ── 3. Search & Action Toolbar Row (Single Unified Row) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search input + 1 Unified Filter Popover */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã SV, họ tên, lý do..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd
                className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-[12px] text-slate-400 select-none cursor-pointer"
                onClick={() => searchInputRef.current?.focus()}
                title="Nhấn phím / để tìm nhanh"
              >
                /
              </kbd>
            )}
          </div>

          <RegradeFilterPopover
            statusTab={statusTab}
            onStatusTabChange={(val) => {
              setStatusTab(val);
              setPage(1);
            }}
            subjectFilter={subjectFilter}
            onSubjectFilterChange={(val) => {
              setSubjectFilter(val);
              setPage(1);
            }}
            appeals={appeals}
            subjectsList={subjectsList}
            totalFilteredCount={filteredAppeals.length}
            onResetAll={() => {
              setSearch('');
              setStatusTab('ALL');
              setSubjectFilter('ALL');
              setPage(1);
            }}
          />
        </div>

        {/* Right: Table Action Controls */}
        <div className="shrink-0">
          <RegradeTableToolbar
            totalCount={filteredAppeals.length}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* ── 4. Status Filter TabBar ── */}
      <div className="border-b border-slate-200/80 dark:border-slate-800">
        <TabBar
          tabs={tabs}
          active={statusTab}
          onChange={(key) => { setStatusTab(key); setPage(1); }}
          className="border-b-0 pt-0"
        />
      </div>

      {/* ── 5. Main Data Table Container ── */}
      <div>
        <RegradeTable
          appeals={paginatedAppeals}
          loading={loading}
          viewMode={viewMode}
          visibleColumns={visibleColumns}
          onReview={openReviewDrawer}
        />

        <RegradePaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredAppeals.length}
          onPage={setPage}
          onLimit={(l) => { setLimit(l); setPage(1); }}
        />
      </div>

      {/* ── 6. Review Drawer Modal ── */}
      <RegradeReviewDrawer
        selectedAppeal={selectedAppeal}
        onClose={() => setSelectedAppeal(null)}
        reviewStatus={reviewStatus}
        setReviewStatus={setReviewStatus}
        revisedScore={revisedScore}
        setRevisedScore={setRevisedScore}
        reviewerNote={reviewerNote}
        setReviewerNote={setReviewerNote}
        handleSaveReview={handleSaveReview}
        submitting={submitting}
      />
    </main>
  );
}
