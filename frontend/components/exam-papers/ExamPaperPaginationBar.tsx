'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ExamPaperPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamPaperPaginationBar(props: ExamPaperPaginationBarProps) {
  return <PaginationBar {...props} unit="đề thi" />;
}
