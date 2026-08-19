'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { FilterSelect } from '../ui/FilterSelect';
import { DoorOpen, UserCheck, ShieldCheck } from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    examScheduleRoomId: number;
    supervisor1Id?: number;
    supervisor2Id?: number;
    note?: string;
  }) => Promise<void>;
  rooms: any[];
  teachers: any[];
  defaultRoomId?: string;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  rooms,
  teachers,
  defaultRoomId,
}: CreateAssignmentModalProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [supervisor1Id, setSupervisor1Id] = useState<string>('');
  const [supervisor2Id, setSupervisor2Id] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Determine initial room when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultRoomId && defaultRoomId !== 'ALL' && rooms.some((r) => String(r.id) === String(defaultRoomId))) {
        setRoomId(String(defaultRoomId));
      } else if (rooms.length > 0) {
        setRoomId(String(rooms[0].id));
      }
      setSupervisor1Id('');
      setSupervisor2Id('');
      setNote('');
    }
  }, [isOpen, defaultRoomId, rooms]);

  const teacherOptions = useMemo(() => {
    return [
      { value: '', label: '-- Chọn cán bộ coi thi --' },
      ...teachers.map((t) => ({
        value: String(t.id),
        label: `${t.fullName} (${t.teacherCode}) · ${t.degree || 'TS'}`,
      })),
    ];
  }, [teachers]);

  // Filter options for Supervisor 2 (exclude Supervisor 1)
  const supervisor2Options = useMemo(() => {
    return [
      { value: '', label: '-- Chọn cán bộ coi thi 2 (Tùy chọn) --' },
      ...teachers
        .filter((t) => String(t.id) !== supervisor1Id)
        .map((t) => ({
          value: String(t.id),
          label: `${t.fullName} (${t.teacherCode}) · ${t.degree || 'TS'}`,
        })),
    ];
  }, [teachers, supervisor1Id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    if (!supervisor1Id && !supervisor2Id) return;

    setLoading(true);
    try {
      await onSubmit({
        examScheduleRoomId: Number(roomId),
        supervisor1Id: supervisor1Id ? Number(supervisor1Id) : undefined,
        supervisor2Id: supervisor2Id ? Number(supervisor2Id) : undefined,
        note,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isPreselectedSingleRoom = Boolean(
    (defaultRoomId && defaultRoomId !== 'ALL') || rooms.length === 1
  );

  const selectedRoomObj = rooms.find((r) => String(r.id) === String(roomId));
  const selectedRoomDetails = selectedRoomObj?.room || selectedRoomObj?.examRoom;
  const selectedRoomName = selectedRoomDetails?.roomName || selectedRoomDetails?.name || selectedRoomDetails?.roomCode || `Phòng #${roomId}`;
  const selectedRoomCap = selectedRoomDetails?.capacity ? ` (${selectedRoomDetails.capacity} chỗ)` : '';
  const currentSupCount = selectedRoomObj?.supervisors?.length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Phân Công Giám Thị"
      subtitle="Chỉ định Giám thị 1 (Chính) và Giám thị 2 (Phụ) cho phòng thi."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* 1. Phòng Thi */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-type-body font-medium text-slate-700 dark:text-slate-300">
            <DoorOpen className="h-4 w-4 text-blue-600" />
            Phòng thi <span className="text-rose-500">*</span>
          </label>

          {isPreselectedSingleRoom ? (
            <div className="flex items-center justify-between h-10 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-type-helper font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">{selectedRoomName}</span>
                {selectedRoomCap && <span className="text-slate-400 font-normal">{selectedRoomCap}</span>}
              </span>
              <span className="text-type-helper font-medium text-slate-500 px-2 py-0.5 ui-pill rounded-full border border-slate-200 dark:border-slate-600">
                Hiện có: {currentSupCount}/2 giám thị
              </span>
            </div>
          ) : (
            <FilterSelect
              containerClassName="w-full"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              options={rooms.map((r) => {
                const roomObj = r.room || r.examRoom;
                const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${r.id}`;
                const cap = roomObj?.capacity ? ` (${roomObj.capacity} chỗ)` : '';
                const supCount = r.supervisors?.length || 0;
                return {
                  value: String(r.id),
                  label: `${rName}${cap} — [Hiện có: ${supCount}/2 giám thị]`,
                };
              })}
            />
          )}
        </div>

        {/* 2. Cặp Giám Thị (2 Cột) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Giám thị 1 */}
          <div className="space-y-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 p-3">
            <label className="flex items-center justify-between text-type-body font-medium text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4" />
                Giám thị 1 (Chính)
              </span>
              <span className="text-type-helper text-rose-500 font-semibold">* Trưởng phòng</span>
            </label>
            <FilterSelect
              containerClassName="w-full"
              value={supervisor1Id}
              onChange={(e) => {
                setSupervisor1Id(e.target.value);
                if (e.target.value === supervisor2Id) {
                  setSupervisor2Id('');
                }
              }}
              options={teacherOptions}
            />
          </div>

          {/* Giám thị 2 */}
          <div className="space-y-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
            <label className="flex items-center justify-between text-type-body font-medium text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <UserCheck className="h-4 w-4 text-slate-500" />
                Giám thị 2 (Phụ)
              </span>
              <span className="text-type-helper text-slate-400 font-normal">Cán bộ phối hợp</span>
            </label>
            <FilterSelect
              containerClassName="w-full"
              value={supervisor2Id}
              onChange={(e) => setSupervisor2Id(e.target.value)}
              options={supervisor2Options}
            />
          </div>
        </div>

        {/* 3. Ghi Chú */}
        <div className="space-y-1.5">
          <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
            Ghi chú phân công
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú phân công hoặc yêu cầu đặc biệt..."
            rows={2}
            className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none shadow-2xs"
          />
        </div>

        {/* 4. Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !roomId || (!supervisor1Id && !supervisor2Id)}
          >
            {loading ? 'Đang lưu...' : 'Xác nhận phân công'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
