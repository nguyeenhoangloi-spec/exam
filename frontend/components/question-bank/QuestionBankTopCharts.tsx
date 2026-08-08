'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Upload, Download, Zap, BarChart2, LayoutGrid, Database, ChevronRight } from 'lucide-react';

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
  const total = counts.total ?? questions.length ?? 0;
  const approved = counts.APPROVED ?? counts.approved ?? questions.filter((q) => q.status === 'APPROVED').length;
  const pending = counts.PENDING ?? counts.pending ?? questions.filter((q) => q.status === 'PENDING').length;
  const rejected = counts.REJECTED ?? counts.rejected ?? questions.filter((q) => q.status === 'REJECTED').length;

  const pctLabel = (val: number) => total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0%';

  const statusData = [
    { name: 'Đã duyệt', value: approved, color: '#10b981' },
    { name: 'Chờ duyệt', value: pending, color: '#f59e0b' },
    { name: 'Từ chối', value: rejected, color: '#ef4444' },
  ];

  const difficultyCounts = (counts.difficulty || {}) as Record<string, number>;
  const easy = difficultyCounts.EASY ?? questions.filter((q) => q.difficulty === 'EASY').length;
  const medium = difficultyCounts.MEDIUM ?? questions.filter((q) => q.difficulty === 'MEDIUM').length;
  const hard = difficultyCounts.HARD ?? questions.filter((q) => q.difficulty === 'HARD').length;

  const difficultyData = [
    { label: 'Dễ', value: easy, color: '#10b981', pct: total > 0 ? (easy / total) * 100 : 0, pill: 'bg-emerald-50 text-emerald-700' },
    { label: 'Trung bình', value: medium, color: '#f59e0b', pct: total > 0 ? (medium / total) * 100 : 0, pill: 'bg-amber-50 text-amber-700' },
    { label: 'Khó', value: hard, color: '#ef4444', pct: total > 0 ? (hard / total) * 100 : 0, pill: 'bg-rose-50 text-rose-700' },
  ];

  const typeCounts = (counts.types || {}) as Record<string, number>;
  const singleChoice = typeCounts.SINGLE_CHOICE ?? questions.filter((q) => !q.type || q.type === 'SINGLE_CHOICE').length;
  const multipleChoice = typeCounts.MULTIPLE_CHOICE ?? questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
  const trueFalse = typeCounts.TRUE_FALSE ?? questions.filter((q) => q.type === 'TRUE_FALSE').length;
  const fillBlank = typeCounts.FILL_BLANK ?? questions.filter((q) => q.type === 'FILL_BLANK').length;
  const essay = typeCounts.ESSAY ?? questions.filter((q) => q.type === 'ESSAY').length;

  const allTypesData = [
    { name: 'Trắc nghiệm', value: singleChoice, color: '#2563eb' },
    { name: 'Nhiều đáp án', value: multipleChoice, color: '#7c3aed' },
    { name: 'Đúng/Sai', value: trueFalse, color: '#0891b2' },
    { name: 'Điền khuyết', value: fillBlank, color: '#059669' },
    { name: 'Tự luận', value: essay, color: '#dc2626' },
  ];
  const typeData = allTypesData.filter((d) => d.value > 0).length > 0
    ? allTypesData.filter((d) => d.value > 0)
    : allTypesData;

  // Shared class tokens
  const cardCls = 'group flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md overflow-hidden cursor-pointer';
  const hdrCls = 'flex items-center gap-2 border-b border-slate-100 pb-3 mb-3';
  const iconCls = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-110';
  const titleCls = 'text-[11.5px] font-black uppercase tracking-wider text-slate-600';
  const legendRowCls = 'flex items-center justify-between gap-1';
  const legendNameCls = 'text-[11px] font-semibold text-slate-600 truncate';
  const legendValCls = 'text-[11px] font-black text-slate-800 shrink-0';
  const legendPctCls = 'text-[9px] text-slate-400 font-medium ml-0.5';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

      {/* ─── Card 1: Tổng quan ─── */}
      <div className={cardCls}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <span className={`${iconCls} bg-blue-50 border-blue-100`}>
              <Database className="h-4 w-4 text-blue-600" />
            </span>
            <span className={titleCls}>Tổng quan ngân hàng</span>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 px-4 pb-4">
          <div className="relative h-[84px] w-[84px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2} stroke="none">
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[14px] font-black text-slate-900 leading-none">{total.toLocaleString('vi-VN')}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">Tổng</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {statusData.map((item) => (
              <div key={item.name} className={legendRowCls}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className={legendNameCls}>{item.name}</span>
                </span>
                <span className={legendValCls}>
                  {item.value.toLocaleString('vi-VN')}
                  <span className={legendPctCls}>({pctLabel(item.value)})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Card 2: Độ khó ─── */}
      <div className={cardCls}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <span className={`${iconCls} bg-blue-50 border-blue-100`}>
              <BarChart2 className="h-4 w-4 text-blue-600" />
            </span>
            <span className={titleCls}>Phân bố độ khó</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 px-4 pb-4">
          {difficultyData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${item.pill}`}>
                  {item.label}
                </span>
                <span className={legendValCls}>
                  {item.value.toLocaleString('vi-VN')}
                  <span className="text-[9px] text-slate-400 font-medium ml-1">({pctLabel(item.value)})</span>
                </span>
              </div>
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Card 3: Loại câu hỏi ─── */}
      <div className={cardCls}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <span className={`${iconCls} bg-blue-50 border-blue-100`}>
              <LayoutGrid className="h-4 w-4 text-blue-600" />
            </span>
            <span className={titleCls}>Phân bố loại câu hỏi</span>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 px-4 pb-4">
          <div className="relative h-[84px] w-[84px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={3} stroke="none">
                  {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[14px] font-black text-slate-900 leading-none">{total.toLocaleString('vi-VN')}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">Tổng</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-24">
            {typeData.map((item) => (
              <div key={item.name} className={legendRowCls}>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className={legendNameCls}>{item.name}</span>
                </span>
                <span className={legendValCls}>
                  {item.value.toLocaleString('vi-VN')}
                  <span className={legendPctCls}>({pctLabel(item.value)})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Card 4: Thao tác nhanh ─── */}
      <div className={cardCls}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <span className={`${iconCls} bg-blue-50 border-blue-100`}>
              <Zap className="h-4 w-4 text-blue-600" />
            </span>
            <span className={titleCls}>Thao tác nhanh</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1 px-3 pb-4">
          <button
            type="button"
            onClick={onAdd}
            className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100">
                <Plus className="h-3 w-3 text-slate-600" />
              </span>
              Thêm câu hỏi mới
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {[
            { label: 'Nhập từ file Excel', icon: <Upload className="h-3 w-3 text-slate-600" />, fn: onImport },
            { label: 'Xuất ngân hàng câu hỏi', icon: <Download className="h-3 w-3 text-slate-600" />, fn: onExport },

          ].map(({ label, icon, fn }) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100">
                  {icon}
                </span>
                {label}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


