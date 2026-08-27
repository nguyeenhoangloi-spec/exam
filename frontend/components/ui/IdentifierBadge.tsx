import React from 'react';

export type IdentifierBadgeTone = 'blue' | 'neutral' | 'inverse';

type IdentifierBadgeProps = {
  children: React.ReactNode;
  tone?: IdentifierBadgeTone;
  className?: string;
  title?: string;
  size?: 'md' | 'sm';
};

const toneClasses: Record<IdentifierBadgeTone, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-slate-900 dark:text-slate-100',
  inverse: 'text-white',
};

/** Shared visual treatment for technical identifiers in the Web UI (Clean Deep Ink style, 15px table data standard). */
export function IdentifierBadge({
  children,
  tone = 'neutral',
  size = 'md',
  className = '',
  title,
}: IdentifierBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-type-helper' : 'text-type-body';

  return (
    <span
      title={title}
      className={[
        'inline-flex min-w-0 max-w-full items-center rounded-lg font-medium tabular-nums whitespace-nowrap select-all',
        sizeClass,
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      <span className="min-w-0 max-w-full truncate">{children}</span>
    </span>
  );
}
