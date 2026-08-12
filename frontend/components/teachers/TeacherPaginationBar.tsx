'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface TeacherPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function TeacherPaginationBar(props: TeacherPaginationBarProps) {
  return <PaginationBar {...props} unit="Giảng viên" />;
}
