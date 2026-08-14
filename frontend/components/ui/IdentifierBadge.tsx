import React from 'react';

export type IdentifierBadgeTone = 'blue' | 'neutral' | 'inverse';

type IdentifierBadgeProps = {
  children: React.ReactNode;
  tone?: IdentifierBadgeTone;
  className?: string;
  title?: string;
};

const toneClasses: Record<IdentifierBadgeTone, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-300',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  inverse: 'border-white/25 bg-white/20 text-white backdrop-blur-md',
};

/** Shared visual treatment for short technical identifiers in the Web UI. */
export function IdentifierBadge({ children, tone = 'blue', className = '', title }: IdentifierBadgeProps) {
  return (
    <span
      title={title}
      className={[
        'inline-flex min-w-0 max-w-full items-center rounded-lg border px-2 py-0.5 text-[13px] font-medium leading-5 tabular-nums whitespace-nowrap',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      <span className="min-w-0 max-w-full truncate">{children}</span>
    </span>
  );
}
