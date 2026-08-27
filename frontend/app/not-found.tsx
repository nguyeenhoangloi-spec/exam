'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl p-8 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-xs">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-type-helper font-medium px-2.5 py-1 ui-pill rounded-full text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-block">
            Mã lỗi: 404 Not Found
          </span>
          <h1 className="text-type-section font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Không tìm thấy trang yêu cầu
          </h1>
          <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            Trang bạn đang truy cập không tồn tại, đã bị xóa hoặc đã chuyển sang đường dẫn khác trên hệ thống.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Quay lại
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
