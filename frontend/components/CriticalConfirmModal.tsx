'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Lock, ShieldAlert, KeyRound, X } from 'lucide-react';

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
  examPasswordRequired = false,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState(reasons[0] || DEFAULT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [note, setNote] = useState('');
  const [inputPhrase, setInputPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [examPassword, setExamPassword] = useState('');
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header Alert Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[20px] font-semibold text-white tracking-tight leading-none">{title}</h3>
              <p className="text-[13px] font-semibold text-rose-100 mt-1">Xác thực an toàn nhiều lớp (Local Security)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="rounded-xl bg-rose-50/90 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <p className="font-extrabold uppercase">CẢNH BÁO HẬU QUẢ:</p>
              <p className="leading-relaxed font-medium">{warningMessage}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 animate-shake">
              {errorMsg}
            </div>
          )}

          {/* Step 1: Select Reason */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              1. Lý do thực hiện thao tác <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-blue-500 focus:bg-white focus:outline-none bg-slate-50/50 cursor-pointer transition"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {selectedReason === 'Lý do khác' && (
              <input
                type="text"
                placeholder="Nhập lý do cụ thể..."
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none transition"
              />
            )}
          </div>

          {/* Step 2: Optional Note */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              2. Ghi chú chi tiết (Tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Nhập bổ sung văn bản chỉ đạo, số quyết định hoặc thông tin liên quan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Step 3: Type Exact Confirmation Phrase */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[15px] font-medium text-[#0F172A]">
                3. Nhập cụm từ xác nhận <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md">
                  {targetPhrase}
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillPhrase}
                  className="text-[13px] font-semibold text-blue-600 hover:bg-blue-50 px-2.5 py-0.5 rounded-md transition cursor-pointer"
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
              className={`w-full rounded-xl border px-3.5 py-2 text-[15px] font-medium focus:outline-none transition ${isPhraseMatched
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                : 'border-slate-200 text-[#0F172A] focus:border-blue-500'
                }`}
            />
            {isPhraseMatched && (
              <p className="mt-1 text-[13px] font-semibold text-emerald-600 flex items-center gap-1">
                Cụm từ xác nhận hợp lệ
              </p>
            )}
          </div>

          {/* Step 4: Account Password Verification (Optional if logged in) */}
          <div>
            <label className="block text-[15px] font-medium text-[#0F172A] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <KeyRound className="w-4 h-4 text-[#64748B]" />
                4. Mật khẩu tài khoản của bạn
              </span>
              <span className="text-[13px] text-[#64748B] font-normal">(Tùy chọn nếu đã đăng nhập)</span>
            </label>
            <input
              type="password"
              placeholder="Mật khẩu tài khoản (tùy chọn)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Step 5: Exam Password (only for publishing official exam paper) */}
          {examPasswordRequired && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-2">
              <label className="block text-[15px] font-medium text-[#0F172A] flex items-center gap-1">
                <Lock className="w-4 h-4 text-blue-600" />
                5. Mật khẩu thi chính thức <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                autoComplete="off"
                required
                placeholder="Nhập mật khẩu thi (tối thiểu 4 ký tự)"
                value={examPassword}
                onChange={(e) => setExamPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] font-medium text-[#0F172A] bg-white focus:border-blue-500 focus:outline-none shadow-2xs transition"
              />
              <p className="text-[13px] font-normal text-[#64748B] leading-relaxed">
                Mật khẩu này sẽ được cấp cho sinh viên để nhập trước khi vào thi chính thức.
                Hệ thống lưu dạng bảo mật (bcrypt) và không ai xem lại được sau khi lưu.
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-[38px] px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-sm font-medium transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`h-[38px] px-4 rounded-lg text-white font-medium text-sm transition flex items-center gap-2 cursor-pointer ${
                loading ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed' : 'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{actionButtonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
