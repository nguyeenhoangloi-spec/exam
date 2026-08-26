'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SecurityAuditRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/activity-logs?tab=security');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="flex items-center gap-3 text-type-body font-medium text-slate-600 dark:text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span>Đang chuyển hướng sang Nhật ký & kiểm toán...</span>
      </div>
    </div>
  );
}
