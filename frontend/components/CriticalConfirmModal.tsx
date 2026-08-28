'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Lock, ShieldAlert, KeyRound, X, Eye, EyeOff, Check } from 'lucide-react';
import { FilterSelect } from './ui/FilterSelect';
import { Button } from './ui/Button';
import { getUserErrorMessage } from '../lib/error-message';

export interface CriticalConfirmPayload {
  reason: string;
  note?: string;
  confirmPhrase: string;
  password: string;
  /** Mật khẩu thi chính thức (chỉ dùng khi phát hành đề thi OFFICIAL) */
  examPassword?: string;
}

interface CriticalConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  warningMessage: string;
  confirmPhrase: string; // E.g. "KHOA DIEM", "PHAT HANH DE THI", "KHOA KY THI"
  reasons?: string[];
  actionButtonText?: string;
  /** Khi true, bắt buộc xác thực lại mật khẩu tài khoản trước thao tác nhạy cảm. */
  passwordRequired?: boolean;
  /** Khi true, hiển thị thêm ô "Mật khẩu thi" bắt buộc (dùng cho phát hành đề thi chính thức) */
  examPasswordRequired?: boolean;
  onConfirm: (payload: CriticalConfirmPayload) => Promise<void> | void;
}

const DEFAULT_REASONS = [
  'Tuân thủ quy định quản lý khảo thí',
  'Hoàn tất công tác chấm thi và tổng hợp',
  'Phát hiện sai sót dữ liệu cần xử lý',
  'Yêu cầu theo chỉ đạo của Ban Giám hiệu',
  'Lý do khác',
];

