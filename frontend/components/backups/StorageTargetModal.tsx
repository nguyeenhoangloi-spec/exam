'use client';

import { useEffect, useState } from 'react';
import { Cloud, FolderOpen, HardDrive, Save } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';

export type StorageProvider = 'LOCAL' | 'R2' | 'B2' | 'S3' | 'WASABI' | 'MINIO' | 'GOOGLE_DRIVE';
export type StorageRole = 'PRIMARY' | 'MIRROR';

export type StorageTarget = {
  id: string;
  name: string;
  provider: StorageProvider;
  role: StorageRole;
  priority: number;
  enabled: boolean;
  config: {
    path?: string; endpoint?: string; region?: string; bucket?: string; prefix?: string;
    accountId?: string; accessKeyId?: string; hasSecretAccessKey?: boolean;
    forcePathStyle?: boolean; serverSideEncryption?: boolean;
    clientId?: string; hasClientSecret?: boolean; googleConnected?: boolean; folderId?: string;
  };
  lastTestedAt?: string;
  lastTestStatus?: 'ONLINE' | 'ERROR';
  lastTestMessage?: string;
};

export type StorageTargetPayload = {
  name: string;
  provider: StorageProvider;
  role: StorageRole;
  priority?: number;
  enabled: boolean;
  config: Record<string, string | boolean | undefined>;
};

const providers: Array<{ value: StorageProvider; label: string; hint: string }> = [
  { value: 'LOCAL', label: 'Local / NAS', hint: 'Ổ đĩa hoặc thư mục mạng' },
  { value: 'R2', label: 'Cloudflare R2', hint: 'S3-compatible, không phí egress' },
  { value: 'B2', label: 'Backblaze B2', hint: 'S3-compatible, lưu trữ giá thấp' },
  { value: 'S3', label: 'Amazon S3', hint: 'Dịch vụ lưu trữ AWS' },
  { value: 'WASABI', label: 'Wasabi', hint: 'S3-compatible dung lượng lớn' },
  { value: 'MINIO', label: 'MinIO', hint: 'Object storage tự quản lý' },
  { value: 'GOOGLE_DRIVE', label: 'Google Drive', hint: 'Kết nối bằng tài khoản Google' },
];

const fieldClass = 'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-type-body font-medium text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50';
const labelClass = 'space-y-1.5 text-type-body font-medium text-slate-900 dark:text-slate-100';

function defaults(provider: StorageProvider): StorageTargetPayload['config'] {
  if (provider === 'LOCAL') return { path: 'backup-runtime/mirror_backup', prefix: 'exam-system' };
  if (provider === 'R2') return { region: 'auto', prefix: 'exam-system', serverSideEncryption: true };
  if (provider === 'WASABI') return { region: 'ap-southeast-1', prefix: 'exam-system', serverSideEncryption: true };
  if (provider === 'S3') return { region: 'ap-southeast-1', prefix: 'exam-system', serverSideEncryption: true };
  if (provider === 'MINIO') return { region: 'us-east-1', prefix: 'exam-system', forcePathStyle: true };
  if (provider === 'B2') return { region: 'us-west-004', prefix: 'exam-system' };
  return { prefix: 'exam-system', folderId: 'root' };
}

