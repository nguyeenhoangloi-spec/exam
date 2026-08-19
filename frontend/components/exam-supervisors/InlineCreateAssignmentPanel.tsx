'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { FilterSelect } from '../ui/FilterSelect';

interface InlineCreateAssignmentPanelProps {
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

export function InlineCreateAssignmentPanel({
  isOpen,
  onClose,
  onSubmit,
  rooms,
  teachers,
  defaultRoomId,
}: InlineCreateAssignmentPanelProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [supervisor1Id, setSupervisor1Id] = useState<string>('');
  const [supervisor2Id, setSupervisor2Id] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultRoomId && defaultRoomId !== 'ALL' && rooms.some((r) => String(r.id) === String(defaultRoomId))) {
        setRoomId(String(defaultRoomId));
      } else if (rooms.length > 0) {
        setRoomId(String(rooms[0].id));
      }
      setSupervisor1Id('');
      setSupervisor2Id('');
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
  const selectedRoomCap = selectedRoomDetails?.capacity ? `${selectedRoomDetails.capacity} chỗ` : '';

  const t1 = teachers.find((t) => String(t.id) === String(supervisor1Id));
  const t2 = teachers.find((t) => String(t.id) === String(supervisor2Id));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* ── 1. Header tinh gọn (Giống 100% bản Tự Động) ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-type-helper font-semibold text-slate-800 dark:text-slate-200  tracking-wider">
          Phân Công Phòng Thi
        </h3>
        {selectedRoomCap && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-type-helper font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {selectedRoomName} ({selectedRoomCap})
          </span>
        )}
      </div>

      {/* ── 2. Nội dung phòng thi (2 Cột Giám Thị Song Song giống hệt bản Tự Động) ── */}
      <div className="space-y-2.5">
        {/* Nếu chưa cố định 1 phòng thi thì hiển thị ô chọn phòng */}
        {!isPreselectedSingleRoom && rooms.length > 1 && (
          <div className="space-y-1">
            <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
              Phòng thi cần phân công *
            </label>
            <FilterSelect
              containerClassName="w-full"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              options={rooms.map((r) => {
                const roomObj = r.room || r.examRoom;
                const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${r.id}`;
                const cap = roomObj?.capacity ? ` (${roomObj.capacity} chỗ)` : '';
                return {
                  value: String(r.id),
                  label: `${rName}${cap}`,
                };
              })}
            />
          </div>
        )}

        {/* 2 Cột Giám Thị Song Song (Giống hệt bản Tự Động) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Cột 1: Giám thị 1 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-type-body font-medium text-blue-700 dark:text-blue-300">
                Giám thị 1 (Chính)
              </label>
              {t1 && (
                <span className="text-type-helper font-normal text-slate-400">
                  {t1.teacherCode}
                </span>
              )}
            </div>
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

          {/* Cột 2: Giám thị 2 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                Giám thị 2 (Phụ)
              </label>
              {t2 && (
                <span className="text-type-helper font-normal text-slate-400">
                  {t2.teacherCode}
                </span>
              )}
            </div>
            <FilterSelect
              containerClassName="w-full"
              value={supervisor2Id}
              onChange={(e) => setSupervisor2Id(e.target.value)}
              options={supervisor2Options}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Footer Hành Động (Giống 100% bản Tự Động) ── */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-type-helper font-medium text-slate-500">
          Chỉ định cán bộ coi thi cho phòng thi
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
            Hủy bỏ
          </Button>
          {/* Tầng 1: Primary Solid Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !roomId || (!supervisor1Id && !supervisor2Id)}
          >
            {loading ? 'Đang lưu...' : 'Lưu phân công'}
          </Button>
        </div>
      </div>
    </form>
  );
}
