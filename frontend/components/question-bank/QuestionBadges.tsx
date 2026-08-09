import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '../../lib/enum-labels';

export const QuestionStatusBadge = ({ status }: { status: string }) => {
  return <StatusBadge status={status} />;
};

export const QuestionDifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const label = DIFFICULTY_LABELS[difficulty] || (difficulty === 'EASY' ? 'Dễ' : difficulty === 'MEDIUM' ? 'Trung bình' : difficulty === 'HARD' ? 'Khó' : difficulty);
  return (
    <span className="text-[13px] font-semibold text-[#334155]">
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
    <span className="text-[13px] font-semibold text-[#334155]">
      {label}
    </span>
  );
};
