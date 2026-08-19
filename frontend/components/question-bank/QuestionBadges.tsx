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
    ? 'bg-transparent text-emerald-700 dark:text-emerald-400 border border-emerald-400 dark:border-emerald-700'
    : isHard
      ? 'bg-transparent text-rose-700 dark:text-rose-400 border border-rose-400 dark:border-rose-700'
      : 'bg-transparent text-amber-700 dark:text-amber-400 border border-amber-400 dark:border-amber-700';

  return (
    <span className={`ui-pill inline-flex items-center px-2.5 py-1 rounded-full text-type-helper font-medium select-none whitespace-nowrap ${badgeCls}`}>
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
