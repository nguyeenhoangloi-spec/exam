'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Upload, Download, Database } from 'lucide-react';
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

  // 100% chuẩn màu Xanh dương & Slate
  const statusData = [
    { name: 'Đã duyệt', value: approved, color: '#2563eb' },
    { name: 'Chờ duyệt', value: pending, color: '#60a5fa' },
    { name: 'Từ chối', value: rejected, color: '#94a3b8' },
  ];

  const difficultyCounts = (counts.difficulty || {}) as Record<string, number>;
  const easy = difficultyCounts.EASY ?? questions.filter((q) => q.difficulty === 'EASY').length;
  const medium = difficultyCounts.MEDIUM ?? questions.filter((q) => q.difficulty === 'MEDIUM').length;
  const hard = difficultyCounts.HARD ?? questions.filter((q) => q.difficulty === 'HARD').length;

  const difficultyData = [
    { label: 'Dễ', value: easy, color: '#2563eb', pct: total > 0 ? (easy / total) * 100 : 0 },
    { label: 'Trung bình', value: medium, color: '#60a5fa', pct: total > 0 ? (medium / total) * 100 : 0 },
    { label: 'Khó', value: hard, color: '#94a3b8', pct: total > 0 ? (hard / total) * 100 : 0 },
  ];

  const typeCounts = (counts.types || {}) as Record<string, number>;
  const singleChoice = typeCounts.SINGLE_CHOICE ?? questions.filter((q) => !q.type || q.type === 'SINGLE_CHOICE').length;
  const multipleChoice = typeCounts.MULTIPLE_CHOICE ?? questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
  const trueFalse = typeCounts.TRUE_FALSE ?? questions.filter((q) => q.type === 'TRUE_FALSE').length;
  const fillBlank = typeCounts.FILL_BLANK ?? questions.filter((q) => q.type === 'FILL_BLANK').length;
  const essay = typeCounts.ESSAY ?? questions.filter((q) => q.type === 'ESSAY').length;

  const allTypesData = [
    { name: 'Trắc nghiệm', value: singleChoice, color: '#2563eb' },
    { name: 'Nhiều đáp án', value: multipleChoice, color: '#3b82f6' },
    { name: 'Đúng/Sai', value: trueFalse, color: '#60a5fa' },
    { name: 'Điền khuyết', value: fillBlank, color: '#93c5fd' },
    { name: 'Tự luận', value: essay, color: '#94a3b8' },
  ];
  const typeData = allTypesData.filter((d) => d.value > 0).length > 0
    ? allTypesData.filter((d) => d.value > 0)
    : allTypesData;

  const cardCls = 'group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer';
  const iconCls = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white';
  const titleCls = 'text-[14px] font-semibold text-slate-900 dark:text-slate-100';

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">

      {/* ─── Card 1: Tổng quan trạng thái ─── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <span className={titleCls}>Tổng quan ngân hàng</span>
          <span className={iconCls}>
            <Database className="h-5 w-5" />
          </span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <div className="relative h-[80px] w-[80px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={26} outerRadius={38} paddingAngle={2} stroke="none">
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">{total.toLocaleString('vi-VN')}</span>
              <span className="text-[11px] font-normal text-slate-400 mt-0.5">Tổng</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            {statusData.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{s.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {s.value} <span className="font-normal text-slate-400 text-[11px]">({pctLabel(s.value)})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Card 2: Phân bố độ khó ─── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <span className={titleCls}>Phân bố độ khó</span>
          <span className={iconCls}>
            <span className="text-xs font-bold">LVL</span>
          </span>
        </div>
        <div className="flex-1 space-y-2.5 my-auto">
          {difficultyData.map((d, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {d.value} <span className="font-normal text-slate-400 text-[11px]">({d.pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Card 3: Loại câu hỏi ─── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <span className={titleCls}>Phân loại câu hỏi</span>
          <span className={iconCls}>
            <span className="text-xs font-bold">TYPE</span>
          </span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <div className="relative h-[80px] w-[80px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" innerRadius={26} outerRadius={38} paddingAngle={2} stroke="none">
                  {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">{typeData.length}</span>
              <span className="text-[11px] font-normal text-slate-400 mt-0.5">Dạng</span>
            </div>
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            {typeData.slice(0, 3).map((t, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{t.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Card 4: Thao tác nhanh ─── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <span className={titleCls}>Tác vụ ngân hàng</span>
          <span className={iconCls}>
            <Plus className="h-5 w-5" />
          </span>
        </div>
        <div className="flex flex-col gap-2 my-auto">
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo câu hỏi mới</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onImport}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              <Upload className="h-3 w-3 text-slate-400" />
              <span>Nhập file</span>
            </button>
            <button
              type="button"
              onClick={onExport}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              <Download className="h-3 w-3 text-slate-400" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
