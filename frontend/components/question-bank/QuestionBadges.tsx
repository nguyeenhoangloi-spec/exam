import React from 'react';
import {
  QUESTION_STATUS_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
} from '../../lib/enum-labels';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border border-slate-300',
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-300',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800 border border-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 border border-rose-300',
  ARCHIVED: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
};

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  HARD: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export const QuestionStatusBadge = ({ status }: { status: string }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${statusStyles[status] || statusStyles.DRAFT}`}>
    {QUESTION_STATUS_LABELS[status] || status}
  </span>
);

export const QuestionDifficultyBadge = ({ difficulty }: { difficulty: string }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${difficultyStyles[difficulty] || difficultyStyles.MEDIUM}`}>
    {DIFFICULTY_LABELS[difficulty] || difficulty}
  </span>
);

export const QuestionTypeBadge = ({ type }: { type: string }) => (
  <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 text-xs font-extrabold">
    {QUESTION_TYPE_LABELS[type] || type}
  </span>
);
