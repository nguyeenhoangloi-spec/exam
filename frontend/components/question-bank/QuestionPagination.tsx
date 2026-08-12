'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

export function QuestionPagination({
  page,
  totalPages,
  limit,
  totalItems = totalPages * limit,
  onPage,
  onLimit,
}: {
  page: number;
  totalPages: number;
  limit: number;
  totalItems?: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}) {
  return (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      limit={limit}
      totalItems={totalItems}
      unit="Câu hỏi"
      onPage={onPage}
      onLimit={onLimit}
    />
  );
}
