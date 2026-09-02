import React from 'react';

export type CategoryBadgeTone = 'neutral' | 'blue' | 'sky' | 'amber';

type CategoryBadgeProps = {
  children: React.ReactNode;
  tone?: CategoryBadgeTone;
  className?: string;
  title?: string;
};

const toneClasses: Record<CategoryBadgeTone, string> = {
  neutral: 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300',
  blue: 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400',
  sky: 'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400',
  amber: 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400',
};

/** Non-interactive category/type label. It must not represent lifecycle status or an identifier. */
export function CategoryBadge({
  children,
  tone = 'neutral',
  className = '',
  title,
}: CategoryBadgeProps) {
  return (
    <span
      title={title}
      className={[
        'ui-pill inline-flex items-center rounded-full border bg-transparent px-2.5 py-0.5 text-type-helper font-medium leading-[18px] whitespace-nowrap select-none',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
