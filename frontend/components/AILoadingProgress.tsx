'use client';

import React from 'react';
import { Sparkles, Bot, FileText, CheckCircle2, Loader2, Cpu } from 'lucide-react';

export interface AILoadingProgressProps {
  percent: number;
  step: number;
  title?: string;
  message?: string;
}

export function AILoadingProgress({
  percent,
  step,
  title = 'Hệ thống AI đang khởi tạo câu hỏi...',
  message = 'Vui lòng chờ trong giây lát, hệ thống đang phân tích bài giảng và xây dựng đáp án',
}: AILoadingProgressProps) {
  const steps = [
    { id: 1, label: 'Đọc ngữ cảnh bài giảng', icon: FileText },
    { id: 2, label: 'Trợ lý AI phân tích', icon: Bot },
    { id: 3, label: 'Xây dựng câu hỏi & đáp án', icon: Cpu },
    { id: 4, label: 'Kiểm tra trùng & Hoàn tất', icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/80 via-blue-50/30 to-white p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
      {/* Top Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              {title}
            </h4>
            <p className="text-xs text-slate-500 font-medium">{message}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black tracking-tight text-blue-700 font-mono">
            {Math.min(100, Math.max(0, Math.round(percent)))}%
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 shadow-sm transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>

      {/* Stepper Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition border ${
                isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : isCurrent
                  ? 'bg-white text-blue-800 border-blue-300 shadow-xs ring-2 ring-blue-100'
                  : 'bg-slate-50 text-slate-400 border-slate-200/70'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span className="truncate text-[13px] font-semibold">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