export function StorageTargetModal({
  isOpen, target, onClose, onSave,
}: {
  isOpen: boolean;
  target?: StorageTarget | null;
  onClose: () => void;
  onSave: (payload: StorageTargetPayload) => Promise<void>;
}) {
  const [provider, setProvider] = useState<StorageProvider>('LOCAL');
  const [name, setName] = useState('Kho dự phòng');
  const [role, setRole] = useState<StorageRole>('MIRROR');
  const [enabled, setEnabled] = useState(true);
  const [config, setConfig] = useState<StorageTargetPayload['config']>(defaults('LOCAL'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (target) {
      setProvider(target.provider); setName(target.name); setRole(target.role); setEnabled(target.enabled);
      setConfig({ ...target.config, secretAccessKey: undefined, clientSecret: undefined });
    } else {
      setProvider('LOCAL'); setName('Kho dự phòng'); setRole('MIRROR'); setEnabled(true); setConfig(defaults('LOCAL'));
    }
    setError('');
  }, [isOpen, target]);

  const updateProvider = (value: StorageProvider) => {
    setProvider(value);
    setConfig(defaults(value));
    setName(providers.find((item) => item.value === value)?.label || 'Nơi lưu backup');
  };
  const update = (key: string, value: string | boolean) => setConfig((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const cleanConfig = Object.fromEntries(Object.entries(config).filter(([, value]) => value !== '' && value !== undefined));
      await onSave({ name: name.trim(), provider, role, enabled, config: cleanConfig });
      onClose();
    } catch (err: any) { setError(err?.message || 'Không thể lưu nơi lưu backup.'); }
    finally { setSaving(false); }
  };

  const isS3 = !['LOCAL', 'GOOGLE_DRIVE'].includes(provider);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={target ? 'Chỉnh sửa nơi lưu' : 'Thêm nơi lưu backup'} size="2xl" icon={provider === 'LOCAL' ? <HardDrive className="h-5 w-5" /> : <Cloud className="h-5 w-5" />}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>Nhà cung cấp
            <select value={provider} disabled={Boolean(target)} onChange={(e) => updateProvider(e.target.value as StorageProvider)} className={fieldClass}>
              {providers.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.hint}</option>)}
            </select>
          </label>
          <label className={labelClass}>Tên hiển thị
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} maxLength={80} required />
          </label>
          <label className={labelClass}>Vai trò
            <select value={role} onChange={(e) => setRole(e.target.value as StorageRole)} className={fieldClass}>
              <option value="PRIMARY">Kho chính (ưu tiên 1)</option><option value="MIRROR">Kho dự phòng (xếp sau kho chính)</option>
            </select>
          </label>
          <label className="flex h-10 items-center justify-between self-end rounded-xl border border-slate-200 px-3 text-type-body font-medium dark:border-slate-700">
            Kích hoạt kết nối <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-blue-600" />
          </label>
        </div>

        {provider === 'LOCAL' && <label className={labelClass}>Đường dẫn thư mục
          <div className="relative"><FolderOpen className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={String(config.path || '')} onChange={(e) => update('path', e.target.value)} className={`${fieldClass} pl-9`} placeholder="D:/exam-backups" required /></div>
        </label>}

        {isS3 && <div className="grid gap-3 sm:grid-cols-2">
          {provider === 'R2' && <label className={labelClass}>Cloudflare Account ID<input value={String(config.accountId || '')} onChange={(e) => update('accountId', e.target.value)} className={fieldClass} placeholder="Account ID" required={!config.endpoint} /></label>}
          {['B2', 'MINIO'].includes(provider) && <label className={labelClass}>Endpoint<input value={String(config.endpoint || '')} onChange={(e) => update('endpoint', e.target.value)} className={fieldClass} placeholder={provider === 'B2' ? 'https://s3.us-west-004.backblazeb2.com' : 'https://minio.example.edu'} required /></label>}
          <label className={labelClass}>Bucket<input value={String(config.bucket || '')} onChange={(e) => update('bucket', e.target.value)} className={fieldClass} required /></label>
          <label className={labelClass}>Region<input value={String(config.region || '')} onChange={(e) => update('region', e.target.value)} className={fieldClass} required /></label>
          <label className={labelClass}>Access Key ID<input value={String(config.accessKeyId || '')} onChange={(e) => update('accessKeyId', e.target.value)} className={fieldClass} required /></label>
          <label className={labelClass}>Secret Access Key<input type="password" value={String(config.secretAccessKey || '')} onChange={(e) => update('secretAccessKey', e.target.value)} className={fieldClass} placeholder={target?.config.hasSecretAccessKey ? 'Để trống nếu không thay đổi' : 'Nhập secret key'} required={!target?.config.hasSecretAccessKey} /></label>
        </div>}

        {provider === 'GOOGLE_DRIVE' && <div className="space-y-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-type-helper font-medium text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">Lưu Client ID và Client Secret trước. Sau đó dùng nút “Kết nối Google” ở danh sách để cấp quyền OAuth.</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Google OAuth Client ID<input value={String(config.clientId || '')} onChange={(e) => update('clientId', e.target.value)} className={fieldClass} required /></label>
            <label className={labelClass}>Google OAuth Client Secret<input type="password" value={String(config.clientSecret || '')} onChange={(e) => update('clientSecret', e.target.value)} className={fieldClass} placeholder={target?.config.hasClientSecret ? 'Để trống nếu không thay đổi' : 'Nhập client secret'} required={!target?.config.hasClientSecret} /></label>
            <label className={labelClass}>ID thư mục Drive<input value={String(config.folderId || 'root')} onChange={(e) => update('folderId', e.target.value)} className={fieldClass} placeholder="root" /></label>
          </div>
        </div>}

        {provider !== 'LOCAL' && <label className={labelClass}>Tiền tố thư mục<input value={String(config.prefix || '')} onChange={(e) => update('prefix', e.target.value)} className={fieldClass} placeholder="exam-system" /></label>}
        {error && <div className="rounded-xl border border-red-200 bg-red-100 px-3 py-2 text-type-body font-semibold text-red-700">{error}</div>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" variant="primary" leftIcon={<Save className="h-4 w-4" />} isLoading={saving}>Lưu nơi lưu</Button>
        </div>
      </form>
    </Modal>
  );
}
