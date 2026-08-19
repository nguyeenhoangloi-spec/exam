'use client';
import { FilterSelect } from '../ui/FilterSelect';

import React, { FormEvent, useState } from 'react';
import {
  AlertTriangle, X, ArrowLeftRight, Sparkles,
} from 'lucide-react';
import { ExamSchedule } from '../../types';
import { Button } from '../ui/Button';

export interface ExamPaperMatrixFormData {
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
  mediaMaxPlays?: string;
}

interface ExamPaperMatrixFormProps {
  schedules: ExamSchedule[];
  formData: ExamPaperMatrixFormData;
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
  const isEssay = examType === 'TU_LUAN';

  const isByScoreMode = formData.selectionMode === 'BY_SCORE';
  const currentTotalScore = (Number(formData.easyScore) || 0) + (Number(formData.mediumScore) || 0) + (Number(formData.hardScore) || 0);
  const isValidMatrix = isByScoreMode ? currentTotalScore > 0 : currentTotal >= 1;

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

  const sortByNewest = (list: any[]) =>
    [...list].sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const pending = sortByNewest(schedules.filter((s: any) => !hasPaper(s) && !isScheduleExpired(s)));
  const created = sortByNewest(schedules.filter((s: any) => hasPaper(s)));
  const expired = sortByNewest(schedules.filter((s: any) => !hasPaper(s) && isScheduleExpired(s)));

