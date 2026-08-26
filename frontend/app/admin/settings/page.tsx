'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, CalendarClock, CheckCircle2, Cloud, DatabaseBackup, Edit3, ExternalLink,
  HardDrive, Plus, RefreshCw, Save, ShieldCheck, Trash2, XCircle,
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

const inputClass = 'h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-type-body font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-50';

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
    <div className="w-full min-h-screen space-y-6 bg-slate-50/50 px-6 py-6 dark:bg-slate-950">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-type-body font-semibold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Cài đặt hệ thống</span>
          </div>
          <h1 className="text-type-page font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Sao lưu & Lưu trữ
          </h1>
          <p className="mt-1 text-type-body text-slate-600 dark:text-slate-400">
            Cấu hình lịch chạy tự động và kết nối nhiều kho lưu trữ đám mây độc lập.
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => void load()}
          disabled={loading || saving}
        >
          Làm mới
        </Button>
      </div>

      <div>
        <nav className="inline-flex rounded-2xl border border-slate-200/90 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900" aria-label="Nhóm cài đặt">
          {([
            ['backup', 'Lịch sao lưu', CalendarClock],
            ['storage', 'Kho lưu trữ', HardDrive],
            ['audit', 'Lưu giữ nhật ký', Archive],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-type-body-sm font-semibold transition-all duration-150 cursor-pointer select-none ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'backup' && (
        <form onSubmit={saveSchedule} className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                  Lịch sao lưu tự động
                </h2>
                <p className="text-type-helper text-slate-500 dark:text-slate-400">
                  Cấu hình được áp dụng trực tiếp cho worker ngầm trong vòng 1 phút.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                <div>
                  <span className="block text-type-body font-semibold text-slate-900 dark:text-slate-100">
                    Tự động chạy
                  </span>
                  <span className="text-type-helper text-slate-500 dark:text-slate-400">
                    Theo lịch
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoBackupEnabled}
                  onClick={() => update('autoBackupEnabled', !settings.autoBackupEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                    settings.autoBackupEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.autoBackupEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <label className="space-y-1.5 text-type-body font-medium text-slate-900 dark:text-slate-100">
                <span>Chu kỳ (ngày)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.intervalDays}
                  onChange={(e) => update('intervalDays', Math.max(1, Number(e.target.value) || 1))}
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5 text-type-body font-medium text-slate-900 dark:text-slate-100">
                <span>Giờ chạy</span>
                <input
                  type="time"
                  value={settings.backupTime}
                  onChange={(e) => update('backupTime', e.target.value)}
                  className={inputClass}
                />
                <span className="block text-type-badge font-normal text-slate-500">Asia/Ho_Chi_Minh</span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                  <DatabaseBackup className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                    Chính sách lưu giữ
                  </h2>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400">
                    Tự động dọn dẹp các bản snapshot cũ sau khi tạo bản mới thành công.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-type-body font-medium text-slate-900 dark:text-slate-100">
                  <span>Số bản tối đa</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.maxRetentionCount}
                    onChange={(e) => update('maxRetentionCount', Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                    className={inputClass}
                  />
                </label>

                <div className="flex items-center justify-between gap-3 self-end rounded-xl border border-slate-200/90 p-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 h-10">
                  <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                    Kho dự phòng
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.dualStorageEnabled}
                    onClick={() => update('dualStorageEnabled', !settings.dualStorageEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      settings.dualStorageEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        settings.dualStorageEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<Save className="h-4 w-4" />}
                isLoading={saving}
                disabled={loading}
              >
                Lưu lịch & chính sách
              </Button>
            </div>
          </section>
        </form>
      )}

      {activeTab === 'storage' && (
        <section className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200/90 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="flex items-center gap-2 text-type-section font-semibold text-slate-900 dark:text-slate-100">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Nơi lưu backup</span>
              </h2>
              <p className="mt-1 text-type-helper text-slate-500 dark:text-slate-400">
                Hệ thống bắt buộc có 1 kho chính và có thể mở rộng nhiều kho dự phòng (Cloudflare R2, AWS S3, Google Drive, Wasabi, MinIO).
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => { setEditing(null); setModalOpen(true); }}
            >
              Thêm nơi lưu
            </Button>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {orderedTargets.map((target) => {
              const liveStatus = statusById.get(target.id);
              const status = liveStatus?.status || target.lastTestStatus || (target.enabled ? 'STANDBY' : 'STANDBY');
              const online = status === 'ONLINE';
              const failed = status === 'ERROR';
              const priority = target.priority || (target.role === 'PRIMARY' ? 1 : 2);
              const maxPriority = Math.max(...orderedTargets.map((item) => item.priority || 2), 2);

              return (
                <article
                  key={target.id}
                  className={`rounded-2xl border p-4 transition duration-150 ${
                    target.role === 'PRIMARY'
                      ? 'border-blue-300 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20'
                      : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`rounded-xl p-2.5 shrink-0 ${
                          target.provider === 'LOCAL'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {target.provider === 'LOCAL' ? (
                          <HardDrive className="h-5 w-5" />
                        ) : (
                          <Cloud className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-type-body font-semibold text-slate-900 dark:text-slate-100">
                            {target.name}
                          </h3>
                          <span
                            className={`table-badge ${
                              priority === 1
                                ? 'table-badge-info'
                                : 'table-badge-neutral'
                            }`}
                          >
                            {priority === 1 ? 'Kho chính' : `Kho phụ ${priority - 1}`}
                          </span>
                        </div>
                        <p className="mt-1 text-type-helper font-medium text-slate-500 dark:text-slate-400">
                          {providerName[target.provider]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`table-badge ${
                          online
                            ? 'table-badge-success'
                            : failed
                            ? 'table-badge-danger'
                            : 'table-badge-neutral'
                        }`}
                      >
                        {online ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : failed ? (
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        )}
                        <span>
                          {online
                            ? 'Kết nối tốt'
                            : failed
                            ? (liveStatus?.message || target.lastTestMessage || 'Kết nối lỗi')
                            : target.enabled
                            ? 'Chưa kiểm tra'
                            : 'Đang tạm dừng'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {liveStatus?.lastWriteAt && (
                    <p
                      className={`mt-2 text-type-helper font-medium ${
                        liveStatus.lastWriteStatus === 'ERROR'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Lần ghi gần nhất: {liveStatus.lastWriteStatus === 'SUCCESS' ? 'Thành công' : `Thất bại — ${liveStatus.lastWriteMessage || 'Không rõ lỗi'}`}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Đưa lên trên"
                      disabled={priority <= 2 || busyId === `reorder-${target.id}`}
                      onClick={() => void reorderTarget(target, 'UP')}
                      icon={<ArrowUp className="h-4 w-4" />}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Đưa xuống dưới"
                      disabled={priority >= maxPriority || busyId === `reorder-${target.id}`}
                      onClick={() => void reorderTarget(target, 'DOWN')}
                      icon={<ArrowDown className="h-4 w-4" />}
                    />
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${busyId === target.id ? 'animate-spin' : ''}`} />}
                      onClick={() => void testTarget(target)}
                      isLoading={busyId === target.id}
                    >
                      Kiểm tra
                    </Button>

                    {target.provider === 'GOOGLE_DRIVE' && (
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => void connectGoogle(target)}
                      >
                        Kết nối Google
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                      onClick={() => { setEditing(target); setModalOpen(true); }}
                    >
                      Sửa
                    </Button>

                    {target.role !== 'PRIMARY' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => setDeleting(target)}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}

            {!loading && settings.storageTargets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                <Cloud className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  Chưa có nơi lưu backup
                </p>
                <p className="mt-1 text-type-helper text-slate-500 dark:text-slate-400">
                  Thêm ít nhất một kho chính để hệ thống có thể bắt đầu sao lưu an toàn.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Lưu giữ nhật ký kiểm toán */}
      {activeTab === 'audit' && (
        <section className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200/90 p-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shrink-0">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                  Lưu giữ nhật ký kiểm toán
                </h2>
                <p className="mt-1 text-type-helper text-slate-500 dark:text-slate-400">
                  Thiết lập thời hạn dữ liệu nóng, archive log và thời gian giữ IP gốc theo từng phân hệ.
                </p>
              </div>
            </div>

            {archiveStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2 text-type-helper font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <Archive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{archiveStatus.archived} / {archiveStatus.total} sự kiện đã archive</span>
              </div>
            )}
          </div>

          <div className="ui-table-wrap overflow-x-auto p-5">
            <table className="ui-table w-full min-w-[800px] text-left">
              <thead className="text-type-label font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200/90 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-medium">Phân hệ nghiệp vụ</th>
                  <th className="pb-3 font-medium">Dữ liệu nóng (ngày)</th>
                  <th className="pb-3 font-medium">Giữ log (ngày)</th>
                  <th className="pb-3 font-medium">Giữ IP gốc (ngày)</th>
                  <th className="pb-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditPolicies.map((policy, index) => (
                  <tr key={policy.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition">
                    <td className="py-3 text-type-body font-semibold text-slate-900 dark:text-slate-100">
                      {auditCategoryLabel[policy.category] || policy.category}
                    </td>
                    {(['hotDays', 'retainDays', 'rawIpDays'] as const).map((field) => (
                      <td key={field} className="py-3 pr-3">
                        <input
                          type="number"
                          min={field === 'retainDays' ? 1825 : 1}
                          max={field === 'retainDays' ? 3650 : 365}
                          value={policy[field]}
                          onChange={(event) =>
                            setAuditPolicies((items) =>
                              items.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, [field]: Number(event.target.value) || 0 } : item
                              )
                            )
                          }
                          className="h-9 w-28 rounded-xl border border-slate-200/90 bg-white px-3 text-type-body font-medium tabular-nums outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                        />
                      </td>
                    ))}
                    <td className="py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void updateAuditPolicy(policy)}
                        isLoading={busyId === `policy-${policy.id}`}
                      >
                        Lưu
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && auditPolicies.length === 0 && (
              <p className="py-8 text-center text-type-body text-slate-500 dark:text-slate-400">
                Chưa tải được chính sách lưu giữ.
              </p>
            )}
          </div>

          <p className="border-t border-slate-100 px-5 py-3 text-type-helper font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
            IP sẽ được ẩn khi hết hạn đã chọn; log kiểm toán bắt buộc lưu tối thiểu 5 năm theo quy định.
          </p>
        </section>
      )}

      <StorageTargetModal
        isOpen={modalOpen}
        target={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={saveTarget}
      />

      <ConfirmModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => void deleteTarget()}
        title="Xóa kết nối lưu trữ"
        message={`Chỉ xóa cấu hình kết nối “${deleting?.name || ''}”; các bản backup đang nằm trên nhà cung cấp sẽ không bị xóa.`}
        type="danger"
        confirmText="Xóa kết nối"
        isLoading={Boolean(deleting && busyId === deleting.id)}
      />
    </div>
  );
}
