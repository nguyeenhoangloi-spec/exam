'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ExamSchedulePaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems?: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamSchedulePaginationBar({
  totalItems = 128,
  ...props
}: ExamSchedulePaginationBarProps) {
  return <PaginationBar {...props} totalItems={totalItems} unit="Lịch thi" />;
}
