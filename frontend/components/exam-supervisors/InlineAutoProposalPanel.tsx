'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { FilterSelect } from '../ui/FilterSelect';

interface InlineAutoProposalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  autoProposal: any;
  teachers: any[];
  rooms: any[];
  onAccept: (proposals: { examScheduleRoomId: number; teacherId: number; role: string }[]) => Promise<void>;
  loading?: boolean;
}

export function InlineAutoProposalPanel({
  isOpen,
  onClose,
  autoProposal,
  teachers,
  rooms,
  onAccept,
  loading = false,
}: InlineAutoProposalPanelProps) {
  const [roomAssignments, setRoomAssignments] = useState<
    Record<number, { supervisor1: number | ''; supervisor2: number | '' }>
  >({});

  useEffect(() => {
    if (!isOpen) return;

    const initial: Record<number, { supervisor1: number | ''; supervisor2: number | '' }> = {};
    for (const r of rooms) {
      initial[r.id] = { supervisor1: '', supervisor2: '' };
      if (r.supervisors && Array.isArray(r.supervisors)) {
        for (const sup of r.supervisors) {
          if (sup.role === 'SUPERVISOR_1') initial[r.id].supervisor1 = sup.teacherId;
          if (sup.role === 'SUPERVISOR_2') initial[r.id].supervisor2 = sup.teacherId;
        }
      }
    }

    if (autoProposal?.proposals && Array.isArray(autoProposal.proposals)) {
      for (const prop of autoProposal.proposals) {
        if (!initial[prop.examScheduleRoomId]) {
          initial[prop.examScheduleRoomId] = { supervisor1: '', supervisor2: '' };
        }
        if (prop.role === 'SUPERVISOR_1') {
          initial[prop.examScheduleRoomId].supervisor1 = prop.teacherId;
        } else if (prop.role === 'SUPERVISOR_2') {
          initial[prop.examScheduleRoomId].supervisor2 = prop.teacherId;
        }
      }
    }

    setRoomAssignments(initial);
  }, [isOpen, autoProposal, rooms]);

  const teacherOptions = useMemo(() => {
    return [
      { value: '', label: '-- Chưa phân công --' },
      ...teachers.map((t) => ({
        value: String(t.id),
        label: `${t.fullName} (${t.teacherCode}) · ${t.degree || 'TS'}`,
      })),
    ];
  }, [teachers]);

  const totalAssignedCount = useMemo(() => {
    let count = 0;
    for (const val of Object.values(roomAssignments)) {
      if (val.supervisor1) count++;
      if (val.supervisor2) count++;
    }
    return count;
  }, [roomAssignments]);

  const totalRequired = rooms.length * 2;
  const progressPercent = totalRequired > 0 ? Math.round((totalAssignedCount / totalRequired) * 100) : 0;

  const handleSelectTeacher = (roomId: number, slot: 'supervisor1' | 'supervisor2', val: string) => {
    setRoomAssignments((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [slot]: val ? Number(val) : '',
      },
    }));
  };

  const hasConflict = (roomId: number) => {
    const r = roomAssignments[roomId];
    return r && r.supervisor1 && r.supervisor2 && r.supervisor1 === r.supervisor2;
  };

  const handleSave = async () => {
    const list: { examScheduleRoomId: number; teacherId: number; role: string }[] = [];
    for (const [rIdStr, val] of Object.entries(roomAssignments)) {
      const rId = Number(rIdStr);
      if (val.supervisor1) {
        list.push({ examScheduleRoomId: rId, teacherId: Number(val.supervisor1), role: 'SUPERVISOR_1' });
      }
      if (val.supervisor2) {
        list.push({ examScheduleRoomId: rId, teacherId: Number(val.supervisor2), role: 'SUPERVISOR_2' });
      }
    }
    await onAccept(list);
  };

  return (
    <div className="space-y-3">
      {/* ── 1. Header tinh gọn (Hoàn toàn không khung) ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Phương Án Tự Động
        </h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          {totalAssignedCount}/{totalRequired} vị trí ({progressPercent}%)
        </span>
      </div>

      {/* ── 2. Loading State hoặc Danh Sách Phòng (Không hộp, không viền) ── */}
      {loading ? (
        <div className="space-y-2.5 py-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {rooms.map((r, idx) => {
            const roomObj = r.room || r.examRoom;
            const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${r.id}`;
            const cap = roomObj?.capacity ? `${roomObj.capacity} chỗ` : '';
            const isConflicted = hasConflict(r.id);
            const assign = roomAssignments[r.id] || { supervisor1: '', supervisor2: '' };
            const isFilledBoth = Boolean(assign.supervisor1 && assign.supervisor2);

            const t1 = teachers.find((t) => String(t.id) === String(assign.supervisor1));
            const t2 = teachers.find((t) => String(t.id) === String(assign.supervisor2));

            return (
              <div
                key={r.id}
                className={`space-y-1.5 ${
                  idx < rooms.length - 1 ? 'pb-3 border-b border-slate-100 dark:border-slate-800/80' : ''
                }`}
              >
                {/* Room Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{rName}</span>
                    {cap && <span className="text-xs text-slate-400 font-normal">({cap})</span>}
                  </div>

                  {isConflicted && (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                      Trùng cán bộ
                    </span>
                  )}
                </div>

                {/* 2 Cột Giám Thị Song Song (Không hộp lồng hộp) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Cột 1: Giám thị 1 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        Giám thị 1 (Chính)
                      </label>
                      {t1 && (
                        <span className="text-xs font-mono text-slate-400">
                          {t1.teacherCode}
                        </span>
                      )}
                    </div>
                    <FilterSelect
                      containerClassName="w-full"
                      value={String(assign.supervisor1)}
                      onChange={(e) => handleSelectTeacher(r.id, 'supervisor1', e.target.value)}
                      options={teacherOptions}
                    />
                  </div>

                  {/* Cột 2: Giám thị 2 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Giám thị 2 (Phụ)
                      </label>
                      {t2 && (
                        <span className="text-xs font-mono text-slate-400">
                          {t2.teacherCode}
                        </span>
                      )}
                    </div>
                    <FilterSelect
                      containerClassName="w-full"
                      value={String(assign.supervisor2)}
                      onChange={(e) => handleSelectTeacher(r.id, 'supervisor2', e.target.value)}
                      options={teacherOptions}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. Footer Hành Động ── */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-medium text-slate-500">
          Tổng: <strong className="text-blue-600 font-semibold">{totalAssignedCount}</strong>/{totalRequired} vị trí
        </span>

        <div className="flex items-center gap-2">
          {/* Tầng 3: Tertiary / Ghost Button */}
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Thu Gọn
          </Button>
          {/* Tầng 1: Primary Solid Button */}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={loading || totalAssignedCount === 0}
          >
            {loading ? 'Đang lưu...' : 'Lưu Phương Án'}
          </Button>
        </div>
      </div>
    </div>
  );
}
