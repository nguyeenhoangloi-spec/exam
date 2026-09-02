import React from 'react';

type MetaValue = React.ReactNode | null | undefined | false;

export interface MetaSeparatorProps {
  className?: string;
}

/** Decorative hairline used between peer metadata values. */
export function MetaSeparator({ className = '' }: MetaSeparatorProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-3.5 w-px shrink-0 bg-slate-200 align-middle dark:bg-slate-700 ${className}`}
    />
  );
}

export interface InlineMetaProps {
  items: MetaValue[];
  className?: string;
  itemClassName?: string;
  stackOnMobile?: boolean;
}

/**
 * Displays peer metadata without raw punctuation separators.
 * Each separator stays grouped with the following item and is hidden when
 * metadata switches to the mobile stacked layout.
 */
export function InlineMeta({
  items,
  className = '',
  itemClassName = '',
  stackOnMobile = false,
}: InlineMetaProps) {
  const visibleItems = items.filter(
    (item) => item !== null && item !== undefined && item !== false && item !== '',
  );

  if (visibleItems.length === 0) return null;

  const layoutClass = stackOnMobile
    ? 'flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-y-1'
    : 'inline-flex min-w-0 flex-wrap items-center gap-y-1';

  return (
    <span role="list" className={`${layoutClass} ${className}`}>
      {visibleItems.map((item, index) => (
        <span
          role="listitem"
          className={`inline-flex min-w-0 items-center ${itemClassName}`}
          key={index}
        >
          {index > 0 && (
            <MetaSeparator className={stackOnMobile ? 'mx-2 hidden sm:inline-block' : 'mx-2'} />
          )}
          <span className="min-w-0">{item}</span>
        </span>
      ))}
    </span>
  );
}
