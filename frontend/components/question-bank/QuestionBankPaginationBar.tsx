'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface QuestionBankPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function QuestionBankPaginationBar(props: QuestionBankPaginationBarProps) {
  return <PaginationBar {...props} unit="Câu hỏi" />;
}
