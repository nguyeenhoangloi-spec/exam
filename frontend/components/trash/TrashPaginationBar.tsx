'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface TrashPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  categoryLabel?: string;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function TrashPaginationBar({ categoryLabel, ...props }: TrashPaginationBarProps) {
  return <PaginationBar {...props} unit={categoryLabel || 'mục đã xóa'} />;
}
