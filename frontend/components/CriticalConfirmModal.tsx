'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Lock, ShieldAlert, KeyRound, X, Eye, EyeOff } from 'lucide-react';
import { FilterSelect } from './ui/FilterSelect';
import { Button } from './ui/Button';

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
  const isExamPasswordValid = examPasswordRequired
    ? examPassword.trim().length >= 4
    : true;
  const isPasswordValid = passwordRequired ? password.trim().length > 0 : true;

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

    if (passwordRequired && !isPasswordValid) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản Admin để xác thực thao tác.');
      return;
    }

    if (examPasswordRequired && examPassword.trim().length < 4) {
      setErrorMsg('Vui lòng nhập mật khẩu thi chính thức (tối thiểu 4 ký tự) ở mục 5.');
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
      setErrorMsg(
        err?.response?.data?.message || err.message || 'Xác thực thất bại. Vui lòng kiểm tra lại mật khẩu.',
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 ease-out"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform">
        {/* Clean Security Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5 space-y-0.5">
              <h3 className="text-[17px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">{title}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Xác thực an toàn bảo mật nhiều lớp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 -mr-1 -mt-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-slate-900">
          <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-0.5">
              <p className="font-semibold text-rose-700 dark:text-rose-300">Cảnh báo hậu quả:</p>
              <p className="leading-relaxed font-medium">{warningMessage}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-3 text-xs font-semibold text-red-700 dark:text-red-300 animate-shake">
              {errorMsg}
            </div>
          )}

          {/* Step 1: Select Reason */}
          <div>
            <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              1. Lý do thực hiện thao tác <span className="text-rose-500">*</span>
            </label>
            <FilterSelect
              containerClassName="w-full"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-[15px] font-medium text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none bg-slate-50/50 dark:bg-slate-800/70 cursor-pointer transition"
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
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:outline-none transition"
              />
            )}
          </div>

          {/* Step 2: Optional Note */}
          <div>
            <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              2. Ghi chú chi tiết <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Nhập bổ sung văn bản chỉ đạo, số quyết định hoặc thông tin liên quan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:outline-none transition"
            />
          </div>

          {/* Step 3: Type Exact Confirmation Phrase */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300">
                3. Nhập cụm từ xác nhận <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 px-2 py-0.5 rounded-lg">
                  {targetPhrase}
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillPhrase}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 px-2 py-0.5 rounded-xl transition cursor-pointer"
                  title="Tự động điền cụm từ xác nhận"
                >
                  Điền nhanh
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder={`Gõ: ${targetPhrase} (hoặc bấm Điền nhanh)`}
              value={inputPhrase}
              onChange={(e) => setInputPhrase(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2 text-[15px] font-medium focus:outline-none transition ${
                isPhraseMatched
                  ? 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:!border-slate-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:!border-rose-500'
              }`}
            />
            {isPhraseMatched && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ Cụm từ xác nhận hợp lệ
              </p>
            )}
          </div>

          {/* Step 4: Account Password Verification */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[15px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>4. Mật khẩu tài khoản của bạn {passwordRequired && <span className="text-rose-500">*</span>}</span>
              </label>
              {!passwordRequired && (
                <span className="text-xs text-slate-400 font-normal">(Tùy chọn nếu đã đăng nhập)</span>
              )}
            </div>
            <input
              type="password"
              required={passwordRequired}
              autoComplete="current-password"
              placeholder={passwordRequired ? 'Nhập mật khẩu Admin hiện tại' : 'Mật khẩu tài khoản (tùy chọn)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:!border-rose-500 focus:outline-none transition"
            />
          </div>

          {/* Step 5: Exam Password (only for publishing official exam paper) */}
          {examPasswordRequired && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>5. Mật khẩu thi chính thức <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type={showExamPassword ? 'text' : 'password'}
                  autoComplete="off"
                  required
                  placeholder="Nhập mật khẩu thi (tối thiểu 4 ký tự)"
                  value={examPassword}
                  onChange={(e) => setExamPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 pr-10 text-[15px] font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:!border-rose-500 focus:outline-none shadow-2xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowExamPassword(!showExamPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-xl transition cursor-pointer"
                >
                  {showExamPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400 leading-relaxed">
                Mật khẩu này dùng cho thí sinh mở đề khi vào phòng thi. Hệ thống tự động mã hóa bảo mật (bcrypt).
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              leftIcon={<Lock className="w-4 h-4" />}
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
