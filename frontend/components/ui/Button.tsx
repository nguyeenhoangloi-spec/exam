import React, { useRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
type ButtonSize = 'xs' | 'sm' | 'md';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit';
    className?: string;
    title?: string;
    ariaLabel?: string;
    icon?: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-primary-600 text-white border border-primary-600 hover:bg-primary-700 hover:border-primary-700 shadow-xs hover:shadow-md focus-visible:ring-primary-200',
    secondary:
        'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs focus-visible:ring-slate-200',
    ghost:
        'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-200',
    danger:
        'bg-danger-500 text-white border border-danger-500 hover:bg-danger-600 hover:border-danger-600 shadow-xs focus-visible:ring-danger-200',
    success:
        'bg-success-500 text-white border border-success-500 hover:bg-success-600 hover:border-success-600 shadow-xs focus-visible:ring-success-100',
    warning:
        'bg-warning-500 text-white border border-warning-500 hover:bg-warning-600 hover:border-warning-600 shadow-xs focus-visible:ring-warning-200',
};

const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1.5 text-[11px] gap-1.5 rounded-lg',
    sm: 'px-3.5 py-2 text-xs gap-2 rounded-xl',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
};

/**
 * Primary interactive button with ripple feedback, focus ring for keyboard
 * navigation and loading spinner. No layout shift on state change.
 */
export function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'sm',
    disabled = false,
    loading = false,
    type = 'button',
    className = '',
    title,
    ariaLabel,
    icon,
}: ButtonProps) {
    const rippleRef = useRef<HTMLSpanElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Lightweight ripple
        const button = event.currentTarget;
        const ripple = rippleRef.current;
        if (ripple) {
            const rect = button.getBoundingClientRect();
            const diameter = Math.max(rect.width, rect.height);
            const size = `${diameter}px`;
            ripple.style.width = size;
            ripple.style.height = size;
            ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`;
            ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`;
            ripple.classList.remove('animate-ripple');
            void ripple.offsetWidth; // restart animation
            ripple.classList.add('animate-ripple');
        }
        onClick?.(event);
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={disabled || loading}
            title={title}
            aria-label={ariaLabel}
            className={[
                'relative inline-flex items-center justify-center overflow-hidden font-semibold cursor-pointer select-none',
                'transition-all duration-200 active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                variantClasses[variant],
                sizeClasses[size],
                className,
            ].join(' ')}
        >
            {icon ? <span className="shrink-0">{icon}</span> : null}
            {loading ? (
                <span
                    className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            ) : null}
            <span className="relative z-[1]">{children}</span>
            <span
                ref={rippleRef}
                className="pointer-events-none absolute rounded-full bg-white/25 opacity-0 [animation-duration:600ms]"
                style={{ transform: 'translate(-50%, -50%)' }}
                aria-hidden="true"
            />
        </button>
    );
}
