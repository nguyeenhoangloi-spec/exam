'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Question, Subject } from '../../types';
import { QuestionAIWizard } from '../../components/question-bank/QuestionAIWizard';
import { QuestionBulkAction } from '../../components/question-bank/QuestionBulkAction';
import { QuestionCard } from '../../components/question-bank/QuestionCard';
import { QuestionDetailDialog } from '../../components/question-bank/QuestionDetailDialog';
import { Filters, QuestionFilters } from '../../components/question-bank/QuestionFilters';
import { QuestionFormDialog } from '../../components/question-bank/QuestionFormDialog';
import { QuestionImportWizard } from '../../components/question-bank/QuestionImportWizard';
import { QuestionPagination } from '../../components/question-bank/QuestionPagination';
import { QuestionSearch } from '../../components/question-bank/QuestionSearch';
import { QuestionStatistics } from '../../components/question-bank/QuestionStatistics';
import { QuestionToolbar } from '../../components/question-bank/QuestionToolbar';
import { printReport } from '../../lib/export-print';

const emptyFilters: Filters = { subjectId: '', chapterId: '', type: '', difficulty: '', bloomLevel: '', status: '' };

export default function QuestionBankPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState(emptyFilters);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Question | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
    if (!['ADMIN','TEACHER'].includes(auth.role)) return void router.push('/dashboard');
    setUser(auth);
    const p = new URLSearchParams(window.location.search);
    setSearch(p.get('search') || ''); setDebounced(p.get('search') || '');
    setPage(Number(p.get('page') || 1)); setLimit(Number(p.get('limit') || 20));
    setFilters({ subjectId:p.get('subjectId')||'', chapterId:p.get('chapterId')||'', type:p.get('type')||'', difficulty:p.get('difficulty')||'', bloomLevel:p.get('bloomLevel')||'', status:p.get('status')||'' });
    if (p.get('action') === 'create') setFormOpen(true);
    if (p.get('action') === 'import') setImportOpen(true);
    const questionId = p.get('questionId');
    if (questionId) {
      api.get(`/questions/${questionId}`)
        .then(response => setDetail(response.data))
        .catch(err => setToast({ message: err.message, type: 'error' }));
    }
    Promise.all([api.get('/questions/filter-options'), api.get('/questions/statistics')]).then(([options, stats]) => { setSubjects(options.data.subjects); setCounts(stats.data); }).catch(e => setError(e.message));
  }, [router]);

  useEffect(() => { const timer = setTimeout(() => { setDebounced(search); setPage(1); }, 400); return () => clearTimeout(timer); }, [search]);

  const load = useCallback(async () => {
    if (!user) return; setLoading(true); setError('');
    const params = new URLSearchParams({ page:String(page), limit:String(limit) });
    Object.entries({ ...filters, search:debounced }).forEach(([k,v]) => v && params.set(k,v));
    router.replace(`/question-bank?${params}`, { scroll:false });
    try {
      const [list, stats] = await Promise.all([api.get(`/questions?${params}`), api.get('/questions/statistics')]);
      setQuestions(list.data.data); setTotalPages(list.data.totalPages); setCounts(stats.data); setSelected([]);
    } catch (e:any) { setError(e.message || 'Không tải được dữ liệu.'); } finally { setLoading(false); }
  }, [user, page, limit, filters, debounced, router]);

  useEffect(() => { load(); }, [load]);

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
        message: `Bạn có chắc chắn muốn phê duyệt câu hỏi mã ${q.code}?`,
        type: 'success',
        confirmText: 'Duyệt câu hỏi',
        onConfirm: async () => {
          closeConfirm();
          try {
            await api.post(`/questions/${q.id}/approve`);
            setToast({ message: `Đã duyệt câu hỏi ${q.code} thành công.`, type: 'success' });
            load();
          } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
        },
      });
      return;
    }

    if (name === 'reject') {
      setConfirmConfig({
        isOpen: true,
        title: 'Từ chối duyệt câu hỏi',
        message: `Nhập lý do từ chối câu hỏi mã ${q.code}:`,
        type: 'danger',
        requireReason: true,
        reasonPlaceholder: 'Lý do từ chối (tối thiểu 3 ký tự)...',
        confirmText: 'Xác nhận từ chối',
        onConfirm: async (reason) => {
          closeConfirm();
          try {
            await api.post(`/questions/${q.id}/reject`, { reason });
            setToast({ message: `Đã từ chối câu hỏi ${q.code}.`, type: 'success' });
            load();
          } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
        },
      });
      return;
    }

    if (name === 'delete') {
      setConfirmConfig({
        isOpen: true,
        title: 'Xóa câu hỏi',
        message: `Bạn có chắc chắn muốn xóa mềm câu hỏi mã ${q.code}?`,
        type: 'danger',
        confirmText: 'Xóa câu hỏi',
        onConfirm: async () => {
          closeConfirm();
          try {
            await api.delete(`/questions/${q.id}`);
            setToast({ message: `Đã xóa câu hỏi ${q.code}.`, type: 'success' });
            load();
          } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
        },
      });
      return;
    }

    // Direct fallback for other actions (e.g., submit, restore, archive)
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận thao tác',
      message: `Thực hiện thao tác trên câu hỏi mã ${q.code}?`,
      type: 'warning',
      confirmText: 'Thực hiện',
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.post(`/questions/${q.id}/${name}`);
          setToast({ message: 'Thao tác thành công.', type: 'success' });
          load();
        } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
      },
    });
  };

  const showDetail = async (id: string) => {
    try {
      setDetail((await api.get(`/questions/${id}`)).data);
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const bulk = async (name: string) => {
    const isReject = name === 'REJECT';
    const isDelete = name === 'DELETE';
    const actionLabel = name === 'APPROVE' ? 'duyệt' : name === 'REJECT' ? 'từ chối' : name === 'DELETE' ? 'xóa' : name === 'RESTORE' ? 'khôi phục' : name === 'ARCHIVE' ? 'lưu trữ' : 'thực hiện';
    const eligible = (q: Question) => {
      if (name === 'APPROVE' || name === 'REJECT') return ['PENDING', 'DRAFT'].includes(q.status);
      if (name === 'ARCHIVE') return ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(q.status);
      if (name === 'RESTORE') return ['ARCHIVED', 'REJECTED'].includes(q.status);
      return true;
    };
    const selectedQuestions = questions.filter(q => selected.includes(q.id));
    const actionIds = selectedQuestions.filter(eligible).map(q => q.id);
    const skipped = selected.length - actionIds.length;
    if (!actionIds.length) {
      setToast({ message: `Không có câu hỏi phù hợp để ${actionLabel}. Hãy kiểm tra trạng thái câu hỏi đã chọn.`, type: 'error' });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: `Thao tác hàng loạt: ${name}`,
      message: `Bạn có chắc chắn muốn ${actionLabel} ${actionIds.length} câu hỏi phù hợp?${skipped ? ` ${skipped} câu không phù hợp sẽ được bỏ qua.` : ''}`,
      type: isDelete || isReject ? 'danger' : 'success',
      requireReason: isReject,
      reasonPlaceholder: 'Nhập lý do từ chối hàng loạt...',
      confirmText: `Xác nhận ${actionLabel}`,
      onConfirm: async (reason) => {
        closeConfirm();
        try {
          const r = await api.post('/questions/bulk-action', { ids: actionIds, action: name, reason });
          setToast({
            message: `Thành công ${r.data.successCount}, thất bại ${r.data.failedCount}${skipped ? `, bỏ qua ${skipped}` : ''}.`,
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
      const selectedSubject = subjects.find(s => String(s.id) === String(filters.subjectId));
      const rows = questions.map((q, idx) => [
        idx + 1,
        q.code || `CH${q.id}`,
        q.subject?.subjectName || 'Chưa gán',
        q.content,
        q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó',
        q.status === 'APPROVED' ? 'Đã duyệt' : q.status === 'PENDING' ? 'Chờ duyệt' : q.status === 'DRAFT' ? 'Nháp' : q.status,
        q.chapter ? `Chương ${q.chapter}` : 'Tự do',
        q.createdByName || q.createdBy?.fullName || 'Hệ thống',
      ]);

      exportToFormattedExcel({
        filename: `Danh_sach_cau_hoi_${new Date().toISOString().slice(0, 10)}.xls`,
        title: 'BÁO CÁO DANH SÁCH CÂU HỎI NGÂN HÀNG',
        subtitle: `Số lượng: ${questions.length} câu hỏi | Môn học: ${selectedSubject?.subjectName || 'Tất cả môn'}`,
        columns: [
          { header: 'STT', align: 'center', width: 8 },
          { header: 'Mã câu hỏi', align: 'center', width: 16 },
          { header: 'Môn học', align: 'left', width: 25 },
          { header: 'Nội dung câu hỏi', align: 'left', width: 45 },
          { header: 'Độ khó', align: 'center', width: 14 },
          { header: 'Trạng thái', align: 'center', width: 14 },
          { header: 'Chương', align: 'center', width: 12 },
          { header: 'Người tạo', align: 'left', width: 20 },
        ],
        rows,
      });
      setToast({ message: 'Đã xuất file Excel tự động định dạng thành công!', type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message || 'Không xuất được Excel.', type: 'error' });
    }
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO THỐNG KÊ NGÂN HÀNG CÂU HỎI',
      subtitle: 'Danh sách các câu hỏi trong ngân hàng câu hỏi khảo thí',
      metaInfo: [
        { label: 'Tổng số câu hỏi', value: String(counts.total || questions.length) },
        { label: 'Số câu hiển thị', value: String(questions.length) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã CH', width: '90px', align: 'center' },
        { header: 'Môn thi', width: '130px' },
        { header: 'Dạng câu hỏi', width: '110px', align: 'center' },
        { header: 'Độ khó', width: '90px', align: 'center' },
        { header: 'Nội dung câu hỏi', width: '250px' },
        { header: 'Trạng thái', width: '100px', align: 'center' },
      ],
      rows: questions.map((q, idx) => [
        idx + 1,
        q.code || `CH-${q.id}`,
        q.subject?.subjectName || '---',
        q.type === 'SINGLE_CHOICE' ? 'Trắc nghiệm (1 đáp án)' : q.type === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' : 'Đúng/Sai',
        q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'Trung bình',
        q.content,
        q.status === 'APPROVED' ? 'Đã duyệt' : q.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt',
      ]),
    });
  };

  return (
    <AppShell user={user} title="Ngân hàng câu hỏi">
      <main className="w-full px-6 py-6 space-y-6">
        <QuestionStatistics
          counts={counts}
          activeStatus={filters.status}
          onSelectStatus={(st) => {
            setFilters({ ...filters, status: st });
            setPage(1);
          }}
        />
        <section className="my-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row">
            <QuestionSearch value={search} onChange={setSearch} />
            <QuestionToolbar
              onAdd={() => { setEditing(null); setFormOpen(true); }}
              onImport={() => setImportOpen(true)}
              onAi={() => setAiOpen(true)}
              onExport={exportCsv}
              onPrint={handlePrintReport}
            />
          </div>
          <QuestionFilters value={filters} subjects={subjects} onChange={next => { setFilters(next); setPage(1); }} />
        </section>
        {(() => {
          const selectedQuestions = questions.filter((q) => selected.includes(q.id));
          const isAdmin = user?.role === 'ADMIN';

          // Teachers and users can submit DRAFT or REJECTED questions for approval
          const canSubmit = selectedQuestions.some((q) => ['DRAFT', 'REJECTED'].includes(q.status));

          // ONLY ADMIN can Approve, Reject, Restore, or Archive questions
          const canApprove = isAdmin && selectedQuestions.some((q) => ['DRAFT', 'PENDING', 'REJECTED'].includes(q.status));
          const canReject = isAdmin && selectedQuestions.some((q) => ['DRAFT', 'PENDING'].includes(q.status));
          const canRestore = isAdmin && selectedQuestions.some((q) => ['ARCHIVED', 'REJECTED'].includes(q.status));
          const canArchive = isAdmin && selectedQuestions.some((q) => ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(q.status));
          
          // ADMIN can delete any selected question; TEACHER can delete DRAFT questions
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
              onToggleAll={() => setSelected(selected.length === questions.length ? [] : questions.map((q) => q.id))}
              onAction={bulk}
              onClear={() => setSelected([])}
            />
          );
        })()}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
            {error}<button onClick={load} className="ml-3 underline">Thử lại</button>
          </div>
        ) : !questions.length ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">Không có câu hỏi phù hợp.</div>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                selected={selected.includes(q.id)}
                onSelect={v => setSelected(v ? [...selected, q.id] : selected.filter(id => id !== q.id))}
                onDetail={() => showDetail(q.id)}
                onAction={name => action(q, name)}
                isAdmin={user?.role === 'ADMIN'}
              />
            ))}
          </div>
        )}
        <QuestionPagination page={page} totalPages={totalPages} limit={limit} onPage={setPage} onLimit={v => { setLimit(v); setPage(1); }} />
      </main>

      <QuestionFormDialog open={formOpen} subjects={subjects} question={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSaved={load} />
      <QuestionDetailDialog question={detail} onClose={() => setDetail(null)} />
      <QuestionImportWizard open={importOpen} subjects={subjects} onClose={() => setImportOpen(false)} onDone={load} />
      <QuestionAIWizard open={aiOpen} subjects={subjects} onClose={() => setAiOpen(false)} onDone={load} />

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
    </AppShell>
  );
}
