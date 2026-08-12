'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ClassPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ClassPaginationBar(props: ClassPaginationBarProps) {
  return <PaginationBar {...props} unit="Lớp học" />;
}
