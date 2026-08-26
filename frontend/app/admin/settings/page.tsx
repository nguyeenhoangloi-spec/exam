'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, CalendarClock, CheckCircle2, Cloud, DatabaseBackup, Edit3, ExternalLink,
  HardDrive, MoreHorizontal, Plus, RefreshCw, Save, ShieldCheck, Trash2, XCircle,
  Archive, SlidersHorizontal,
} from 'lucide-react';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Button } from '../../../components/ui/Button';
import {
  StorageTarget, StorageTargetModal, StorageTargetPayload,
} from '../../../components/backups/StorageTargetModal';
import api from '../../../lib/api';

type BackupSettings = {
  autoBackupEnabled: boolean;
  intervalDays: number;
  backupTime: string;
  maxRetentionCount: number;
  dualStorageEnabled: boolean;
  storageTargets: StorageTarget[];
};

type StorageStatus = {
  targets?: Array<{ id: string; status: 'ONLINE' | 'ERROR' | 'STANDBY'; message?: string; lastWriteAt?: string; lastWriteStatus?: 'SUCCESS' | 'ERROR'; lastWriteMessage?: string }>;
};

type AuditRetentionPolicy = { id: string; category: string; hotDays: number; retainDays: number; rawIpDays: number };
type AuditArchiveStatus = { locationLabel: string; total: number; archived: number };
type SettingsTab = 'backup' | 'storage' | 'audit';

const auditCategoryLabel: Record<string, string> = {
  AUTHENTICATION: 'Xác thực', AUTHORIZATION: 'Phân quyền', DATA_ACCESS: 'Truy cập dữ liệu', DATA_EXPORT: 'Xuất dữ liệu',
  EXAMINATION: 'Khảo thí', BACKUP_RECOVERY: 'Sao lưu & khôi phục', AI_PROCESSING: 'Xử lý AI', SYSTEM_SECURITY: 'Bảo mật hệ thống',
};

const defaults: BackupSettings = {
  autoBackupEnabled: true, intervalDays: 1, backupTime: '02:00', maxRetentionCount: 10,
  dualStorageEnabled: true, storageTargets: [],
};

const providerName: Record<string, string> = {
  LOCAL: 'Local / NAS', R2: 'Cloudflare R2', B2: 'Backblaze B2', S3: 'Amazon S3',
  WASABI: 'Wasabi', MINIO: 'MinIO', GOOGLE_DRIVE: 'Google Drive',
};

const inputClass = 'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50';

