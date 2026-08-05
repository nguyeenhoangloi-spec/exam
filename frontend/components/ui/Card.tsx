import React from 'react';

type CardProps = {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padded?: boolean;
};

/**
 * Modern SaaS card container: white surface, hairline border, soft shadow,
 * 16px radius. Optional hover elevation lift (200ms, no layout shift).
 */
export function Card({ children, className = '', hover = false, padded = true }: CardProps) {
    return (
        <div
            className={[
                'rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200',
                padded ? 'p-5' : '',
                hover ? 'hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300/80' : '',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

type CardHeaderProps = {
    icon?: React.ReactNode;
    iconClassName?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
};

/** Standard card header: icon chip + title/description on the left, action slot on the right. */
export function CardHeader({ icon, iconClassName = '', title, description, action }: CardHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
                {icon ? (
                    <span
                        className={[
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            iconClassName || 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                    >
                        {icon}
                    </span>
                ) : null}
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">{title}</h3>
                    {description ? (
                        <p className="text-[11px] font-medium text-slate-500 truncate">{description}</p>
                    ) : null}
                </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

type CardFooterProps = {
    children: React.ReactNode;
    className?: string;
};

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`mt-3 border-t border-slate-100 pt-2.5 ${className}`}>{children}</div>
    );
}
