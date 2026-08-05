import React from 'react';

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'violet';

const toneClasses: Record<BadgeTone, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-primary-50 text-primary-700 border-primary-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-warning-50 text-warning-700 border-warning-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

type BadgeProps = {
    children: React.ReactNode;
    tone?: BadgeTone;
    className?: string;
    dot?: boolean;
};

/** Compact status pill with optional leading status dot. */
export function Badge({ children, tone = 'slate', className = '', dot = false }: BadgeProps) {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap',
                toneClasses[tone],
                className,
            ].join(' ')}
        >
            {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
            {children}
        </span>
    );
}
