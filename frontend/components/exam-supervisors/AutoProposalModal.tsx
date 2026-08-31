'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { FilterSelect } from '../ui/FilterSelect';
import { DoorOpen, ShieldCheck, UserCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface AutoProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoProposal: any;
  teachers: any[];
  rooms: any[];
  onAccept: (proposals: { examScheduleRoomId: number; teacherId: number; role: string }[]) => Promise<void>;
  loading?: boolean;
}

export function AutoProposalModal({
  isOpen,
  onClose,
  autoProposal,
  teachers,
  rooms,
  onAccept,
  loading = false,
}: AutoProposalModalProps) {
  const [roomAssignments, setRoomAssignments] = useState<
    Record<number, { supervisor1: number | ''; supervisor2: number | '' }>
  >({});

  useEffect(() => {
    if (!isOpen) return;

    const initial: Record<number, { supervisor1: number | ''; supervisor2: number | '' }> = {};
    for (const r of rooms) {
      initial[r.id] = { supervisor1: '', supervisor2: '' };
      // If room already has supervisors
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
        label: `${t.fullName} (${t.teacherCode}) – ${t.degree || 'TS'}`,
      })),
    ];
  }, [teachers]);

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

  const totalAssignedCount = useMemo(() => {
    let count = 0;
    for (const val of Object.values(roomAssignments)) {
      if (val.supervisor1) count++;
      if (val.supervisor2) count++;
    }
    return count;
  }, [roomAssignments]);

  const totalRequired = rooms.length * 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Phương Án Phân Công Giám Thị Tự Động"
      subtitle={`Thuật toán đã tự động tính toán và điền sẵn cán bộ cho ${rooms.length} phòng thi.`}
      size="4xl"
    >
      <div className="space-y-4 pt-1">
        {/* Unassigned Warning Note if any */}
        {autoProposal?.unassigned?.length > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-type-helper text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Lưu ý: Có {autoProposal.unassigned.length} vị trí thiếu giảng viên rảnh trong khung giờ này. Bạn có thể chọn bổ sung thủ công bên dưới.
            </span>
          </div>
        )}

        {/* Room List with Prefilled Supervisors */}
        <div className="max-h-[440px] overflow-y-auto space-y-3 pr-1">
          {rooms.map((r) => {
            const roomObj = r.room || r.examRoom;
            const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${r.id}`;
            const cap = roomObj?.capacity ? `${roomObj.capacity} chỗ` : '';
            const isConflicted = hasConflict(r.id);
            const assign = roomAssignments[r.id] || { supervisor1: '', supervisor2: '' };

            const isFilledBoth = Boolean(assign.supervisor1 && assign.supervisor2);

            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 transition ${isConflicted
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-blue-600" />
                    <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                      {rName} {cap && <span className="text-slate-400 font-normal">({cap})</span>}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConflicted ? (
                      <span className="flex items-center gap-1 text-type-helper font-semibold text-rose-600">
                        <ShieldAlert className="h-3.5 w-3.5" /> Trùng cán bộ gác thi
                      </span>
                    ) : isFilledBoth ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 ui-pill rounded-full text-type-helper font-medium text-emerald-700 dark:text-emerald-300">
                        Đủ 2 giám thị
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 ui-pill rounded-full text-type-helper font-medium text-amber-700 dark:text-amber-300">
                        Chưa đủ 2 giám thị
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Giám thị 1 */}
                  <div className="space-y-1 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 p-2.5">
                    <label className="flex items-center justify-between text-type-body font-medium text-blue-700 dark:text-blue-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Giám thị 1 (Chính)
                      </span>
                    </label>
                    <FilterSelect
                      containerClassName="w-full"
                      value={String(assign.supervisor1)}
                      onChange={(e) => handleSelectTeacher(r.id, 'supervisor1', e.target.value)}
                      options={teacherOptions}
                    />
                  </div>

                  {/* Giám thị 2 */}
                  <div className="space-y-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5">
                    <label className="flex items-center justify-between text-type-body font-medium text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                        Giám thị 2 (Phụ)
                      </span>
                    </label>
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-type-helper font-semibold text-slate-500">
            Đã xếp: <span className="font-semibold text-blue-600">{totalAssignedCount}</span> / {totalRequired} lượt giám thị
          </div>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={loading || totalAssignedCount === 0}
            >
              {loading ? 'Đang lưu...' : 'Xác Nhận Lưu Toàn Bộ'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
