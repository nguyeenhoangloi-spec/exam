'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white shadow-2xs ${
        noPadding ? '' : 'p-6'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  title,
  subtitle,
  action,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { title?: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  if (title || subtitle || action) {
    return (
      <div className={`flex items-center justify-between border-b border-slate-100 pb-4 mb-4 ${className}`} {...props}>
        <div>
          {title && <h3 className="text-base font-extrabold text-slate-900 leading-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-100 pb-4 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between border-t border-slate-100 pt-4 mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  description?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function StatisticCard({ title, value, icon, trend, description, badge, className = '' }: StatisticCardProps) {
  return (
    <Card className={`flex flex-col justify-between transition hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(trend || description || badge) && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
          {trend && (
            <span className={`font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {description && <span>{description}</span>}
          {badge && <div>{badge}</div>}
        </div>
      )}
    </Card>
  );
}
