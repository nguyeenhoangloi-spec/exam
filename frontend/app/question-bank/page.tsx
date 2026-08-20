'use client';

import { useCallback, useEffect, useState, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import api, { getCachedData } from '../../lib/api';
import { cachedGet, invalidateCache } from '../../lib/api-cache';
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
import { QuestionBankFilterPopover } from '../../components/question-bank/QuestionBankFilterPopover';
import { QuestionBankFilterValues } from '../../components/question-bank/QuestionBankFiltersCard';
import { TabBar } from '../../components/ui/TabBar';
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
    onConfirm: () => { },
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
        .catch(err => setToast({ message: err.message || 'Không thể tải chi tiết câu hỏi.', type: 'error' }));
    }

    Promise.all([api.get('/questions/filter-options'), api.get('/questions/statistics')])
      .then(([options, stats]) => {
        setSubjects(options.data.subjects);
        setCounts(stats.data);
      })
      .catch(e => setError(e.message || 'Không tải được dữ liệu lọc câu hỏi.'));
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
        cachedGet(`/questions?${params}`),
        cachedGet(`/questions/statistics?${statsParams}`),
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

  const handleRefresh = async () => {
    invalidateCache('/questions');
    await load();
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  const action = async (q: Question, name: string) => {
    if (name === 'edit') {
      try {
        setEditing((await api.get(`/questions/${q.id}`)).data);
        setFormOpen(true);
      } catch (e: any) {
        setToast({ message: e.message || 'Không thể tải câu hỏi để chỉnh sửa.', type: 'error' });
      }
      return;
    }

    if (name === 'submit') {
      try {
        await api.post(`/questions/${q.id}/submit`);
        invalidateCache('/questions');
        setToast({ message: `Đã gửi duyệt câu hỏi ${q.code || `QH${q.id}`} thành công.`, type: 'success' });
        load();
      } catch (e: any) {
        setToast({ message: e.message || 'Không thể gửi duyệt câu hỏi.', type: 'error' });
      }
      return;
    }

    if (name === 'duplicate') {
      try {
        const res = await api.post(`/questions/${q.id}/duplicate`);
        invalidateCache('/questions');
        setToast({ message: `Đã nhân bản câu hỏi thành công (Mã mới: ${res.data?.code || ''})!`, type: 'success' });
        load();
      } catch (e: any) {
        setToast({ message: e.message || 'Không thể nhân bản câu hỏi.', type: 'error' });
      }
      return;
    }

    if (name === 'archive') {
      setConfirmConfig({
        isOpen: true,
        title: 'Lưu trữ câu hỏi',
        message: `Bạn có chắc chắn muốn chuyển câu hỏi mã ${q.code || `QH${q.id}`} vào kho lưu trữ?`,
        type: 'warning',
        confirmText: 'Lưu trữ câu hỏi',
        onConfirm: async () => {
          closeConfirm();
          try {
            await api.post(`/questions/${q.id}/archive`);
            invalidateCache('/questions');
            setToast({ message: `Đã chuyển câu hỏi ${q.code || `QH${q.id}`} sang trạng thái lưu trữ.`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message || 'Không thể lưu trữ câu hỏi.', type: 'error' });
          }
        },
      });
      return;
    }

    if (name === 'restore') {
      try {
        await api.post(`/questions/${q.id}/restore`);
        invalidateCache('/questions');
        setToast({ message: `Đã khôi phục câu hỏi ${q.code || `QH${q.id}`} thành công.`, type: 'success' });
        load();
      } catch (e: any) {
        setToast({ message: e.message || 'Không thể khôi phục câu hỏi.', type: 'error' });
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
            invalidateCache('/questions');
            setToast({ message: `Đã duyệt câu hỏi thành công.`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message || 'Không thể duyệt câu hỏi.', type: 'error' });
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
            invalidateCache('/questions');
            setToast({ message: `Đã từ chối câu hỏi.`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message || 'Không thể từ chối câu hỏi.', type: 'error' });
          }
        },
      });
      return;
    }

    if (name === 'delete') {
      setConfirmConfig({
        isOpen: true,
        title: 'Xóa câu hỏi?',
        message: `Bạn có chắc chắn muốn xóa câu hỏi mã ${q.code || `QH${q.id}`}? Dữ liệu sẽ được chuyển vào thùng rác.`,
        type: 'danger',
        confirmText: 'Xóa câu hỏi',
        onConfirm: async () => {
          closeConfirm();
          try {
            await api.delete(`/questions/${q.id}`);
            invalidateCache('/questions');
            setToast({ message: `Đã chuyển câu hỏi vào thùng rác thành công!`, type: 'success' });
            load();
          } catch (e: any) {
            setToast({ message: e.message || 'Không thể xóa câu hỏi.', type: 'error' });
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
          invalidateCache('/questions');
          setToast({
            message: `Thành công ${r.data.successCount}, thất bại ${r.data.failedCount}.`,
            type: r.data.failedCount ? 'error' : 'success',
          });
          load();
        } catch (e: any) {
          setToast({ message: e.message || 'Thao tác hàng loạt thất bại. Vui lòng thử lại.', type: 'error' });
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
        q.createdByName || q.createdBy?.fullName || '—',
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
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen text-slate-900 dark:text-slate-100">
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

        {/* Top KPI Cards Row */}
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

        {/* Search & Action Toolbar Row (Single Horizontal Unified Row) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Left: Unified Search Bar with Embedded ListFilter Popover (Cách 1) */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={filterValues.search}
              onChange={(e) => {
                setFilterValues({ ...filterValues, search: e.target.value });
                setPage(1);
              }}
              placeholder="Tìm theo nội dung, mã câu hỏi..."
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
            />

            {/* Right embedded action container inside input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {filterValues.search ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilterValues({ ...filterValues, search: '' });
                    setPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}

              {/* Đường ngăn cách mảnh */}
              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

              {/* 1 Nút ListFilter Nhúng Trực Tiếp Bên Trong Góc Phải Ô Search */}
              <QuestionBankFilterPopover
                filters={filterValues}
                onChange={(next) => {
                  setFilterValues(next);
                  setPage(1);
                }}
                subjects={subjects}
                questions={questions}
                totalFilteredCount={questions.length}
                onResetAll={handleResetFilters}
              />
            </div>
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <QuestionBankTableToolbar
              totalCount={counts.total || questions.length}
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

        {/* Status TabBar */}
        <TabBar
          tabs={[
            { key: '', label: 'Tất cả câu hỏi', count: counts.total ?? counts.all ?? 0 },
            { key: 'DRAFT', label: 'Bản nháp', count: counts.DRAFT ?? counts.draft ?? 0 },
            { key: 'PENDING', label: 'Chờ duyệt', count: counts.PENDING ?? counts.pending ?? 0 },
            { key: 'APPROVED', label: 'Đã duyệt', count: counts.APPROVED ?? counts.approved ?? 0 },
            { key: 'REJECTED', label: 'Bị từ chối', count: counts.REJECTED ?? counts.rejected ?? 0 },
          ]}
          active={filterValues.status}
          onChange={(key) => {
            setFilterValues({ ...filterValues, status: key });
            setPage(1);
          }}
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
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 font-semibold">
            {error}
            <button onClick={load} className="ml-3 underline cursor-pointer">
              Thử lại
            </button>
          </div>
        ) : !questions.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
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
            onRubricSaved={() => {
              setToast({ message: 'Đã lưu Rubric chấm điểm cho câu hỏi thành công!', type: 'success' });
              void load();
            }}
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
        onSaved={(msg) => {
          invalidateCache('/questions');
          setToast({ message: msg || (editing ? 'Đã cập nhật câu hỏi thành công!' : 'Đã thêm mới câu hỏi thành công!'), type: 'success' });
          load();
        }}
      />

      {/* Right Drawer Quick View */}
      <QuestionDetailDialog
        question={detail}
        onClose={() => setDetail(null)}
        onRubricSaved={() => {
          setToast({ message: 'Đã lưu Rubric chấm điểm cho câu hỏi thành công!', type: 'success' });
          void load();
        }}
      />

      <QuestionImportWizard
        open={importOpen}
        subjects={subjects}
        onClose={() => setImportOpen(false)}
        onDone={(count) => {
          invalidateCache('/questions');
          setToast({ message: typeof count === 'number' ? `Đã nhập thành công ${count} câu hỏi vào ngân hàng dữ liệu!` : (count || 'Đã nhập dữ liệu câu hỏi thành công!'), type: 'success' });
          load();
        }}
      />

      <QuestionAIWizard
        open={aiOpen}
        subjects={subjects}
        onClose={() => setAiOpen(false)}
        onDone={(msg) => {
          invalidateCache('/questions');
          setToast({ message: (typeof msg === 'string' && msg) || 'Đã sinh câu hỏi bằng AI thành công!', type: 'success' });
          load();
        }}
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