export const CriticalConfirmModal: React.FC<CriticalConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  warningMessage,
  confirmPhrase,
  reasons = DEFAULT_REASONS,
  actionButtonText = 'Xác nhận',
  passwordRequired = false,
  examPasswordRequired = false,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState(reasons[0] || DEFAULT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [note, setNote] = useState('');
  const [inputPhrase, setInputPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [examPassword, setExamPassword] = useState('');
  const [showExamPassword, setShowExamPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const targetPhrase = confirmPhrase.trim().toUpperCase();

  // Helper strip vietnamese diacritics for flexible matching
  const normalizeStr = (str: string) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .toUpperCase();

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(reasons[0] || DEFAULT_REASONS[0]);
      setCustomReason('');
      setNote('');
      setInputPhrase('');
      setPassword('');
      setExamPassword('');
      setShowExamPassword(false);
      setErrorMsg('');
      setLoading(false);
    }
  }, [isOpen, reasons]);

  if (!isOpen || !mounted) return null;

  const isPhraseMatched = normalizeStr(inputPhrase) === normalizeStr(targetPhrase);
  const isReasonValid = Boolean(
    selectedReason !== 'Lý do khác' ? selectedReason.trim() : customReason.trim(),
  );

  const handleQuickFillPhrase = () => {
    setInputPhrase(confirmPhrase);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isReasonValid) {
      setErrorMsg('Vui lòng chọn hoặc nhập lý do thực hiện thao tác.');
      return;
    }

    if (!isPhraseMatched) {
      setErrorMsg(`Cụm từ xác nhận chưa chính xác. Vui lòng gõ "${targetPhrase}" (hoặc bấm nút Điền nhanh).`);
      return;
    }

    if (passwordRequired && (!password || password.trim().length === 0)) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản Admin để xác thực thao tác.');
      return;
    }

    if (examPasswordRequired && examPassword.trim().length < 4) {
      setErrorMsg('Vui lòng nhập mật khẩu thi chính thức (tối thiểu 4 ký tự).');
      return;
    }

    const finalReason = selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason;

    try {
      setLoading(true);
      await onConfirm({
        reason: finalReason,
        note: note.trim() || undefined,
        confirmPhrase: inputPhrase.trim().toUpperCase(),
        password,
        examPassword: examPasswordRequired ? examPassword.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(getUserErrorMessage(err, 'Xác thực thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center bg-slate-950/60 p-3 overscroll-contain backdrop-blur-sm animate-modal-backdrop sm:p-4"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col max-h-[calc(100dvh-1.5rem)] animate-modal-dialog will-change-transform sm:max-h-[calc(100dvh-2rem)]">
        {/* Clean Security Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5 space-y-0.5">
              <h3 className="text-type-card font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">{title}</h3>
              <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400">Xác thực an toàn bảo mật nhiều lớp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 -mr-1 -mt-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1 bg-white dark:bg-slate-900">
            {/* Warning Callout Banner */}
            <div className="rounded-xl bg-rose-50/70 border border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-900/50 p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-type-helper text-rose-900 dark:text-rose-200 space-y-0.5">
                <p className="font-semibold text-rose-700 dark:text-rose-300">Cảnh báo hậu quả:</p>
                <p className="leading-relaxed font-normal">{warningMessage}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-3 text-type-helper font-semibold text-red-700 dark:text-red-300 animate-shake">
                {errorMsg}
              </div>
            )}

            {/* 1. Reason Select */}
            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                Lý do thực hiện thao tác <span className="text-rose-500">*</span>
              </label>
              <FilterSelect
                containerClassName="w-full"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none bg-slate-50/50 dark:bg-slate-800/70 cursor-pointer transition shadow-2xs"
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </FilterSelect>
              {selectedReason === 'Lý do khác' && (
                <input
                  type="text"
                  placeholder="Nhập lý do cụ thể..."
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:outline-none transition shadow-2xs mt-1.5"
                />
              )}
            </div>

            {/* 2. Note Input (compact 1 line) */}
            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                Ghi chú chi tiết <span className="text-type-helper text-slate-400 font-normal">(Tùy chọn)</span>
              </label>
              <input
                type="text"
                placeholder="Văn bản chỉ đạo, số quyết định hoặc thông tin liên quan..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:outline-none transition bg-white dark:bg-slate-900 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* 3. Confirm Phrase */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                  Nhập cụm từ xác nhận <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 text-type-helper">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 tracking-wide">
                    {targetPhrase}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleQuickFillPhrase}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    title="Tự động điền cụm từ xác nhận"
                  >
                    Điền nhanh
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={`Gõ: ${targetPhrase} (hoặc bấm Điền nhanh)`}
                  value={inputPhrase}
                  onChange={(e) => setInputPhrase(e.target.value)}
                  className={`w-full h-10 rounded-xl border px-3.5 text-type-body font-medium focus:outline-none transition shadow-2xs ${
                    isPhraseMatched
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 focus:!border-emerald-500 pr-10 font-semibold'
                      : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:!border-rose-500'
                  }`}
                />
                {isPhraseMatched && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-emerald-600 dark:text-emerald-400" title="Đã khớp chính xác">
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Account Password (chỉ hiển thị khi bắt buộc) */}
            {passwordRequired && (
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mật khẩu tài khoản Admin <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu tài khoản của bạn để xác thực"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:!border-rose-500 focus:outline-none transition shadow-2xs"
                />
              </div>
            )}

            {/* 5. Exam Password (if required) */}
            {examPasswordRequired && (
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mật khẩu thi chính thức <span className="text-rose-500">*</span></span>
                  <span className="text-type-helper text-slate-400 font-normal">(Thí sinh dùng khi mở đề)</span>
                </label>
                <div className="relative">
                  <input
                    type={showExamPassword ? 'text' : 'password'}
                    autoComplete="off"
                    required
                    placeholder="Nhập mật khẩu ca thi (tối thiểu 4 ký tự)"
                    value={examPassword}
                    onChange={(e) => setExamPassword(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 px-3.5 pr-10 text-type-body font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:!border-rose-500 focus:outline-none shadow-2xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExamPassword(!showExamPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-xl transition cursor-pointer"
                    title={showExamPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showExamPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={loading}
              className="min-w-[120px]"
              leftIcon={<ShieldAlert className="w-4 h-4" />}
            >
              {actionButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
