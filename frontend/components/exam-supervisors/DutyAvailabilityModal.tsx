'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, X, ChevronDown, Check } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui';

interface DutyAvailabilityItem {
  id?: number;
  examDate: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  note?: string;
}

interface DutyAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const SHIFT_PRESETS = [
  { id: 'morning', label: 'Ca Sáng', time: '07:30 - 11:30', start: '07:30', end: '11:30' },
  { id: 'afternoon', label: 'Ca Chiều', time: '13:30 - 17:30', start: '13:30', end: '17:30' },
  { id: 'all_day', label: 'Cả ngày', time: '07:30 - 17:30', start: '07:30', end: '17:30' },
];

export function DutyAvailabilityModal({ isOpen, onClose, onSuccess }: DutyAvailabilityModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [availabilities, setAvailabilities] = useState<DutyAvailabilityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [examDate, setExamDate] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'UNAVAILABLE'>('AVAILABLE');
  const [selectedShift, setSelectedShift] = useState<string>('morning');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('11:30');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      void fetchAvailabilities();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setExamDate(tomorrow.toISOString().split('T')[0]);
      setStatus('AVAILABLE');
      setSelectedShift('morning');
      setStartTime('07:30');
      setEndTime('11:30');
      setIsCustomTime(false);
      setNote('');
      setFormError('');
      setActiveTab('form');
    }
  }, [isOpen]);

  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/my-duty-availability');
      setAvailabilities(res.data || []);
    } catch (err: any) {
      console.error('Failed to load duty availability', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShift = (preset: typeof SHIFT_PRESETS[0]) => {
    setSelectedShift(preset.id);
    setIsCustomTime(false);
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDate) {
      setFormError('Vui lòng chọn ngày coi thi.');
      return;
    }
    if (startTime >= endTime) {
      setFormError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await api.patch('/teachers/my-duty-availability', {
        examDate,
        startTime,
        endTime,
        status,
        note: note.trim() || undefined,
      });
      onSuccess(
        status === 'AVAILABLE'
          ? `Đã đăng ký sẵn sàng coi thi ngày ${new Date(examDate).toLocaleDateString('vi-VN')} (${startTime} - ${endTime}).`
          : `Đã ghi nhận báo bận coi thi ngày ${new Date(examDate).toLocaleDateString('vi-VN')} (${startTime} - ${endTime}).`
      );
      await fetchAvailabilities();
      setActiveTab('history');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Lỗi khi lưu đăng ký lịch coi thi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header với Tab lồng mượt mà */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">
              Đăng ký khả năng coi thi
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thanh tab chia đều 50/50 cân đối */}
        <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`py-2.5 px-4 text-center text-type-body-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Đăng ký ca mới
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 text-center text-type-body-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Lịch đã khai báo ({availabilities.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-type-body-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Hàng 1: Ngày coi thi & Loại đăng ký (Chia đôi 1:1 cân đối) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                    Ngày coi thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                    Khả năng coi thi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-3 pr-8 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      <option value="AVAILABLE">Sẵn sàng coi thi</option>
                      <option value="UNAVAILABLE">Báo bận / Vắng</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Hàng 2: Ca coi thi (3 ô cân đối) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                    Ca coi thi <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomTime(!isCustomTime)}
                    className="text-type-helper text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isCustomTime ? 'Dùng ca mặc định' : 'Tùy chỉnh giờ'}
                  </button>
                </div>

                {/* 3 nút ca cân đối */}
                <div className="grid grid-cols-3 gap-2">
                  {SHIFT_PRESETS.map((preset) => {
                    const isSelected = !isCustomTime && selectedShift === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectShift(preset)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200 ring-1 ring-blue-500/20'
                            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-type-body-sm font-semibold">{preset.label}</span>
                        <span className="text-type-helper text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {preset.time}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Khung giờ tùy chỉnh (chỉ mở ra khi người dùng cần) */}
                {isCustomTime && (
                  <div className="grid grid-cols-2 gap-3 pt-1.5">
                    <div>
                      <span className="text-type-helper text-slate-500 dark:text-slate-400 block mb-1">
                        Giờ bắt đầu
                      </span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-type-helper text-slate-500 dark:text-slate-400 block mb-1">
                        Giờ kết thúc
                      </span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Hàng 3: Ghi chú */}
              <div className="space-y-1.5">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 block">
                  Ghi chú / Nguyện vọng
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Ưu tiên coi thi tòa A, có việc bận sau 17h..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={submitting}>
                  Đóng
                </Button>
                <Button
                  type="submit"
                  variant={status === 'AVAILABLE' ? 'primary' : 'danger'}
                  size="md"
                  isLoading={submitting}
                >
                  {status === 'AVAILABLE' ? 'Lưu lịch sẵn sàng' : 'Xác nhận báo bận'}
                </Button>
              </div>
            </form>
          ) : (
            /* Tab Lịch sử khai báo */
            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-500 text-type-body-sm">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                  <p>Đang tải danh sách...</p>
                </div>
              ) : availabilities.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-type-body-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có lịch khai báo nào
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  {availabilities.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                            {new Date(item.examDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-type-helper text-slate-500 dark:text-slate-400">
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        {item.note && (
                          <div className="text-type-helper text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.note}
                          </div>
                        )}
                      </div>

                      <span
                        className={`ui-pill inline-flex items-center rounded-full border px-2 py-0.5 text-type-helper font-medium shrink-0 ${
                          item.status === 'AVAILABLE'
                            ? 'border-emerald-400 bg-transparent text-emerald-700 dark:border-emerald-600 dark:text-emerald-400'
                            : 'border-rose-400 bg-transparent text-rose-700 dark:border-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Báo bận'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
