import React from 'react';
import { Clock } from 'lucide-react';

type DeadlineBadgeProps = {
  remainingDays: number;
  className?: string;
};

/** Compact deadline indicator for tables and lists. This is temporal metadata, not lifecycle status. */
export function DeadlineBadge({ remainingDays, className = '' }: DeadlineBadgeProps) {
  const normalizedDays = Math.max(0, Math.floor(remainingDays));
  const isExpired = normalizedDays === 0;
  const isUrgent = normalizedDays <= 5;

  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] text-type-helper font-medium leading-[20px] whitespace-nowrap tabular-nums select-none',
        isUrgent
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-amber-600 dark:text-amber-400',
        className,
      ].join(' ')}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{isExpired ? 'Hết hạn' : `Còn ${normalizedDays} ngày`}</span>
    </span>
  );
}
