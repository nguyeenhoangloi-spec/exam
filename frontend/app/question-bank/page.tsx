'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
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
    const actionLabel = name === 'APPROVE' ? 'duyệt' : name === 'REJECT' ? 'từ chối' : name === 'DELETE' ? 'xóa' : 'thực hiện';

    setConfirmConfig({
      isOpen: true,
      title: `Thao tác hàng loạt: ${name}`,
      message: `Bạn có chắc chắn muốn ${actionLabel} ${selected.length} câu hỏi đã chọn?`,
      type: isDelete || isReject ? 'danger' : 'success',
      requireReason: isReject,
      reasonPlaceholder: 'Nhập lý do từ chối hàng loạt...',
      confirmText: `Xác nhận ${actionLabel}`,
      onConfirm: async (reason) => {
        closeConfirm();
        try {
          const r = await api.post('/questions/bulk-action', { ids: selected, action: name, reason });
          setToast({
            message: `Thành công ${r.data.successCount}, thất bại ${r.data.failedCount}`,
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
      const r = await api.post('/questions/export', filters, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setToast({ message: e.message || 'Không xuất được CSV.', type: 'error' });
    }
  };

  return (
    <AppShell user={user} title="Ngân hàng câu hỏi">
      <main className="mx-auto w-full max-w-[1500px] p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-slate-500">Quản lý, phê duyệt và tái sử dụng câu hỏi khảo thí.</p>
        </div>
        <QuestionStatistics counts={counts} />
        <section className="my-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row">
            <QuestionSearch value={search} onChange={setSearch} />
            <QuestionToolbar
              onAdd={() => { setEditing(null); setFormOpen(true); }}
              onImport={() => setImportOpen(true)}
              onAi={() => setAiOpen(true)}
              onExport={exportCsv}
            />
          </div>
          <QuestionFilters value={filters} subjects={subjects} onChange={next => { setFilters(next); setPage(1); }} />
        </section>
        <QuestionBulkAction count={selected.length} onAction={bulk} onClear={() => setSelected([])} />
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
      <QuestionImportWizard open={importOpen} onClose={() => setImportOpen(false)} onDone={load} />
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
