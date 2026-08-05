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

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100';

  return (
    <Modal isOpen={isOpen} onClose={close} title="Đổi mật khẩu tài khoản">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu hiện tại.</span>
        </div>

        {errorMsg && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMsg}</span></div>}
        {successMsg && <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{successMsg}</span></div>}

        <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} placeholder="Nhập mật khẩu hiện tại" />
        <PasswordField label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew((v) => !v)} placeholder="Nhập mật khẩu mới" />
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={close} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy bỏ</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#1e66f5] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"><KeyRound className="h-4 w-4" />{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
        </div>
      </form>
    </Modal>
  );
};

function PasswordField({ label, value, onChange, visible, onToggle, placeholder }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <input type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" placeholder={placeholder} autoComplete="new-password" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
    </div>
  );
}
