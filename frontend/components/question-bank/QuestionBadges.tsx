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

  const textCls = isEasy
    ? 'text-emerald-600 dark:text-emerald-400'
    : isHard
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <span className={`text-[13px] font-semibold select-none whitespace-nowrap ${textCls}`}>
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
    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
      {label}
    </span>
  );
};
