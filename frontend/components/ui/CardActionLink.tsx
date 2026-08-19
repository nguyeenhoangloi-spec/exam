
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowUpRight } from 'lucide-react';

interface CardActionLinkProps {
  href: string;
  children: React.ReactNode;
  iconType?: 'chevron' | 'external';
  className?: string;
}

/**
 * Shared Component cho link điều hướng phụ trên Card Header / Footer
 * Cố định chuẩn: 13px (fs-helper), font-semibold (600), icon 14px (h-3.5 w-3.5)
 */
export function CardActionLink({
  href,
  children,
  iconType = 'chevron',
  className = '',
}: CardActionLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-type-helper font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors select-none cursor-pointer group whitespace-nowrap shrink-0 ${className}`}
    >
      <span>{children}</span>
      {iconType === 'chevron' ? (
        <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
      ) : (
        <ArrowUpRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      )}
    </Link>
  );
}
