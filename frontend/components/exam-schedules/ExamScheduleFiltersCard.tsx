'use client';

import React, { useState } from 'react';
import { Search, Calendar, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
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
  onReset: () => void;
}

export function ExamScheduleFiltersCard({
  filters,
  periods,
  rooms,
  supervisors = [],
  onChange,
  onReset,
}: ExamScheduleFiltersCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof ExamScheduleFilterValues, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3.5">
      {/* Filter Grid matching Mockup Image 100% */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1, Col 1: Kỳ thi */}
        <div className="space-y-1">
          <label className="text-[15px] font-semibold text-slate-700">Kỳ thi</label>
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
          <label className="text-[15px] font-semibold text-slate-700">Ca thi</label>
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
          <label className="text-[15px] font-semibold text-slate-700">Phòng thi</label>
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
          <label className="text-[15px] font-semibold text-slate-700">Ngày thi</label>
          <div className="relative">
            <input
              type="date"
              value={filters.examDate}
              onChange={(e) => handleChange('examDate', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 2, Col 1: Trạng thái */}
        <div className="space-y-1">
          <label className="text-[15px] font-semibold text-slate-700">Trạng thái</label>
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
          <label className="text-[15px] font-semibold text-slate-700">Học kỳ</label>
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
          <label className="text-[15px] font-semibold text-slate-700">Năm học</label>
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
          <label className="text-[15px] font-semibold text-slate-700">Giám thị</label>
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


      {/* Bottom Filter Controls matching Mockup Image 100% */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{isExpanded ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Xóa bộ lọc</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Lọc kết quả</span>
          </button>
        </div>
      </div>
    </div>
  );
}
