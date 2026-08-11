'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui';
import { ExamPaper } from '../../types';

interface ChangeExamPasswordModalProps {
  isOpen: boolean;
  paper: ExamPaper | null;
  onClose: () => void;
  onSubmit: (paperId: number, newPassword: string, reason?: string) => Promise<void>;
}

export function ChangeExamPasswordModal({
  isOpen,
  paper,
  onClose,
  onSubmit,
}: ChangeExamPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setReason('');
      setShowPassword(false);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !paper) return null;

  const sched = (paper as any).examSchedule || {};
  const subName = (paper as any).subjectName || sched.subjectName || sched.subject?.subjectName || 'Môn thi';
  const subCode = (paper as any).subjectCode || sched.subjectCode || sched.subject?.subjectCode || '';
  const hasPassword = Boolean((paper as any).hasExamPassword || sched.onlineExamConfig?.examPasswordHash);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.trim().length < 4) {
      setError('Mật khẩu mới phải có tối thiểu 4 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(paper.id, newPassword.trim(), reason.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cấu hình / Đổi mật khẩu ca thi">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info card */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-1.5 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="font-sans tabular-nums text-xs font-black text-slate-900 dark:text-slate-100">
              Mã đề: {paper.paperCode}
            </span>
            <span
              className={`inline-flex items-center gap-[6px] text-[14px] leading-5 font-semibold ${
                hasPassword
                  ? 'text-[#15803D] dark:text-emerald-400'
                  : 'text-[#D97706] dark:text-amber-400'
              }`}
            >
              <KeyRound className="h-3 w-3" />
              {hasPassword ? 'Đã cài mật khẩu' : 'Chưa có mật khẩu'}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {subCode ? `[${subCode}] ` : ''}{subName}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input new password */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Mật khẩu thi mới <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu ca thi mới (tối thiểu 4 ký tự)"
              required
              minLength={4}
              maxLength={50}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới để xác nhận"
            required
            minLength={4}
            maxLength={50}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Lý do cập nhật mật khẩu <span className="text-slate-400 font-normal">(Tùy chọn)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Giảng viên cấp lại do sinh viên quên mật khẩu thi"
            maxLength={255}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            leftIcon={<ShieldCheck className="h-4 w-4" />}
          >
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
