'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface StudentPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function StudentPaginationBar(props: StudentPaginationBarProps) {
  return <PaginationBar {...props} unit="Sinh viên" />;
}
