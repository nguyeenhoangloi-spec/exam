'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';

interface SchedulePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: any[];
  selectedScheduleId: string;
  onSelectSchedule: (scheduleId: number) => void;
}

export function SchedulePickerModal({
  isOpen,
  onClose,
  schedules,
  selectedScheduleId,
  onSelectSchedule,
}: SchedulePickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'EXPIRED'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveTab('ALL');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isScheduleExpired = (s: any) => {
    if (['COMPLETED', 'CANCELLED', 'LOCKED'].includes(s?.status)) return true;
    if (!s?.examDate) return false;
    try {
      const scheduleEnd = new Date(s.examDate);
      if (s.endTime) {
        const [h, m] = s.endTime.split(':').map(Number);
        scheduleEnd.setHours(h || 23, m || 59, 0, 0);
      } else {
        scheduleEnd.setHours(23, 59, 59, 999);
      }
      return scheduleEnd.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const getSupervisionStats = (s: any) => {
    const rooms = s.examScheduleRooms || [];
    const totalRooms = rooms.length;
    const required = totalRooms * 2;
    const assigned = rooms.reduce(
      (acc: number, r: any) => acc + (r._count?.supervisors || r.supervisors?.length || 0),
      0
    );
    const isFull = totalRooms > 0 && assigned >= required;
    return { totalRooms, required, assigned, isFull };
  };

  const pendingList = schedules.filter((s) => !isScheduleExpired(s) && !getSupervisionStats(s).isFull);
  const completedList = schedules.filter((s) => !isScheduleExpired(s) && getSupervisionStats(s).isFull);
  const expiredList = schedules.filter((s) => isScheduleExpired(s));

  const filteredSchedules = schedules.filter((s) => {
    const isExpired = isScheduleExpired(s);
    const { isFull } = getSupervisionStats(s);

    if (activeTab === 'PENDING' && (isExpired || isFull)) return false;
    if (activeTab === 'COMPLETED' && (isExpired || !isFull)) return false;
    if (activeTab === 'EXPIRED' && !isExpired) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (s.subject?.subjectName || s.subjectName || '').toLowerCase();
      const code = (s.subject?.subjectCode || s.subjectCode || '').toLowerCase();
      const date = s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : '';
      return name.includes(q) || code.includes(q) || date.includes(q);
    }

    return true;
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs animate-modal-backdrop" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-dialog will-change-transform">
        {/* Header Chuẩn Design System */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
          <div>
            <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Chọn Ca Thi Khảo Thí
            </h2>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
              Tổng cộng {schedules.length} ca thi trong hệ thống
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer text-type-body-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Toolbar Lọc & Tìm Kiếm */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên môn, mã môn, ngày thi..."
            className="w-full h-10 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-type-body text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            autoFocus
          />

          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-type-helper">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`h-8 px-3 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80'
              }`}
            >
              Tất cả ({schedules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`h-8 px-3 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'PENDING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80'
              }`}
            >
              Chưa xếp ({pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`h-8 px-3 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80'
              }`}
            >
              Đã đủ ({completedList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EXPIRED')}
              className={`h-8 px-3 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'EXPIRED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80'
              }`}
            >
              Đã kết thúc ({expiredList.length})
            </button>
          </div>
        </div>

        {/* Danh Sách Thẻ Ca Thi (Scrollable List) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSchedules.length === 0 ? (
            <div className="py-12 text-center text-type-helper text-slate-400">
              Không tìm thấy ca thi nào phù hợp với bộ lọc
            </div>
          ) : (
            filteredSchedules.map((s) => {
              const isSelected = String(s.id) === String(selectedScheduleId);
              const isExpired = isScheduleExpired(s);
              const { totalRooms, required, assigned, isFull } = getSupervisionStats(s);

              const subName = s.subject?.subjectName || s.subjectName || 'Ca thi';
              const subCode = s.subject?.subjectCode || s.subjectCode || 'MH';
              const dateStr = s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : '';

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSchedule(s.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {subName}
                      </span>
                      <span className="text-type-helper font-normal text-slate-400">
                        #{subCode}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-type-helper font-semibold bg-blue-600 text-white">
                          Đang chọn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-type-helper text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {s.startTime} - {s.endTime}
                      </span>
                      {dateStr && <span>• Ngày: {dateStr}</span>}
                      <span>• {totalRooms} phòng thi</span>
                    </div>
                  </div>

                  {/* Right: Status Pill */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded text-type-helper font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Đã kết thúc
                      </span>
                    ) : isFull ? (
                      <span className="px-2 py-0.5 rounded text-type-helper font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Đủ {assigned}/{required} GT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-type-helper font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        Có: {assigned}/{required} GT
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
          <span className="text-type-helper text-slate-500">
            Hiển thị <strong>{filteredSchedules.length}</strong> ca thi
          </span>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
