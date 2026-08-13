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
      className={`rounded-2xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-2xs ${
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
      <div className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 ${className}`} {...props}>
        <div>
          {title && <h3 className="edu-card-title">{title}</h3>}
          {subtitle && <p className="edu-secondary mt-0.5 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 ${className}`} {...props}>
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
    <div className={`flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 ${className}`} {...props}>
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
    <Card className={`group flex flex-col justify-between transition hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="edu-helper font-medium tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
          <div className="edu-kpi tracking-tight">{value}</div>
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
            {icon}
          </div>
        )}
      </div>

      {(trend || description || badge) && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 edu-helper text-slate-500 dark:text-slate-400">
          {trend && (
            <span className={`font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
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
