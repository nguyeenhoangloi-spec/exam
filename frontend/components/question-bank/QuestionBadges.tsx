import React from 'react';
import { Check, X, Clock, FileText } from 'lucide-react';
import {
  QUESTION_STATUS_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
} from '../../lib/enum-labels';

export const QuestionStatusBadge = ({ status }: { status: string }) => {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80">
        <Check className="h-3 w-3 text-emerald-600" />
        <span>Đã duyệt</span>
      </span>
    );
  }

  if (status === 'PENDING' || status === 'PENDING_APPROVAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200/80">
        <Clock className="h-3 w-3 text-amber-600" />
        <span>Chờ duyệt</span>
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200/80">
        <X className="h-3 w-3 text-rose-600" />
        <span>Bị từ chối</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
      <FileText className="h-3 w-3 text-slate-500" />
      <span>{QUESTION_STATUS_LABELS[status] || 'Nháp'}</span>
    </span>
  );
};

export const QuestionDifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  if (difficulty === 'EASY') {
    return (
      <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
        Dễ
      </span>
    );
  }

  if (difficulty === 'MEDIUM') {
    return (
      <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
        Trung bình
      </span>
    );
  }

  if (difficulty === 'HARD') {
    return (
      <span className="inline-block rounded-lg bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
        Khó
      </span>
    );
  }

  return (
    <span className="inline-block rounded-lg bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
      {DIFFICULTY_LABELS[difficulty] || difficulty}
    </span>
  );
};

export const QuestionTypeBadge = ({ type }: { type: string }) => {
  const label = type === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm';
  return (
    <span className="text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
};