export default function SystemSettingsPage() {
  usePageTitle('Cài đặt hệ thống');
  const [settings, setSettings] = useState<BackupSettings>(defaults);
  const [activeTab, setActiveTab] = useState<SettingsTab>('backup');
  const [storage, setStorage] = useState<StorageStatus>({});
  const [auditPolicies, setAuditPolicies] = useState<AuditRetentionPolicy[]>([]);
  const [archiveStatus, setArchiveStatus] = useState<AuditArchiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StorageTarget | null>(null);
  const [deleting, setDeleting] = useState<StorageTarget | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [settingsResponse, overviewResponse] = await Promise.all([
        api.get<BackupSettings>('/backups/settings', { params: { noCache: true } }),
        api.get<{ storage?: StorageStatus }>('/backups/overview', { params: { noCache: true } }),
      ]);
      const [policiesResult, archiveResult] = await Promise.allSettled([
        api.get<AuditRetentionPolicy[]>('/security-audit/policies', { params: { noCache: true } }),
        api.get<AuditArchiveStatus>('/security-audit/archive-status', { params: { noCache: true } }),
      ]);
      setSettings({ ...defaults, ...settingsResponse.data, storageTargets: settingsResponse.data.storageTargets || [] });
      setStorage(overviewResponse.data.storage || {});
      setAuditPolicies(policiesResult.status === 'fulfilled' ? policiesResult.value.data || [] : []);
      setArchiveStatus(archiveResult.status === 'fulfilled' ? archiveResult.value.data || null : null);
    } catch (error: any) { setToast({ message: error?.message || 'Không thể tải cài đặt hệ thống.', type: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleDrive') === 'connected') setToast({ message: 'Đã kết nối Google Drive thành công.', type: 'success' });
    if (params.get('googleDrive') === 'error') setToast({ message: params.get('message') || 'Không thể kết nối Google Drive.', type: 'error' });
  }, []);

  const statusById = useMemo(() => new Map((storage.targets || []).map((item) => [item.id, item])), [storage.targets]);
  const orderedTargets = useMemo(() => [...settings.storageTargets].sort((a, b) => (a.priority || 99) - (b.priority || 99)), [settings.storageTargets]);
  const update = <K extends keyof BackupSettings>(key: K, value: BackupSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  const saveSchedule = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.put('/backups/settings', {
        autoBackupEnabled: settings.autoBackupEnabled, intervalDays: settings.intervalDays,
        backupTime: settings.backupTime, maxRetentionCount: settings.maxRetentionCount,
        dualStorageEnabled: settings.dualStorageEnabled,
      });
      await load(); setToast({ message: 'Đã lưu và áp dụng lịch sao lưu.', type: 'success' });
    } catch (error: any) { setToast({ message: error?.message || 'Không thể lưu lịch sao lưu.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const saveTarget = async (payload: StorageTargetPayload) => {
    if (editing) await api.put(`/backups/storage-targets/${editing.id}`, payload);
    else await api.post('/backups/storage-targets', payload);
    await load();
    setToast({ message: editing ? 'Đã cập nhật nơi lưu backup.' : 'Đã thêm nơi lưu backup.', type: 'success' });
  };

  const testTarget = async (target: StorageTarget) => {
    setBusyId(target.id);
    try {
      const response = await api.post<{ message: string }>(`/backups/storage-targets/${target.id}/test`);
      await load(); setToast({ message: response.data.message, type: 'success' });
    } catch (error: any) { await load(); setToast({ message: error?.message || 'Kiểm tra kết nối thất bại.', type: 'error' }); }
    finally { setBusyId(''); }
  };

  const connectGoogle = async (target: StorageTarget) => {
    setBusyId(target.id);
    try {
      const response = await api.post<{ authorizationUrl: string }>(`/backups/storage-targets/${target.id}/google-drive/authorize`);
      window.location.assign(response.data.authorizationUrl);
    } catch (error: any) { setToast({ message: error?.message || 'Không thể bắt đầu kết nối Google Drive.', type: 'error' }); setBusyId(''); }
  };

  const deleteTarget = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await api.delete<{ message: string }>(`/backups/storage-targets/${deleting.id}`);
      setDeleting(null); await load(); setToast({ message: response.data.message, type: 'success' });
    } catch (error: any) { setToast({ message: error?.message || 'Không thể xóa nơi lưu.', type: 'error' }); }
    finally { setBusyId(''); }
  };

  const reorderTarget = async (target: StorageTarget, direction: 'UP' | 'DOWN') => {
    setBusyId(`reorder-${target.id}`);
    try {
      await api.post(`/backups/storage-targets/${target.id}/reorder`, { direction });
      await load();
      setToast({ message: 'Đã cập nhật thứ tự kho backup.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể đổi thứ tự kho backup.', type: 'error' });
    } finally { setBusyId(''); }
  };

  const updateAuditPolicy = async (policy: AuditRetentionPolicy) => {
    setBusyId(`policy-${policy.id}`);
    try {
      await api.patch(`/security-audit/policies/${policy.category}`, {
        hotDays: policy.hotDays, retainDays: policy.retainDays, rawIpDays: policy.rawIpDays,
      });
      await load();
      setToast({ message: `Đã lưu chính sách ${auditCategoryLabel[policy.category] || policy.category}.`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể lưu chính sách nhật ký.', type: 'error' });
    } finally { setBusyId(''); }
  };

  return (
    <div className="w-full min-h-screen space-y-5 bg-slate-50/50 px-6 py-6 dark:bg-slate-950">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-type-body font-semibold text-slate-900 dark:text-slate-100"><ShieldCheck className="h-5 w-5 text-blue-600" /> Cài đặt hệ thống</div>
          <h1 className="text-type-page font-semibold tracking-tight text-slate-950 dark:text-slate-50">Sao lưu & lưu trữ</h1>
          <p className="mt-1 text-type-body text-slate-700 dark:text-slate-300">Cấu hình lịch chạy và kết nối nhiều nơi lưu mà không phải sửa file môi trường.</p>
        </div>
        <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()} disabled={loading || saving}>Làm mới</Button>
      </div>

      <nav className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Nhóm cài đặt">
        {([
          ['backup', 'Sao lưu', CalendarClock],
          ['storage', 'Nơi lưu trữ', HardDrive],
          ['audit', 'Lưu giữ nhật ký', Archive],
        ] as const).map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-type-body-sm font-semibold transition ${activeTab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      {activeTab === 'backup' && <form onSubmit={saveSchedule} className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50"><CalendarClock className="h-5 w-5" /></div><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-slate-50">Lịch sao lưu tự động</h2><p className="text-type-helper text-slate-700 dark:text-slate-300">Cấu hình được áp dụng trong vòng một phút.</p></div></div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><span><span className="block text-type-body font-medium text-slate-950 dark:text-slate-50">Tự động sao lưu</span><span className="text-type-helper text-slate-600 dark:text-slate-300">Chạy theo lịch</span></span><input type="checkbox" checked={settings.autoBackupEnabled} onChange={(e) => update('autoBackupEnabled', e.target.checked)} className="h-5 w-5 accent-blue-600" /></label>
            <label className="space-y-1.5 text-type-body font-medium text-slate-950 dark:text-slate-50">Chu kỳ (ngày)<input type="number" min={1} max={365} value={settings.intervalDays} onChange={(e) => update('intervalDays', Math.max(1, Number(e.target.value) || 1))} className={inputClass} /></label>
            <label className="space-y-1.5 text-type-body font-medium text-slate-950 dark:text-slate-50">Giờ chạy<input type="time" value={settings.backupTime} onChange={(e) => update('backupTime', e.target.value)} className={inputClass} /><span className="text-type-helper font-normal text-slate-600">Asia/Ho_Chi_Minh</span></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40"><DatabaseBackup className="h-5 w-5" /></div><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-slate-50">Chính sách lưu giữ</h2><p className="text-type-helper text-slate-700 dark:text-slate-300">Dọn bản cũ sau khi bản mới hoàn tất.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-type-body font-medium text-slate-950 dark:text-slate-50">Số bản tối đa<input type="number" min={1} max={100} value={settings.maxRetentionCount} onChange={(e) => update('maxRetentionCount', Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className={inputClass} /></label>
            <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-slate-200 p-3 dark:border-slate-700"><span className="text-type-body font-medium text-slate-950 dark:text-slate-50">Dùng kho dự phòng</span><input type="checkbox" checked={settings.dualStorageEnabled} onChange={(e) => update('dualStorageEnabled', e.target.checked)} className="h-5 w-5 accent-blue-600" /></label>
          </div>
          <div className="mt-4 flex justify-end"><Button type="submit" variant="primary" leftIcon={<Save className="h-4 w-4" />} isLoading={saving} disabled={loading}>Lưu lịch & chính sách</Button></div>
        </section>
      </form>}

      {activeTab === 'storage' && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div><h2 className="flex items-center gap-2 text-type-section font-semibold text-slate-950 dark:text-slate-50"><HardDrive className="h-5 w-5 text-blue-600" />Nơi lưu backup</h2><p className="mt-1 text-type-helper text-slate-700 dark:text-slate-300">Một kho chính bắt buộc; có thể thêm nhiều kho dự phòng.</p></div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>Thêm nơi lưu</Button>
        </div>

        <div className="space-y-2 p-4 sm:p-5">
          {orderedTargets.map((target) => {
            const liveStatus = statusById.get(target.id);
            const status = liveStatus?.status || target.lastTestStatus || (target.enabled ? 'STANDBY' : 'STANDBY');
            const online = status === 'ONLINE'; const failed = status === 'ERROR';
            const priority = target.priority || (target.role === 'PRIMARY' ? 1 : 2);
            const maxPriority = Math.max(...orderedTargets.map((item) => item.priority || 2), 2);
            return <article key={target.id} className={`rounded-2xl border p-4 transition ${target.role === 'PRIMARY' ? 'border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3"><div className={`rounded-xl p-2.5 ${target.provider === 'LOCAL' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>{target.provider === 'LOCAL' ? <HardDrive className="h-5 w-5" /> : <Cloud className="h-5 w-5" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-type-body-sm font-semibold text-slate-950 dark:text-slate-50">{target.name}</h3><span className={`rounded-full border px-2 py-0.5 text-type-helper font-semibold ${priority === 1 ? 'border-blue-200 text-blue-700' : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'}`}>{priority === 1 ? 'Kho chính' : `Kho phụ ${priority - 1}`}</span></div><p className="mt-1 text-type-helper font-medium text-slate-600 dark:text-slate-300">{providerName[target.provider]}</p></div></div>
                <span className="w-9" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-type-helper font-medium dark:bg-slate-950/50">{online ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : failed ? <XCircle className="h-4 w-4 text-red-500" /> : <RefreshCw className="h-4 w-4 text-slate-500" />}<span className={online ? 'text-emerald-700' : failed ? 'text-red-700' : 'text-slate-700 dark:text-slate-300'}>{online ? 'Kết nối tốt' : failed ? (liveStatus?.message || target.lastTestMessage || 'Kết nối lỗi') : target.enabled ? 'Chưa kiểm tra' : 'Đang tạm dừng'}</span></div>
              {liveStatus?.lastWriteAt && <p className={`mt-2 text-type-helper font-medium ${liveStatus.lastWriteStatus === 'ERROR' ? 'text-red-700' : 'text-slate-600 dark:text-slate-300'}`}>Lần ghi gần nhất: {liveStatus.lastWriteStatus === 'SUCCESS' ? 'thành công' : `thất bại — ${liveStatus.lastWriteMessage || 'không rõ lỗi'}`}</p>}
              <div className="mt-3 flex justify-end gap-1"><Button variant="ghost" size="icon" title="Đưa lên" disabled={priority <= 2 || busyId === `reorder-${target.id}`} onClick={() => void reorderTarget(target, 'UP')} icon={<ArrowUp className="h-4 w-4" />} /><Button variant="ghost" size="icon" title="Đưa xuống" disabled={priority >= maxPriority || busyId === `reorder-${target.id}`} onClick={() => void reorderTarget(target, 'DOWN')} icon={<ArrowDown className="h-4 w-4" />} /><details className="relative"><summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><MoreHorizontal className="h-4 w-4" /></summary><div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-type-helper font-medium hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => void testTarget(target)}><RefreshCw className="h-4 w-4" />Kiểm tra</button>{target.provider === 'GOOGLE_DRIVE' && <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-type-helper font-medium hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => void connectGoogle(target)}><ExternalLink className="h-4 w-4" />Kết nối Google</button>}<button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-type-helper font-medium hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setEditing(target); setModalOpen(true); }}><Edit3 className="h-4 w-4" />Sửa cấu hình</button>{target.role !== 'PRIMARY' && <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-type-helper font-medium text-red-600 hover:bg-red-50" onClick={() => setDeleting(target)}><Trash2 className="h-4 w-4" />Xóa kết nối</button>}</div></details></div>
            </article>;
          })}
          {!loading && settings.storageTargets.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center"><Cloud className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-type-body font-semibold text-slate-900">Chưa có nơi lưu backup</p><p className="mt-1 text-type-helper text-slate-600">Thêm ít nhất một kho chính để hệ thống có thể sao lưu.</p></div>}
        </div>
      </section>}

      {activeTab === 'audit' && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><SlidersHorizontal className="h-5 w-5" /></div><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-slate-50">Lưu giữ nhật ký kiểm toán</h2><p className="mt-1 text-type-helper text-slate-700 dark:text-slate-300">Thiết lập thời hạn dữ liệu nóng, archive log và thời gian giữ IP gốc theo từng nhóm sự kiện.</p></div></div>
          {archiveStatus && <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-type-helper font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><Archive className="h-4 w-4 text-violet-600" />{archiveStatus.archived}/{archiveStatus.total} sự kiện đã archive</div>}
        </div>
        <div className="ui-table-wrap overflow-x-auto p-5">
          <table className="ui-table w-full min-w-[800px] text-left"><thead className="text-type-label font-medium text-slate-800 dark:text-slate-200"><tr><th className="pb-3 font-medium">Nhóm</th><th className="pb-3 font-medium">Dữ liệu nóng (ngày)</th><th className="pb-3 font-medium">Giữ log (ngày)</th><th className="pb-3 font-medium">Giữ IP gốc (ngày)</th><th className="pb-3" /></tr></thead><tbody>{auditPolicies.map((policy, index) => <tr key={policy.id} className="border-t border-slate-100 dark:border-slate-800"><td className="py-3 text-type-body font-medium text-slate-950 dark:text-slate-50">{auditCategoryLabel[policy.category] || policy.category}</td>{(['hotDays', 'retainDays', 'rawIpDays'] as const).map((field) => <td key={field} className="py-3 pr-3"><input type="number" min={field === 'retainDays' ? 1825 : 1} max={field === 'retainDays' ? 3650 : 365} value={policy[field]} onChange={(event) => setAuditPolicies((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: Number(event.target.value) || 0 } : item))} className="h-10 w-32 rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium tabular-nums outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950" /></td>)}<td className="py-3 text-right"><Button variant="secondary" size="sm" onClick={() => void updateAuditPolicy(policy)} isLoading={busyId === `policy-${policy.id}`}>Lưu</Button></td></tr>)}</tbody></table>
          {!loading && auditPolicies.length === 0 && <p className="py-8 text-center text-type-body text-slate-600 dark:text-slate-300">Chưa tải được chính sách lưu giữ.</p>}
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-type-helper font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">IP sẽ được ẩn khi hết hạn đã chọn; log kiểm toán bắt buộc lưu tối thiểu 5 năm. Chi tiết sự kiện và tính toàn vẹn chuỗi log nằm tại mục Kiểm toán & bảo mật.</p>
      </section>}

      <StorageTargetModal isOpen={modalOpen} target={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={saveTarget} />
      <ConfirmModal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void deleteTarget()} title="Xóa kết nối lưu trữ" message={`Chỉ xóa cấu hình kết nối “${deleting?.name || ''}”; các bản backup đang nằm trên nhà cung cấp sẽ không bị xóa.`} type="danger" confirmText="Xóa kết nối" isLoading={Boolean(deleting && busyId === deleting.id)} />
    </div>
  );
}
