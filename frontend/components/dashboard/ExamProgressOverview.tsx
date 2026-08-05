'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { DashboardOverview } from '../../types/dashboard';

export function ExamProgressOverview({ periods }: { periods?: DashboardOverview['examProgress'] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Học kỳ II năm 2024 - 2025');

  const activePeriod = (periods && periods.length > 0) ? periods[0] : null;

  const totalSchedules = activePeriod?.totalSchedules || 120;
  const arrangedSchedules = activePeriod?.arrangedSchedules || 85;
  const supervisedSchedules = activePeriod?.supervisedSchedules || 76;
  const completedSchedules = activePeriod?.completedSchedules || 45;

  const arrangedPct = totalSchedules ? Math.round((arrangedSchedules / totalSchedules) * 1000) / 10 : 70.8;
  const supervisedPct = totalSchedules ? Math.round((supervisedSchedules / totalSchedules) * 1000) / 10 : 63.3;
  const completedPct = totalSchedules ? Math.round((completedSchedules / totalSchedules) * 1000) / 10 : 37.5;
  const overallPct = activePeriod?.paperProgress || 63.3;

  const steps = [
    { num: 1, name: 'Tạo kỳ thi', status: 'COMPLETED', label: 'Hoàn thành' },
    { num: 2, name: 'Tạo lịch thi', status: 'COMPLETED', label: 'Hoàn thành' },
    { num: 3, name: 'Xếp phòng', status: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { num: 4, name: 'Phân công giám thị', status: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { num: 5, name: 'Tạo đề thi', status: 'PENDING', label: 'Chưa thực hiện' },
    { num: 6, name: 'Tổ chức thi', status: 'PENDING', label: 'Chưa thực hiện' },
    { num: 7, name: 'Nhập & công bố điểm', status: 'PENDING', label: 'Chưa thực hiện' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-5 h-full flex flex-col justify-between">
      {/* Top Header & Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Tình hình tổ chức kỳ thi: {selectedPeriod}
          </h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>Thời gian: <strong>01/04/2025 - 30/06/2025</strong></span>
          </p>
        </div>

        <div className="relative shrink-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 outline-none hover:bg-slate-100 transition cursor-pointer"
          >
            <option value="Học kỳ II năm 2024 - 2025">Học kỳ II năm 2024 - 2025</option>
            <option value="Học kỳ I năm 2024 - 2025">Học kỳ I năm 2024 - 2025</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        </div>
      </div>

      {/* Metrics Row & Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* 4 Numbers */}
        <div className="md:col-span-8 grid grid-cols-4 gap-2 text-center">
          <div>
            <span className="text-xl font-black text-slate-900 block">{totalSchedules}</span>
            <span className="text-[11px] font-bold text-slate-500 block">Tổng lịch thi</span>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">{arrangedSchedules}</span>
            <span className="text-[11px] font-bold text-slate-500 block">Đã xếp phòng</span>
            <span className="text-[10px] font-semibold text-slate-400">({arrangedPct}%)</span>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">{supervisedSchedules}</span>
            <span className="text-[11px] font-bold text-slate-500 block">Đã phân công</span>
            <span className="text-[10px] font-semibold text-slate-400">({supervisedPct}%)</span>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">{completedSchedules}</span>
            <span className="text-[11px] font-bold text-slate-500 block">Hoàn tất</span>
            <span className="text-[10px] font-semibold text-slate-400">({completedPct}%)</span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="md:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Tiến độ tổng thể</span>
            <span className="text-base font-black text-blue-600">{overallPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500 shadow-xs"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="text-right">
            <span className="inline-flex rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-extrabold">
              Đang thực hiện
            </span>
          </div>
        </div>
      </div>

      {/* 7 Horizontal Step Circles Connected by Line */}
      <div className="pt-2">
        <div className="relative flex items-start justify-between">
          {/* Line behind circles */}
          <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 -z-0" />

          {steps.map((step) => {
            const isCompleted = step.status === 'COMPLETED';
            const isInProgress = step.status === 'IN_PROGRESS';

            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center text-center max-w-[85px]">
                {/* Number Circle */}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition-transform duration-200 hover:scale-110 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : isInProgress
                      ? 'bg-blue-600 text-white shadow-2xs ring-3 ring-blue-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step.num}
                </div>

                {/* Step Name */}
                <span className="mt-1.5 text-[11px] font-extrabold text-slate-800 leading-tight">
                  {step.name}
                </span>

                {/* Status Label Pill */}
                <span
                  className={`mt-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isInProgress
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
