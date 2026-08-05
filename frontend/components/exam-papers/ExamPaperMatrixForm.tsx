'use client';

import React, { FormEvent } from 'react';
import { Sparkles, Calendar, BookOpen, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { ExamSchedule } from '../../types';

interface ExamPaperMatrixFormProps {
  schedules: ExamSchedule[];
  formData: {
    examScheduleId: string;
    paperCode: string;
    durationMinutes: string;
    easyCount: string;
    mediumCount: string;
    hardCount: string;
    variantCount: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleDurationChange: (duration: string) => void;
  onSubmit: (e: FormEvent) => void;
  creating: boolean;
  selectedSchedule?: ExamSchedule;
  scheduleDuration: number;
  currentTotal: number;
  requiredTotal: number;
  isValidTotal: boolean;
}

export function ExamPaperMatrixForm({
  schedules,
  formData,
  setFormData,
  handleDurationChange,
  onSubmit,
  creating,
  selectedSchedule,
  scheduleDuration,
  currentTotal,
  requiredTotal,
  isValidTotal,
}: ExamPaperMatrixFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Tạo Đề thi Ngẫu nhiên theo Ma trận</h3>
            <p className="text-[11px] font-semibold text-slate-500">Tự động chọn ngẫu nhiên câu hỏi từ Ngân hàng đề theo cấu hình</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDurationChange('60')}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition cursor-pointer border ${
              formData.durationMinutes === '60'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Mẫu 60 phút (40 câu)
          </button>
          <button
            type="button"
            onClick={() => handleDurationChange('90')}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition cursor-pointer border ${
              formData.durationMinutes === '90'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Mẫu 90 phút (60 câu)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Schedule Select */}
        <div className="lg:col-span-5 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chọn Ca thi / Lịch thi <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              value={formData.examScheduleId}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, examScheduleId: e.target.value }))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition cursor-pointer"
            >
              <option value="">-- Chọn Ca thi --</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  [{(s as any).subjectCode || s.subject?.subjectCode || 'MH'}] {(s as any).subjectName || s.subject?.subjectName || 'Môn'} - {(s as any).periodName || (s as any).period?.name || 'Kỳ thi'} ({s.examDate})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {selectedSchedule && (
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 pt-0.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {selectedSchedule.examDate} ({selectedSchedule.startTime} - {selectedSchedule.endTime}) · Thời lượng ca thi: <strong className="text-slate-900">{scheduleDuration} phút</strong>
              </span>
            </p>
          )}
        </div>

        {/* Paper Code & Variants */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Mã đề gốc</label>
            <input
              type="text"
              required
              value={formData.paperCode}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, paperCode: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 focus:border-blue-500 outline-none"
              placeholder="101"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Số mã đảo</label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.variantCount}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, variantCount: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="lg:col-span-4 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Thời gian làm bài (Phút)</label>
          <input
            type="number"
            min={15}
            max={scheduleDuration || 180}
            value={formData.durationMinutes}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-900 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Difficulty Matrix Row */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Ma trận độ khó câu hỏi</span>
          <span className={`text-xs font-black ${isValidTotal ? 'text-emerald-600' : 'text-rose-600'}`}>
            Tổng: {currentTotal} câu {requiredTotal > 0 && `(Mẫu chuẩn: ${requiredTotal} câu)`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 space-y-1">
            <span className="text-[10.5px] font-bold text-emerald-700 uppercase">Dễ (Easy)</span>
            <input
              type="number"
              min={0}
              value={formData.easyCount}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, easyCount: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 space-y-1">
            <span className="text-[10.5px] font-bold text-amber-700 uppercase">Trung bình (Medium)</span>
            <input
              type="number"
              min={0}
              value={formData.mediumCount}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, mediumCount: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-900 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 space-y-1">
            <span className="text-[10.5px] font-bold text-rose-700 uppercase">Khó (Hard)</span>
            <input
              type="number"
              min={0}
              value={formData.hardCount}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, hardCount: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-900 focus:border-rose-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {!isValidTotal && (
          <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Thời lượng {formData.durationMinutes} phút cần {requiredTotal} câu hỏi</span>
          </p>
        )}

        <button
          type="submit"
          disabled={creating || !isValidTotal || currentTotal < 1}
          className="ml-auto flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-black transition disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          <span>{creating ? 'Đang tự động sinh đề...' : 'Tự động tạo Đề thi theo Ma trận'}</span>
        </button>
      </div>
    </form>
  );
}
