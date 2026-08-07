'use client';

import React, { FormEvent, useState } from 'react';
import {
  Sparkles, Calendar, AlertTriangle, CheckCircle2,
  FileText, CheckSquare, ChevronDown, X,
} from 'lucide-react';
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
    examType?: string;
    selectionMode?: string;
    easyScore?: string;
    mediumScore?: string;
    hardScore?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleDurationChange: (duration: string) => void;
  onSubmit: (e: FormEvent) => void;
  creating: boolean;
  selectedSchedule?: any;
  scheduleDuration: number;
  currentTotal: number;
  requiredTotal: number;
  isValidTotal: boolean;
  isEssay?: boolean;
}

const fmt = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : 'Chưa có ngày');

// Design-system aligned defaults
const ESSAY_DEFAULTS = { easyCount: '3', mediumCount: '2', hardCount: '0' };
const MC_60 = { easyCount: '16', mediumCount: '16', hardCount: '8' };
const MC_90 = { easyCount: '24', mediumCount: '24', hardCount: '12' };

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
}: ExamPaperMatrixFormProps) {
  const [showPanel, setShowPanel] = useState(false);

  const examType = formData.examType || 'TRAC_NGHIEM';
  const isEssay  = examType === 'TU_LUAN';
  const scheduleType = selectedSchedule?.examType === 'TU_LUAN' ? 'TU_LUAN' : selectedSchedule?.examType === 'TRAC_NGHIEM' ? 'TRAC_NGHIEM' : undefined;

  const isPublished = Boolean(
    selectedSchedule?.hasPublishedPaper ||
    selectedSchedule?.examPapers?.some((p: any) => p.status === 'PUBLISHED')
  );

  const isScheduleExpired = (s: any) => {
    if (['COMPLETED', 'CANCELLED', 'LOCKED'].includes(s?.status)) return true;
    if (!s?.examDate) return false;
    try {
      const scheduleEnd = new Date(s.examDate);
      if (s.endTime) {
        const [h, m] = s.endTime.split(':').map(Number);
        scheduleEnd.setHours(h || 23, m || 59, 0, 0);
      } else {
        scheduleEnd.setHours(23, 59, 59, 999);
      }
      return scheduleEnd.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const hasPaper = (s: any) => {
    if (s?.hasPublishedPaper) return true;
    if (typeof s?.paperCount === 'number' && s.paperCount > 0) return true;
    if (Array.isArray(s?.examPapers) && s.examPapers.length > 0) return true;
    return false;
  };

  const pending = schedules.filter((s: any) => !hasPaper(s) && !isScheduleExpired(s));
  const created = schedules.filter((s: any) => hasPaper(s));
  const expired = schedules.filter((s: any) => !hasPaper(s) && isScheduleExpired(s));

  const label = (s: any) => ({
    subCode:    s.subjectCode    || s.subject?.subjectCode    || 'MH',
    subName:    s.subjectName    || s.subject?.subjectName    || 'Môn',
    periodName: s.periodName     || s.period?.name            || s.examPeriod?.name || 'Kỳ thi',
  });

  const switchType = (type: 'TRAC_NGHIEM' | 'DIEN_LO' | 'TU_LUAN') => {
    if (type === 'TU_LUAN') {
      setFormData((p: any) => ({ ...p, examType: type, ...ESSAY_DEFAULTS }));
    } else {
      const d = formData.durationMinutes === '90' ? MC_90 : MC_60;
      setFormData((p: any) => ({ ...p, examType: type, ...d }));
    }
  };

  const selectSchedule = (id: string) => {
    setFormData((p: any) => ({ ...p, examScheduleId: id }));
    setShowPanel(false);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900">Tạo Đề thi theo Ma trận</h3>
          <p className="text-[11px] font-semibold text-slate-400">Tự động chọn ngẫu nhiên từ Ngân hàng đề</p>
        </div>

        {/* Preset buttons — always visible, hint only */}
        <div className="flex items-center gap-2 shrink-0">
          {(['60', '90'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleDurationChange(m)}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition cursor-pointer border ${
                formData.durationMinutes === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {m} phút
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* ── ROW 1: 4 fields, uniform height ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">

          {/* 1. Loại đề */}
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Loại đề <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => switchType('TRAC_NGHIEM')}
                className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold border transition cursor-pointer ${
                  examType === 'TRAC_NGHIEM'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                TN
              </button>
              <button
                type="button"
                onClick={() => switchType('DIEN_LO')}
                className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold border transition cursor-pointer ${
                  examType === 'DIEN_LO' || examType === 'FILL_BLANK'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                Điền lỗ
              </button>
              <button
                type="button"
                onClick={() => switchType('TU_LUAN')}
                className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold border transition cursor-pointer ${
                  examType === 'TU_LUAN'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                TL
              </button>
            </div>
            <p className="text-[9.5px] text-slate-400 font-semibold">
              {examType === 'DIEN_LO' || examType === 'FILL_BLANK' ? 'Điền vào chỗ trống' : isEssay ? 'Tự luận' : 'Trắc nghiệm'}
            </p>
          </div>

          {/* 2. Mã đề gốc */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Mã đề gốc</label>
            <input
              type="text"
              required
              value={formData.paperCode}
              onChange={(e) => setFormData((p: any) => ({ ...p, paperCode: e.target.value }))}
              placeholder="101"
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* 3. Số mã đảo */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Số mã đảo</label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.variantCount}
              onChange={(e) => setFormData((p: any) => ({ ...p, variantCount: e.target.value }))}
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* 4. Thời gian */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Thời gian (phút)</label>
            <input
              type="number"
              min={15}
              max={scheduleDuration || 180}
              value={formData.durationMinutes}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
            />
            {scheduleDuration > 0 && (
              <p className="text-[9.5px] text-slate-400 font-semibold">Tối đa: {scheduleDuration} phút</p>
            )}
          </div>
        </div>

        {/* ── ROW 2: Schedule Selector ── */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Chọn Ca thi / Lịch thi <span className="text-red-500">*</span>
          </label>

          {selectedSchedule ? (
            <button
              type="button"
              onClick={() => setShowPanel(!showPanel)}
              className="w-full flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-left hover:bg-blue-50 transition cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">
                  [{(selectedSchedule as any).subjectCode || (selectedSchedule as any).subject?.subjectCode || 'MH'}]{' '}
                  {(selectedSchedule as any).subjectName || (selectedSchedule as any).subject?.subjectName || 'Môn thi'}
                  {' — '}
                  {(selectedSchedule as any).periodName || (selectedSchedule as any).examPeriod?.name || 'Kỳ thi'}
                </p>
                <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                  {fmt(selectedSchedule.examDate)} · {selectedSchedule.startTime} – {selectedSchedule.endTime}
                  {scheduleDuration > 0 && ` · ${scheduleDuration} phút`}
                </p>
              </div>
              <span className="text-[10px] font-bold text-blue-500 shrink-0 flex items-center gap-0.5">
                Đổi <ChevronDown className="h-3 w-3" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPanel(!showPanel)}
              className="w-full flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-400">Nhấn để chọn Ca thi / Lịch thi</span>
              <ChevronDown className="h-4 w-4 text-slate-400 ml-auto shrink-0" />
            </button>
          )}

          {/* Modal popup overlay */}
          {showPanel && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={() => setShowPanel(false)}
              />

              {/* Popup card — centered */}
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-900">Chọn Ca thi / Lịch thi</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                        {pending.length} ca chưa có đề · {created.length} ca đã có đề
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPanel(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body — 2 columns */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

                    {/* LEFT: Chưa có đề */}
                    <div>
                      <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100 z-10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Chưa có đề ({pending.length})
                        </span>
                      </div>
                      {pending.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Không có ca thi cần tạo đề</p>
                      ) : (
                        pending.map((s: any) => {
                          const { subCode, subName, periodName } = label(s);
                          const active = formData.examScheduleId === String(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectSchedule(String(s.id))}
                              className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-blue-50 transition cursor-pointer ${
                                active ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''
                              }`}
                            >
                              <p className={`text-xs font-black truncate ${active ? 'text-blue-700' : 'text-slate-800'}`}>
                                [{subCode}] {subName}
                              </p>
                              <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5 truncate">
                                {periodName} · {fmt(s.examDate)}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{s.startTime} – {s.endTime}</p>
                            </button>
                          );
                        })
                      )}

                      {/* Phân đoạn ca thi Đã quá hạn / Đã kết thúc */}
                      {expired.length > 0 && (
                        <div className="border-t border-slate-200 bg-slate-100/50 pt-2">
                          <div className="px-4 py-1.5 bg-slate-200/60">
                            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                              📁 Đã quá hạn / Đã kết thúc ({expired.length})
                            </span>
                          </div>
                          {expired.map((s: any) => {
                            const { subCode, subName, periodName } = label(s);
                            return (
                              <div
                                key={s.id}
                                className="w-full text-left px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 opacity-60 cursor-not-allowed select-none"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-extrabold text-slate-600 truncate">
                                    [{subCode}] {subName}
                                  </p>
                                  <span className="shrink-0 rounded-md bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5">
                                    Đã quá hạn
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                                  {periodName} · {fmt(s.examDate)} ({s.startTime} – {s.endTime})
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Đã có đề */}
                    <div>
                      <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100 z-10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Đã có đề ({created.length})
                        </span>
                      </div>
                      {created.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Chưa có</p>
                      ) : (
                        created.map((s: any) => {
                          const { subCode, subName, periodName } = label(s);
                          const active = formData.examScheduleId === String(s.id);
                          const count  = s.examPapers?.length || 0;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectSchedule(String(s.id))}
                              className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-blue-50 transition cursor-pointer ${
                                active ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <p className={`text-xs font-black truncate flex-1 ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                                  [{subCode}] {subName}
                                </p>
                                {s.examPapers?.some((p: any) => p.status === 'PUBLISHED') && (
                                  <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5">
                                    Đã phát hành
                                  </span>
                                )}
                                <span className="shrink-0 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5">
                                  {count} đề
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5 truncate">
                                {periodName} · {fmt(s.examDate)}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                    <button
                      type="button"
                      onClick={() => setShowPanel(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── ROW 3: Difficulty Matrix ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-600">
                Ma trận phân bổ đề thi
              </span>
            </div>

            {/* Switch Mode */}
            <div className="flex items-center rounded-lg bg-slate-200/70 p-0.5 text-[10px] font-extrabold">
              <button
                type="button"
                onClick={() => setFormData((p: any) => ({ ...p, selectionMode: 'BY_COUNT' }))}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  (formData.selectionMode || 'BY_COUNT') === 'BY_COUNT'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Số câu
              </button>
              <button
                type="button"
                onClick={() => setFormData((p: any) => ({ ...p, selectionMode: 'BY_SCORE', easyScore: '3', mediumScore: '4', hardScore: '3' }))}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  formData.selectionMode === 'BY_SCORE'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Thang điểm (Ngân hàng)
              </button>
            </div>
          </div>

          {formData.selectionMode === 'BY_SCORE' ? (
            <div className="space-y-2">
              <p className="text-[11.5px] text-slate-600 font-semibold px-0.5 py-1">
                Hệ thống tự động quét Ngân hàng câu hỏi & lấy điểm gốc để tìm tập hợp khớp với thang điểm bên dưới.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Dễ (Điểm mục tiêu)', key: 'easyScore', accent: 'emerald' },
                  { label: 'TB (Điểm mục tiêu)', key: 'mediumScore', accent: 'amber'   },
                  { label: 'Khó (Điểm mục tiêu)', key: 'hardScore', accent: 'red'     },
                ].map(({ label: lb, key, accent }) => (
                  <div key={key} className="rounded-xl bg-white border border-slate-200 p-2.5 space-y-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide block ${
                      accent === 'emerald' ? 'text-emerald-700' :
                      accent === 'amber'   ? 'text-amber-700'   :
                      'text-red-700'
                    }`}>
                      {lb}
                    </span>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={10}
                      value={(formData as any)[key] || ''}
                      onChange={(e) => setFormData((p: any) => ({ ...p, [key]: e.target.value }))}
                      className="w-full rounded-lg border border-blue-200 bg-blue-50/20 px-2.5 py-1.5 text-sm font-black text-slate-900 outline-none focus:bg-white transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Dễ (Số câu)',        key: 'easyCount',   accent: 'emerald' },
                { label: 'Trung bình (Số câu)', key: 'mediumCount', accent: 'amber'   },
                { label: 'Khó (Số câu)',        key: 'hardCount',   accent: 'red'     },
              ].map(({ label: lb, key, accent }) => (
                <div key={key} className="rounded-xl bg-white border border-slate-200 p-2.5 space-y-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide block ${
                    accent === 'emerald' ? 'text-emerald-700' :
                    accent === 'amber'   ? 'text-amber-700'   :
                    'text-red-700'
                  }`}>
                    {lb}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData((p: any) => ({ ...p, [key]: e.target.value }))}
                    className={`w-full rounded-lg border bg-slate-50 px-2.5 py-1.5 text-sm font-black text-slate-900 outline-none focus:bg-white transition ${
                      accent === 'emerald' ? 'border-emerald-200 focus:border-emerald-400' :
                      accent === 'amber'   ? 'border-amber-200   focus:border-amber-400'   :
                      'border-red-200      focus:border-red-400'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {isPublished ? (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              Lịch thi này đã có đề công bố. Không thể sinh thêm đề tự động.
            </p>
          ) : currentTotal < 1 ? (
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Cần ít nhất 1 câu hỏi
            </p>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sẵn sàng tạo đề
            </span>
          )}

          <button
            type="submit"
            disabled={creating || currentTotal < 1 || isPublished}
            className={`rounded-xl text-white px-5 py-2.5 text-xs font-black transition shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
              isPublished
                ? 'bg-slate-400 opacity-60'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {creating
              ? 'Đang sinh đề...'
              : isPublished
              ? 'Đã Có Đề Công Bố'
              : 'Tạo đề chung'}
          </button>
        </div>
      </div>
    </form>
  );
}
