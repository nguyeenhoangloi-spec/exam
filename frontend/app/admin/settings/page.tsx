'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { Button } from '../../../components/ui/Button';
import api from '../../../lib/api';
import { CalendarClock, DatabaseBackup, FolderOpen, HardDrive, Save, ShieldCheck } from 'lucide-react';

type BackupSettings = {
  autoBackupEnabled: boolean;
  intervalDays: number;
  backupTime: string;
  maxRetentionCount: number;
  dualStorageEnabled: boolean;
  primaryPath: string;
  secondaryPath: string;
};

type StorageStatus = {
  primary?: { path: string; status: string; isAvailable: boolean };
  secondary?: { path: string; status: string; isAvailable: boolean };
};

const defaults: BackupSettings = {
  autoBackupEnabled: true,
  intervalDays: 1,
  backupTime: '02:00',
  maxRetentionCount: 10,
  dualStorageEnabled: true,
  primaryPath: 'backup-runtime/primary',
  secondaryPath: 'backup-runtime/mirror_backup',
};

export default function SystemSettingsPage() {
  usePageTitle('Cài đặt hệ thống');
  const [settings, setSettings] = useState<BackupSettings>(defaults);
  const [storage, setStorage] = useState<StorageStatus>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [settingsResponse, overviewResponse] = await Promise.all([
        api.get<BackupSettings>('/backups/settings'),
        api.get<{ storage?: StorageStatus }>('/backups/overview', { params: { noCache: true } }),
      ]);
      setSettings({ ...defaults, ...settingsResponse.data });
      setStorage(overviewResponse.data.storage || {});
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể tải cài đặt hệ thống.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = <K extends keyof BackupSettings>(key: K, value: BackupSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.put('/backups/settings', settings);
      await load();
      setToast({ message: 'Đã lưu và áp dụng cài đặt backup.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error?.message || 'Không thể lưu cài đặt backup.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-12 sm:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-type-body font-semibold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Cài đặt hệ thống
          </div>
          <h1 className="text-type-page font-semibold tracking-tight text-slate-950 dark:text-slate-50">Cấu hình sao lưu</h1>
          <p className="mt-1 text-type-body text-slate-700 dark:text-slate-300">
            Quản lý lịch chạy, số bản lưu và vị trí backup mà không cần sửa file môi trường.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading || saving}>
          Làm mới
        </Button>
      </div>

      <form onSubmit={save} className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><CalendarClock className="h-5 w-5" /></div>
            <div><h2 className="text-type-section font-semibold text-slate-950 dark:text-slate-50">Lịch sao lưu tự động</h2><p className="text-type-helper text-slate-700 dark:text-slate-300">Worker sẽ đọc cấu hình mới theo từng phút.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <span><span className="block text-type-body font-medium text-slate-950 dark:text-slate-50">Tự động sao lưu</span><span className="text-type-helper text-slate-700 dark:text-slate-300">Bật lịch backup định kỳ</span></span>
              <input type="checkbox" checked={settings.autoBackupEnabled} onChange={(e) => update('autoBackupEnabled', e.target.checked)} className="h-5 w-5 accent-blue-600" />
            </label>
            <label className="space-y-1.5"><span className="block text-type-body font-medium text-slate-950 dark:text-slate-50">Chu kỳ (ngày)</span><input type="number" min={1} max={365} value={settings.intervalDays} onChange={(e) => update('intervalDays', Math.max(1, Number(e.target.value) || 1))} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" /></label>
            <label className="space-y-1.5"><span className="block text-type-body font-medium text-slate-950 dark:text-slate-50">Giờ chạy</span><input type="time" value={settings.backupTime} onChange={(e) => update('backupTime', e.target.value)} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" /><span className="text-type-helper text-slate-700 dark:text-slate-300">Múi giờ: Asia/Ho_Chi_Minh</span></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><DatabaseBackup className="h-5 w-5" /></div><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-slate-50">Chính sách lưu giữ</h2><p className="text-type-helper text-slate-700 dark:text-slate-300">Các bản cũ sẽ được dọn sau khi backup mới hoàn tất.</p></div></div>
          <label className="block max-w-sm space-y-1.5"><span className="block text-type-body font-medium text-slate-950 dark:text-slate-50">Số bản backup tối đa</span><input type="number" min={1} max={100} value={settings.maxRetentionCount} onChange={(e) => update('maxRetentionCount', Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" /></label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><HardDrive className="h-5 w-5" /></div><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-slate-50">Vị trí lưu trữ</h2><p className="text-type-helper text-slate-700 dark:text-slate-300">Đường dẫn được lưu ở cấu hình runtime của hệ thống.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5"><span className="flex items-center gap-2 text-type-body font-medium text-slate-950 dark:text-slate-50"><FolderOpen className="h-4 w-4 text-blue-600" />Kho chính</span><input value={settings.primaryPath} onChange={(e) => update('primaryPath', e.target.value)} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50" placeholder="backup-runtime/primary" /><span className="text-type-helper text-slate-700 dark:text-slate-300">Không dùng thư mục gốc hoặc thư mục ứng dụng.</span></label>
            <label className="space-y-1.5"><span className="flex items-center gap-2 text-type-body font-medium text-slate-950 dark:text-slate-50"><FolderOpen className="h-4 w-4 text-emerald-600" />Kho dự phòng</span><input value={settings.secondaryPath} onChange={(e) => update('secondaryPath', e.target.value)} disabled={!settings.dualStorageEnabled} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:disabled:bg-slate-950" placeholder="backup-runtime/mirror_backup" /></label>
          </div>
          <label className="mt-5 flex max-w-md items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><span><span className="block text-type-body font-medium text-slate-950 dark:text-slate-50">Lưu trữ kép</span><span className="text-type-helper text-slate-700 dark:text-slate-300">Nhân bản snapshot sang kho dự phòng</span></span><input type="checkbox" checked={settings.dualStorageEnabled} onChange={(e) => update('dualStorageEnabled', e.target.checked)} className="h-5 w-5 accent-blue-600" /></label>
          <div className="mt-4 grid gap-3 text-type-helper md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-200">Kho chính: <strong>{storage.primary?.status || 'Chưa kiểm tra'}</strong></div><div className="rounded-xl bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-200">Kho dự phòng: <strong>{storage.secondary?.status || 'Chưa kiểm tra'}</strong></div></div>
        </section>

        <div className="flex justify-end"><Button type="submit" variant="primary" leftIcon={<Save className="h-4 w-4" />} isLoading={saving} disabled={loading}>Lưu cài đặt</Button></div>
      </form>
    </div>
  );
}
