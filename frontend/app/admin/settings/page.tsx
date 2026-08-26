'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Cloud,
  Edit3,
  HardDrive,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Button } from '../../../components/ui/Button';
import {
  StorageTarget,
  StorageTargetModal,
  StorageTargetPayload,
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
  targets?: Array<{
    id: string;
    status: 'ONLINE' | 'ERROR' | 'STANDBY';
    message?: string;
    lastWriteAt?: string;
    lastWriteStatus?: 'SUCCESS' | 'ERROR';
    lastWriteMessage?: string;
  }>;
};

type AuditRetentionPolicy = {
  id: string;
  category: string;
  hotDays: number;
  retainDays: number;
  rawIpDays: number;
};

type AuditArchiveStatus = {
  locationLabel: string;
  total: number;
  archived: number;
};

const auditCategoryLabel: Record<string, string> = {
  AUTHENTICATION: 'Xác thực',
  AUTHORIZATION: 'Phân quyền',
  DATA_ACCESS: 'Truy cập dữ liệu',
  DATA_EXPORT: 'Xuất dữ liệu',
  EXAMINATION: 'Khảo thí',
  BACKUP_RECOVERY: 'Sao lưu & khôi phục',
  AI_PROCESSING: 'Xử lý AI',
  SYSTEM_SECURITY: 'Bảo mật hệ thống',
};

const defaults: BackupSettings = {
  autoBackupEnabled: true,
  intervalDays: 1,
  backupTime: '02:00',
  maxRetentionCount: 10,
  dualStorageEnabled: true,
  storageTargets: [],
};

const providerName: Record<string, string> = {
  LOCAL: 'Local / NAS',
  R2: 'Cloudflare R2',
  B2: 'Backblaze B2',
  S3: 'Amazon S3',
  WASABI: 'Wasabi',
  MINIO: 'MinIO',
  GOOGLE_DRIVE: 'Google Drive',
};

const inputClass =
  'h-9 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-type-body font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-50';

