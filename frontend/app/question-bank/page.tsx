'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getCachedData } from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Question, Subject } from '../../types';
import { QuestionAIWizard } from '../../components/question-bank/QuestionAIWizard';
import { QuestionBulkAction } from '../../components/question-bank/QuestionBulkAction';
import { QuestionDetailDialog } from '../../components/question-bank/QuestionDetailDialog';
import { QuestionFormDialog } from '../../components/question-bank/QuestionFormDialog';
import { QuestionImportWizard } from '../../components/question-bank/QuestionImportWizard';

// Newly Designed SaaS 2026 Components
import { QuestionBankHeader } from '../../components/question-bank/QuestionBankHeader';
import { QuestionBankTopCharts } from '../../components/question-bank/QuestionBankTopCharts';
import { QuestionBankFiltersCard, QuestionBankFilterValues } from '../../components/question-bank/QuestionBankFiltersCard';
import { QuestionBankTabsBar } from '../../components/question-bank/QuestionBankTabsBar';
import { QuestionBankTableToolbar } from '../../components/question-bank/QuestionBankTableToolbar';
import { QuestionBankTable } from '../../components/question-bank/QuestionBankTable';
import { QuestionBankPaginationBar } from '../../components/question-bank/QuestionBankPaginationBar';

export default function QuestionBankPage() {
  usePageTitle('Ngân hàng câu hỏi');
  const router = useRouter();

  const cachedQRes = typeof window !== 'undefined' ? getCachedData<any>('/questions?page=1&limit=20') : null;
  const cachedSubs = typeof window !== 'undefined' ? getCachedData<Subject[]>('/subjects') : null;
  const initialQList = cachedQRes?.data || [];

  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>(initialQList);
  const [subjects, setSubjects] = useState<Subject[]>(cachedSubs || []);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [filterValues, setFilterValues] = useState<QuestionBankFilterValues>({
    search: '',
    subjectId: '',
    chapterId: '',
    topic: '',
    difficulty: '',
    status: '',
    creator: '',
    dateRange: '',
    type: '',
    bloomLevel: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    content: true,
    subject: true,
    difficulty: true,
    type: true,
    status: true,
    creator: true,
    createdAt: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Question | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [loading, setLoading] = useState(!initialQList.length);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning';
    requireReason?: boolean;
    reasonPlaceholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (reason?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const auth = getAuthUser();
    if (!auth) return void router.push('/login');
    if (!['ADMIN', 'TEACHER'].includes(auth.role)) return void router.push('/dashboard');
    setUser(auth);

    const p = new URLSearchParams(window.location.search);
    setPage(Number(p.get('page') || 1));
    setLimit(Number(p.get('limit') || 20));

    setFilterValues({
      search: p.get('search') || '',
      subjectId: p.get('subjectId') || '',
      chapterId: p.get('chapterId') || '',
      topic: p.get('topic') || '',
      difficulty: p.get('difficulty') || '',
      status: p.get('status') || '',
      creator: p.get('creator') || '',
      dateRange: p.get('dateRange') || '',
      type: p.get('type') || '',
      bloomLevel: p.get('bloomLevel') || '',
    });

    if (p.get('action') === 'create') setFormOpen(true);
    if (p.get('action') === 'import') setImportOpen(true);

    const questionId = p.get('questionId');
    if (questionId) {
      api.get(`/questions/${questionId}`)
        .then(response => setDetail(response.data))
        .catch(err => setToast({ message: err.message, type: 'error' }));
    }

    Promise.all([api.get('/questions/filter-options'), api.get('/questions/statistics')])
      .then(([options, stats]) => {
        setSubjects(options.data.subjects);
        setCounts(stats.data);
      })
      .catch(e => setError(e.message));
  }, [router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filterValues.search) params.set('search', filterValues.search);
    if (filterValues.subjectId) params.set('subjectId', filterValues.subjectId);
    if (filterValues.chapterId) params.set('chapterId', filterValues.chapterId);
    if (filterValues.difficulty) params.set('difficulty', filterValues.difficulty);
    if (filterValues.status) params.set('status', filterValues.status);
    if (filterValues.type) params.set('type', filterValues.type);

    const statsParams = new URLSearchParams(params);
    statsParams.delete('status');
    statsParams.delete('page');
    statsParams.delete('limit');

    router.replace(`/question-bank?${params}`, { scroll: false });

    try {
      const [list, stats] = await Promise.all([
        api.get(`/questions?${params}`),
        api.get(`/questions/statistics?${statsParams}`),
      ]);
      setQuestions(list.data.data);
      setTotalPages(list.data.totalPages);
      setCounts(stats.data);
      setSelected([]);
    } catch (e: any) {
      setError(e.message || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [user, page, limit, filterValues, router]);

  useEffect(() => {
    load();
  }, [load]);

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  const action = async (q: Question, name: string) => {
    if (name === 'edit') {
      try {
        setEditing((await api.get(`/questions/${q.id}`)).data);
        setFormOpen(true);
      } catch (e: any) {
        setToast({ message: e.message, type: 'error' });
      }
      return;
    }

    if (name === 'approve') {
      setConfirmConfig({
        isOpen: true,
        title: 'Phê duyệt câu hỏi',
        message: `Bạn có chắc chắn muốn phê duyệt câu hỏi mã ${q.code || `QH${q.id}`}?`,
        type: 'success',
        confirmText: 'Duyệt câu hỏi',
        onConfirm: async () => {
          closeConfirm();
          try {
            await api.post(`/questions/${q.id}/approve`);
            setToast({ message: `Đã duyệt câu hỏi thành công.`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message, type: 'error' });
          }
        },
      });
      return;
    }

    if (name === 'reject') {
      setConfirmConfig({
        isOpen: true,
        title: 'Từ chối duyệt câu hỏi',
        message: `Nhập lý do từ chối câu hỏi mã ${q.code || `QH${q.id}`}:`,
        type: 'danger',
        requireReason: true,
        reasonPlaceholder: 'Lý do từ chối (tối thiểu 3 ký tự)...',
        confirmText: 'Xác nhận từ chối',
        onConfirm: async (reason) => {
          closeConfirm();
          try {
            await api.post(`/questions/${q.id}/reject`, { reason });
            setToast({ message: `Đã từ chối câu hỏi.`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message, type: 'error' });
          }
        },
      });
      return;
    }

    if (name === 'delete') {
      setConfirmConfig({
        isOpen: true,
        title: 'Xóa câu hỏi',
        message: `Bạn có chắc chắn muốn xóa câu hỏi mã ${q.code || `QH${q.id}`}?`,
        type: 'danger',
        confirmText: 'Xóa câu hỏi',
        onConfirm: async () => {
          closeConfirm();
          try {
            await api.delete(`/questions/${q.id}`);
            setToast({ message: `Đã xóa câu hỏi.`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message, type: 'error' });
          }
        },
      });
      return;
    }
  };

  const showDetail = async (q: Question) => {
    try {
      setDetail((await api.get(`/questions/${q.id}`)).data);
    } catch {
      setDetail(q);
    }
  };

  const bulk = async (name: string) => {
    const isReject = name === 'REJECT';
    const isDelete = name === 'DELETE';
    const actionLabel = name === 'APPROVE' ? 'duyệt' : name === 'REJECT' ? 'từ chối' : name === 'DELETE' ? 'xóa' : 'thực hiện';
    const selectedQuestions = questions.filter(q => selected.includes(q.id));
    const actionIds = selectedQuestions.map(q => q.id);

    setConfirmConfig({
      isOpen: true,
      title: `Thao tác hàng loạt: ${name}`,
      message: `Bạn có chắc chắn muốn ${actionLabel} ${actionIds.length} câu hỏi đã chọn?`,
      type: isDelete || isReject ? 'danger' : 'success',
      requireReason: isReject,
      reasonPlaceholder: 'Nhập lý do từ chối hàng loạt...',
      confirmText: `Xác nhận ${actionLabel}`,
      onConfirm: async (reason) => {
        closeConfirm();
        try {
          const r = await api.post('/questions/bulk-action', { ids: actionIds, action: name, reason });
          setToast({
            message: `Thành công ${r.data.successCount}, thất bại ${r.data.failedCount}.`,
            type: r.data.failedCount ? 'error' : 'success',
          });
          load();
        } catch (e: any) {
          setToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  const exportCsv = async () => {
    try {
      const selectedSubject = subjects.find(s => String(s.id) === String(filterValues.subjectId));
      const rows = questions.map((q, idx) => [
        idx + 1,
        q.code || `QH${q.id}`,
        q.subject?.subjectName || 'Chưa gán',
        q.content,
        q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó',
        q.status === 'APPROVED' ? 'Đã duyệt' : q.status === 'PENDING' ? 'Chờ duyệt' : q.status === 'DRAFT' ? 'Nháp' : q.status,
        q.createdByName || q.createdBy?.fullName || 'Nguyễn Văn A',
      ]);

      exportToFormattedExcel({
        filename: `Ngân_hang_cau_hoi_${new Date().toISOString().slice(0, 10)}.xls`,
        title: 'BÁO CÁO NGÂN HÀNG CÂU HỎI KHẢO THÍ',
        subtitle: `Số lượng: ${questions.length} câu hỏi | Môn học: ${selectedSubject?.subjectName || 'Tất cả môn'}`,
        columns: [
          { header: 'STT', align: 'center', width: 8 },
          { header: 'Mã câu hỏi', align: 'center', width: 16 },
          { header: 'Môn học', align: 'left', width: 25 },
          { header: 'Nội dung câu hỏi', align: 'left', width: 45 },
          { header: 'Độ khó', align: 'center', width: 14 },
          { header: 'Trạng thái', align: 'center', width: 14 },
          { header: 'Người tạo', align: 'left', width: 20 },
        ],
        rows,
      });
      setToast({ message: 'Đã xuất file Excel tự động định dạng thành công!', type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message || 'Không xuất được Excel.', type: 'error' });
    }
  };

  const handleResetFilters = () => {
    setFilterValues({
      search: '',
      subjectId: '',
      chapterId: '',
      topic: '',
      difficulty: '',
      status: '',
      creator: '',
      dateRange: '',
      type: '',
      bloomLevel: '',
    });
    setPage(1);
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header Section */}
        <QuestionBankHeader
          onAdd={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          onImport={() => setImportOpen(true)}
          onAi={() => setAiOpen(true)}
          onPrint={exportCsv}
        />

        {/* Top Charts Row: 4 Cards in 1 Row at Top */}
        <QuestionBankTopCharts
          counts={counts}
          questions={questions}
          onAdd={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          onImport={() => setImportOpen(true)}
          onExport={exportCsv}
        />

        {/* Full-Width Main Content Section (100% width for Table & Options display) */}
        <div className="space-y-4">
          {/* Multi-row Filter Card */}
          <QuestionBankFiltersCard
            filters={filterValues}
            subjects={subjects}
            onChange={(next) => {
              setFilterValues(next);
              setPage(1);
            }}
            onReset={handleResetFilters}
          />

          {/* Status Tabs Bar */}
          <QuestionBankTabsBar
            activeStatus={filterValues.status}
            counts={counts}
            onSelectStatus={(status) => {
              setFilterValues({ ...filterValues, status });
              setPage(1);
            }}
          />

          {/* Table Action Toolbar */}
          <QuestionBankTableToolbar
            totalCount={counts.total || questions.length}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />

          {/* Floating Bulk Action Bar when items selected */}
          {(() => {
            const selectedQuestions = questions.filter((q) => selected.includes(q.id));
            const isAdmin = user?.role === 'ADMIN';

            const canSubmit = selectedQuestions.some((q) => ['DRAFT', 'REJECTED'].includes(q.status));
            const canApprove = isAdmin && selectedQuestions.some((q) => ['DRAFT', 'PENDING', 'REJECTED'].includes(q.status));
            const canReject = isAdmin && selectedQuestions.some((q) => ['DRAFT', 'PENDING'].includes(q.status));
            const canRestore = isAdmin && selectedQuestions.some((q) => ['ARCHIVED', 'REJECTED'].includes(q.status));
            const canArchive = isAdmin && selectedQuestions.some((q) => ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(q.status));
            const canDelete = isAdmin || selectedQuestions.every((q) => q.status === 'DRAFT');

            return (
              <QuestionBulkAction
                totalCount={questions.length}
                selectedCount={selected.length}
                allSelected={questions.length > 0 && selected.length === questions.length}
                canSubmit={canSubmit}
                canApprove={canApprove}
                canReject={canReject}
                canRestore={canRestore}
                canArchive={canArchive}
                canDelete={canDelete}
                onToggleAll={() =>
                  setSelected(selected.length === questions.length ? [] : questions.map((q) => q.id))
                }
                onAction={bulk}
                onClear={() => setSelected([])}
              />
            );
          })()}

          {/* Full-Width Question Data Table */}
          {loading ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 font-bold">
              {error}
              <button onClick={load} className="ml-3 underline cursor-pointer">
                Thử lại
              </button>
            </div>
          ) : !questions.length ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
              Không tìm thấy câu hỏi phù hợp.
            </div>
          ) : (
            <QuestionBankTable
              questions={questions}
              selected={selected}
              viewMode={viewMode}
              visibleColumns={visibleColumns}
              onSelect={(id, checked) =>
                setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
              }
              onSelectAll={(checked) =>
                setSelected(checked ? questions.map((q) => q.id) : [])
              }
              onDetail={showDetail}
              onAction={action}
              isAdmin={user?.role === 'ADMIN'}
            />
          )}

          {/* Pagination Footer */}
          <QuestionBankPaginationBar
            page={page}
            totalPages={totalPages}
            limit={limit}
            totalItems={counts.total ?? questions.length ?? 0}
            onPage={setPage}
            onLimit={(v) => {
              setLimit(v);
              setPage(1);
            }}
          />
        </div>
      </main>

      {/* Dialogs and Modals */}
      <QuestionFormDialog
        open={formOpen}
        subjects={subjects}
        question={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={load}
      />

      {/* Right Drawer Quick View */}
      <QuestionDetailDialog question={detail} onClose={() => setDetail(null)} />

      <QuestionImportWizard
        open={importOpen}
        subjects={subjects}
        onClose={() => setImportOpen(false)}
        onDone={load}
      />

      <QuestionAIWizard
        open={aiOpen}
        subjects={subjects}
        onClose={() => setAiOpen(false)}
        onDone={load}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        requireReason={confirmConfig.requireReason}
        reasonPlaceholder={confirmConfig.reasonPlaceholder}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
