'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface DepartmentPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function DepartmentPaginationBar(props: DepartmentPaginationBarProps) {
  return <PaginationBar {...props} unit="Khoa / Phòng" />;
}