export default function SystemSettingsPage() {
  usePageTitle('Cài đặt hệ thống');
  const [settings, setSettings] = useState<BackupSettings>(defaults);
  const [storage, setStorage] = useState<StorageStatus>({});
  const [auditPolicies, setAuditPolicies] = useState<AuditRetentionPolicy[]>([]);
  const [archiveStatus, setArchiveStatus] = useState<AuditArchiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
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
      setSettings({
        ...defaults,
        ...settingsResponse.data,
        storageTargets: settingsResponse.data.storageTargets || [],
      });
      setStorage(overviewResponse.data.storage || {});
      setAuditPolicies(policiesResult.status === 'fulfilled' ? policiesResult.value.data || [] : []);
      setArchiveStatus(archiveResult.status === 'fulfilled' ? archiveResult.value.data || null : null);
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể tải cài đặt hệ thống.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleDrive') === 'connected')
      setToast({ message: 'Đã kết nối Google Drive thành công.', type: 'success' });
    if (params.get('googleDrive') === 'error')
      setToast({ message: params.get('message') || 'Không thể kết nối Google Drive.', type: 'error' });
  }, []);

  const statusById = useMemo(
    () => new Map((storage.targets || []).map((item) => [item.id, item])),
    [storage.targets],
  );

  const orderedTargets = useMemo(
    () => [...settings.storageTargets].sort((a, b) => (a.priority || 99) - (b.priority || 99)),
    [settings.storageTargets],
  );

  const update = <K extends keyof BackupSettings>(key: K, value: BackupSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const saveAllSettings = async () => {
    setSavingAll(true);
    try {
      await Promise.all([
        api.put('/backups/settings', {
          autoBackupEnabled: settings.autoBackupEnabled,
          intervalDays: settings.intervalDays,
          backupTime: settings.backupTime,
          maxRetentionCount: settings.maxRetentionCount,
          dualStorageEnabled: settings.dualStorageEnabled,
        }),
        ...auditPolicies.map((policy) =>
          api.patch(`/security-audit/policies/${policy.category}`, {
            hotDays: policy.hotDays,
            retainDays: policy.retainDays,
            rawIpDays: policy.rawIpDays,
          }),
        ),
      ]);
      await load();
      setToast({ message: 'Đã lưu và áp dụng toàn bộ cài đặt hệ thống.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể lưu cài đặt hệ thống.', type: 'error' });
    } finally {
      setSavingAll(false);
    }
  };

  const saveTarget = async (payload: StorageTargetPayload) => {
    if (editing) await api.put(`/backups/storage-targets/${editing.id}`, payload);
    else await api.post('/backups/storage-targets', payload);
    await load();
    setToast({
      message: editing ? 'Đã cập nhật nơi lưu backup.' : 'Đã thêm nơi lưu backup.',
      type: 'success',
    });
  };

  const testTarget = async (target: StorageTarget) => {
    setBusyId(target.id);
    try {
      const response = await api.post<{ message: string }>(`/backups/storage-targets/${target.id}/test`);
      await load();
      setToast({ message: response.data.message, type: 'success' });
    } catch (error: any) {
      await load();
      setToast({ message: error?.message || 'Kiểm tra kết nối thất bại.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const connectGoogle = async (target: StorageTarget) => {
    setBusyId(target.id);
    try {
      const response = await api.post<{ authorizationUrl: string }>(
        `/backups/storage-targets/${target.id}/google-drive/authorize`,
      );
      window.location.assign(response.data.authorizationUrl);
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể bắt đầu kết nối Google Drive.', type: 'error' });
      setBusyId('');
    }
  };

  const deleteTarget = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await api.delete<{ message: string }>(`/backups/storage-targets/${deleting.id}`);
      setDeleting(null);
      await load();
      setToast({ message: response.data.message, type: 'success' });
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể xóa nơi lưu.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const reorderTarget = async (target: StorageTarget, direction: 'UP' | 'DOWN') => {
    setBusyId(`reorder-${target.id}`);
    try {
      await api.post(`/backups/storage-targets/${target.id}/reorder`, { direction });
      await load();
      setToast({ message: 'Đã cập nhật thứ tự kho backup.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể đổi thứ tự kho backup.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* 1. Header Tiêu Chuẩn Hệ Thống (CHỈ 1 NÚT PRIMARY CTA "LƯU THAY ĐỔI" DUY NHẤT) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
            Cài đặt hệ thống
          </h1>
          <p className="text-type-helper text-slate-600 dark:text-slate-400 font-normal">
            Cấu hình lịch sao lưu tự động, kho lưu trữ đám mây và chính sách nhật ký kiểm toán.
          </p>
        </div>

        {/* Nút Primary CTA Duy Nhất Cho Toàn Bộ Trang */}
        <Button
          variant="primary"
          size="md"
          leftIcon={<Save className="h-4 w-4" />}
          onClick={() => void saveAllSettings()}
          isLoading={savingAll}
          disabled={loading}
        >
          Lưu thay đổi
        </Button>
      </div>

      {/* 2. DUY NHẤT 1 KHUNG NGUYÊN KHỐI (Monolithic Canvas, Đã xóa toàn bộ nút Lưu con bên trong) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* NỬA TRÁI (Lg: 6/12): Lịch sao lưu + Kho lưu trữ (Phân cách bằng 1 đường kẻ ngang mờ) */}
          <div className="lg:col-span-6 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            
            {/* Phần 1: Lịch sao lưu tự động & Dự phòng (Gọn gàng, không có nút Lưu con) */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                  Lịch sao lưu tự động
                </h2>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                  Cấu hình chu kỳ chạy ngầm và số bản snapshot tối đa.
                </p>
              </div>

              {/* 2 Dấu Tích Checkbox Hiện Đại & Tối Giản */}
              <div className="grid gap-6 sm:grid-cols-2 pt-1">
                {/* Mục 1: Tự động sao lưu định kỳ */}
                <div
                  onClick={() => update('autoBackupEnabled', !settings.autoBackupEnabled)}
                  className="flex items-start gap-3 cursor-pointer select-none group"
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      settings.autoBackupEnabled
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 group-hover:border-slate-400'
                    }`}
                  >
                    {settings.autoBackupEnabled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                      Tự động sao lưu định kỳ
                    </span>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                      Tạo snapshot database theo lịch.
                    </p>
                  </div>
                </div>

                {/* Mục 2: Ghi song song kho dự phòng */}
                <div
                  onClick={() => update('dualStorageEnabled', !settings.dualStorageEnabled)}
                  className="flex items-start gap-3 cursor-pointer select-none group"
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      settings.dualStorageEnabled
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 group-hover:border-slate-400'
                    }`}
                  >
                    {settings.dualStorageEnabled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                      Ghi song song kho dự phòng
                    </span>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                      Đồng bộ sang các kho phụ.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Ô input chia đều 3 cột */}
              <div className="grid gap-4 sm:grid-cols-3 pt-1">
                <label className="space-y-1.5 block">
                  <span className="text-type-helper font-medium text-slate-700 dark:text-slate-300">
                    Chu kỳ (ngày)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.intervalDays}
                    onChange={(e) => update('intervalDays', Math.max(1, Number(e.target.value) || 1))}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-type-helper font-medium text-slate-700 dark:text-slate-300">
                    Giờ chạy
                  </span>
                  <input
                    type="time"
                    value={settings.backupTime}
                    onChange={(e) => update('backupTime', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-type-helper font-medium text-slate-700 dark:text-slate-300">
                    Số bản lưu tối đa
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.maxRetentionCount}
                    onChange={(e) =>
                      update('maxRetentionCount', Math.min(100, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            {/* Phần 2: Kho lưu trữ backup (Chứa nút + Thêm nơi lưu) */}
            <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                      Kho lưu trữ backup ({settings.storageTargets.length})
                    </h2>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                      Kho chính và các điểm đích dự phòng (R2, S3, Drive, Local).
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                  >
                    Thêm nơi lưu
                  </Button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orderedTargets.map((target) => {
                    const liveStatus = statusById.get(target.id);
                    const status = liveStatus?.status || target.lastTestStatus || (target.enabled ? 'STANDBY' : 'STANDBY');
                    const online = status === 'ONLINE';
                    const failed = status === 'ERROR';
                    const priority = target.priority || (target.role === 'PRIMARY' ? 1 : 2);
                    const maxPriority = Math.max(...orderedTargets.map((item) => item.priority || 2), 2);

                    return (
                      <div
                        key={target.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                      >
                        {/* Trái: Icon + Tên */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`rounded-xl p-2.5 shrink-0 ${
                              target.provider === 'LOCAL'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {target.provider === 'LOCAL' ? (
                              <HardDrive className="h-4.5 w-4.5" />
                            ) : (
                              <Cloud className="h-4.5 w-4.5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-type-body font-semibold text-slate-900 dark:text-slate-100">
                                {target.name}
                              </span>
                              <span
                                className={`table-badge ${
                                  priority === 1 ? 'table-badge-info' : 'table-badge-neutral'
                                }`}
                              >
                                {priority === 1 ? 'Chính' : `Phụ ${priority - 1}`}
                              </span>
                            </div>
                            <p className="text-type-helper text-slate-400 font-normal">
                              {providerName[target.provider]}
                            </p>
                          </div>
                        </div>

                        {/* Phải: Trạng thái & Toàn bộ nút chức năng */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
                              ? 'Online'
                              : failed
                              ? 'Lỗi'
                              : target.enabled
                              ? 'Chưa test'
                              : 'Tạm dừng'}
                          </span>
                        </span>

                        {/* Nút Thứ tự Lên/Xuống */}
                        {orderedTargets.length > 1 && (
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Đưa lên"
                              disabled={priority <= 2 || busyId === `reorder-${target.id}`}
                              onClick={() => void reorderTarget(target, 'UP')}
                              icon={<ArrowUp className="h-3.5 w-3.5" />}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Đưa xuống"
                              disabled={priority >= maxPriority || busyId === `reorder-${target.id}`}
                              onClick={() => void reorderTarget(target, 'DOWN')}
                              icon={<ArrowDown className="h-3.5 w-3.5" />}
                            />
                          </div>
                        )}

                        {/* Nút Test kết nối */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Kiểm tra kết nối"
                          onClick={() => void testTarget(target)}
                          disabled={busyId === target.id}
                          icon={
                            <RefreshCw
                              className={`h-3.5 w-3.5 ${busyId === target.id ? 'animate-spin text-blue-600' : ''}`}
                            />
                          }
                        />

                        {/* Nút Kết nối Google OAuth */}
                        {target.provider === 'GOOGLE_DRIVE' && (
                          <Button
                            variant="soft"
                            size="sm"
                            onClick={() => void connectGoogle(target)}
                          >
                            Google
                          </Button>
                        )}

                        {/* Nút Sửa */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Chỉnh sửa kho"
                          onClick={() => {
                            setEditing(target);
                            setModalOpen(true);
                          }}
                          icon={<Edit3 className="h-3.5 w-3.5" />}
                        />

                        {/* Nút Xóa */}
                        {target.role !== 'PRIMARY' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Xóa kho lưu trữ"
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            onClick={() => setDeleting(target)}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {!loading && settings.storageTargets.length === 0 && (
                  <div className="py-6 text-center text-type-helper text-slate-400 font-normal">
                    Chưa cấu hình kho backup.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NỬA PHẢI (Lg: 6/12): Lưu giữ nhật ký kiểm toán (Gọn gàng, không có nút Lưu con) */}
        <div className="lg:col-span-6 flex flex-col justify-between">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                    Lưu giữ nhật ký kiểm toán
                  </h2>
                  {archiveStatus && (
                    <span className="table-badge table-badge-neutral text-type-helper">
                      {archiveStatus.archived} / {archiveStatus.total} archive
                    </span>
                  )}
                </div>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                  Thời hạn dữ liệu nóng, archive và thời gian giữ IP gốc theo từng phân hệ.
                </p>
              </div>

              <div className="ui-table-wrap border-0 shadow-none rounded-none bg-transparent overflow-x-auto">
                <table className="ui-table w-full text-left">
                  <thead className="text-type-label font-medium text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="pb-3 pt-1 font-medium bg-transparent">Phân hệ nghiệp vụ</th>
                      <th className="pb-3 pt-1 font-medium text-center bg-transparent">Nóng (ngày)</th>
                      <th className="pb-3 pt-1 font-medium text-center bg-transparent">Giữ log</th>
                      <th className="pb-3 pt-1 font-medium text-center bg-transparent">Giữ IP gốc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditPolicies.map((policy, index) => (
                      <tr
                        key={policy.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition"
                      >
                        <td className="py-3 text-type-body font-medium text-slate-900 dark:text-slate-100">
                          {auditCategoryLabel[policy.category] || policy.category}
                        </td>
                        {(['hotDays', 'retainDays', 'rawIpDays'] as const).map((field) => (
                          <td key={field} className="py-3 text-center px-1">
                            <input
                              type="number"
                              min={field === 'retainDays' ? 1825 : 1}
                              max={field === 'retainDays' ? 3650 : 365}
                              value={policy[field]}
                              onChange={(event) =>
                                setAuditPolicies((items) =>
                                  items.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, [field]: Number(event.target.value) || 0 }
                                      : item,
                                  ),
                                )
                              }
                              className="h-8.5 w-20 text-center rounded-xl border border-slate-200/90 bg-white px-1.5 text-type-body font-normal tabular-nums outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!loading && auditPolicies.length === 0 && (
                  <p className="py-6 text-center text-type-body text-slate-400">
                    Chưa tải được chính sách lưu giữ.
                  </p>
                )}
              </div>
            </div>

            <p className="border-t border-slate-100 px-5 sm:px-6 py-3 text-type-helper text-slate-400 dark:border-slate-800 font-normal">
              * Log kiểm toán bắt buộc lưu tối thiểu 5 năm (1825 ngày) theo quy định an toàn hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StorageTargetModal
        isOpen={modalOpen}
        target={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
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
