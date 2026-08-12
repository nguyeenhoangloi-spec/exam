'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ExamReportPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamReportPaginationBar(props: ExamReportPaginationBarProps) {
  return <PaginationBar {...props} unit="Báo cáo" />;
}
