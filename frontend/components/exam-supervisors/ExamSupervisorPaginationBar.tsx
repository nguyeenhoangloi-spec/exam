'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ExamSupervisorPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamSupervisorPaginationBar(props: ExamSupervisorPaginationBarProps) {
  return <PaginationBar {...props} unit="cán bộ" limitOptions={[10, 20, 50, 100]} />;
}

