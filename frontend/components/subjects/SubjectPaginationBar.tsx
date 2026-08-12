'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface SubjectPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function SubjectPaginationBar(props: SubjectPaginationBarProps) {
  return <PaginationBar {...props} unit="Môn học" />;
}
