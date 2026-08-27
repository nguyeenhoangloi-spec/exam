'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '../../../../../lib/api';

function targetIdFromState(state: string) {
  try {
    const raw = state.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const encoded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=');
    const bytes = Uint8Array.from(window.atob(encoded), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return String(payload.targetId || '');
  } catch { return ''; }
}

export default function GoogleDriveCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang hoàn tất kết nối Google Drive...');

  useEffect(() => {
    const complete = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || '';
      const state = params.get('state') || '';
      const oauthError = params.get('error');
      const targetId = targetIdFromState(state);
      if (oauthError || !code || !state || !targetId) {
        const reason = oauthError === 'access_denied' ? 'Bạn đã từ chối cấp quyền Google Drive.' : 'Phản hồi Google OAuth không hợp lệ.';
        setStatus('error'); setMessage(reason);
        setTimeout(() => window.location.replace(`/admin/settings?googleDrive=error&message=${encodeURIComponent(reason)}`), 1800);
        return;
      }
      try {
        const response = await api.post<{ message: string }>(`/backups/storage-targets/${targetId}/google-drive/complete`, { code, state });
        setStatus('success'); setMessage(response.data.message);
        setTimeout(() => window.location.replace('/admin/settings?googleDrive=connected'), 1200);
      } catch (error: any) {
        const reason = error?.message || 'Không thể hoàn tất kết nối Google Drive.';
        setStatus('error'); setMessage(reason);
        setTimeout(() => window.location.replace(`/admin/settings?googleDrive=error&message=${encodeURIComponent(reason)}`), 2200);
      }
    };
    void complete();
  }, []);

  return <div className="flex min-h-[70vh] items-center justify-center p-5"><div className="w-full max-w-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">{status === 'loading' ? <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" /> : status === 'success' ? <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" /> : <XCircle className="mx-auto h-9 w-9 text-red-500" />}<h1 className="mt-4 text-type-card font-semibold text-slate-950 dark:text-slate-50">Kết nối Google Drive</h1><p className="mt-2 text-type-body font-medium text-slate-700 dark:text-slate-300">{message}</p></div></div>;
}
