import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { DIFFICULTY_LABELS } from '../../lib/enum-labels';

export const QuestionStatusBadge = ({ status }: { status: string }) => {
  return <StatusBadge status={status} />;
};

export const QuestionDifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  if (difficulty === 'EASY') {
    return (
      <span className="inline-flex items-center rounded-[8px] bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-300/80 h-6">
        Dễ
      </span>
    );
  }

  if (difficulty === 'MEDIUM') {
    return (
      <span className="inline-flex items-center rounded-[8px] bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-300/80 h-6">
        Trung bình
      </span>
    );
  }

  if (difficulty === 'HARD') {
    return (
      <span className="inline-flex items-center rounded-[8px] bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-300/80 h-6">
        Khó
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-[8px] bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 h-6">
      {DIFFICULTY_LABELS[difficulty] || difficulty}
    </span>
  );
};

export const QuestionTypeBadge = ({ type }: { type: string }) => {
  const isEssay = type === 'ESSAY';
  return (
    <span
      className={`inline-flex items-center rounded-[8px] border px-2.5 py-0.5 text-[11px] font-bold h-6 ${
        isEssay
          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
          : 'bg-emerald-50 text-emerald-700 border-emerald-300/80'
      }`}
    >
      {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
    </span>
  );
};
