'use client';
import { FilterSelect } from '../ui/FilterSelect';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Upload, FileText, FolderPlus, ArrowRight } from 'lucide-react';

interface QuestionBankSidebarProps {
  counts?: Record<string, number>;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function QuestionBankSidebar({
  counts = {},
  onAdd,
  onImport,
  onExport,
}: QuestionBankSidebarProps) {
  const total = counts.total || 2664;
  const approved = counts.approved || 2450;
  const pending = counts.pending || 128;
  const rejected = counts.rejected || 86;

  // Question status donut data
  const statusData = [
    { name: 'Đã duyệt', value: approved, color: 'var(--ui-chart-success-strong)', percent: '92,0%' },
    { name: 'Chờ duyệt', value: pending, color: 'var(--ui-chart-warning)', percent: '4,8%' },
    { name: 'Bị từ chối', value: rejected, color: 'var(--ui-chart-danger)', percent: '3,2%' },
  ];

  // Difficulty progress data
  const difficultyData = [
    { label: 'Dễ', value: 1128, percent: '42.4%', color: 'var(--ui-chart-success-strong)', pctNum: 42.4 },
    { label: 'Trung bình', value: 984, percent: '37.0%', color: 'var(--ui-chart-warning)', pctNum: 37.0 },
    { label: 'Khó', value: 552, percent: '20.6%', color: 'var(--ui-chart-danger)', pctNum: 20.6 },
  ];

  // Type distribution donut data
  const typeData = [
    { name: 'Trắc nghiệm', value: 2180, color: 'var(--ui-chart-primary)', percent: '81,9%' },
    { name: 'Tự luận', value: 484, color: 'var(--ui-chart-primary-light)', percent: '18,1%' },
  ];

  return (
    <div className="space-y-4">
      {/* Card 1: Tổng quan ngân hàng */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-type-card font-semibold text-slate-900">Tổng quan ngân hàng</h3>
          <div className="relative">
            <FilterSelect className="h-9 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 text-type-body font-normal text-slate-700 outline-none hover:bg-slate-50 cursor-pointer shadow-2xs">
              <option>Tất cả thời gian</option>
              <option>Tháng này</option>
              <option>Học kỳ này</option>
            </FilterSelect>
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          {/* Donut canvas */}
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-type-section font-semibold text-slate-900 leading-tight">
                {total.toLocaleString('vi-VN')}
              </span>
              <span className="text-type-helper font-normal text-slate-500">Tổng câu hỏi</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 space-y-2 text-type-body-sm">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-type-helper text-slate-500 font-normal">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Phân bố độ khó */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-3">
        <h3 className="text-type-card font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
          Phân bố độ khó
        </h3>

        <div className="space-y-3 pt-1">
          {difficultyData.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-type-body-sm font-medium">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-900 font-semibold">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-type-helper text-slate-500 font-normal">({item.percent})</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pctNum}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Phân bố loại câu hỏi */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-3">
        <h3 className="text-type-card font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
          Phân bố loại câu hỏi
        </h3>

        <div className="flex items-center gap-3 py-1">
          {/* Donut canvas */}
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={30}
                  outerRadius={48}
                  paddingAngle={3}
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-type-card font-semibold text-slate-900 leading-tight">
                {total.toLocaleString('vi-VN')}
              </span>
              <span className="text-type-helper font-normal text-slate-500">Tổng</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 space-y-2 text-type-body-sm">
            {typeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-type-helper text-slate-500 font-normal">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 4: Thao tác nhanh */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-2.5">
        <h3 className="text-type-card font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
          Thao tác nhanh
        </h3>

        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body font-medium text-blue-700 transition hover:bg-blue-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Thêm câu hỏi</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
          </button>

          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-slate-500" />
              <span>Nhập từ file Excel</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span>Xuất ngân hàng câu hỏi</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-type-body font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-slate-500" />
              <span>Quản lý chủ đề</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
