'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, Plus, Upload, FileText, FolderPlus, ArrowRight } from 'lucide-react';

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
    { name: 'Đã duyệt', value: approved, color: '#16a34a', percent: '92,0%' },
    { name: 'Chờ duyệt', value: pending, color: '#f59e0b', percent: '4,8%' },
    { name: 'Bị từ chối', value: rejected, color: '#ef4444', percent: '3,2%' },
  ];

  // Difficulty progress data
  const difficultyData = [
    { label: 'Dễ', value: 1128, percent: '42.4%', color: '#16a34a', pctNum: 42.4 },
    { label: 'Trung bình', value: 984, percent: '37.0%', color: '#f59e0b', pctNum: 37.0 },
    { label: 'Khó', value: 552, percent: '20.6%', color: '#ef4444', pctNum: 20.6 },
  ];

  // Type distribution donut data
  const typeData = [
    { name: 'Trắc nghiệm', value: 2180, color: '#2563eb', percent: '81,9%' },
    { name: 'Tự luận', value: 484, color: '#3b82f6', percent: '18,1%' },
  ];

  return (
    <div className="space-y-4">
      {/* Card 1: Tổng quan ngân hàng */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-sm font-black text-slate-900">Tổng quan ngân hàng</h3>
          <div className="relative">
            <select className="appearance-none rounded-xl border border-slate-200 bg-white px-2.5 py-1 pr-6 text-[11px] font-bold text-slate-600 outline-none hover:bg-slate-50 cursor-pointer shadow-2xs">
              <option>Tất cả thời gian</option>
              <option>Tháng này</option>
              <option>Học kỳ này</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
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
              <span className="text-sm font-black text-slate-900 leading-tight">
                {total.toLocaleString('vi-VN')}
              </span>
              <span className="text-[9.5px] font-bold text-slate-400">Tổng câu hỏi</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 space-y-2 text-xs font-semibold">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-bold">{item.name}</span>
                </span>
                <span className="font-extrabold text-slate-900">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Phân bố độ khó */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2.5">
          Phân bố độ khó
        </h3>

        <div className="space-y-3 pt-1">
          {difficultyData.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-900 font-extrabold">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">({item.percent})</span>
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
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2.5">
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
              <span className="text-xs font-black text-slate-900 leading-tight">
                {total.toLocaleString('vi-VN')}
              </span>
              <span className="text-[9px] font-bold text-slate-400">Tổng</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 space-y-2 text-xs font-semibold">
            {typeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-bold">{item.name}</span>
                </span>
                <span className="font-extrabold text-slate-900">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 4: Thao tác nhanh */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-2.5">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2.5">
          Thao tác nhanh
        </h3>

        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Thêm câu hỏi mới</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
          </button>

          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-slate-600" />
              <span>Nhập từ file Excel</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <span>Xuất ngân hàng câu hỏi</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-slate-600" />
              <span>Quản lý chủ đề</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
