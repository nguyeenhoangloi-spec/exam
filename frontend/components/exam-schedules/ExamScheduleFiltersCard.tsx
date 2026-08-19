'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { ExamPeriod, ExamRoom } from '../../types';
import { FilterSelect } from '../ui/FilterSelect';

export interface ExamScheduleFilterValues {
  search: string;
  examPeriodId: string;
  shift: string;
  roomId: string;
  examDate: string;
  status: string;
  semester: string;
  schoolYear: string;
  supervisorId: string;
}

interface ExamScheduleFiltersCardProps {
  filters: ExamScheduleFilterValues;
  periods: ExamPeriod[];
  rooms: ExamRoom[];
  supervisors?: any[];
  onChange: (next: ExamScheduleFilterValues) => void;
}

export function ExamScheduleFiltersCard({
  filters,
  periods,
  rooms,
  supervisors = [],
  onChange,
}: ExamScheduleFiltersCardProps) {
  const handleChange = (key: keyof ExamScheduleFilterValues, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Filter Grid matching Mockup Image 100% */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1, Col 1: Kỳ thi */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Kỳ thi</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.examPeriodId}
            onChange={(e) => handleChange('examPeriodId', e.target.value)}
          >
            <option value="">Chọn kỳ thi</option>
            {periods.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </FilterSelect>
        </div>

        {/* Row 1, Col 2: Ca thi */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Ca thi</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.shift}
            onChange={(e) => handleChange('shift', e.target.value)}
          >
            <option value="">Tất cả ca thi</option>
            <option value="CA_1">Ca 1 - Sáng (07:00 - 09:00)</option>
            <option value="CA_2">Ca 2 - Sáng (09:30 - 11:30)</option>
            <option value="CA_3">Ca 3 - Chiều (13:00 - 15:00)</option>
            <option value="CA_4">Ca 4 - Chiều (15:30 - 17:30)</option>
          </FilterSelect>
        </div>

        {/* Row 1, Col 3: Phòng thi */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Phòng thi</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.roomId}
            onChange={(e) => handleChange('roomId', e.target.value)}
          >
            <option value="">Tất cả phòng thi</option>
            {rooms.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.roomCode || r.code || r.name} ({r.capacity || 40} chỗ)
              </option>
            ))}
          </FilterSelect>
        </div>

        {/* Row 1, Col 4: Ngày thi */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Ngày thi</label>
          <div className="relative">
            <input
              type="date"
              value={filters.examDate}
              onChange={(e) => handleChange('examDate', e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 text-type-body font-normal text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Row 2, Col 1: Trạng thái */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Trạng thái</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="ONGOING">Đang diễn ra</option>
            <option value="COMPLETED">Đã diễn ra</option>
            <option value="CANCELLED">Đã hủy</option>
          </FilterSelect>
        </div>

        {/* Row 2, Col 2: Học kỳ */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Học kỳ</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.semester}
            onChange={(e) => handleChange('semester', e.target.value)}
          >
            <option value="">Tất cả học kỳ</option>
            <option value="HK1">Học kỳ I</option>
            <option value="HK2">Học kỳ II</option>
            <option value="HK3">Học kỳ Hè</option>
          </FilterSelect>
        </div>

        {/* Row 2, Col 3: Năm học */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Năm học</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.schoolYear}
            onChange={(e) => handleChange('schoolYear', e.target.value)}
          >
            <option value="">Tất cả năm học</option>
            <option value="2023-2024">2023 - 2024</option>
            <option value="2022-2023">2022 - 2023</option>
            <option value="2024-2025">2024 - 2025</option>
          </FilterSelect>
        </div>

        {/* Row 2, Col 4: Giám thị */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-700 mb-1">Giám thị</label>
          <FilterSelect
            size="md"
            className="w-full"
            containerClassName="w-full"
            value={filters.supervisorId}
            onChange={(e) => handleChange('supervisorId', e.target.value)}
          >
            <option value="">Tất cả giám thị</option>
            {supervisors.map((sup: any) => (
              <option key={sup.id} value={String(sup.id)}>
                {sup.fullName || sup.name}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>


    </div>
  );
}
