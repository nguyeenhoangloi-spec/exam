'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileLock2, Filter, Lock, RefreshCw, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import api from '../../../lib/api';
import { Toast } from '../../../components/Toast';
import { usePageTitle } from '../../../components/PageTitleContext';

type Outcome = 'SUCCESS' | 'DENIED' | 'FAILURE';
type Event = { id: string; occurredAt: string; category: string; action: string; outcome: Outcome; entityType?: string; entityId?: string; route?: string; ipAddress?: string; requestId?: string; legalHold: boolean; actor?: { username: string; email: string; role: string } | null };

const categoryLabel: Record<string, string> = {
  AUTHENTICATION: 'Xác thực', AUTHORIZATION: 'Phân quyền', DATA_ACCESS: 'Truy cập dữ liệu', DATA_EXPORT: 'Xuất dữ liệu',
  EXAMINATION: 'Khảo thí', BACKUP_RECOVERY: 'Sao lưu & khôi phục', AI_PROCESSING: 'Xử lý AI', SYSTEM_SECURITY: 'Bảo mật hệ thống',
};
const outcomeLabel: Record<Outcome, string> = { SUCCESS: 'Thành công', DENIED: 'Bị từ chối', FAILURE: 'Thất bại' };
const outcomeClass: Record<Outcome, string> = { SUCCESS: 'text-emerald-700 bg-emerald-50 border-emerald-200', DENIED: 'text-amber-800 bg-amber-50 border-amber-200', FAILURE: 'text-rose-700 bg-rose-50 border-rose-200' };
const actionLabel: Record<string, string> = {
  CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa', ARRANGE: 'Xếp lịch', AUTO_ASSIGN: 'Tự động phân công',
  EXAM_PAPER_ANSWER_KEY_VIEWED: 'Xem đề & đáp án', EXAM_PAPER_EXPORT_REQUESTED: 'Xuất đề thi',
  QUESTION_ANSWER_KEY_VIEWED: 'Xem câu hỏi & đáp án', QUESTION_BANK_EXPORTED: 'Xuất ngân hàng câu hỏi',
  RUBRIC_VIEWED: 'Xem rubric', RUBRIC_VERSION_HISTORY_VIEWED: 'Xem lịch sử rubric',
  ESSAY_ATTEMPT_ANSWER_VIEWED: 'Xem bài tự luận', EXAM_RESULT_VIEWED: 'Xem kết quả',
  EXAM_ATTEMPT_REVIEW_VIEWED: 'Xem bài làm & điểm', GRADE_REPORT_VIEWED: 'Xem bảng điểm',
  EXAM_REPORT_SUMMARY_VIEWED: 'Xem báo cáo tổng hợp', EXAM_REPORT_PREVIEWED: 'Xem trước báo cáo',
  EXAM_REPORT_EXPORT: 'Xuất báo cáo', ATTENDANCE_SHEET_VIEWED: 'Xem danh sách điểm danh',
  BACKUP_OVERVIEW_VIEWED: 'Xem tổng quan sao lưu', BACKUP_SETTINGS_VIEWED: 'Xem cấu hình sao lưu', BACKUP_JOB_VIEWED: 'Xem chi tiết bản sao lưu',
  ACCESS_CONTROL_OVERVIEW_VIEWED: 'Xem tổng quan phân quyền', ACCESS_CONTROL_HISTORY_VIEWED: 'Xem lịch sử phân quyền',
  USER_EFFECTIVE_PERMISSIONS_VIEWED: 'Xem quyền hiệu lực',
  SESSION_ACCESS_DENIED: 'Truy cập bị từ chối do phiên không hợp lệ', PERMISSION_DENIED: 'Truy cập bị từ chối do thiếu quyền',
  ROLE_DENIED: 'Truy cập bị từ chối do sai vai trò', SECURITY_AUDIT_POLICY_UPDATED: 'Cập nhật chính sách lưu giữ',
  SECURITY_AUDIT_LEGAL_HOLD_APPLIED: 'Khóa nhật ký để điều tra', SECURITY_AUDIT_LEGAL_HOLD_RELEASED: 'Mở khóa nhật ký điều tra',
};
const entityLabel: Record<string, string> = {
  EXAM_PAPER: 'Đề thi', QUESTION: 'Câu hỏi', QUESTION_RUBRIC: 'Rubric câu hỏi', EXAM_ATTEMPT: 'Bài làm',
  EXAM_SCHEDULE: 'Lịch thi', EXAM_REPORT: 'Báo cáo', QUESTION_BANK: 'Ngân hàng câu hỏi',
  BACKUP_SYSTEM: 'Hệ thống sao lưu', BACKUP_SETTINGS: 'Cấu hình sao lưu', BACKUP_JOB: 'Bản sao lưu',
  ACCESS_CONTROL: 'Phân quyền', USER: 'Tài khoản', PROCTOR_ASSIGNMENT: 'Phân công coi thi',
};

