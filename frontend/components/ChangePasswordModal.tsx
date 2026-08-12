'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import api from '../lib/api';
import { Modal } from './Modal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const close = () => {
    if (loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) return setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
    if (newPassword.length < 6) return setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (newPassword !== confirmPassword) return setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
    if (currentPassword === newPassword) return setErrorMsg('Mật khẩu mới phải khác mật khẩu hiện tại.');

    setLoading(true);
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
      setSuccessMsg(response.data?.message || 'Đổi mật khẩu thành công.');
      window.setTimeout(close, 1200);
    } catch (error: any) {
      const raw = error?.response?.data?.message || error?.message;
      setErrorMsg(Array.isArray(raw) ? raw.join(', ') : (raw || 'Không thể cập nhật mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3.5 text-[15px] leading-6 font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400';

  return (
    <Modal isOpen={isOpen} onClose={close} title="Đổi mật khẩu tài khoản">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-medium text-blue-900">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu hiện tại.</span>
        </div>

        {errorMsg && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMsg}</span></div>}
        {successMsg && <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{successMsg}</span></div>}

        <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} placeholder="Nhập mật khẩu hiện tại" />
        <PasswordField label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew((v) => !v)} placeholder="Nhập mật khẩu mới" />
        <div className="space-y-1">
          <label className="block text-[15px] font-semibold text-slate-700 dark:text-slate-300">Xác nhận mật khẩu mới <span className="text-rose-500">*</span></label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={close} disabled={loading} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Hủy bỏ</button>
          <button type="submit" disabled={loading} className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-md hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"><KeyRound className="h-3.5 w-3.5" />{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
        </div>
      </form>
    </Modal>
  );
};

function PasswordField({ label, value, onChange, visible, onToggle, placeholder }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-[15px] font-semibold text-slate-700 dark:text-slate-300">{label} <span className="text-rose-500">*</span></label>
      <div className="relative">
        <input type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3.5 pr-10 text-[15px] leading-6 font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400" placeholder={placeholder} autoComplete="new-password" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
    </div>
  );
}
