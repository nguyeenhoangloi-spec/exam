'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown, Plus, Upload, FileText, FolderPlus, ArrowRight } from 'lucide-react';
import { Question } from '../../types';

interface QuestionBankTopChartsProps {
  counts?: Record<string, number>;
  questions?: Question[];
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function QuestionBankTopCharts({
  counts = {},
  questions = [],
  onAdd,
  onImport,
  onExport,
}: QuestionBankTopChartsProps) {
  // Real Database Data
  const total = counts.total ?? questions.length ?? 0;

  const approved = counts.APPROVED ?? counts.approved ?? questions.filter((q) => q.status === 'APPROVED').length;
  const pending = counts.PENDING ?? counts.pending ?? questions.filter((q) => q.status === 'PENDING').length;
  const rejected = counts.REJECTED ?? counts.rejected ?? questions.filter((q) => q.status === 'REJECTED').length;

  const calcPct = (val: number) => (total > 0 ? ((val / total) * 100).toFixed(1).replace('.', ',') + '%' : '0%');

  // Status donut data
  const statusData = [
    { name: 'Đã duyệt', value: approved, color: '#16a34a', percent: calcPct(approved) },
    { name: 'Chờ duyệt', value: pending, color: '#f59e0b', percent: calcPct(pending) },
    { name: 'Bị từ chối', value: rejected, color: '#ef4444', percent: calcPct(rejected) },
  ];

  // Difficulty data from real questions
  const difficultyCounts = (counts.difficulty || {}) as Record<string, number>;
  const easy = difficultyCounts.EASY ?? questions.filter((q) => q.difficulty === 'EASY').length;
  const medium = difficultyCounts.MEDIUM ?? questions.filter((q) => q.difficulty === 'MEDIUM').length;
  const hard = difficultyCounts.HARD ?? questions.filter((q) => q.difficulty === 'HARD').length;

  const difficultyData = [
    { label: 'Dễ', value: easy, percent: calcPct(easy), color: '#16a34a', pctNum: total > 0 ? (easy / total) * 100 : 0 },
    { label: 'Trung bình', value: medium, percent: calcPct(medium), color: '#f59e0b', pctNum: total > 0 ? (medium / total) * 100 : 0 },
    { label: 'Khó', value: hard, percent: calcPct(hard), color: '#ef4444', pctNum: total > 0 ? (hard / total) * 100 : 0 },
  ];

  // Question Type distribution - 5 types
  const typeCounts = (counts.types || {}) as Record<string, number>;
  const singleChoice = typeCounts.SINGLE_CHOICE ?? questions.filter((q) => !q.type || q.type === 'SINGLE_CHOICE').length;
  const multipleChoice = typeCounts.MULTIPLE_CHOICE ?? questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
  const trueFalse = typeCounts.TRUE_FALSE ?? questions.filter((q) => q.type === 'TRUE_FALSE').length;
  const fillBlank = typeCounts.FILL_BLANK ?? questions.filter((q) => q.type === 'FILL_BLANK').length;
  const essay = typeCounts.ESSAY ?? questions.filter((q) => q.type === 'ESSAY').length;

  const allTypesData = [
    { name: 'Trắc nghiệm', value: singleChoice, color: '#2563eb', percent: calcPct(singleChoice) },
    { name: 'Nhiều đáp án', value: multipleChoice, color: '#3b82f6', percent: calcPct(multipleChoice) },
    { name: 'Đúng / Sai', value: trueFalse, color: '#60a5fa', percent: calcPct(trueFalse) },
    { name: 'Điền khuyết', value: fillBlank, color: '#93c5fd', percent: calcPct(fillBlank) },
    { name: 'Tự luận', value: essay, color: '#1d4ed8', percent: calcPct(essay) },
  ];

  const typeData = total > 0 ? (allTypesData.filter((item) => item.value > 0).length > 0 ? allTypesData.filter((item) => item.value > 0) : allTypesData) : allTypesData;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 items-stretch">
      {/* Card 1: Tổng quan ngân hàng */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs h-full">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs sm:text-sm font-black text-slate-900">Tổng quan ngân hàng</h3>
          <div className="relative">
            <select className="appearance-none bg-transparent py-0.5 pl-1 pr-4 text-[10px] sm:text-[10.5px] font-bold text-slate-600 outline-none hover:text-slate-900 cursor-pointer">
              <option>Tất cả thời gian</option>
              <option>Tháng này</option>
              <option>Học kỳ này</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pt-2">
          {/* Donut canvas */}
          <div className="relative h-20 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={26}
                  outerRadius={44}
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
              <span className="text-xs font-black text-slate-900 leading-tight">
                {total.toLocaleString('vi-VN')}
              </span>
              <span className="text-[8.5px] font-bold text-slate-400">Tổng</span>
            </div>
          </div>

          {/* Donut Legend with ample right spacing */}
          <div className="flex-1 space-y-1.5 text-xs font-semibold min-w-0 pr-1">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[10.5px] gap-1">
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-bold truncate">{item.name}</span>
                </span>
                <span className="font-extrabold text-slate-900 shrink-0">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-[9.5px] text-slate-400 font-medium">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Phân bố độ khó */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs h-full">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
          Phân bố độ khó
        </h3>

        <div className="space-y-2 pt-2 pr-1">
          {difficultyData.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-bold">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-900 font-extrabold">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-[9.5px] text-slate-400 font-medium">({item.percent})</span>
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
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs h-full">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
          Phân bố loại câu hỏi
        </h3>

        <div className="flex items-center gap-2 sm:gap-3 pt-2">
          {/* Donut canvas */}
          <div className="relative h-20 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={26}
                  outerRadius={44}
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
              <span className="text-[8.5px] font-bold text-slate-400">Tổng</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 space-y-1 text-xs font-semibold min-w-0 pr-1 max-h-24 overflow-y-auto">
            {typeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[10.5px] gap-1">
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-bold truncate">{item.name}</span>
                </span>
                <span className="font-extrabold text-slate-900 shrink-0">
                  {item.value.toLocaleString('vi-VN')}{' '}
                  <span className="text-[9.5px] text-slate-400 font-medium">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 4: Thao tác nhanh */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs h-full">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
          Thao tác nhanh
        </h3>

        <div className="space-y-1 pt-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-between rounded-xl px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              <span>Thêm câu hỏi mới</span>
            </span>
            <ArrowRight className="h-3 w-3 text-blue-500" />
          </button>

          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-center justify-between rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-slate-600" />
              <span>Nhập từ file Excel</span>
            </span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex w-full items-center justify-between rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              <span>Xuất ngân hàng câu hỏi</span>
            </span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-between rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FolderPlus className="h-3.5 w-3.5 text-slate-600" />
              <span>Quản lý chủ đề</span>
            </span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
