'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Minus,
  FileText,
  AlertTriangle,
  Clock,
  User,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '../ui/Button';

interface ExamAttemptReviewModalProps {
  attemptId: string | null;
  onClose: () => void;
}

function OptionItem({ label, text, isSelected, isCorrect, showAnswer }: { label: string; text: string; isSelected: boolean; isCorrect: boolean; showAnswer: boolean }) {
  let cls = 'border-slate-200 bg-slate-50/60 text-slate-700';
  if (showAnswer && isCorrect && isSelected) cls = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold';
  else if (showAnswer && isCorrect && !isSelected) cls = 'border-emerald-300 bg-emerald-50/60 text-emerald-800';
  else if (showAnswer && !isCorrect && isSelected) cls = 'border-rose-300 bg-rose-50 text-rose-800';
  else if (isSelected && !showAnswer) cls = 'border-blue-400 bg-blue-50 text-blue-900 font-semibold';

  return (
    <div className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs transition ${cls}`}>
      <span className="font-black text-inherit shrink-0">{label}.</span>
      <span className="flex-1 leading-relaxed">{text}</span>
      <span className="shrink-0">
        {showAnswer && isCorrect && isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {showAnswer && isCorrect && !isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        {showAnswer && !isCorrect && isSelected && <XCircle className="w-4 h-4 text-rose-500" />}
        {isSelected && !showAnswer && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300" />}
      </span>
    </div>
  );
}

function QuestionCard({ q, idx, showAnswer }: { q: any; idx: number; showAnswer: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const sel = q.studentSelection;
  const selectedIds: string[] = sel?.selectedOptionIds || [];
  const isCorrect = sel?.isCorrect;
  const score = sel?.finalScore ?? 0;

  let statusColor = 'text-slate-500';
  let StatusIcon: any = Minus;
  if (q.type !== 'ESSAY') {
    if (showAnswer) {
      if (isCorrect) { statusColor = 'text-emerald-600'; StatusIcon = CheckCircle2; }
      else if (selectedIds.length === 0) { statusColor = 'text-slate-400'; StatusIcon = Minus; }
      else { statusColor = 'text-rose-500'; StatusIcon = XCircle; }
    } else if (selectedIds.length > 0) {
      statusColor = 'text-blue-600'; StatusIcon = CheckCircle2;
    }
  }

  const borderCls = showAnswer && q.type !== 'ESSAY'
    ? isCorrect ? 'border-emerald-200' : selectedIds.length === 0 ? 'border-slate-200/90' : 'border-rose-200'
    : 'border-slate-200/90';

  return (
    <div className={`rounded-2xl border bg-white shadow-2xs overflow-hidden ${borderCls}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-slate-50/60 transition"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`shrink-0 mt-0.5 ${statusColor}`}>
            <StatusIcon className="w-4 h-4" />
          </span>
          <p className="flex-1 min-w-0 text-xs font-black text-slate-900 leading-snug line-clamp-2">
            Cau {idx + 1}: {q.content}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-black px-2 py-1 rounded-lg ${showAnswer && q.type !== 'ESSAY' ? (isCorrect ? 'bg-emerald-50 text-emerald-700' : selectedIds.length === 0 ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700') : 'bg-blue-50 text-blue-700'}`}>
            {showAnswer ? `${score}/${q.maxScore}diem` : `${q.maxScore}diem`}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 pt-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#475569] rounded-lg bg-slate-100 px-2.5 py-1">
              {q.type === 'ESSAY' ? 'Tự luận' : q.type === 'FILL_BLANK' ? 'Điền khuyết' : q.type === 'TRUE_FALSE' ? 'Đúng / Sai' : 'Trắc nghiệm'}
            </span>
            <span className="text-[13px] font-semibold text-[#475569] rounded-lg bg-slate-100 px-2.5 py-1">
              {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'Trung bình'}
            </span>
          </div>

          {q.type !== 'ESSAY' && q.type !== 'FILL_BLANK' && q.options?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt: any) => (
                <OptionItem
                  key={opt.id}
                  label={opt.label || '?'}
                  text={opt.content || opt.text || ''}
                  isSelected={selectedIds.includes(opt.id)}
                  isCorrect={Boolean(opt.isCorrect)}
                  showAnswer={showAnswer}
                />
              ))}
            </div>
          )}

          {q.type === 'FILL_BLANK' && (
            <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <p className="text-[10.5px] font-extrabold text-slate-600 uppercase tracking-wider">Bài làm điền khuyết của sinh viên:</p>
              <div className="space-y-2">
                {((q.fillBlankAnswers && q.fillBlankAnswers.length > 0 ? q.fillBlankAnswers : [{ blankIndex: 1 }]) as any[]).map((expected: any) => {
                  const bIdx = expected.blankIndex || 1;
                  const studentItem = (sel?.fillBlankAnswers || []).find((ans: any) => Number(ans.blankIndex) === Number(bIdx));
                  const studentVal = studentItem?.value || '';
                  const correctVal = expected.answer || '';
                  return (
                    <div key={bIdx} className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">Ô #{bIdx}:</span>
                        <span className="font-bold text-slate-900">{studentVal || <span className="italic text-slate-400">Bỏ trống</span>}</span>
                      </div>
                      {showAnswer && (
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Đáp án đúng: <span className="font-black">{correctVal || '---'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {q.type === 'ESSAY' && (
            <div className="space-y-2">
              <p className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">Bài làm của sinh viên:</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                {sel?.textAnswer || <span className="italic text-slate-400">Không có bài làm tự luận</span>}
              </div>
              {showAnswer && sel?.teacherComment && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 space-y-1">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Nhận xét của Giảng viên:</p>
                  <p className="text-xs text-blue-900 whitespace-pre-wrap">{sel.teacherComment}</p>
                </div>
              )}
            </div>
          )}

          {showAnswer && q.explanation && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Giai thich dap an:</p>
              <p className="text-xs text-slate-700 leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExamAttemptReviewModal({ attemptId, onClose }: ExamAttemptReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const load = useCallback(async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.getAttemptReview(attemptId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Khong the tai chi tiet bai thi');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (attemptId) void load();
  }, [attemptId, load]);

  if (!attemptId) return null;

  const correct = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === true).length ?? 0;
  const wrong = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === false).length ?? 0;
  const skipped = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === null && (q.studentSelection?.selectedOptionIds?.length ?? 0) === 0).length ?? 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[20px] font-semibold leading-[28px] text-[#0F172A]">Xem Lại Chi Tiết Bài Thi</h2>
            {data && (
              <p className="text-[13px] font-medium text-[#64748B] mt-0.5">
                {data.student?.fullName} ({data.student?.studentCode}) - {data.paper?.subjectName} - Mã đề: {data.paper?.paperCode}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Dang tai bai lam chi tiet...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-semibold text-rose-600">{error}</p>
              <button type="button" onClick={load} className="text-xs font-bold text-blue-600 hover:underline">Thu lai</button>
            </div>
          )}

          {data && !loading && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-blue-50 p-4 text-center space-y-1">
                  <Award className="w-5 h-5 text-blue-600 mx-auto" />
                  <p className="text-xl font-black text-blue-700">{data.attemptInfo?.totalScore ?? '--'} <span className="text-xs font-bold">/ {data.attemptInfo?.maxScore ?? 10}</span></p>
                  <p className="text-[13px] font-semibold text-blue-600">Tổng điểm</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-center space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  <p className="text-xl font-black text-emerald-700">{correct}</p>
                  <p className="text-[13px] font-semibold text-emerald-600">Câu đúng</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 text-center space-y-1">
                  <XCircle className="w-5 h-5 text-rose-600 mx-auto" />
                  <p className="text-xl font-black text-rose-700">{wrong}</p>
                  <p className="text-[13px] font-semibold text-rose-600">Câu sai</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4 text-center space-y-1">
                  <Minus className="w-5 h-5 text-slate-500 mx-auto" />
                  <p className="text-xl font-black text-slate-700">{skipped}</p>
                  <p className="text-[13px] font-semibold text-[#64748B]">Bỏ qua</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {data.student?.className}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> {data.paper?.durationMinutes} phut</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Nop: {data.attemptInfo?.submittedAt ? new Date(data.attemptInfo.submittedAt).toLocaleString('vi-VN') : '--'}</span>
                {data.attemptInfo?.isFlagged && (
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Vi pham - Risk {data.attemptInfo?.riskScore} diem
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Chi Tiet Tung Cau ({data.questions?.length ?? 0} cau)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${showAnswer ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {showAnswer ? 'An Dap An' : 'Hien Dap An'}
                </button>
              </div>

              <div className="space-y-3">
                {(data.questions || []).map((q: any, idx: number) => (
                  <QuestionCard key={q.questionId || idx} q={q} idx={idx} showAnswer={showAnswer} />
                ))}
              </div>

              {data.incidents?.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Su co Vi Pham ({data.incidents.length})
                  </h4>
                  {data.incidents.map((inc: any, i: number) => (
                    <div key={inc.id || i} className="text-xs text-amber-900 bg-white rounded-xl border border-amber-200 p-2.5">
                      <span className="font-bold">{inc.decision || 'Canh bao'}:</span> {inc.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 shrink-0 flex items-center justify-between gap-3 bg-white rounded-b-2xl">
          {data?.questions?.some((q: any) => q.type === 'ESSAY') ? (
            <a href={`/teacher/essay-grading?attemptId=${attemptId}`}>
              <Button variant="primary" size="md" leftIcon={<FileText className="w-4 h-4" />}>
                Chấm / Sửa Điểm Tự Luận
              </Button>
            </a>
          ) : <div />}
          <Button variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
