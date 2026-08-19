import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '../../lib/enum-labels';

export const QuestionStatusBadge = ({ status }: { status: string }) => {
  return <StatusBadge status={status} />;
};

export const QuestionDifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const isEasy = difficulty === 'EASY';
  const isHard = difficulty === 'HARD';
  const label = DIFFICULTY_LABELS[difficulty] || (isEasy ? 'Dễ' : isHard ? 'Khó' : 'Trung bình');

  const badgeCls = isEasy
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
    : isHard
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-type-helper font-semibold select-none whitespace-nowrap ${badgeCls}`}>
      {label}
    </span>
  );
};

const QUESTION_TYPE_SHORT_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  FILL_BLANK: 'Điền khuyết',
  ESSAY: 'Tự luận',
};

export const QuestionTypeBadge = ({ type }: { type: string }) => {
  const label = QUESTION_TYPE_SHORT_LABELS[type] || QUESTION_TYPE_LABELS[type] || 'Trắc nghiệm';
  return (
    <span className="text-type-helper font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
      {label}
    </span>
  );
};
