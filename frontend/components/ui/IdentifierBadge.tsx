import React from 'react';

export type IdentifierBadgeTone = 'blue' | 'neutral' | 'inverse';

type IdentifierBadgeProps = {
  children: React.ReactNode;
  tone?: IdentifierBadgeTone;
  className?: string;
  title?: string;
};

const toneClasses: Record<IdentifierBadgeTone, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-slate-900 dark:text-slate-100',
  inverse: 'text-white',
};

/** Shared visual treatment for short technical identifiers in the Web UI (Clean Deep Ink style). */
export function IdentifierBadge({ children, tone = 'neutral', className = '', title }: IdentifierBadgeProps) {
  return (
    <span
      title={title}
      className={[
        'inline-flex min-w-0 max-w-full items-center rounded-lg px-2 py-0.5 text-type-helper font-medium tabular-nums whitespace-nowrap select-all',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      <span className="min-w-0 max-w-full truncate">{children}</span>
    </span>
  );
}

