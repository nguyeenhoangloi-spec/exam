import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

type EmptyStateProps = {
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
};

/** Consistent empty state for tables, charts and lists. */
export function EmptyState({
    title = 'Chưa có dữ liệu',
    message = 'Không có dữ liệu nào để hiển thị tại thời điểm này.',
    actionLabel,
    onAction,
    className = '',
}: EmptyStateProps) {
    return (
        <div
            className={[
                'flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/50 px-4 py-8 text-center',
                className,
            ].join(' ')}
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-400 dark:text-slate-500 shadow-2xs">
                <Inbox className="h-5 w-5" />
            </span>
            <p className="edu-body-important text-slate-700 dark:text-slate-200">{title}</p>
            <p className="max-w-xs edu-helper text-slate-500 dark:text-slate-400">{message}</p>
            {actionLabel && onAction ? (
                <Button variant="secondary" size="xs" className="mt-1.5" onClick={onAction}>
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}