  const label = (s: any) => ({
    subCode: s.subjectCode || s.subject?.subjectCode || 'MH',
    subName: s.subjectName || s.subject?.subjectName || 'Môn',
    periodName: s.periodName || s.period?.name || s.examPeriod?.name || 'Kỳ thi',
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
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">

      {/* ── HEADER (Thuần túy, không khung, không nền, không icon) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
            Tạo đề thi theo ma trận
          </h3>
          <p className="text-type-helper font-normal text-slate-400 dark:text-slate-500 mt-0.5">
            Tự động chọn ngẫu nhiên từ Ngân hàng đề
          </p>
        </div>

        {/* Preset switch — không khung, không nền */}
        <div className="flex items-center gap-3 text-type-helper font-semibold shrink-0">
          <button
            type="button"
            onClick={() => handleDurationChange('60')}
            className={`transition cursor-pointer ${formData.durationMinutes !== '90'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            60 phút
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            type="button"
            onClick={() => handleDurationChange('90')}
            className={`transition cursor-pointer ${formData.durationMinutes === '90'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            90 phút
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── ROW 1: 4 Cấu hình cơ bản ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">

          {/* 1. Loại đề */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-900 dark:text-slate-100">
              Loại đề <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => switchType('TRAC_NGHIEM')}
                className={`flex h-10 items-center justify-center gap-1 rounded-xl text-type-helper font-semibold border transition cursor-pointer ${examType === 'TRAC_NGHIEM'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                TN
              </button>
              <button
                type="button"
                onClick={() => switchType('DIEN_LO')}
                className={`flex h-10 items-center justify-center gap-1 rounded-xl text-type-helper font-semibold border transition cursor-pointer ${examType === 'DIEN_LO' || examType === 'FILL_BLANK'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                Điền lỗ
              </button>
              <button
                type="button"
                onClick={() => switchType('TU_LUAN')}
                className={`flex h-10 items-center justify-center gap-1 rounded-xl text-type-helper font-semibold border transition cursor-pointer ${examType === 'TU_LUAN'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                TL
              </button>
            </div>
            <p className="text-type-helper text-slate-400 dark:text-slate-500 font-medium">
              {examType === 'DIEN_LO' || examType === 'FILL_BLANK' ? 'Điền vào chỗ trống' : isEssay ? 'Tự luận' : 'Trắc nghiệm'}
            </p>
          </div>

          {/* 2. Mã đề gốc */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-900 dark:text-slate-100">
              Mã đề gốc
            </label>
            <input
              type="text"
              required
              value={formData.paperCode}
              onChange={(e) => setFormData((p: any) => ({ ...p, paperCode: e.target.value }))}
              placeholder="101"
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          {/* 3. Số mã đảo */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-900 dark:text-slate-100">
              Số mã đảo
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.variantCount}
              onChange={(e) => setFormData((p: any) => ({ ...p, variantCount: e.target.value }))}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          {/* 4. Thời gian */}
          <div className="space-y-1.5">
            <label className="block text-type-body font-medium text-slate-900 dark:text-slate-100">
              Thời gian (phút)
            </label>
            <input
              type="number"
              min={15}
              max={scheduleDuration || 180}
              value={formData.durationMinutes}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
            {scheduleDuration > 0 && (
              <p className="text-type-helper text-slate-400 dark:text-slate-500 font-medium">
                Tối đa: {scheduleDuration} phút
              </p>
            )}
          </div>
        </div>

        {/* ── ROW 2: Ca thi (Thuần túy, không khung, không nền, không icon thừa) ── */}
        <div className="space-y-1 pt-1">
          <label className="block text-type-body font-medium text-slate-900 dark:text-slate-100">
            Chọn Ca thi / Lịch thi <span className="text-rose-500">*</span>
          </label>

          {selectedSchedule ? (
            <div className="py-0.5 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-type-helper font-semibold bg-blue-600 text-white tracking-wide">
                  {(selectedSchedule as any)?.mode === 'MOCK' ? 'THI THỬ' : 'CHÍNH THỨC'}
                </span>
                <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  {(selectedSchedule as any).subjectName || (selectedSchedule as any).subject?.subjectName || 'Môn thi'}
                </span>
                <span className="text-type-helper font-medium text-slate-400">
                  #{(selectedSchedule as any).subjectCode || (selectedSchedule as any).subject?.subjectCode || 'MH'}
                </span>
                {((selectedSchedule as any).periodName || (selectedSchedule as any).examPeriod?.name) && (
                  <span className="text-type-helper font-normal text-slate-400 hidden sm:inline">
                    — {(selectedSchedule as any).periodName || (selectedSchedule as any).examPeriod?.name}
                  </span>
                )}

                {/* Nút Đổi Ca thuần icon, không chữ, không khung, không nền */}
                <button
                  type="button"
                  onClick={() => setShowPanel(true)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                  title="Đổi ca thi khác"
                  aria-label="Đổi ca thi khác"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-type-helper text-slate-500 dark:text-slate-400 flex-wrap">
                {selectedSchedule.examDate && (
                  <span>{fmt(selectedSchedule.examDate)}</span>
                )}
                {selectedSchedule.startTime && (
                  <span>{selectedSchedule.startTime} – {selectedSchedule.endTime}</span>
                )}
                {scheduleDuration > 0 && (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {scheduleDuration} phút
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <span className="text-type-helper font-medium text-slate-500">Chưa chọn ca thi</span>
              <button
                type="button"
                onClick={() => setShowPanel(true)}
                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                title="Nhấn để chọn ca thi"
                aria-label="Nhấn để chọn ca thi"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Modal popup overlay */}
          {showPanel && (
            <>
              <div
                className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
                onClick={() => setShowPanel(false)}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
                    <div>
                      <p className="text-type-card font-semibold text-white tracking-tight">Chọn Ca thi / Lịch thi</p>
                      <p className="text-type-helper font-semibold text-blue-100 mt-0.5">
                        {pending.length} ca chưa có đề · {created.length} ca đã có đề
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPanel(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-blue-100 hover:text-white hover:bg-blue-700/80 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div>
                      <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10">
                        <span className="text-type-helper font-semibold text-slate-500 tracking-wider">
                          Chưa có đề ({pending.length})
                        </span>
                      </div>
                      {pending.length === 0 ? (
                        <p className="px-4 py-6 text-type-helper text-slate-400 text-center font-semibold">Không có ca thi cần tạo đề</p>
                      ) : (
                        pending.map((s: any) => {
                          const { subCode, subName, periodName } = label(s);
                          const active = formData.examScheduleId === String(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectSchedule(String(s.id))}
                              className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${active ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''
                                }`}
                            >
                              <p className={`text-type-helper font-semibold truncate ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                [{subCode}] {subName}
                              </p>
                              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">
                                {periodName} · {fmt(s.examDate)}
                              </p>
                              <p className="text-type-helper text-slate-400 dark:text-slate-500 mt-0.5">{s.startTime} – {s.endTime}</p>
                            </button>
                          );
                        })
                      )}

                      {expired.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 pt-2">
                          <div className="px-4 py-1.5 bg-slate-200/60 dark:bg-slate-700/60">
                            <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-300 tracking-wider">
                              📁 Đã quá hạn / Đã kết thúc ({expired.length})
                            </span>
                          </div>
                          {expired.map((s: any) => {
                            const { subCode, subName, periodName } = label(s);
                            return (
                              <div
                                key={s.id}
                                className="w-full text-left px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 opacity-60 cursor-not-allowed select-none"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-type-helper font-semibold text-slate-600 dark:text-slate-300 truncate">
                                    [{subCode}] {subName}
                                  </p>
                                  <span className="inline-flex items-center gap-[6px] shrink-0 text-type-helper leading-5 font-semibold text-danger-600">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Đã quá hạn
                                  </span>
                                </div>
                                <p className="text-type-helper text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                                  {periodName} · {fmt(s.examDate)} ({s.startTime} – {s.endTime})
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10">
                        <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-300 tracking-wider">
                          Đã có đề ({created.length})
                        </span>
                      </div>
                      {created.length === 0 ? (
                        <p className="px-4 py-6 text-type-helper text-slate-400 text-center font-semibold">Chưa có</p>
                      ) : (
                        created.map((s: any) => {
                          const { subCode, subName, periodName } = label(s);
                          const active = formData.examScheduleId === String(s.id);
                          const count = s.examPapers?.length || 0;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectSchedule(String(s.id))}
                              className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${active ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <p className={`text-type-helper font-semibold truncate flex-1 ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                  [{subCode}] {subName}
                                </p>
                                <span className="shrink-0 text-type-helper font-semibold text-slate-600 dark:text-slate-300">
                                  {count} đề
                                </span>
                              </div>
                              <p className="text-type-helper text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                                {periodName} · {fmt(s.examDate)}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setShowPanel(false)}
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── ROW 3: Ma trận phân bổ đề thi ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-type-body font-medium text-slate-700 dark:text-slate-300">
              Ma trận phân bổ đề thi
            </h4>

            {/* Switch Mode: Pill Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setFormData((p: any) => ({ ...p, selectionMode: 'BY_COUNT' }))}
                className={`px-3 py-1 rounded-xl text-type-helper font-semibold transition-all cursor-pointer ${formData.selectionMode !== 'BY_SCORE'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                Theo số câu
              </button>
              <button
                type="button"
                onClick={() => setFormData((p: any) => ({ ...p, selectionMode: 'BY_SCORE', easyScore: '3', mediumScore: '4', hardScore: '3' }))}
                className={`px-3 py-1 rounded-xl text-type-helper font-semibold transition-all cursor-pointer ${formData.selectionMode === 'BY_SCORE'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                Theo thang điểm
              </button>
            </div>
          </div>

          {formData.selectionMode === 'BY_SCORE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Dễ (Điểm)', key: 'easyScore' },
                { label: 'Trung bình (Điểm)', key: 'mediumScore' },
                { label: 'Khó (Điểm)', key: 'hardScore' },
              ].map(({ label: lb, key }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">{lb}</label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    max={10}
                    value={(formData as any)[key] || ''}
                    onChange={(e) => setFormData((p: any) => ({ ...p, [key]: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none transition"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Dễ (Số câu)', key: 'easyCount' },
                { label: 'Trung bình (Số câu)', key: 'mediumCount' },
                { label: 'Khó (Số câu)', key: 'hardCount' },
              ].map(({ label: lb, key }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">{lb}</label>
                  <input
                    type="number"
                    min={0}
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData((p: any) => ({ ...p, [key]: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none transition"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ROW 4: Cấu hình Media (Không icon, không khung nền thừa) ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-1 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
              Số lần phát Video/Audio mặc định cho đề thi
            </span>
            <span className="text-type-helper font-normal text-slate-400 dark:text-slate-500 mt-0.5">
              Tất cả câu hỏi nghe/xem trong đề thi này sẽ tự động áp dụng số lượt phát tối đa này
            </span>
          </div>
          <FilterSelect
            value={formData.mediaMaxPlays || '2'}
            onChange={(e) => setFormData((p: any) => ({ ...p, mediaMaxPlays: e.target.value }))}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-type-body font-medium text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="1">1 lần (Ngặt nghèo / Thi Nghe)</option>
            <option value="2">2 lần (Chuẩn Khảo thí / IELTS)</option>
            <option value="3">3 lần</option>
            <option value="5">5 lần</option>
            <option value="0">Không giới hạn</option>
          </FilterSelect>
        </div>

        {/* ── ROW 5: Footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {isPublished ? (
            <p className="text-type-helper font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              Lịch thi này đã có đề công bố. Không thể sinh thêm đề tự động.
            </p>
          ) : !isValidMatrix ? (
            <p className="text-type-helper font-semibold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isByScoreMode ? 'Cần nhập tổng điểm phân bổ > 0' : 'Cần ít nhất 1 câu hỏi'}
            </p>
          ) : (
            <span className="text-type-helper font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Sẵn sàng tạo đề
            </span>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={creating || !isValidMatrix || isPublished}
            isLoading={creating}
          >
            {creating
              ? 'Đang sinh đề...'
              : isPublished
                ? 'Đã có đề công bố'
                : 'Tạo đề thi chung'}
          </Button>
        </div>
      </div>
    </form>
  );
}
