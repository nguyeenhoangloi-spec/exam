'use client';

import React, { useState, useEffect } from 'react';
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

export const CriticalConfirmModal: React.FC<CriticalConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  warningMessage,
  confirmPhrase,
  reasons = [
    'Tuân thủ quy định quản lý khảo thí',
    'Hoàn tất công tác chấm thi và tổng hợp',
    'Phát hiện sai sót dữ liệu cần xử lý',
    'Yêu cầu theo chỉ đạo của Ban Giám hiệu',
    'Lý do khác',
  ],
  actionButtonText = 'Xác Nhận & Thực Hiện',
  examPasswordRequired = false,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState(reasons[0] || '');
  const [customReason, setCustomReason] = useState('');
  const [note, setNote] = useState('');
  const [inputPhrase, setInputPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [examPassword, setExamPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const targetPhrase = confirmPhrase.trim().toUpperCase();

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(reasons[0] || '');
      setCustomReason('');
      setNote('');
      setInputPhrase('');
      setPassword('');
      setExamPassword('');
      setErrorMsg('');
      setLoading(false);
    }
  }, [isOpen, reasons]);

  if (!isOpen) return null;

  const isPhraseMatched = inputPhrase.trim().toUpperCase() === targetPhrase;
  const isReasonValid = Boolean(
    selectedReason !== 'Lý do khác' ? selectedReason.trim() : customReason.trim(),
  );
  const isExamPasswordValid = examPasswordRequired
    ? examPassword.trim().length >= 4
    : true;
  const canSubmit =
    isPhraseMatched && isReasonValid && Boolean(password.trim()) && isExamPasswordValid && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isReasonValid) {
      setErrorMsg('Vui lòng chọn hoặc nhập lý do thực hiện thao tác.');
      return;
    }

    if (!isPhraseMatched) {
      setErrorMsg(`Cụm từ xác nhận chưa chính xác. Vui lòng gõ đúng "${targetPhrase}".`);
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản của bạn để xác thực.');
      return;
    }

    if (examPasswordRequired && examPassword.trim().length < 4) {
      setErrorMsg('Vui lòng nhập mật khẩu thi (tối thiểu 4 ký tự) để phát hành đề thi chính thức.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-rose-100 flex flex-col max-h-[90vh]">
        {/* Header Alert Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{title}</h3>
              <p className="text-xs text-rose-100 font-medium">Xác thực an toàn nhiều lớp (Local Security)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="rounded-xl bg-rose-50/80 border border-rose-200/80 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <p className="font-bold">CẢNH BÁO HẬU QUẢ:</p>
              <p className="leading-relaxed">{warningMessage}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-100 border border-red-200 p-3 text-xs font-semibold text-red-700 animate-shake">
              ⚠️ {errorMsg}
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none bg-slate-50/50"
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
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Step 3: Type Exact Confirmation Phrase */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-600">
                3. Nhập cụm từ xác nhận <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {targetPhrase}
              </span>
            </div>
            <input
              type="text"
              required
              placeholder={`Gõ đúng chữ: ${targetPhrase}`}
              value={inputPhrase}
              onChange={(e) => setInputPhrase(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2 text-xs font-bold focus:outline-none transition ${isPhraseMatched
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                : 'border-slate-200 focus:border-rose-500'
                }`}
            />
            {isPhraseMatched && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                ✓ Cụm từ xác nhận khớp đúng
              </p>
            )}
          </div>

          {/* Step 4: Account Password Verification */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              4. Mật khẩu tài khoản của bạn <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Nhập mật khẩu hiện tại để xác nhận quyền hạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Step 5: Exam Password (only for publishing official exam paper) */}
          {examPasswordRequired && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <label className="block text-xs font-bold uppercase text-blue-700 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                5. Mật khẩu thi chính thức <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                autoComplete="off"
                required
                placeholder="Nhập mật khẩu thi (tối thiểu 4 ký tự)"
                value={examPassword}
                onChange={(e) => setExamPassword(e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-3.5 py-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] font-medium text-blue-700/80 leading-relaxed">
                Mật khẩu này sẽ được cấp cho sinh viên để nhập trước khi vào thi chính thức.
                Hệ thống lưu dạng bảo mật (bcrypt) và không ai xem lại được sau khi lưu.
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-5 py-2 rounded-xl text-white font-bold text-xs transition shadow-md flex items-center gap-2 ${canSubmit
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực Backend...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{actionButtonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

