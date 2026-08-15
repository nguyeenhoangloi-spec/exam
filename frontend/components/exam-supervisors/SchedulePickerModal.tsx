'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IdentifierBadge } from '../ui/IdentifierBadge';
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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const pendingSchedules = schedules.filter((s: any) => !isScheduleExpired(s) && !getSupervisionStats(s).isFull);
  const completedSchedules = schedules.filter((s: any) => !isScheduleExpired(s) && getSupervisionStats(s).isFull);
  const expiredSchedules = schedules.filter((s: any) => isScheduleExpired(s));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-600 text-white">
          <div>
            <p className="text-lg font-semibold text-white tracking-tight">Chọn Ca thi</p>
            <p className="text-xs font-semibold text-blue-100 mt-0.5">
              {pendingSchedules.length} ca chưa xếp · {completedSchedules.length} ca đã xếp
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-blue-100 hover:text-white hover:bg-blue-700/80 transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* CỘT TRÁI: Chưa xếp */}
          <div>
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10">
              <span className="text-[12px] font-semibold text-slate-500 tracking-wider">
                Chưa xếp ({pendingSchedules.length})
              </span>
            </div>
            {pendingSchedules.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Tất cả đã xếp</p>
            ) : (
              pendingSchedules.map((s: any) => {
                const isActive = selectedScheduleId === s.id.toString();
                const { totalRooms, required, assigned } = getSupervisionStats(s);

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSchedule(s.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${
                      isActive ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {s.mode === 'MOCK' ? '[THI THỬ] ' : '[CHÍNH THỨC] '}
                        {s.subject?.subjectName || s.subjectName}
                      </p>
                      <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[12px] font-semibold px-1.5 py-0.5">
                        {totalRooms === 0 ? '0 phòng' : `${assigned}/${required} GT`}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      <IdentifierBadge tone="blue">{s.subject?.subjectCode || s.subjectCode}</IdentifierBadge> · {s.startTime}–{s.endTime}
                      {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                    </p>
                  </button>
                );
              })
            )}

            {/* Section Ca thi Đã quá hạn */}
            {expiredSchedules.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 pt-2">
                <div className="px-4 py-1.5 bg-slate-200/60 dark:bg-slate-700/60">
                  <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-300 tracking-wider">
                    📁 Đã quá hạn / Đã kết thúc ({expiredSchedules.length})
                  </span>
                </div>
                {expiredSchedules.map((s: any) => (
                  <div
                    key={s.id}
                    className="w-full text-left px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 cursor-not-allowed select-none"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {s.subject?.subjectName || s.subjectName}
                      </p>
                      <span className="shrink-0 rounded-md bg-amber-100 text-amber-800 text-[12px] font-semibold px-1.5 py-0.5">
                        Đã quá hạn
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                      <IdentifierBadge tone="blue">{s.subject?.subjectCode || s.subjectCode}</IdentifierBadge> · {s.startTime}–{s.endTime}
                      {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Đã xếp */}
          <div>
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-300 tracking-wider">
                Đã xếp ({completedSchedules.length})
              </span>
            </div>
            {completedSchedules.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Chưa có</p>
            ) : (
              completedSchedules.map((s: any) => {
                const isActive = selectedScheduleId === s.id.toString();
                const { totalRooms, required, assigned } = getSupervisionStats(s);

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSchedule(s.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${
                      isActive ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {s.subject?.subjectName || s.subjectName}
                      </p>
                      <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[12px] font-semibold px-1.5 py-0.5">
                        {assigned}/{required} GT
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                      <IdentifierBadge tone="blue">{s.subject?.subjectCode || s.subjectCode}</IdentifierBadge> · {totalRooms} phòng · {s.startTime}–{s.endTime}
                      {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
