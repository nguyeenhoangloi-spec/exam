'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ExamPeriodPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamPeriodPaginationBar(props: ExamPeriodPaginationBarProps) {
  return <PaginationBar {...props} unit="Kỳ thi" />;
}