export default function SecurityAuditPage() {
  usePageTitle('Kiểm toán & bảo mật');
  const [events, setEvents] = useState<Event[]>([]);
  const [integrity, setIntegrity] = useState<{ checked: number; valid: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [outcome, setOutcome] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventResponse, integrityResponse] = await Promise.all([
        api.get('/security-audit/events', { params: { limit: 50, ...(search ? { search } : {}), ...(category ? { category } : {}), ...(outcome ? { outcome } : {}) } }),
        api.get('/security-audit/integrity', { params: { limit: 1000 } }),
      ]);
      setEvents(eventResponse.data.items || []);
      setIntegrity(integrityResponse.data);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Không thể tải dữ liệu kiểm toán bảo mật.' });
    } finally { setLoading(false); }
  }, [search, category, outcome]);

  useEffect(() => { void load(); }, [load]);
  const summary = useMemo(() => ({ total: events.length, denied: events.filter((event) => event.outcome === 'DENIED').length, failed: events.filter((event) => event.outcome === 'FAILURE').length, held: events.filter((event) => event.legalHold).length }), [events]);

  const applyHold = async (event: Event) => {
    const reason = window.prompt('Lý do khóa lưu giữ (legal hold):');
    if (!reason?.trim()) return;
    try {
      await api.post(`/security-audit/events/${event.id}/legal-hold`, { reason });
      setToast({ type: 'success', message: 'Đã khóa lưu giữ sự kiện kiểm toán.' });
      await load();
    } catch (error: any) { setToast({ type: 'error', message: error?.message || 'Không thể tạo legal hold.' }); }
  };

  return <main className="min-h-screen bg-slate-50 px-6 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    <div className="mx-auto max-w-[1560px] space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-type-page-title font-semibold"><ShieldAlert className="h-6 w-6 text-blue-600" />Kiểm toán & bảo mật</h1><p className="mt-1 text-type-body text-slate-700 dark:text-slate-300 font-normal">Sự kiện nhạy cảm được lưu độc lập, che dữ liệu bí mật và kiểm tra được tính toàn vẹn.</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-type-body font-medium ${integrity?.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{integrity?.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{integrity?.valid ? `Chuỗi log hợp lệ (${integrity.checked})` : 'Kiểm tra chuỗi log'}</span><button onClick={() => void load()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-type-body font-medium shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"><RefreshCw className="h-4 w-4" />Làm mới</button></div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        {[['Sự kiện đang xem', summary.total, ShieldCheck], ['Bị từ chối', summary.denied, AlertTriangle], ['Thất bại', summary.failed, AlertTriangle], ['Đang khóa lưu giữ', summary.held, FileLock2]].map(([label, value, Icon]: any) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between text-type-body text-slate-700 dark:text-slate-300 font-normal"><span>{label}</span><Icon className="h-4 w-4 text-blue-600" /></div><p className="mt-2 text-type-kpi font-bold tabular-nums">{value}</p></article>)}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center dark:border-slate-800"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo hành động, đối tượng hoặc tài khoản..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-type-body font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" /></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal dark:border-slate-700 dark:bg-slate-950"><option value="">Tất cả nhóm</option>{Object.entries(categoryLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal dark:border-slate-700 dark:bg-slate-950"><option value="">Mọi kết quả</option>{Object.entries(outcomeLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button onClick={() => void load()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-type-body font-medium text-white hover:bg-blue-700 cursor-pointer"><Filter className="h-4 w-4" />Lọc</button></div>
        <div className="ui-table-wrap overflow-x-auto"><table className="ui-table w-full min-w-[1050px] text-left"><thead className="bg-slate-50 text-type-label font-medium text-slate-800 dark:bg-slate-950 dark:text-slate-200"><tr><th className="px-4 py-3 font-medium">Thời điểm</th><th className="px-4 py-3 font-medium">Tài khoản</th><th className="px-4 py-3 font-medium">Sự kiện</th><th className="px-4 py-3 font-medium">Đối tượng</th><th className="px-4 py-3 font-medium">Kết quả</th><th className="px-4 py-3 font-medium">Nguồn</th><th className="px-4 py-3 font-medium">Trạng thái</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-10 text-center text-type-body text-slate-600 font-normal">Đang tải nhật ký kiểm toán…</td></tr> : events.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-type-body text-slate-600 font-normal">Chưa có sự kiện phù hợp.</td></tr> : events.map((event) => <tr key={event.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-3 text-type-body tabular-nums font-normal">{new Date(event.occurredAt).toLocaleString('vi-VN')}</td><td className="px-4 py-3 text-type-body font-medium">{event.actor?.username || 'Hệ thống'}</td><td className="px-4 py-3 text-type-body font-normal"><p className="text-type-body font-medium">{actionLabel[event.action] || event.action.replaceAll('_', ' ')}</p><p className="table-meta text-type-helper text-slate-600 font-normal">{categoryLabel[event.category] || event.category}</p></td><td className="px-4 py-3 text-type-body font-normal">{event.entityType ? `${entityLabel[event.entityType] || event.entityType}${event.entityId ? ` · ${event.entityId}` : ''}` : '—'}</td><td className="px-4 py-3 text-type-body font-normal"><span className={`table-badge ui-pill inline-flex rounded-full border px-2.5 py-1 text-type-helper font-medium ${outcomeClass[event.outcome]}`}>{outcomeLabel[event.outcome]}</span></td><td className="px-4 py-3 text-type-body font-normal"><span className="table-meta text-type-helper text-slate-700 font-normal">{event.ipAddress || 'IP đã ẩn'}<br />{event.route || '—'}</span></td><td className="px-4 py-3 text-type-body font-normal">{event.legalHold ? <span title="Đang khóa để điều tra" aria-label="Đang khóa để điều tra" className="table-badge inline-flex items-center justify-center text-amber-800"><Lock className="h-4 w-4" /></span> : <button onClick={() => void applyHold(event)} title="Khóa để điều tra" aria-label="Khóa để điều tra" className="table-action inline-flex h-8 w-8 items-center justify-center rounded-xl text-blue-700 hover:bg-blue-50 cursor-pointer"><Lock className="h-4 w-4" /></button>}</td></tr>)}</tbody></table></div>
      </section>

    </div>
  </main>;
}
